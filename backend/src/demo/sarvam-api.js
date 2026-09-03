const SARVAM_API = "https://api.sarvam.ai"

const WOXZA_TO_SARVAM_LANGUAGE = { en:"en-IN", hi:"hi-IN", te:"te-IN", ta:"ta-IN", kn:"kn-IN", ml:"ml-IN", mr:"mr-IN", gu:"gu-IN", bn:"bn-IN", pa:"pa-IN", or:"or-IN" }
const SARVAM_TO_WOXZA_LANGUAGE = Object.fromEntries(Object.entries(WOXZA_TO_SARVAM_LANGUAGE).map(([woxza, sarvam]) => [sarvam, woxza]))

export const sarvamLanguageCode = language => WOXZA_TO_SARVAM_LANGUAGE[language] || "en-IN"
export const woxzaLanguageFromSarvamCode = languageCode => SARVAM_TO_WOXZA_LANGUAGE[String(languageCode || "").toLowerCase().replace(/^([a-z]{2})/, (_, value) => value.toLowerCase()).replace(/-in$/i, "-IN")] || SARVAM_TO_WOXZA_LANGUAGE[languageCode] || "en"
const languageSetting = (name, language, fallback) => process.env[`${name}_${String(language || "").toUpperCase()}`] || process.env[name] || fallback

function wavFromPcm16(pcm, sampleRate=16_000) {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34)
  header.write("data", 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

async function readError(response, service) {
  const body = await response.text()
  throw new Error(`${service} failed (${response.status}): ${body.slice(0, 300)}`)
}

export function createSarvamApi({ apiKey=process.env.SARVAM_API_KEY, fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    async transcribePcm16(pcm, { language="unknown", signal }={}) {
      const form = new FormData()
      form.set("file", new Blob([wavFromPcm16(pcm)], { type:"audio/wav" }), "utterance.wav")
      form.set("model", process.env.SARVAM_STT_MODEL || "saaras:v4")
      form.set("mode", process.env.V2_STT_MODE || "codemix")
      // `unknown` asks Saaras to identify the language from this utterance.
      // It is essential for callers who switch between English and an Indic
      // language after choosing English in the website form.
      form.set("language_code", language === "unknown" ? "unknown" : sarvamLanguageCode(language))
      const response = await fetchImpl(`${SARVAM_API}/speech-to-text`, { method:"POST", headers:{ "api-subscription-key":apiKey }, body:form, signal })
      if (!response.ok) await readError(response, "Sarvam STT")
      const body = await response.json()
      return { text:String(body.transcript || "").trim(), languageCode:body.language_code || (language === "unknown" ? "unknown" : sarvamLanguageCode(language)), requestId:body.request_id, provider:"sarvam-saaras" }
    },
    async synthesizeTelephonyAudio(text, { language="en", signal }={}) {
      // Plivo accepts raw Linear16 at 16 kHz for bidirectional playback. It
      // preserves much more voice detail than legacy 8 kHz mu-law.
      const codec = process.env.V2_TTS_CODEC || "linear16"
      const sampleRate = Number(process.env.V2_TTS_SAMPLE_RATE || "16000")
      const speaker = languageSetting("SARVAM_TTS_SPEAKER", language, "ritu")
      const pace = Number(languageSetting("SARVAM_TTS_PACE", language, "1.15"))
      const temperature = Number(languageSetting("SARVAM_TTS_TEMPERATURE", language, "0.70"))
      const response = await fetchImpl(`${SARVAM_API}/text-to-speech`, {
        method:"POST", headers:{ "api-subscription-key":apiKey, "content-type":"application/json" }, signal,
        body:JSON.stringify({ text, language_code:sarvamLanguageCode(language), model:process.env.SARVAM_TTS_MODEL || "bulbul:v3", speaker, pace, temperature, speech_sample_rate:sampleRate, output_audio_codec:codec })
      })
      if (!response.ok) await readError(response, "Sarvam TTS")
      const body = await response.json()
      const audio = body.audios?.[0]
      if (!audio) throw new Error("Sarvam TTS returned no audio")
      return {
        audio:Buffer.from(audio, "base64"), requestId:body.request_id, provider:"sarvam-bulbul",
        contentType:codec === "linear16" ? "audio/x-l16" : "audio/x-mulaw", sampleRate, speaker, pace, temperature
      }
    }
  }
}
