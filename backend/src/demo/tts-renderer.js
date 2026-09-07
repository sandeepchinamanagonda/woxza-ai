import { GoogleGenAI } from "@google/genai"
import textToSpeech from "@google-cloud/text-to-speech"

export function resolveChirpSpeakingRate(value=process.env.CHIRP_TTS_SPEAKING_RATE ?? "1.15") {
  const rate = Number(value)
  // Google Cloud StreamingAudioConfig supports [0.25, 2.0]. Invalid config
  // falls back predictably rather than failing an otherwise valid call.
  return Number.isFinite(rate) && rate >= 0.25 && rate <= 2 ? rate : 1
}

async function *chirpStreamingSynthesis({ client, responseText, language, signal, speakingRate }) {
  const stream = client.streamingSynthesize()
  const chunks = []
  let ended = false
  let failure = null
  let wake
  const notify = () => { const resolve = wake; wake = null; resolve?.() }
  const abort = () => stream.destroy(Object.assign(new Error("TTS rendering cancelled"), { name:"AbortError" }))
  signal?.addEventListener("abort", abort, { once:true })
  stream.on("data", response => { if (response.audioContent?.length) chunks.push(Buffer.from(response.audioContent)); notify() })
  stream.on("error", error => { if (!signal?.aborted) failure = error; ended = true; notify() })
  stream.on("end", () => { ended = true; notify() })
  // This is Google Cloud Text-to-Speech's bidirectional streaming RPC. PCM is
  // signed 16-bit little-endian, mono, 24 kHz—the same input expected by the
  // existing Plivo-boundary resample/μ-law encoder.
  stream.write({ streamingConfig:{ voice:{ languageCode:language === "te" ? "te-IN" : language, name:"te-IN-Chirp3-HD-Kore" }, streamingAudioConfig:{ audioEncoding:"PCM", sampleRateHertz:24000, speakingRate } } })
  stream.write({ input:{ text:responseText } })
  stream.end()
  try {
    while (!ended || chunks.length) {
      if (chunks.length) { yield chunks.shift(); continue }
      if (failure) throw failure
      await new Promise(resolve => { wake = resolve })
    }
    if (failure) throw failure
  } finally {
    signal?.removeEventListener("abort", abort)
    if (!ended) stream.destroy()
  }
}

// Text-only TTS: it receives an immutable approved transcript, never caller
// audio or conversation state. The caller controls cancellation through AbortSignal.
export function createTtsRenderer({ provider=process.env.APPROVED_TTS_PROVIDER || "gemini", apiKey=process.env.GEMINI_API_KEY, model=process.env.GEMINI_TTS_MODEL || "gemini-3.1-flash-tts-preview", voice=process.env.GEMINI_DEMO_VOICE || "Kore", stream, chirpClient, chirpSpeakingRate=process.env.CHIRP_TTS_SPEAKING_RATE }={}) {
  const ai = !stream && apiKey ? new GoogleGenAI({ apiKey }) : null
  const client = chirpClient || (provider === "chirp3-hd-streaming" ? new textToSpeech.v1beta1.TextToSpeechClient() : null)
  const render = stream || (provider === "chirp3-hd-streaming"
    ? ({ responseText, language, signal }) => chirpStreamingSynthesis({ client, responseText, language, signal, speakingRate:resolveChirpSpeakingRate(chirpSpeakingRate) })
    : async function *({ responseText, signal }) {
    if (!ai) throw new Error("Gemini TTS is not configured")
    const result = await ai.models.generateContentStream({
      model,
      contents:[{ role:"user", parts:[{ text:`Synthesize the following caller-facing transcript verbatim. Do not add, remove, translate, or explain any words.\n<SPOKEN_TEXT>${responseText}</SPOKEN_TEXT>` }] }],
      config:{ responseModalities:["AUDIO"], speechConfig:{ voiceConfig:{ prebuiltVoiceConfig:{ voiceName:voice } } }, signal }
    })
    for await (const event of result) {
      for (const part of event?.candidates?.[0]?.content?.parts || []) if (part.inlineData?.data) yield Buffer.from(part.inlineData.data, "base64")
    }
  })
  return {
    provider:provider === "chirp3-hd-streaming" ? "google-cloud-tts" : "gemini-tts",
    model:provider === "chirp3-hd-streaming" ? "te-IN-Chirp3-HD-Kore:streaming:pcm24k" : model,
    async renderJob({ job, manager }) {
      const controller = new AbortController()
      // Acquire the job-owned cancellation fence before invoking the provider.
      // If caller VAD cancelled the job between queueing and this point, no
      // network request is created at all.
      if (!manager.beginRender(job.id, job.render_epoch, controller)) return false
      try {
        for await (const pcm of render({ responseText:job.response_text, language:job.language_code, signal:controller.signal })) {
          if (!(await manager.deliver({ responseJobId:job.id, renderEpoch:job.render_epoch, pcm }))) return false
        }
      } catch (error) {
        if (controller.signal.aborted) return false
        throw error
      }
      return manager.complete({ responseJobId:job.id, renderEpoch:job.render_epoch })
    }
  }
}
