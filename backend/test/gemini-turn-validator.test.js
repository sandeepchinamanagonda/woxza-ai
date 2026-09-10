import assert from "node:assert/strict"
import test from "node:test"
import { createGeminiTurnValidator } from "../src/demo/gemini-turn-validator.js"
import { createTurnValidationGate } from "../src/demo/turn-validation-gate.js"

const request = { schema_version:1, candidate_text:"I run a medical shop", language:{ selected:"en" } }
const geminiResponse = value => ({ ok:true, json:async () => ({ candidates:[{ content:{ parts:[{ text:JSON.stringify(value) }] } }] }) })

test("Gemini validator submits a strict bounded JSON request and normalizes the response", async () => {
  let call
  const validator = createGeminiTurnValidator({
    apiKey:"test-key",
    model:"test-model",
    fetchImpl:async (...args) => { call = args; return geminiResponse({ decision:"complete", confidence:0.95, reason_code:"contextually_complete_answer", candidate_text:"I run a medical shop" }) }
  })
  const result = await validator.validate(request)
  assert.match(call[0], /test-model:generateContent\?key=test-key/)
  const body = JSON.parse(call[1].body)
  assert.equal(body.generationConfig.temperature, 0)
  assert.deepEqual(body.generationConfig.responseJsonSchema.required, ["decision", "confidence", "reason_code", "candidate_text"])
  assert.equal(result.valid, true)
  assert.equal(result.value.next_action, "route_complete_turn")
})

test("Gemini validator rejects malformed provider JSON", async () => {
  const validator = createGeminiTurnValidator({ apiKey:"test-key", fetchImpl:async () => ({ ok:true, json:async () => ({ candidates:[{ content:{ parts:[{ text:"not-json" }] } }] }) }) })
  await assert.rejects(() => validator.validate(request), /invalid JSON/)
})

test("Gemini validator aborts a slow provider request at its configured deadline", async () => {
  const validator = createGeminiTurnValidator({
    apiKey:"test-key",
    timeoutMs:500,
    fetchImpl:(_url, { signal }) => new Promise((resolve, reject) => {
      // Keep the test event loop alive while AbortSignal.timeout fires; a real
      // fetch request naturally does this while its socket is pending.
      const keeper = setTimeout(resolve, 650)
      signal.addEventListener("abort", () => { clearTimeout(keeper); reject(signal.reason) }, { once:true })
    })
  })
  await assert.rejects(() => validator.validate(request), error => error.name === "TimeoutError")
})

test("turn-validation gate fails closed and leaves state untouched on validator errors", async () => {
  const gate = createTurnValidationGate({ validator:{ validate:async () => { throw new Error("provider unavailable") } } })
  const evaluation = await gate.evaluate({ finalTranscript:"I think", language:"en" })
  assert.equal(evaluation.status, "failed")
  assert.deepEqual(gate.snapshot(), { heldFragment:"", unclearAttempts:0, fragmentExpiresAt:null })
})

test("turn-validation gate applies only validated decisions to its temporary state", async () => {
  const validator = { validate:async request => ({ valid:true, value:{ decision:"incomplete", confidence:0.98, reason_code:"continuing_thought", candidate_text:request.candidate_text, should_hold_fragment:true } }) }
  const gate = createTurnValidationGate({ validator })
  const evaluation = await gate.evaluate({ finalTranscript:"I think", language:"en", conversation:{ phase:"focused_discovery" } })
  assert.equal(evaluation.status, "validated")
  assert.equal(gate.snapshot().heldFragment, "I think")
})

test("turn-validation gate records payload, validator, state, and total timing", async () => {
  const gate = createTurnValidationGate({ validator:{ validate:async request => ({ valid:true, value:{ decision:"complete", confidence:0.9, reason_code:"complete_answer", candidate_text:request.candidate_text } }) } })
  const evaluation = await gate.evaluate({ finalTranscript:"A complete answer", language:"en" })
  assert.equal(evaluation.status, "validated")
  assert.deepEqual(Object.keys(evaluation.timing).sort(), ["payload_build_ms", "state_apply_ms", "total_ms", "validator_ms"])
  assert.ok(evaluation.timing.total_ms >= evaluation.timing.validator_ms)
})
