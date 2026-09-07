import test from "node:test"
import assert from "node:assert/strict"
import { configuredIndicTtsSpeaker, configuredIndicTtsUrl, createIndicTts } from "../src/demo/indic-tts.js"

test("Indic TTS forwards normalized text and returns Plivo-compatible L16", async () => {
  const calls = []
  const adapter = createIndicTts({ baseUrl:"http://indic.test", fetchImpl:async (url, options) => {
    calls.push({ url, options })
    return new Response(new Uint8Array([1, 2, 3, 4]), { headers:{ "content-type":"audio/x-l16;rate=16000", "x-request-id":"indic-1" } })
  } })
  const audio = []
  const session = await adapter.open({ language:"te", onAudio:value => audio.push(value) })
  const sent = await session.send("whats app లో 500 ఆర్డర్లు వచ్చాయి")
  assert.equal(sent, "WhatsApp లో 500 ఆర్డర్లు వచ్చాయి")
  assert.equal(calls[0].url, "http://indic.test/v1/synthesize")
  assert.deepEqual(JSON.parse(calls[0].options.body), { text:sent, language:"te", speaker:"female" })
  assert.equal(audio[0].contentType, "audio/x-l16")
  assert.equal(audio[0].sampleRate, 16000)
  assert.deepEqual([...audio[0].audio], [1, 2, 3, 4])
})

test("Indic TTS configuration supports a language-specific selected voice", () => {
  assert.equal(configuredIndicTtsUrl({ INDIC_TTS_URL:"http://localhost:5050/" }), "http://localhost:5050")
  assert.equal(configuredIndicTtsSpeaker("te", { INDIC_TTS_SPEAKER_TE:"male" }), "male")
})
