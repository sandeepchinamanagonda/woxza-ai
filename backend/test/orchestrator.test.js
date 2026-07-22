import assert from "node:assert/strict"
import test from "node:test"
import { cancelPendingAction, commitAction, createCallSession, noOp, submitTurn } from "../src/demo/orchestrator.js"

function turn(session, intent, details={}, clarity="clear") {
  return submitTurn(session, { turn_id:session.turn_id, expected_state_version:session.state_version, intent, clarity, details })
}
function spoken(result) { return commitAction(result.pending_session, result.pending_session.pending_action.action_id) }
function callerTurn(session) { return { ...session, turn_id:session.turn_id + 1 } }
function readyDiscovery() {
  const initial = callerTurn(createCallSession({ callId:"call-1" }))
  return spoken(turn(initial, "provide_detail", { business:"tile shop", current_process:"staff take calls", primary_pain:"missed showroom enquiries", operating_detail:"35 calls a day" }))
}

test("orchestrator rejects stale turns without advancing phase", () => {
  const session = createCallSession({ callId:"call-1" })
  assert.deepEqual(submitTurn(session, { turn_id:1, expected_state_version:0, intent:"accept", clarity:"clear" }), noOp())
})

test("phase changes only when approved audio begins and a cancelled action is harmless", () => {
  const proposed = turn(callerTurn(createCallSession({ callId:"call-1" })), "provide_detail", { business:"hotel", current_process:"staff answer calls", primary_pain:"missed late check-in calls", operating_detail:"20 calls/day" })
  const cancelled = cancelPendingAction(proposed.pending_session, proposed.pending_session.pending_action.action_id)
  assert.equal(cancelled.stable_phase, "business_discovery")
  assert.equal(cancelled.state_version, 0)
  const committed = spoken(proposed)
  assert.equal(committed.stable_phase, "experience_choice")
  assert.equal(committed.state_version, 1)
})

test("discovery does not pitch before all four confirmed details", () => {
  const session = callerTurn(createCallSession({ callId:"call-1" }))
  const result = turn(session, "provide_detail", { business:"mobile repair shop" })
  assert.equal(result.action, "ask_missing_business_detail")
  assert.equal(result.response_context.missing, "current_process")
  assert.equal(result.pending_session.stable_phase, "business_discovery")
})

test("discovery keeps a dynamic label and approved workflow tags without hard-coding a shop name", () => {
  const session = callerTurn(createCallSession({ callId:"call-1" }))
  const result = turn(session, "provide_detail", {
    business:"Sri Lakshmi Traders",
    current_process:"staff answer contractor calls and note quotes",
    primary_pain:"missed quote follow-ups",
    operating_detail:"40 calls a day",
    business_label:"door retailer with contractor quote enquiries",
    business_category:"retail_general",
    workflow_tags:["catalogue_quotes", "lead_follow_up", "high_call_volume"]
  })
  assert.equal(result.pending_session.business_profile.business_label, "door retailer with contractor quote enquiries")
  assert.equal(result.pending_session.business_profile.business_category, "retail_general")
  assert.deepEqual(result.pending_session.business_profile.workflow_tags, ["catalogue_quotes", "lead_follow_up", "high_call_volume"])
})

test("pitch-first decline closes directly after pitch", () => {
  let session = readyDiscovery()
  session = callerTurn({ ...session, pitch:{ status:"ready", data:[{ id:"p1" }] }, demo:{ status:"ready", data:{} } })
  session = spoken(turn(session, "change_choice", { choice:"pitch" }))
  assert.equal(session.stable_phase, "tailored_pitch")
  session = callerTurn(session)
  session = spoken(turn(session, "feedback"))
  assert.equal(session.stable_phase, "demo_offer")
  session = callerTurn(session)
  const declined = turn(session, "decline")
  assert.equal(declined.action, "close")
  assert.equal(declined.pending_session.pending_action.next_phase, "closing")
})

