import WebSocket from "ws"
import { sarvamLanguageCode } from "./sarvam-api.js"

const SARVAM_API = "wss://api.sarvam.ai"

// This is intentionally an opt-in experiment.  The established V3 value is
// still V3_STT_SILENCE_MS, so removing this change restores its 500ms behavior
// even if the local environment retains the experiment variable.
export function v3EndpointSilenceMs({ experiment=process.env.V3_LATENCY_CHERRY_VAD_MS, baseline=process.env.V3_STT_SILENCE_MS }={}) {
  const value = Number(experiment || baseline || "500")
  return Number.isFinite(value) && value >= 250 && value <= 1200 ? Math.floor(value) : 500
}

const parseMessage = raw => {
  try { return JSON.parse(raw.toString()) } catch { return null }
}

export function realtimeSttUrl({ language="auto", model="saaras:v3-realtime", mode="codemix", streamType="fast", silenceDurationMs=500, minSpeechDurationMs=250 }={}) {
  const url = new URL(`${SARVAM_API}/speech-to-text-realtime/ws`)
  url.searchParams.set("language_code", language === "auto" ? "auto" : sarvamLanguageCode(language))
  url.searchParams.set("model", model)
  url.searchParams.set("mode", mode)
  url.searchParams.set("stream_type", streamType)
  url.searchParams.set("endpointing", "vad")
  url.searchParams.set("encoding", "linear16")
  url.searchParams.set("sample_rate", "16000")
  url.searchParams.set("silence_duration_ms", String(silenceDurationMs))
  url.searchParams.set("min_speech_duration_ms", String(minSpeechDurationMs))
  return url.toString()
}

function openSocket(WebSocketImpl, url, apiKey) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocketImpl(url, { headers:{ "api-subscription-key":apiKey } })
    const fail = error => { cleanup(); reject(error) }
    const ready = () => { cleanup(); resolve(ws) }
    const cleanup = () => { ws.off?.("error", fail); ws.off?.("open", ready) }
    ws.once("error", fail)
    ws.once("open", ready)
  })
}

// This is intentionally a thin raw-WebSocket adapter rather than an SDK
// wrapper. Sarvam's current Node SDK does not pass STT `mode` through, while
// Woxza needs codemix and raw L16 audio from Plivo.
export function createSarvamRealtimeStt({ apiKey=process.env.SARVAM_API_KEY, WebSocketImpl=WebSocket }={}) {
  if (!apiKey) return null
  return {
    async open({ language="auto", onPartial=()=>{}, onFinal=()=>{}, onSpeechStart=()=>{}, onSpeechEnd=()=>{}, onError=()=>{} }={}) {
      const ws = await openSocket(WebSocketImpl, realtimeSttUrl({
        language,
        model:process.env.V3_STT_MODEL || "saaras:v3-realtime",
        mode:process.env.V3_STT_MODE || "codemix",
        streamType:process.env.V3_STT_STREAM_TYPE || "fast",
        silenceDurationMs:v3EndpointSilenceMs(),
        minSpeechDurationMs:Number(process.env.V3_STT_MIN_SPEECH_MS || "250")
      }), apiKey)
      ws.on("message", raw => {
        const event = parseMessage(raw); if (!event) return
        if (event.event === "transcript.partial") onPartial({ text:String(event.text || ""), languageCode:event.language || "auto", requestId:event.request_id })
        else if (event.event === "transcript.final") onFinal({ text:String(event.text || "").trim(), languageCode:event.language || "auto", requestId:event.request_id, metrics:event.metrics || {} })
        else if (event.event === "vad.speech_start") onSpeechStart(event)
        else if (event.event === "vad.speech_end") onSpeechEnd(event)
        else if (event.event === "error") onError(new Error(`Sarvam realtime STT ${event.code || "error"}: ${event.message || "unknown error"}`), event)
      })
      return {
        push(pcm) { if (ws.readyState === WebSocketImpl.OPEN && pcm?.length) ws.send(JSON.stringify({ event:"audio_input", audio:Buffer.from(pcm).toString("base64") })) },
        close() { if (ws.readyState === WebSocketImpl.OPEN) { ws.send(JSON.stringify({ event:"end" })); ws.close() } }
      }
    }
  }
}

