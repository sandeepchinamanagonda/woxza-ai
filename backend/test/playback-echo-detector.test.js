import assert from "node:assert/strict"
import test from "node:test"
import { createPlaybackEchoDetector } from "../src/demo/playback-echo-detector.js"

const audio = phase => {
  const frame = Buffer.alloc(640)
  for (let index = 0; index < 320; index += 1) frame.writeInt16LE(Math.round(Math.sin((index + phase) / 7) * 6_000), index * 2)
  return frame
}

test("recognises a scaled copy of recently played audio as echo", () => {
  const detector = createPlaybackEchoDetector()
  const outgoing = audio(0)
  const echoed = Buffer.alloc(640)
  for (let index = 0; index < 320; index += 1) echoed.writeInt16LE(Math.round(outgoing.readInt16LE(index * 2) * 0.45), index * 2)
  detector.noteOutgoing(outgoing, 16_000)
  assert.equal(detector.assessIncoming(echoed).likelyEcho, true)
})

test("does not label unrelated caller speech-shaped audio as echo", () => {
  const detector = createPlaybackEchoDetector()
  detector.noteOutgoing(audio(0), 16_000)
  const result = detector.assessIncoming(audio(31))
  assert.equal(result.likelyEcho, false)
})

test("does not compare incompatible output sample rates", () => {
  const detector = createPlaybackEchoDetector()
  detector.noteOutgoing(audio(0), 24_000)
  assert.equal(detector.assessIncoming(audio(0)).likelyEcho, false)
})
