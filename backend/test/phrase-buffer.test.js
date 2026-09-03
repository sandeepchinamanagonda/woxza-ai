import test from "node:test"
import assert from "node:assert/strict"
import { createPhraseBuffer, createWordBoundaryBuffer } from "../src/demo/phrase-buffer.js"

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
