import { WebSocketServer } from "ws"
import { decodePlivoInboundAudio } from "./gemini-bridge.js"
import { LANGUAGES } from "./prompt.js"
import { woxzaLanguageFromSarvamCode } from "./sarvam-api.js"
import { createSarvamRealtimeStt, createSarvamStreamingTts } from "./sarvam-realtime.js"
import { createSarvamConversation } from "./sarvam-conversation.js"
import { createOpenAiConversation } from "./openai-conversation.js"
import { createAnthropicConversation } from "./anthropic-conversation.js"
import { createWordBoundaryBuffer } from "./phrase-buffer.js"
import { logCallEvent } from "../call-events.js"

const findCall = async (db, id) => (await db.query("SELECT id,language FROM demo_calls WHERE id=$1 AND status IN ('ringing','connected')", [id])).rows[0]
const persist = (db, callId, speaker, text) => { const value = String(text || "").trim(); if (value) void db.query("INSERT INTO call_transcript_turns (demo_call_id,speaker,text) VALUES ($1,$2,$3)", [callId, speaker, value]) }
const welcome = language => ({ en:"Hello, I’m Woxza’s AI assistant. Thanks for trying the demo. What would you like to talk about today?", te:"నమస్కారం, నేను Woxza AI అసిస్టెంట్‌ని. మా డెమో ప్రయత్నించినందుకు ధన్యవాదాలు. ఈరోజు మీరు ఏ విషయం గురించి మాట్లాడాలనుకుంటున్నారు?", hi:"नमस्ते, मैं Woxza का AI सहायक हूँ। डेमो आज़माने के लिए धन्यवाद। आज आप किस बारे में बात करना चाहेंगे?", ta:"வணக்கம், நான் Woxza-வின் AI உதவியாளர். இந்த டெமோவை முயற்சித்ததற்கு நன்றி. இன்று நீங்கள் எதைப் பற்றி பேச விரும்புகிறீர்கள்?" }[language] || "Hello, I’m Woxza’s AI assistant. Thanks for trying the demo. What would you like to talk about today?")

// V3 is deliberately separate from V2. Set VOICE_PIPELINE=v3 to opt in;
// changing it back to v2 restores the previous bridge without a code rollback.
const configuredBrainProvider = () => (process.env.V3_BRAIN_PROVIDER || "sarvam").toLowerCase()
const configuredBrain = () => {
  const provider = configuredBrainProvider()
  if (provider === "openai") return createOpenAiConversation()
  if (provider === "anthropic") return createAnthropicConversation()
  return createSarvamConversation()
}
const configuredBrainModel = provider => provider === "openai" ? (process.env.V3_OPENAI_MODEL || "gpt-4.1-mini") : provider === "anthropic" ? (process.env.V3_ANTHROPIC_MODEL || "claude-sonnet-4-6") : (process.env.SARVAM_CHAT_MODEL || "sarvam-105b-conversations")

