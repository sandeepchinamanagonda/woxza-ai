import assert from "node:assert/strict"
import test from "node:test"
import { createLiveTurnGate, interpretationSignature } from "../src/demo/live-turn-gate.js"
import { createAudioChunkDeduplicator } from "../src/demo/audio-deduplicator.js"

test("allows one interpretation per caller turn and suppresses only in-flight semantic duplicates", () => {
  let at = 0
  const gate = createLiveTurnGate({ now:() => at })
  const signature = interpretationSignature({ intent:"change_choice", clarity:"clear", details:{ choice:"demo" } })
  gate.begin(4)
  assert.equal(gate.claim(4), true)
  assert.equal(gate.claim(4), false)
  gate.record(signature, "experience_choice")
  assert.equal(gate.isInFlightDuplicate(signature, "experience_choice", true), true)
  assert.equal(gate.isInFlightDuplicate(signature, "demo_scenario", true), false)
  at = 8_001
  assert.equal(gate.isInFlightDuplicate(signature, "experience_choice", true), false)
})

test("drops byte-identical audible chunks only inside the short action window", () => {
  let at = 0
  const dedupe = createAudioChunkDeduplicator({ now:() => at })
  const chunk = Buffer.from("same-native-audio")
  assert.equal(dedupe.shouldForward("action-1", chunk), true)
  assert.equal(dedupe.shouldForward("action-1", chunk), false)
  assert.equal(dedupe.shouldForward("action-2", chunk), true)
  at = 2_501
  assert.equal(dedupe.shouldForward("action-1", chunk), true)
})