test("a clear demo selection advances even while background preparation is pending and duplicate tool calls cannot advance it twice", () => {
  let session = readyDiscovery()
  session = callerTurn({ ...session, pitch:{ status:"preparing", data:null }, demo:{ status:"preparing", data:null } })
  const selected = turn(session, "change_choice", { choice:"demo" })
  assert.equal(selected.action, "ask_demo_scenario")
  assert.equal(selected.pending_session.pending_action.next_phase, "demo_scenario")

  const afterSelection = spoken(selected)
  const duplicate = submitTurn(afterSelection, { turn_id:session.turn_id, expected_state_version:afterSelection.state_version, intent:"change_choice", clarity:"clear", details:{ choice:"demo" } })
  assert.deepEqual(duplicate, noOp("duplicate_turn"))
})

test("demo-first collects quantity and handles product follow-ups before example-order confirmation and feedback", () => {
  let session = readyDiscovery()
  session = callerTurn({ ...session, pitch:{ status:"ready", data:[{ id:"p1" }] }, demo:{ status:"ready", data:{ default_scenario:"stock availability" } } })
  session = spoken(turn(session, "change_choice", { choice:"demo" }))
  assert.equal(session.stable_phase, "demo_scenario")
  session = callerTurn(session)
  session = spoken(turn(session, "accept", { scenario:"anything" }))
  assert.equal(session.stable_phase, "customer_request")
  session = callerTurn(session)
  const stockAnswer = turn(session, "customer_request", { request:"Do you have this tile in stock?" })
  assert.equal(stockAnswer.action, "deliver_simulated_answer_and_ask_quantity")
  assert.match(stockAnswer.response_context.instruction, /how many/i)
  session = spoken(stockAnswer)
  assert.equal(session.stable_phase, "order_details")
  session = callerTurn(session)
  const discount = turn(session, "customer_request", { request:"What discount can I get?" })
  assert.equal(discount.action, "answer_order_follow_up_and_ask_quantity")
  assert.equal(discount.pending_session.pending_action.next_phase, "order_details")
  session = spoken(discount)
  session = callerTurn(session)
  const quantity = turn(session, "provide_detail", { quantity:"2 cartons" })
  assert.equal(quantity.action, "present_order_terms_and_ask_proceed")
  session = spoken(quantity)
  assert.equal(session.stable_phase, "task_confirmation")
  session = callerTurn(session)
  const confirmation = turn(session, "accept")
  assert.equal(confirmation.action, "confirm_simulated_task")
  assert.match(confirmation.response_context.example_reference, /^DEMO-/)
  session = spoken(confirmation)
  assert.equal(session.stable_phase, "demo_feedback")
  session = callerTurn(session)
  session = spoken(turn(session, "feedback", { feedback:"good" }))
  assert.equal(session.stable_phase, "business_value_offer")
  session = callerTurn(session)
  const offer = turn(session, "decline")
  assert.equal(offer.action, "ask_anything_else")
  assert.equal(offer.pending_session.pending_action.next_phase, "anything_else")
})

test("billing scenario collects a measurement before presenting an example invoice confirmation", () => {
  let session = { ...createCallSession({ callId:"billing-1" }), stable_phase:"customer_request", turn_id:1, demo_scenario:"billing_quote" }
  const quote = turn(session, "customer_request", { request:"What is the price per square foot?" })
  assert.equal(quote.action, "deliver_billing_quote_and_ask_measurement")
  session = spoken(quote)
  assert.equal(session.stable_phase, "billing_details")
  session = callerTurn(session)
  const total = turn(session, "provide_detail", { measurement:"120 square feet" })
  assert.equal(total.action, "present_billing_total_and_ask_proceed")
  assert.equal(total.pending_session.pending_action.next_phase, "task_confirmation")
})