export function streamingTtsUrl({ model="bulbul:v3" }={}) {
  const url = new URL(`${SARVAM_API}/text-to-speech/ws`)
  url.searchParams.set("model", model)
  url.searchParams.set("send_completion_event", "true")
  return url.toString()
}

export function createSarvamStreamingTts({ apiKey=process.env.SARVAM_API_KEY, WebSocketImpl=WebSocket }={}) {
  if (!apiKey) return null
  return {
    async open({ language="en", onAudio=()=>{}, onComplete=()=>{}, onError=()=>{} }={}) {
      const ws = await openSocket(WebSocketImpl, streamingTtsUrl({ model:process.env.SARVAM_TTS_MODEL || "bulbul:v3" }), apiKey)
      const speaker = process.env[`SARVAM_TTS_SPEAKER_${String(language).toUpperCase()}`] || process.env.SARVAM_TTS_SPEAKER || "ritu"
      const pace = Number(process.env[`SARVAM_TTS_PACE_${String(language).toUpperCase()}`] || process.env.SARVAM_TTS_PACE || "1.15")
      const temperature = Number(process.env[`SARVAM_TTS_TEMPERATURE_${String(language).toUpperCase()}`] || process.env.SARVAM_TTS_TEMPERATURE || "0.70")
      ws.on("message", raw => {
        const event = parseMessage(raw); if (!event) return
        if (event.type === "audio" && event.data?.audio) {
          const codec = process.env.V2_TTS_CODEC || "linear16"
          // Plivo's bidirectional playback contract is explicit about L16;
          // normalize Sarvam's generic PCM MIME label before forwarding it.
          onAudio({ audio:Buffer.from(event.data.audio, "base64"), requestId:event.data.request_id, contentType:codec === "linear16" ? "audio/x-l16" : event.data.content_type || "audio/x-mulaw", sampleRate:Number(event.data.sample_rate || process.env.V2_TTS_SAMPLE_RATE || 16000), speaker, pace, temperature })
        }
        else if (event.type === "event" && event.data?.event_type === "final") onComplete(event.data)
        else if (event.type === "error" || event.event === "error") onError(new Error(`Sarvam streaming TTS: ${event.data?.message || event.message || "unknown error"}`), event)
      })
      // The streaming protocol uses `target_language_code` (unlike REST's
      // `language_code`) and requires the model inside the config dictionary.
      // Sending REST field names here was accepted by the socket but rejected
      // by Sarvam after connection, leaving a silent phone call.
      ws.send(JSON.stringify({ type:"config", data:{ target_language_code:sarvamLanguageCode(language), speaker, pace, temperature, model:process.env.SARVAM_TTS_MODEL || "bulbul:v3", enable_preprocessing:true, min_buffer_size:Number(process.env.V3_TTS_MIN_BUFFER_CHARS || "30"), max_chunk_length:Number(process.env.V3_TTS_MAX_CHUNK_CHARS || "200"), output_audio_codec:process.env.V2_TTS_CODEC || "linear16", output_audio_bitrate:"128k", speech_sample_rate:String(process.env.V2_TTS_SAMPLE_RATE || "16000") } }))
      return {
        send(text) { if (ws.readyState === WebSocketImpl.OPEN && String(text || "").trim()) ws.send(JSON.stringify({ type:"text", data:{ text:String(text).trim() } })) },
        flush() { if (ws.readyState === WebSocketImpl.OPEN) ws.send(JSON.stringify({ type:"flush" })) },
        close() { if (ws.readyState === WebSocketImpl.OPEN) ws.close() }
      }
    }
  }
}
