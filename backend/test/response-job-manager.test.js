import assert from "node:assert/strict"
import test from "node:test"
import { createResponseJobManager } from "../src/demo/response-job-manager.js"

test("plays an owned job exactly once and persists the approved text", async () => {
  const audio = [], transcripts = []
  const manager = createResponseJobManager({ demoCallId:"00000000-0000-0000-0000-000000000001", onAudio:(pcm, meta) => audio.push({ pcm, meta }), persistTranscript:async value => { transcripts.push(value); return 99 } })
  const job = await manager.create({ action:"ask_missing_business_detail", responseText:"స్టీల్ కొట్టు, చాలా బాగుంది!", language:"te", textSource:"template" })
  assert.equal(await manager.deliver({ responseJobId:job.id, renderEpoch:job.render_epoch, pcm:Buffer.from([1]) }), true)
  assert.equal(await manager.complete({ responseJobId:job.id, renderEpoch:job.render_epoch }), true)
  assert.equal(audio.length, 1)
  assert.deepEqual(transcripts, [{ responseJobId:job.id, text:"స్టీల్ కొట్టు, చాలా బాగుంది!", deliveryStatus:"locked_playing" }])
  assert.equal(manager.activeJob().status, "completed")
})

test("discards stale job audio before it reaches the carrier", async () => {
  const audio = [], events = []
  const manager = createResponseJobManager({ demoCallId:"00000000-0000-0000-0000-000000000002", onAudio:pcm => audio.push(pcm), onEvent:event => events.push(event) })
  const job = await manager.create({ action:"clarify", responseText:"Could you repeat that?", language:"en", textSource:"template" })
  assert.equal(await manager.deliver({ responseJobId:"wrong", renderEpoch:1, pcm:Buffer.from([1]) }), false)
  assert.equal(await manager.deliver({ responseJobId:job.id, renderEpoch:2, pcm:Buffer.from([1]) }), false)
  assert.equal(audio.length, 0)
  assert.equal(events.filter(event => event.event === "response_audio_discarded").length, 2)
})

test("real caller barge-in invalidates late TTS chunks", async () => {
  const audio = []
  const manager = createResponseJobManager({ demoCallId:"00000000-0000-0000-0000-000000000003", onAudio:pcm => audio.push(pcm) })
  const job = await manager.create({ action:"clarify", responseText:"Please repeat.", language:"en", textSource:"template" })
  await manager.deliver({ responseJobId:job.id, renderEpoch:1, pcm:Buffer.from([1]) })
  const interrupted = await manager.interrupt()
  assert.equal(interrupted.status, "interrupted")
  assert.equal(await manager.deliver({ responseJobId:job.id, renderEpoch:1, pcm:Buffer.from([2]) }), false)
  assert.equal(audio.length, 1)
})
