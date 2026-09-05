import { normalizeTtsText } from "./tts-text-normalizer.js"

const DEFAULT_URL = "http://host.docker.internal:5050"
const supportedLanguages = new Set(["as", "bn", "brx", "en", "en+hi", "gu", "hi", "kn", "ml", "mni", "mr", "or", "pa", "raj", "ta", "te"])

export const configuredIndicTtsUrl = (env=process.env) => String(env.INDIC_TTS_URL || DEFAULT_URL).replace(/\/$/, "")
export const configuredIndicTtsSpeaker = (language, env=process.env) => env[`INDIC_TTS_SPEAKER_${String(language || "en").toUpperCase()}`] || env.INDIC_TTS_SPEAKER || "female"

// Indic-TTS generates a complete utterance, unlike Sarvam's streaming socket.
// It deliberately shares the V3 TTS session contract so the bridge can switch
// providers without changing any call or Plivo logic.
export function createIndicTts({ baseUrl=configuredIndicTtsUrl(), fetchImpl=globalThis.fetch }={}) {
  if (!baseUrl || typeof fetchImpl !== "function") return null
  return {
    provider:"ai4bharat-indic-tts",
    model:"indic-tts-fastpitch-hifigan",
    async open({ language="en", onAudio=()=>{}, onComplete=()=>{}, onError=()=>{} }={}) {
      if (!supportedLanguages.has(language)) throw new Error(`Indic-TTS does not support language: ${language}`)
      let closed = false
      let controller = null
      return {
        provider:"ai4bharat-indic-tts",
        model:"indic-tts-fastpitch-hifigan",
        async send(text) {
          const normalized = normalizeTtsText(text)
          if (!normalized || closed) return ""
          controller?.abort()
          controller = new AbortController()
          try {
            const response = await fetchImpl(`${baseUrl}/v1/synthesize`, {
              method:"POST",
              signal:controller.signal,
              headers:{ "content-type":"application/json" },
              body:JSON.stringify({ text:normalized, language, speaker:configuredIndicTtsSpeaker(language) })
            })
            if (!response.ok) throw new Error(`Indic-TTS failed (${response.status}): ${(await response.text()).slice(0, 240)}`)
            const audio = Buffer.from(await response.arrayBuffer())
            if (!audio.length) throw new Error("Indic-TTS returned no audio")
            const responseContentType = response.headers.get("content-type") || "audio/x-l16;rate=16000"
            const sampleRate = Number(responseContentType.match(/rate=(\d+)/i)?.[1] || response.headers.get("x-audio-sample-rate") || "16000")
            // Plivo's playAudio envelope keeps codec and sample rate in separate
            // fields.  Sarvam uses this exact representation; forwarding an HTTP
            // MIME parameter ("audio/x-l16;rate=16000") here can result in a
            // successful-looking event that Plivo does not render audibly.
            if (!closed) onAudio({ audio, contentType:"audio/x-l16", sampleRate, requestId:response.headers.get("x-request-id") || undefined, speaker:configuredIndicTtsSpeaker(language) })
            if (!closed) onComplete()
            return normalized
          } catch (error) {
            if (error?.name !== "AbortError" && !closed) onError(error)
            throw error
          }
        },
        flush() {},
        close() { closed = true; controller?.abort() }
      }
    }
  }
}