export function attachDemoV3StreamingBridge(server, { db, stt=createSarvamRealtimeStt(), tts=createSarvamStreamingTts(), brain=configuredBrain() }={}) {
  const wss = new WebSocketServer({ noServer:true })
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost")
    if (url.pathname !== "/telephony/plivo/v3/stream") return
    wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, url))
  })
  wss.on("connection", async (socket, url) => {
    const demoCallId = url.searchParams.get("demoCallId"), requestedLanguage = url.searchParams.get("lang") || "en"
    if (!demoCallId || !LANGUAGES.has(requestedLanguage) || !stt || !tts || !brain) return socket.close(1011, "V3 providers are not configured")
    if (!await findCall(db, demoCallId).catch(() => null)) return socket.close(1008, "Unknown demo call")
    let closed = false, epoch = 0, activeTurn, ttsSession, ttsLanguage, ttsOpening, ttsConnectionId = 0, ttsPlayback
    const history = [], memory = { opening_delivered:true, turns:[] }
    const log = (eventType, payload={}, latencyMs=null) => logCallEvent(db, { callId:demoCallId, demoCallId, eventType, payload:{ pipeline:"v3-streaming", ...payload }, latencyMs })
    const sendAudio = result => { if (socket.readyState === socket.OPEN && result.audio?.length) socket.send(JSON.stringify({ event:"playAudio", media:{ contentType:result.contentType, sampleRate:result.sampleRate, payload:result.audio.toString("base64") } })) }
    const discardTts = () => { ttsConnectionId += 1; ttsOpening = undefined; ttsSession?.close(); ttsSession = undefined; ttsLanguage = undefined; ttsPlayback = undefined }
    const stopAgent = reason => {
      epoch += 1; activeTurn?.abort(reason); activeTurn = undefined
      // Sarvam cannot cancel an in-progress TTS response. Close only when it
      // is actively generating; an idle, pre-warmed connection is reusable.
      if (ttsPlayback) discardTts()
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ event:"clearAudio" }))
      log("barge_in", { reason })
    }
    const prepareTts = speechLanguage => {
      if (ttsSession && ttsLanguage === speechLanguage) return Promise.resolve(ttsSession)
      if (ttsOpening && ttsLanguage === speechLanguage) return ttsOpening
      discardTts(); const connectionId = ++ttsConnectionId; ttsLanguage = speechLanguage
      ttsOpening = tts.open({ language:speechLanguage, onAudio:result => {
        const playback = ttsPlayback
        if (closed || connectionId !== ttsConnectionId || !playback || playback.epoch !== epoch) return
        sendAudio(result)
        if (!playback.firstAudioSent) {
          playback.firstAudioSent = true
          log("first_audio_sent", { provider:"sarvam-bulbul-streaming", request_id:result.requestId }, Date.now() - playback.startedAt)
        }
      }, onComplete:() => {
        if (connectionId === ttsConnectionId) ttsPlayback = undefined
      }, onError:error => log("error", { component:"v3_tts", message:error.message }) }).then(session => {
        if (closed || connectionId !== ttsConnectionId) { session?.close(); return null }
        ttsSession = session; return session
      }).finally(() => { if (connectionId === ttsConnectionId) ttsOpening = undefined })
      return ttsOpening
    }
    const sendTtsChunk = async ({ sessionReady, text, turnEpoch, startedAt }) => {
      const session = await sessionReady
      if (!session || closed || turnEpoch !== epoch) return
      if (!ttsPlayback || ttsPlayback.epoch !== turnEpoch) ttsPlayback = { epoch:turnEpoch, startedAt, firstAudioSent:false }
      session.send(text)
    }
    const processFinal = async ({ text, languageCode, requestId, metrics }) => {
      if (!text || closed) return
      const turnEpoch = epoch, started = Date.now(), controller = new AbortController(); activeTurn = controller
      const language = woxzaLanguageFromSarvamCode(languageCode)
      persist(db, demoCallId, "caller", text); history.push({ role:"user", content:text })
      log("stt_final", { provider:"sarvam-saaras-realtime", request_id:requestId, language:languageCode, text_length:text.length, metrics }, 0)
      try {
        // Start establishing TTS, but do not await it before the LLM. This
        // overlaps the WebSocket handshake with model time instead of making
        // the caller pay for both delays in sequence.
        const speechLanguage = requestedLanguage
        const ttsReady = prepareTts(speechLanguage)
        const words = createWordBoundaryBuffer({ minimumCharacters:Number(process.env.V3_TTS_MIN_BUFFER_CHARS || "30") })
        let replyText = "", firstToken = true
        for await (const chunk of brain.replyStream({ language, history, callerText:text, memory, signal:controller.signal })) {
          if (firstToken) { firstToken = false; log("llm_first_token", {}, Date.now() - started) }
          replyText += chunk.text
          for (const textChunk of words.push(chunk.text)) await sendTtsChunk({ sessionReady:ttsReady, text:textChunk, turnEpoch, startedAt:started })
        }
        const last = words.flush(); if (last) await sendTtsChunk({ sessionReady:ttsReady, text:last, turnEpoch, startedAt:started })
        const session = await ttsReady; if (session && !closed && turnEpoch === epoch) session.flush()
        replyText = replyText.trim(); if (!replyText || closed || turnEpoch !== epoch) return
        history.push({ role:"assistant", content:replyText }); memory.turns.push({ turn:memory.turns.length + 1, caller:text, agent:replyText }); memory.turns = memory.turns.slice(-16)
        persist(db, demoCallId, "agent", replyText)
        log("llm_response", { provider:brain.provider || configuredBrainProvider(), model:brain.model || configuredBrainModel(configuredBrainProvider()) }, Date.now() - started)
      } catch (error) { if (!controller.signal.aborted) log("error", { component:"v3_turn", message:error.message }, Date.now() - started) }
      finally { if (activeTurn === controller) activeTurn = undefined }
    }
    let sttSession
    try {
      sttSession = await stt.open({ language:"auto", onPartial:partial => log("stt_partial", { text_length:partial.text.length, language:partial.languageCode }), onSpeechStart:() => stopAgent("sarvam_vad_speech_start"), onSpeechEnd:() => log("stt_speech_end"), onFinal:result => { void processFinal(result) }, onError:error => log("error", { component:"v3_stt", message:error.message }) })
    } catch (error) { log("error", { component:"v3_stt_connect", message:error.message }); return socket.close(1011, "Sarvam realtime STT unavailable") }
    const close = () => { if (closed) return; closed = true; sttSession?.close(); discardTts(); stopAgent("call_closed") }
    socket.on("close", close)
    socket.on("message", raw => { try { const event = JSON.parse(raw.toString()); if (event.event === "stop") return close(); if (event.event === "media" && event.media?.payload) sttSession.push(decodePlivoInboundAudio(event.media.payload, process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000", process.env.PLIVO_L16_BYTE_ORDER || "little")) } catch (error) { log("error", { component:"v3_plivo_input", message:error.message }) } })
    log("call_started", { provider:"plivo", agentId:"sarvam-streaming-v3", brain_provider:configuredBrainProvider(), brain_model:brain.model || configuredBrainModel(configuredBrainProvider()), stt_model:process.env.V3_STT_MODEL || "saaras:v3-realtime", tts_model:process.env.SARVAM_TTS_MODEL || "bulbul:v3" })
    const greeting = welcome(requestedLanguage); history.push({ role:"assistant", content:greeting })
    try {
      // If the caller begins speaking during the TTS handshake, never send a
      // delayed welcome afterwards. That would overlap their first response.
      const welcomeEpoch = epoch
      const session = await prepareTts(requestedLanguage)
      if (session && !closed && welcomeEpoch === epoch) { ttsPlayback = { epoch:welcomeEpoch, startedAt:Date.now(), firstAudioSent:false }; session.send(greeting); session.flush() }
    } catch (error) { log("error", { component:"v3_welcome_tts", message:error.message }) }
  })
}
