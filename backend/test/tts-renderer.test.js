import assert from "node:assert/strict"
import test from "node:test"
import { createResponseJobManager } from "../src/demo/response-job-manager.js"
import { createTtsRenderer, resolveChirpSpeakingRate } from "../src/demo/tts-renderer.js"

test("Chirp speaking rate is an explicit bounded environment setting", () => {
  assert.equal(resolveChirpSpeakingRate("1.15"), 1.15)
  assert.equal(resolveChirpSpeakingRate("2.2"), 1)
  assert.equal(resolveChirpSpeakingRate("not-a-number"), 1)
})

test("renderer receives only frozen response text and streams only to its matching job", async () => {
  const received = [], audio = []
  const renderer = createTtsRenderer({ stream:async function *({ responseText, signal }) { received.push({ responseText, aborted:signal.aborted }); yield Buffer.from([1, 2]); yield Buffer.from([3]) } })
  const manager = createResponseJobManager({ demoCallId:"00000000-0000-0000-0000-000000000004", onAudio:pcm => audio.push(pcm) })
  const job = await manager.create({ action:"clarify", responseText:"స్టీల్ కొట్టు, చాలా బాగుంది!", language:"te", textSource:"template" })
  assert.equal(await renderer.renderJob({ job, manager }), true)
  assert.deepEqual(received, [{ responseText:"స్టీల్ కొట్టు, చాలా బాగుంది!", aborted:false }])
  assert.equal(audio.length, 2)
})

test("never starts a TTS request when caller barge-in cancelled the job before rendering", async () => {
  let requests = 0
  const renderer = createTtsRenderer({ stream:async function *() { requests += 1; yield Buffer.from([1]) } })
  const manager = createResponseJobManager({ demoCallId:"00000000-0000-0000-0000-000000000005" })
  const job = await manager.create({ action:"clarify", responseText:"Please repeat.", language:"en", textSource:"template" })
  await manager.interrupt("caller_barge_in")
  assert.equal(await renderer.renderJob({ job, manager }), false)
  assert.equal(requests, 0)
})
