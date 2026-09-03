import test from "node:test"
import assert from "node:assert/strict"
import { realtimeSttUrl, streamingTtsUrl, v3EndpointSilenceMs } from "../src/demo/sarvam-realtime.js"

test("the endpointing experiment shortens V3 silence without changing its baseline", () => {
  assert.equal(v3EndpointSilenceMs({ experiment:"350", baseline:"500" }), 350)
  assert.equal(v3EndpointSilenceMs({ experiment:"", baseline:"500" }), 500)
  assert.equal(v3EndpointSilenceMs({ experiment:"120", baseline:"500" }), 500)
})

test("realtime STT URL preserves low-latency and multilingual call settings", () => {
  const url = new URL(realtimeSttUrl({ language:"auto", model:"saaras:v3-realtime", mode:"codemix", streamType:"fast", silenceDurationMs:420, minSpeechDurationMs:180 }))
  assert.equal(url.pathname, "/speech-to-text-realtime/ws")
  assert.equal(url.searchParams.get("language_code"), "auto")
  assert.equal(url.searchParams.get("endpointing"), "vad")
  assert.equal(url.searchParams.get("encoding"), "linear16")
  assert.equal(url.searchParams.get("sample_rate"), "16000")
  assert.equal(url.searchParams.get("stream_type"), "fast")
  assert.equal(url.searchParams.get("silence_duration_ms"), "420")
})

test("streaming TTS URL requests completion events for per-turn lifecycle", () => {
  const url = new URL(streamingTtsUrl({ model:"bulbul:v3" }))
  assert.equal(url.pathname, "/text-to-speech/ws")
  assert.equal(url.searchParams.get("model"), "bulbul:v3")
  assert.equal(url.searchParams.get("send_completion_event"), "true")
})
