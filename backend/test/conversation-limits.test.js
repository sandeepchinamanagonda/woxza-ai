import test from "node:test"
import assert from "node:assert/strict"
import { voiceResponseTokenLimit } from "../src/demo/conversation-limits.js"

test("full-picture budget is independent from ordinary phone turns", () => {
  const oldOrdinary = process.env.VOICE_RESPONSE_MAX_TOKENS
  const oldExtended = process.env.VOICE_FULL_PICTURE_MAX_TOKENS
  process.env.VOICE_RESPONSE_MAX_TOKENS = "56"
  delete process.env.VOICE_FULL_PICTURE_MAX_TOKENS
  assert.equal(voiceResponseTokenLimit("en"), 56)
  assert.equal(voiceResponseTokenLimit("en", { extended:true }), 256)
  process.env.VOICE_FULL_PICTURE_MAX_TOKENS = "192"
  assert.equal(voiceResponseTokenLimit("en", { extended:true }), 192)
  if (oldOrdinary === undefined) delete process.env.VOICE_RESPONSE_MAX_TOKENS
  else process.env.VOICE_RESPONSE_MAX_TOKENS = oldOrdinary
  if (oldExtended === undefined) delete process.env.VOICE_FULL_PICTURE_MAX_TOKENS
  else process.env.VOICE_FULL_PICTURE_MAX_TOKENS = oldExtended
})
