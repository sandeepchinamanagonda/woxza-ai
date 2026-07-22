import assert from "node:assert/strict"
import test from "node:test"
import { applyDeterministicDemoEngine, createDemoMock } from "../src/demo/deterministic-demo-engine.js"

test("demo engine owns stable mock price, delivery window, and reference", () => {
  const mock = createDemoMock({ callId:"abc-123456", business:"tile showroom", scenario:"billing_quote", order:{ product:"floor tiles", quantity:"100", unit:"square feet" } })
  assert.equal(mock.unit_price, "₹500 per square feet")
  assert.equal(mock.total, "₹50,000")
  assert.equal(mock.delivery_window, "today between 4 PM and 6 PM")
  assert.equal(mock.reference, "DEMO-123456")
})

test("engine hydrates only supported demo actions and leaves discovery untouched", () => {
  const session = { call_id:"demo-abcdef", demo_scenario:"delivery", business_profile:{ business:"hardware shop" }, demo_order:{ product:"cement", quantity:"2", unit:"bags" } }
  const demo = applyDeterministicDemoEngine({ action:"deliver_delivery_status_and_ask_proceed", pending_session:session, response_context:{ scenario:"delivery" } }, session)
  assert.equal(demo.response_context.deterministic_demo, true)
  assert.equal(demo.response_context.mock.reference, "DEMO-ABCDEF")
  const discovery = applyDeterministicDemoEngine({ action:"ask_missing_business_detail", pending_session:session, response_context:{} }, session)
  assert.equal(discovery.response_context.deterministic_demo, undefined)
})
