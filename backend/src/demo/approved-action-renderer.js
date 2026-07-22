// Dynamic business answers need Gemini's localized composition, followed by
// structural validation. Control transitions are deliberately excluded: the
// bridge delivers those from backend-owned instructions without making Gemini
// perform an extra render tool call.
export const DYNAMIC_RENDERED_DEMO_ACTIONS = new Set([
  "deliver_simulated_answer_and_ask_quantity",
  "answer_order_follow_up_and_ask_quantity",
  "present_order_terms_and_ask_proceed",
  "confirm_simulated_task",
  "deliver_billing_quote_and_ask_measurement",
  "answer_billing_follow_up_and_ask_measurement",
  "present_billing_total_and_ask_proceed",
  "deliver_delivery_status_and_ask_proceed",
  "deliver_dynamic_business_resolution_and_ask_proceed",
  "explain_payment_and_ask_proceed",
  "deliver_service_status_and_ask_proceed",
  "answer_faq_and_offer_next_step",
  "answer_or_offer_help"
])

export const FIXED_DEMO_ACTIONS = new Set([
  "ask_demo_scenario", "set_demo_roles", "guide_customer_request",
  "clarify_order_confirmation", "complete_simulated_task",
  "ask_business_value_permission", "ask_anything_else", "close"
])

// Backward-compatible export for tests and callers that used the earlier name.
export const RENDERED_ORDER_ACTIONS = DYNAMIC_RENDERED_DEMO_ACTIONS

const REQUIRED_FIELDS = {
  deliver_simulated_answer_and_ask_quantity:["example_label", "product_answer", "quantity_question"],
  answer_order_follow_up_and_ask_quantity:["example_label", "follow_up_answer", "next_order_question"],
  present_order_terms_and_ask_proceed:["example_label", "price", "discount", "delivery", "proceed_question"],
  confirm_simulated_task:["example_label", "confirmation", "order_reference", "feedback_question"],
  deliver_billing_quote_and_ask_measurement:["example_label", "price", "measurement_question"],
  answer_billing_follow_up_and_ask_measurement:["example_label", "follow_up_answer", "measurement_question"],
  present_billing_total_and_ask_proceed:["example_label", "price", "discount", "total", "proceed_question"],
  deliver_delivery_status_and_ask_proceed:["example_label", "status", "delivery", "proceed_question"],
  deliver_dynamic_business_resolution_and_ask_proceed:["example_label", "status", "proceed_question"],
  explain_payment_and_ask_proceed:["example_label", "payment_answer", "proceed_question"],
  deliver_service_status_and_ask_proceed:["example_label", "status", "proceed_question"],
  answer_faq_and_offer_next_step:["example_label", "faq_answer", "next_step"],
  answer_or_offer_help:["response_answer", "next_question"]
}

// These are wording-level guardrails on top of the structural contract. They
// catch common attempts to smuggle a pitch, closing, or premature completion
// into an order action. The approved action/phase remains the primary guard.
const FORBIDDEN_TOPIC_PATTERN = /\b(?:feature|features|capabilit(?:y|ies)|waitlist|join\s+(?:the\s+)?waitlist|goodbye|bye)\b|ఫీచ|వెయిట్.?లిస్ట్|फीचर|वेटलिस्ट|அம்ச|காத்திருப்புப் பட்டியல்/iu

export function buildApprovedActionRenderContract({ action, actionId, responseContext={}, language }) {
  if (!DYNAMIC_RENDERED_DEMO_ACTIONS.has(action)) return null
  const order = responseContext.order || {}
  const terms = responseContext.order_terms || {}
  const reference = responseContext.example_reference || null
  return {
    action,
    action_id:actionId,
    language,
    order:{ product:order.product || responseContext.request || null, quantity:order.quantity || null },
    terms,
    reference,
    fixed_text:String(responseContext.fixed_text || responseContext.role_handoff_text || "").trim() || null,
    required_fields:REQUIRED_FIELDS[action],
    forbidden_topics:["feature_pitch", "demo_completion", "closing"]
  }
}

export function validateApprovedActionRender(contract, args={}) {
  if (!contract || args.action_id !== contract.action_id) return { ok:false, reason:"action_id_mismatch" }
  const text = String(args.localized_text || "").trim()
  if (text.length < 12 || text.length > 650) return { ok:false, reason:"invalid_localized_text" }
  if (contract.fixed_text && text !== contract.fixed_text) return { ok:false, reason:"fixed_text_mismatch" }
  const included = new Set(Array.isArray(args.included_fields) ? args.included_fields : [])
  const missing = contract.required_fields.filter(field => !included.has(field))
  if (missing.length) return { ok:false, reason:"missing_required_fields", missing }
  const unexpected = [...included].filter(field => !contract.required_fields.includes(field))
  if (unexpected.length) return { ok:false, reason:"unexpected_fields", unexpected }
  if (contract.reference && !text.toUpperCase().includes(String(contract.reference).toUpperCase())) return { ok:false, reason:"missing_reference" }
  if (!contract.fixed_text && FORBIDDEN_TOPIC_PATTERN.test(text)) return { ok:false, reason:"forbidden_topic" }
  return { ok:true, text }
}
