import test from "node:test"
import assert from "node:assert/strict"
import { voicePitchTokenLimit } from "../src/demo/conversation-limits.js"

test("gives a rare localized pitch enough room without enlarging English by default", () => {
  const previous = process.env.VOICE_PITCH_MAX_TOKENS
  delete process.env.VOICE_PITCH_MAX_TOKENS
  try {
    assert.equal(voicePitchTokenLimit("en"), 160)
    assert.equal(voicePitchTokenLimit("te"), 220)
    assert.equal(voicePitchTokenLimit("gu"), 220)
  } finally {
    if (previous !== undefined) process.env.VOICE_PITCH_MAX_TOKENS = previous
  }
})
