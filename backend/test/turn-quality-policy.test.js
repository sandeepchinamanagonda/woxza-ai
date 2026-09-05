import assert from "node:assert/strict"
import test from "node:test"
import { assessCallerPartial, assessCallerTurn } from "../src/demo/turn-quality-policy.js"

test("holds acknowledgements and micro-fragments without invoking a model", () => {
  assert.deepEqual(assessCallerTurn("Okay"), { action:"hold", reason:"acknowledgement" })
  assert.deepEqual(assessCallerTurn("హ్మ్"), { action:"hold", reason:"acknowledgement" })
  assert.deepEqual(assessCallerTurn("sarele"), { action:"hold", reason:"acknowledgement" })
  assert.deepEqual(assessCallerTurn("Hmm adhe"), { action:"hold", reason:"acknowledgement" })
  assert.deepEqual(assessCallerTurn("I"), { action:"hold", reason:"micro_fragment" })
})

test("requires meaningful words before a partial can interrupt playback", () => {
  assert.deepEqual(assessCallerPartial("Hmm"), { action:"observe", reason:"not_meaningful_yet" })
  assert.deepEqual(assessCallerPartial("sarele"), { action:"observe", reason:"not_meaningful_yet" })
  assert.deepEqual(assessCallerPartial("ఫార్మసీ"), { action:"observe", reason:"await_final_single_word" })
  assert.deepEqual(assessCallerPartial("ఆగండి"), { action:"confirm_barge_in", reason:"explicit_interruption" })
  assert.deepEqual(assessCallerPartial("నా షాప్ ఉంది"), { action:"confirm_barge_in", reason:"meaningful_multiword_partial" })
})

test("keeps meaningful multilingual caller turns for the brain", () => {
  assert.deepEqual(assessCallerTurn("నా మందుల షాప్ ఉంది"), { action:"respond", reason:"meaningful_turn" })
  assert.deepEqual(assessCallerTurn("I use phone and WhatsApp"), { action:"respond", reason:"meaningful_turn" })
})
