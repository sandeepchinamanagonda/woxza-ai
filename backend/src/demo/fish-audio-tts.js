import { resamplePcm } from "./audio-codec.js"

const FISH_MODEL = "fish-audio/s2.1-pro-free:free"

function pcmToMuLaw(input) {
  const samples = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
  const output = Buffer.alloc(samples.length)
  for (let index = 0; index < samples.length; index += 1) {
    let sample = samples[index]; const sign = sample < 0 ? 0x80 : 0
    if (sample < 0) sample = -sample
    sample = Math.min(32635, sample) + 0x84
    let exponent = 7
    for (let mask = 0x4000; exponent > 0 && !(sample & mask); mask >>= 1) exponent -= 1
    output[index] = (~(sign | (exponent << 4) | ((sample >> (exponent + 3)) & 0x0f))) & 0xff
  }
  return output
}

export function createFishAudioTts({ apiKey=process.env.OPENROUTER_API_KEY, model=process.env.FISH_TTS_MODEL || FISH_MODEL, fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    async synthesizeMuLaw8k(text, { signal }={}) {
      const response = await fetchImpl("https://openrouter.ai/api/v1/audio/speech", {
        method:"POST", signal,
        headers:{ authorization:`Bearer ${apiKey}`, "content-type":"application/json", "HTTP-Referer":process.env.WEBSITE_URL || "https://woxza.ai", "X-OpenRouter-Title":"Woxza voice demo" },
        // OpenRouter's TTS endpoint currently supports raw PCM or MP3.  Fish
        // returns 44.1 kHz, mono PCM; raw PCM avoids a decode step in a live call.
        body:JSON.stringify({ model, input:text, response_format:"pcm" })
      })
      if (!response.ok) throw new Error(`Fish Audio TTS failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
      const contentType = response.headers.get("content-type") || ""
      const sampleRate = Number(contentType.match(/rate=(\d+)/i)?.[1] || 44_100)
      const channels = Number(contentType.match(/channels=(\d+)/i)?.[1] || 1)
      if (!contentType.toLowerCase().startsWith("audio/pcm") || channels !== 1) throw new Error(`Fish Audio returned unsupported audio: ${contentType || "unknown"}`)
      const pcm = Buffer.from(await response.arrayBuffer())
      if (pcm.length % 2 !== 0) throw new Error("Fish Audio PCM response is not 16-bit aligned")
      return { audio:pcmToMuLaw(resamplePcm(pcm, sampleRate, 8_000)), provider:"fish-audio", model }
    }
  }
}
