import assert from "node:assert/strict"
import test from "node:test"
import { buildApprovedActionRenderContract, DYNAMIC_RENDERED_DEMO_ACTIONS, FIXED_DEMO_ACTIONS, validateApprovedActionRender } from "../src/demo/approved-action-renderer.js"

test("order terms require a localized render with every semantic field before speech", () => {
  const contract = buildApprovedActionRenderContract({
    action:"present_order_terms_and_ask_proceed",
    actionId:"call:10:4:present_order_terms_and_ask_proceed",
    language:"Telugu",
    responseContext:{ order:{ product:"Dolo 650", quantity:"10 strips" }, order_terms:{ total:"₹300", discount:"5%", delivery:"today evening" } }
  })
  const rejected = validateApprovedActionRender(contract, { action_id:contract.action_id, localized_text:"డోలో 650 పది స్ట్రిప్స్‌కు ఉదాహరణ మొత్తం మూడు వందల రూపాయలు.", included_fields:["example_label", "price", "delivery", "proceed_question"] })
  assert.equal(rejected.ok, false)
  assert.deepEqual(rejected.missing, ["discount"])
  const accepted = validateApprovedActionRender(contract, { action_id:contract.action_id, localized_text:"డోలో 650 పది స్ట్రిప్స్‌కు ఉదాహరణ మొత్తం మూడు వందల రూపాయలు. ఐదు శాతం డిస్కౌంట్‌తో ఈరోజు సాయంత్రం డెలివరీగా చూపిస్తున్నాను. ఈ ఉదాహరణ ఆర్డర్‌ను నిర్ధారించాలా?", included_fields:["example_label", "price", "discount", "delivery", "proceed_question"] })
  assert.equal(accepted.ok, true)
})

test("a confirmation render cannot omit the backend-generated reference", () => {
  const contract = buildApprovedActionRenderContract({ action:"confirm_simulated_task", actionId:"call:11:5:confirm", language:"Hindi", responseContext:{ example_reference:"DEMO-ABC123" } })
  const missingReference = validateApprovedActionRender(contract, { action_id:contract.action_id, localized_text:"आपका उदाहरण ऑर्डर कन्फर्म हो गया है।", included_fields:["example_label", "confirmation", "order_reference", "feedback_question"] })
  assert.equal(missingReference.ok, false)
  assert.equal(missingReference.reason, "missing_reference")
})

test("dynamic answers render while deterministic demo transitions bypass the extra renderer call", () => {
  for (const action of [
    "deliver_billing_quote_and_ask_measurement", "deliver_delivery_status_and_ask_proceed",
    "answer_faq_and_offer_next_step", "answer_or_offer_help", "confirm_simulated_task"
  ]) {
    const contract = buildApprovedActionRenderContract({ action, actionId:`call:${action}`, language:"Telugu", responseContext:{} })
    assert.ok(contract, action)
    assert.ok(contract.required_fields.length, action)
  }
  for (const action of ["ask_demo_scenario", "set_demo_roles", "guide_customer_request", "clarify_order_confirmation", "complete_simulated_task", "ask_business_value_permission", "ask_anything_else", "close"]) {
    assert.equal(buildApprovedActionRenderContract({ action, actionId:`call:${action}`, language:"Telugu", responseContext:{} }), null, action)
    assert.ok(FIXED_DEMO_ACTIONS.has(action), action)
  }
  assert.ok(DYNAMIC_RENDERED_DEMO_ACTIONS.has("confirm_simulated_task"))
  const confirmation = buildApprovedActionRenderContract({ action:"confirm_simulated_task", actionId:"confirm", language:"Telugu", responseContext:{ fixed_text:"మీ ఉదాహరణ అభ్యర్థన నిర్ధారించబడింది. మీ రిఫరెన్స్ నంబర్ DEMO-123." } })
  assert.equal(validateApprovedActionRender(confirmation, { action_id:"confirm", localized_text:"వేరే సమాధానం", included_fields:["example_label", "confirmation", "order_reference", "feedback_question"] }).reason, "fixed_text_mismatch")
})
