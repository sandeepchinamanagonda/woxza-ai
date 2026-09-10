import test from "node:test"
import assert from "node:assert/strict"
import { createPhraseBuffer, createProsodyPhraseBuffer, createWordBoundaryBuffer } from "../src/demo/phrase-buffer.js"
import { configuredTurnControl, configuredTurnControlSettings, configuredTurnValidationMode, configuredTurnValidationTimeoutMs, configuredWoxzaPhraseBuffer } from "../src/demo/v3-streaming-bridge.js"

test("phrase buffer waits for a complete sentence before TTS", () => {
  const buffer = createPhraseBuffer({ minimumCharacters:10 })
  assert.equal(buffer.push("మీరు చెప్పినది "), "")
  assert.equal(buffer.push("అర్థమవుతోంది. తరువాత"), "మీరు చెప్పినది అర్థమవుతోంది.")
  assert.equal(buffer.flush(), "తరువాత")
})

test("word buffer releases a valid streaming-TTS chunk without waiting for a sentence", () => {
  const buffer = createWordBoundaryBuffer({ minimumCharacters:30 })
  assert.deepEqual(buffer.push("మీ business లో follow-up చేయడం "), ["మీ business లో follow-up చేయడం"])
  assert.deepEqual(buffer.push("ఎలా జరుగుతోంది"), [])
  assert.equal(buffer.flush(), "ఎలా జరుగుతోంది")
})

test("prosody buffer keeps a comma clause together until the sentence ends", () => {
  const buffer = createProsodyPhraseBuffer({ minimumCharacters:30, maximumCharacters:140 })
  assert.deepEqual(buffer.push("మీకు రోజుకు చాలా enquiries వస్తున్నట్టు ఉంది, "), [])
  assert.deepEqual(buffer.push("వాటిలో follow up చేయడం ఎక్కువ సమయం తీసుకుంటుందా?"), [{
    text:"మీకు రోజుకు చాలా enquiries వస్తున్నట్టు ఉంది, వాటిలో follow up చేయడం ఎక్కువ సమయం తీసుకుంటుందా?",
    releaseReason:"sentence_end"
  }])
  assert.equal(buffer.flush(), null)
})

test("prosody buffer prefers sentence endings and preserves ordered text", () => {
  const source = "That is a useful detail for the demo. Which channel takes most of the follow-up time?"
  const buffer = createProsodyPhraseBuffer({ minimumCharacters:20, maximumCharacters:140 })
  const phrases = [...buffer.push(source.slice(0, 47)), ...buffer.push(source.slice(47))]
  const tail = buffer.flush(); if (tail) phrases.push(tail)
  assert.deepEqual(phrases.map(phrase => phrase.releaseReason), ["sentence_end", "sentence_end"])
  assert.equal(phrases.map(phrase => phrase.text).join(" "), source)
})

test("prosody buffer falls back only at a safe word boundary when punctuation is absent", () => {
  const source = "This reply has no punctuation but it still needs a safe speaking boundary before it becomes too long"
  const buffer = createProsodyPhraseBuffer({ minimumCharacters:20, maximumCharacters:42 })
  const phrases = buffer.push(source)
  const tail = buffer.flush(); if (tail) phrases.push(tail)
  assert.ok(phrases.length >= 1)
  assert.equal(phrases[0].releaseReason, "max_length_fallback")
  assert.ok(phrases.filter(phrase => phrase.releaseReason === "max_length_fallback").length >= 1)
  assert.equal(phrases.map(phrase => phrase.text).join(" "), source)
  assert.ok(phrases.every(phrase => !phrase.text.endsWith(" ")))
})

test("prosody buffer can release a complete word-boundary phrase after its wait budget", () => {
  let time = 0
  const buffer = createProsodyPhraseBuffer({ minimumCharacters:20, maximumCharacters:140, maxWaitMs:400, now:() => time })
  assert.deepEqual(buffer.push("This is a natural but unfinished phrase"), [])
  time = 399
  assert.equal(buffer.releaseTimedOut(), null)
  time = 400
  assert.deepEqual(buffer.releaseTimedOut(), { text:"This is a natural but unfinished", releaseReason:"max_wait_fallback" })
})

test("Woxza phrase controls use their own settings before legacy values", () => {
  assert.deepEqual(configuredWoxzaPhraseBuffer({
    V3_WOXZA_PHRASE_MIN_CHARS:"72", V3_WOXZA_PHRASE_MAX_CHARS:"160", V3_WOXZA_PHRASE_MAX_WAIT_MS:"350",
    V3_TTS_MIN_BUFFER_CHARS:"60", V3_TTS_PHRASE_MAX_CHARS:"140"
  }), { minimumCharacters:72, maximumCharacters:160, maxWaitMs:350 })
})

test("turn control defaults to completed-turn protection and accepts only explicit modes", () => {
  assert.equal(configuredTurnControl({}), "hybrid")
  assert.equal(configuredTurnControl({ V3_TURN_CONTROL:"shadow" }), "shadow")
  assert.equal(configuredTurnControl({ V3_TURN_CONTROL:"bridge" }), "bridge")
  assert.equal(configuredTurnControl({ V3_TURN_CONTROL:"hybrid" }), "hybrid")
  assert.equal(configuredTurnControl({ V3_TURN_CONTROL:"anything-else" }), "hybrid")
  assert.deepEqual(configuredTurnControlSettings({
    V3_TURN_START_FRAMES:"3", V3_TURN_ENDPOINT_SILENCE_MS:"800", V3_TURN_PRE_ROLL_FRAMES:"12"
  }), { startFrames:3, endSilenceMs:800, preRollFrames:12 })
})

test("turn validation modes are explicit, with production-safe code defaults", () => {
  assert.equal(configuredTurnValidationMode({}), "off")
  assert.equal(configuredTurnValidationMode({ V3_TURN_VALIDATION_MODE:"shadow" }), "shadow")
  assert.equal(configuredTurnValidationMode({ V3_TURN_VALIDATION_MODE:"active" }), "active")
})

test("turn validation timeout is bounded for predictable caller latency", () => {
  assert.equal(configuredTurnValidationTimeoutMs({}), 5000)
  assert.equal(configuredTurnValidationTimeoutMs({ V3_TURN_VALIDATION_TIMEOUT_MS:"4200" }), 4200)
  assert.equal(configuredTurnValidationTimeoutMs({ V3_TURN_VALIDATION_TIMEOUT_MS:"100" }), 500)
  assert.equal(configuredTurnValidationTimeoutMs({ V3_TURN_VALIDATION_TIMEOUT_MS:"9000" }), 5000)
})