test("FAQ, delivery, payment, and service scenarios retain their distinct next-step workflows", () => {
  const cases = [
    ["faq_catalogue", "answer_faq_and_offer_next_step", "faq_follow_up"],
    ["delivery", "deliver_delivery_status_and_ask_proceed", "task_confirmation"],
    ["payments", "explain_payment_and_ask_proceed", "task_confirmation"],
    ["service_status", "deliver_service_status_and_ask_proceed", "task_confirmation"]
  ]
  for (const [scenario, action, nextPhase] of cases) {
    const session = { ...createCallSession({ callId:`${scenario}-1` }), stable_phase:"customer_request", turn_id:1, demo_scenario:scenario }
    const result = turn(session, "customer_request", { request:"Can you help with this?" })
    assert.equal(result.action, action, scenario)
    assert.equal(result.pending_session.pending_action.next_phase, nextPhase, scenario)
  }
})

test("delivery and unlisted scenarios resolve with concrete mock outcomes instead of a dead end", () => {
  let delivery = { ...createCallSession({ callId:"delivery-resolution" }), stable_phase:"customer_request", turn_id:1, demo_scenario:"delivery" }
  const deliveryStatus = turn(delivery, "customer_request", { request:"When will my delivery arrive?" })
  assert.equal(deliveryStatus.action, "deliver_delivery_status_and_ask_proceed")
  assert.match(deliveryStatus.response_context.example_delivery_window, /today/i)
  assert.match(deliveryStatus.response_context.instruction, /concrete estimated delivery/i)

  const customChoice = turn({ ...createCallSession({ callId:"custom-resolution" }), stable_phase:"demo_scenario", turn_id:1, demo:{ status:"ready", data:{} } }, "accept", { scenario:"contractor follow-up request" })
  assert.equal(customChoice.pending_session.demo_scenario, "dynamic_business_request")
  let custom = spoken(customChoice)
  custom = callerTurn(custom)
  const customAnswer = turn(custom, "customer_request", { request:"Can you approve my contractor price today?" })
  assert.equal(customAnswer.action, "deliver_dynamic_business_resolution_and_ask_proceed")
  assert.match(customAnswer.response_context.instruction, /concrete/i)
})

test("unclear business speech is clarified and never becomes a business fact", () => {
  let session = callerTurn(createCallSession({ callId:"call-1" }))
  const result = turn(session, "unclear", { business:"medical shop" }, "unclear")
  assert.equal(result.action, "clarify")
  assert.deepEqual(result.pending_session.business_profile, {})
})

test("recovery is bounded and confirmation never claims completion without clear acceptance", () => {
  let session = { ...createCallSession({ callId:"call-1" }), stable_phase:"task_confirmation", turn_id:1 }
  let result = turn(session, "unclear", {}, "unclear")
  session = spoken(result)
  session = callerTurn(session)
  result = turn(session, "unclear", {}, "unclear")
  session = spoken(result)
  session = callerTurn(session)
  result = turn(session, "unclear", {}, "unclear")
  assert.equal(result.action, "close")
  assert.equal(result.pending_session.pending_action.next_phase, "closing")
})

test("packaging details keep an order open and only an explicit decline can complete it", () => {
  let session = {
    ...createCallSession({ callId:"pack-1" }),
    stable_phase:"task_confirmation",
    turn_id:1,
    demo_scenario:"stock_order",
    demo_order:{ product:"plumbing supplies", quantity:"10", unit:null, follow_up_count:0 }
  }
  const packaging = turn(session, "provide_detail", { measurement:"cartons" })
  assert.equal(packaging.action, "present_order_terms_and_ask_proceed")
  assert.equal(packaging.pending_session.demo_order.unit, "cartons")
  assert.equal(packaging.pending_session.pending_action.next_phase, "task_confirmation")

  session = callerTurn(session)
  const unclearDecision = turn(session, "ask_more", { request:"What happens next?" })
  assert.equal(unclearDecision.action, "present_order_terms_and_ask_proceed")
  assert.notEqual(unclearDecision.action, "complete_simulated_task")

  const declined = turn({ ...session, stable_phase:"task_confirmation" }, "decline")
  assert.equal(declined.action, "complete_simulated_task")

  const accepted = turn({ ...session, stable_phase:"task_confirmation" }, "accept")
  assert.equal(accepted.action, "confirm_simulated_task")
  assert.match(accepted.response_context.example_reference, /^DEMO-/)
})
