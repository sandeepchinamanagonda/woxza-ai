import assert from "node:assert/strict"
import test from "node:test"
import { createCallerTurnController } from "../src/demo/caller-turn-controller.js"

const silence = () => Buffer.alloc(640)
const speech = () => {
  const value = Buffer.alloc(640)
  for (let index = 0; index < 320; index += 1) value.writeInt16LE(index % 2 ? 3000 : -3000, index * 2)
  return value
}

const quietInterjection = () => {
  const value = Buffer.alloc(640)
  for (let index = 0; index < 320; index += 1) value.writeInt16LE(index % 2 ? 160 : -160, index * 2)
  return value
}

test("the 150 RMS local-test threshold catches a quiet two-frame interruption", () => {
  let starts = 0
  const controller = createCallerTurnController({
    audible:frame => {
      const samples = new Int16Array(frame.buffer, frame.byteOffset, frame.length / 2)
      return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length) >= 150
    },
    onActivityStart:() => { starts += 1 }
  })
  controller.push(quietInterjection())
  controller.push(quietInterjection())
  assert.equal(starts, 1)
})

test("keeps playback during candidate audio and stops only after lexical confirmation", () => {
  const events = []
  const controller = createCallerTurnController({
    endSilenceMs:60,
    preRollFrames:1,
    onBargeIn:({ utteranceId }) => events.push(`barge:${utteranceId}`),
    onActivityStart:({ utteranceId }) => events.push(`start:${utteranceId}`),
    onAudio:() => events.push("audio"),
    onActivityEnd:({ utteranceId }) => events.push(`end:${utteranceId}`)
  })
  controller.push(speech())
  assert.deepEqual(events, [])
  controller.push(speech())
  assert.deepEqual(events, ["start:1", "audio", "audio"])
  assert.equal(controller.confirmBargeIn({ reason:"meaningful_stt_partial" }), true)
  assert.deepEqual(events.slice(0, 4), ["start:1", "audio", "audio", "barge:1"])
  controller.push(silence())
  controller.push(silence())
  controller.push(silence())
  assert.ok(events.includes("end:1"))
})

test("ignores a stale end after a later utterance has started", () => {
  const ended = []
  const controller = createCallerTurnController({ endSilenceMs:1000, onActivityEnd:({ utteranceId }) => ended.push(utteranceId) })
  controller.push(speech())
  controller.push(speech())
  controller.confirmBargeIn()
  assert.equal(controller.end(2), false)
  assert.equal(controller.end(1), true)
  controller.push(speech())
  controller.push(speech())
  controller.confirmBargeIn()
  assert.equal(controller.end(1), false)
  assert.equal(controller.end(2), true)
  assert.deepEqual(ended, [1, 2])
})

test("delivers the exact PCM utterance, including pre-roll, only once on commit", () => {
  let committed
  const controller = createCallerTurnController({
    endSilenceMs:20,
    preRollFrames:1,
    onActivityEnd:event => { committed = event }
  })
  const first = speech()
  const second = speech()
  const trailingSilence = silence()
  controller.push(first)
  controller.push(second)
  controller.confirmBargeIn()
  controller.push(trailingSilence)

  assert.equal(committed.utteranceId, 1)
  assert.deepEqual(committed.audio, Buffer.concat([first, second, trailingSilence]))
})

test("an unconfirmed noise candidate is sent to STT but never interrupts playback", () => {
  const events = []
  const controller = createCallerTurnController({
    endSilenceMs:40,
    onBargeIn:() => events.push("barge"),
    onAudio:() => events.push("audio"),
    onUnconfirmedActivityEnd:() => events.push("ignored")
  })
  // Two 20ms frames detect a candidate, but do not clear the agent.
  controller.push(speech()); controller.push(speech())
  assert.equal(events.includes("barge"), false)
  assert.equal(events.filter(event => event === "audio").length, 2)
  controller.push(silence()); controller.push(silence())
  assert.ok(events.includes("ignored"))
  assert.equal(events.includes("barge"), false)
})

test("does not re-fire barge-in when an STT partial arrives after endpointing", () => {
  const events = []
  const controller = createCallerTurnController({
    endSilenceMs:40,
    onBargeIn:() => events.push("barge"),
    onActivityEnd:() => events.push("end")
  })
  controller.push(speech()); controller.push(speech())
  assert.equal(controller.confirmBargeIn(), true)
  controller.push(silence()); controller.push(silence())
  assert.deepEqual(events, ["barge", "end"])

  // Sarvam can send another partial after speech_end/flush. That partial is
  // still useful to transcription, but it cannot be a fresh interruption.
  assert.equal(controller.confirmBargeIn(), false)
  assert.deepEqual(events, ["barge", "end"])
})
