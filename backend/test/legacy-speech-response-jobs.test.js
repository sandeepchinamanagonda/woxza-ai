import assert from "node:assert/strict"
import test from "node:test"
import { createResponseTextBuilder } from "../src/demo/response-text-builder.js"

// These are the legacy speech branches migrated to backend-owned response
// jobs. They must all freeze their supplied backend text before TTS; none may
// require Gemini Live to phrase or speak it.
const migratedActions = [
  "opening",
  "silence_reprompt",
  "legacy_delivery_retry",
  "legacy_order_confirmation",
  "legacy_post_order",
  "legacy_appointment_closing",
  "legacy_contextual_completion",
  "legacy_output_safety_retry",
  "legacy_protected_render_retry"
]

test("every migrated legacy speech action freezes backend-owned text", async () => {
  let generatorCalls = 0
  const builder = createResponseTextBuilder({ generate:async () => { generatorCalls += 1; return { response_text:"must not be used" } } })
  for (const action of migratedActions) {
    const expected = `approved ${action}`
    const rendered = await builder.build({ action, language:"en", context:{ response_text:expected } })
    assert.deepEqual(rendered, { response_text:expected, text_source:"template", model:null })
  }
  assert.equal(generatorCalls, 0)
})

test("bridge keeps legacy Live output fenced when approved rendering is on", async () => {
  const source = await import("node:fs/promises").then(fs => fs.readFile(new URL("../src/demo/gemini-bridge.js", import.meta.url), "utf8"))
  assert.match(source, /live_audio_forbidden_in_approved_tts_mode/)
  assert.match(source, /missing_response_job_capability/)
  assert.match(source, /deliverBackendResponse\(\{ action:"opening"/)
  assert.match(source, /deliverBackendResponse\(\{ action:"close"/)
})
