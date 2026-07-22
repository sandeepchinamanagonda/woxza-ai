import assert from "node:assert/strict"
import test from "node:test"
import { createLiveTranscriptTurnBuffer, mergeLiveTranscriptFragments } from "../src/demo/live-transcript-buffer.js"

test("coalesces many streaming fragments into one caller turn", () => {
  let scheduled
  const received = []
  const buffer = createLiveTranscriptTurnBuffer({
    schedule:callback => (scheduled = callback),
    cancel:() => {},
    onTurn:text => received.push(text)
  })
  buffer.push("tile")
  buffer.push("shop")
  buffer.push("delivery")
  scheduled()
  assert.deepEqual(received, ["tile shop delivery"])
})

test("does not split Indic-script speech into fake individual caller turns", () => {
  assert.equal(mergeLiveTranscriptFragments(["మే", "ము", "ఆ", "ర్డర్"]), "మేముఆర్డర్")
})
