import test from "node:test"
import assert from "node:assert/strict"
import { estimateCallCosts } from "../src/call-costs.js"

test("estimates Sarvam voice and chat costs from persisted units", () => {
  const result = estimateCallCosts({
    sttAudioSeconds:150,
    sttModel:"saaras:v3-realtime",
    ttsCharacters:900,
    llmProvider:"sarvam-conversations",
    inputTokens:6000,
    outputTokens:500
  })
  assert.equal(result.sttInr, 0.75)
  assert.equal(result.ttsInr, 2.7)
  assert.equal(result.llmInr, 0.21228)
  assert.equal(result.totalInr, 3.66228)
})

test("keeps Indic TTS usage telemetry while excluding a Sarvam per-character charge", () => {
  const result = estimateCallCosts({ ttsCharacters:2000, ttsProvider:"ai4bharat-indic-tts" })
  assert.equal(result.ttsInr, 0)
})

test("estimates V3 Gemini text brain separately in USD and INR", () => {
  const result = estimateCallCosts({ ttsCharacters:100, llmProvider:"gemini", inputTokens:1_000_000, cachedInputTokens:200_000, outputTokens:100_000 })
  assert.equal(result.ttsInr, 0.3)
  assert.equal(result.geminiUsd, 0.496)
  assert.equal(result.geminiInr, 46.872)
  assert.equal(result.llmInr, 46.872)
  assert.equal(result.totalInr, 47.172)
})
