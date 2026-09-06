import test from "node:test"
import assert from "node:assert/strict"
import { hasVerifiedValueRequest } from "../src/demo/value-intent-evidence.js"

test("requires a caller-cited explicit request before activating a value pitch", () => {
  const history = [{ role:"user", content:"I run a steel shop and receive calls on WhatsApp." }]
  assert.equal(hasVerifiedValueRequest({ requested:true, confidence:0.89, evidence:"steel shop" }, history), false)
  assert.equal(hasVerifiedValueRequest({ requested:false, confidence:1, evidence:"steel shop" }, history), false)
  assert.equal(hasVerifiedValueRequest({ requested:true, confidence:0.99, evidence:"how can Woxza help" }, history), false)
})

test("accepts an exact multilingual caller request as classifier evidence", () => {
  const history = [{ role:"user", content:"నా స్టీల్ షాప్‌కి Woxza ఎలా ఉపయోగపడుతుంది?" }]
  assert.equal(hasVerifiedValueRequest({ requested:true, confidence:0.99, evidence:"Woxza ఎలా ఉపయోగపడుతుంది" }, history), true)
})
