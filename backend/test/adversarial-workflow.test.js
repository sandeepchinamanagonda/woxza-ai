import assert from "node:assert/strict"
import test from "node:test"
import { buildApprovedActionRenderContract, validateApprovedActionRender } from "../src/demo/approved-action-renderer.js"
import { createCallSession, submitTurn } from "../src/demo/orchestrator.js"
import { findDemoRoleReversal } from "../src/demo/output-guardrail.js"
import { normalizeTurnInterpretation } from "../src/demo/turn-normalizer.js"

function submit(session, intent, details={}, clarity="clear") {
  return submitTurn(session, {
    turn_id:session.turn_id,
    expected_state_version:session.state_version,
    intent,
    clarity,
    details
  })
}

test("routes an unlisted but intelligible scenario into the bounded dynamic demo workflow", () => {
  const session = {
    ...createCallSession({ callId:"bad-scenario" }),
    stable_phase:"demo_scenario",
    turn_id:3,
    demo:{ status:"ready", data:{ default_scenario:"stock_order" } }
  }
  const result = submit(session, "accept", { scenario:"make it magical and do everything" })
  assert.equal(result.action, "set_demo_roles")
  assert.equal(result.pending_session.pending_action.next_phase, "customer_request")
  assert.equal(result.pending_session.demo_scenario, "dynamic_business_request")
})

test("the role contract is explicit and cannot ask Woxza to become the customer", () => {
  const session = {
    ...createCallSession({ callId:"roles" }),
    stable_phase:"demo_scenario",
    turn_id:4,
    demo:{ status:"ready", data:{ default_scenario:"stock_order" } }
  }
  const result = submit(session, "accept", { scenario:"stock order" })
  assert.equal(result.action, "set_demo_roles")
  assert.equal(result.response_context.caller_role, "customer")
  assert.equal(result.response_context.agent_role, "business_representative")
  assert.match(result.response_context.role_instruction, /DEMO ROLE LOCK/i)
  assert.match(result.response_context.role_instruction, /Wait for the caller's customer question/i)
})

test("role handoff is backend-owned, blocks role reversal, and allows the correct direction", () => {
  assert.equal(buildApprovedActionRenderContract({ action:"set_demo_roles", actionId:"roles", language:"Hindi" }), null)
  assert.equal(findDemoRoleReversal("मैं एक ग्राहक बनकर आपसे सवाल पूछूँगा।", "hi"), "demo_role_reversal")
  assert.equal(findDemoRoleReversal("फर्ज़ कीजिए कि मैं आपका कस्टमर हूँ।", "hi"), "demo_role_reversal")
  assert.equal(findDemoRoleReversal("अब आप ग्राहक हैं। मैं Hamza Tiles की तरफ़ से बात करूँगा।", "hi"), null)
  assert.equal(findDemoRoleReversal("నేను ఒక కస్టమర్‌గా ఉంటాను, మీరు జవాబు చెప్పండి.", "te"), "demo_role_reversal")
  assert.equal(findDemoRoleReversal("ఇప్పుడు మీరు కస్టమర్. నేను షాప్ తరఫున మాట్లాడతాను.", "te"), null)
})

test("confirmation cannot be reached by arbitrary, malformed, or off-script input", () => {
  const base = {
    ...createCallSession({ callId:"no-implicit-confirm" }),
    stable_phase:"task_confirmation",
    turn_id:9,
    demo_scenario:"stock_order",
    demo_order:{ product:"paint", quantity:"10", unit:"cartons" }
  }
  for (const [intent, details] of [
    ["provide_detail", {}],
    ["ask_more", {}],
    ["unrelated", { request:"tell me a joke" }],
    ["customer_request", { request:"what colours do you have?" }]
  ]) {
    const result = submit(base, intent, details)
    assert.notEqual(result.action, "confirm_simulated_task", intent)
    assert.notEqual(result.action, "complete_simulated_task", intent)
    assert.notEqual(result.pending_session.pending_action.next_phase, "demo_feedback", intent)
  }
})

test("explicit caller words override a hallucinated acceptance during order confirmation", () => {
  const base = { intent:"accept", clarity:"clear", details:{} }
  const no = normalizeTurnInterpretation(base, { phase:"task_confirmation", callerText:"No, not yet" })
  assert.equal(no.interpretation.intent, "decline")

  const contradiction = normalizeTurnInterpretation(base, { phase:"task_confirmation", callerText:"Yes... actually no, wait" })
  assert.equal(contradiction.interpretation.intent, "unclear")
})

test("renderer rejects a valid-looking confirmation that smuggles a pitch or closing into the order turn", () => {
  const contract = buildApprovedActionRenderContract({
    action:"confirm_simulated_task",
    actionId:"attack:confirm",
    language:"English",
    responseContext:{ example_reference:"DEMO-LOCKED" }
  })
  const injectedPitch = validateApprovedActionRender(contract, {
    action_id:"attack:confirm",
    localized_text:"Your example order is confirmed with reference DEMO-LOCKED. Would you like to hear more features and join the waitlist? How did the demo feel?",
    included_fields:["example_label", "confirmation", "order_reference", "feedback_question"]
  })
  assert.equal(injectedPitch.ok, false)
  assert.equal(injectedPitch.reason, "forbidden_topic")

  const injectedField = validateApprovedActionRender(contract, {
    action_id:"attack:confirm",
    localized_text:"Your example order is confirmed with reference DEMO-LOCKED. How did the demo feel?",
    included_fields:["example_label", "confirmation", "order_reference", "feedback_question", "price"]
  })
  assert.equal(injectedField.ok, false)
  assert.equal(injectedField.reason, "unexpected_fields")
})

test("invalid tool schema values and stale state versions have no side effects", () => {
  const session = { ...createCallSession({ callId:"invalid-tool" }), turn_id:1, stable_phase:"experience_choice" }
  const invalidIntent = submit(session, "invented_intent", {})
  assert.equal(invalidIntent.action, "no_op")
  assert.equal(invalidIntent.reason, "invalid_interpretation")

  const staleVersion = submitTurn(session, {
    turn_id:1,
    expected_state_version:99,
    intent:"accept",
    clarity:"clear",
    details:{ choice:"demo" }
  })
  assert.equal(staleVersion.action, "no_op")
  assert.equal(staleVersion.reason, "stale_turn")
})
