export const CALL_PHASES = new Set([
  "business_discovery", "experience_choice", "tailored_pitch", "demo_offer",
  "demo_scenario", "customer_request", "simulated_answer", "order_details", "task_confirmation",
  "billing_details", "faq_follow_up", "demo_feedback", "business_value_offer", "anything_else", "closing", "ended"
])

export const TURN_INTENTS = new Set([
  "accept", "decline", "provide_detail", "customer_request", "feedback",
  "ask_more", "change_choice", "stop", "unclear", "unrelated"
])

const DISCOVERY_FIELDS = ["business", "current_process", "primary_pain", "operating_detail"]
export const BUSINESS_CATEGORIES = ["pharma_wholesale", "retail_general", "restaurant", "appointment_services", "real_estate", "universal"]
export const WORKFLOW_TAGS = [
  "inventory_orders", "pricing_discounts", "delivery_fulfilment", "catalogue_quotes",
  "lead_follow_up", "appointment_enquiries", "patient_enquiries", "call_routing_handoff",
  "after_hours_coverage", "manual_data_entry", "high_call_volume", "customer_specific_rules"
]
const RECOVERY_LIMITS = {
  business_discovery:2, experience_choice:1, demo_scenario:1, customer_request:2,
  order_details:2, billing_details:2, faq_follow_up:2, task_confirmation:2, demo_feedback:1, business_value_offer:1, anything_else:1
}
export const DEMO_SCENARIOS = ["stock_order", "billing_quote", "delivery", "faq_catalogue", "payments", "service_status", "dynamic_business_request"]

export function createCallSession({ callId, tenantId="woxza", language="en" }={}) {
  return {
    call_id:callId, tenant_id:tenantId, stable_phase:"business_discovery", pending_action:null,
    turn_id:0, last_processed_turn_id:0, state_version:0, preferred_language:language, turn_language:language,
    language_confidence:"unknown", alternate_language_turns:0, recovery_counts:{},
    business_profile:{}, pitch_points_used:[], journey:{ pitch_delivered:false, demo_completed:false, selected_experience:null },
    demo_order:{ product:null, quantity:null, unit:null, follow_up_count:0 },
    demo_scenario:null,
    pitch:{ status:"idle", data:null }, demo:{ status:"idle", data:null }
  }
}

export function noOp(reason="stale_turn") { return { action:"no_op", response_context:null, reason } }

export function submitTurn(session, interpretation={}) {
  const { turn_id, expected_state_version, intent, clarity="unclear", details={} } = interpretation
  if (!session || turn_id !== session.turn_id || expected_state_version !== session.state_version) return noOp()
  // Gemini Live can emit more than one tool call while it is resolving one
  // transcription. A caller utterance may choose only one workflow action.
  if (turn_id <= (session.last_processed_turn_id || 0)) return noOp("duplicate_turn")
  if (session.pending_action) return noOp("pending_action")
  if (!TURN_INTENTS.has(intent) || !["clear", "unclear"].includes(clarity)) return noOp("invalid_interpretation")
  if (intent === "stop") return approve(session, "closing", "close", { reason:"caller_requested_end" })
  if (clarity === "unclear" || intent === "unclear") return recover(session)

  switch (session.stable_phase) {
    case "business_discovery": return handleDiscovery(session, details)
    case "experience_choice": return handleExperienceChoice(session, intent, details)
    case "tailored_pitch":
      return approve(markJourney(session, { pitch_delivered:true }), "demo_offer", "deliver_pitch", pitchContext(session))
    case "demo_offer":
      return intent === "accept"
        ? approve(session, "demo_scenario", "ask_demo_scenario", demoContext(session))
        : approve(session, "closing", "close", { reason:"demo_declined_after_pitch" })
    case "demo_scenario":
      return chooseScenario(session, intent, details)
    case "customer_request":
      return handleCustomerRequest(session, intent, details)
    case "simulated_answer":
      return recover(session)
    case "order_details":
      return handleOrderDetails(session, intent, details)
    case "billing_details":
      return handleBillingDetails(session, intent, details)
    case "faq_follow_up":
      return handleFaqFollowUp(session, intent, details)
    case "task_confirmation":
      if (isOrderFollowUp(intent, details)) {
        // A pack/unit clarification (for example, "cartons") is still part of
        // the order. Never interpret it as a refusal or complete the demo.
        return handleOrderDetails(session, intent, details)
      }
      if (intent === "accept") {
        return approve(markJourney(session, { demo_completed:true }), "demo_feedback", "confirm_simulated_task", { ...demoContext(session), order:session.demo_order, order_terms:exampleOrderTerms(session.demo_order), example_reference:exampleReference(session), instruction:"Confirm the example order/task now and state the example reference. Then ask how the demo felt." })
      }
      if (intent === "decline") {
        return approve(markJourney(session, { demo_completed:true }), "demo_feedback", "complete_simulated_task", { ...demoContext(session), instruction:"Acknowledge that the caller explicitly chose not to proceed with the example order/task. Then ask how the demo felt." })
      }
      // Completion is allowed only after an explicit yes or no. Any other
      // clear utterance gets a short confirmation clarification, never an
      // implicit decline.
      return approve(session, "task_confirmation", "clarify_order_confirmation", {
        ...demoContext(session), order:session.demo_order, order_terms:exampleOrderTerms(session.demo_order),
        instruction:"The order remains open. Ask one short question whether the caller wants to proceed with this example order. Do not say it is confirmed, do not create a reference, and do not ask for feedback."
      })
    case "demo_feedback":
      return approve(session, "business_value_offer", "ask_business_value_permission", { feedback:details.feedback || details.request || null })
    case "business_value_offer":
      return intent === "accept"
        ? approve(session, "tailored_pitch", "deliver_pitch", pitchContext(session))
        : approve(session, "anything_else", "ask_anything_else")
    case "anything_else":
      return (intent === "decline" || intent === "stop")
        ? approve(session, "closing", "close", { reason:"caller_finished" })
        : approve(session, "anything_else", "answer_or_offer_help", { request:details.request || null })
    case "closing": return approve(session, "ended", "close")
    default: return noOp("unsupported_phase")
  }
}

function handleDiscovery(session, details) {
  const profile = pickProfile({ ...session.business_profile, ...details })
  const missing = DISCOVERY_FIELDS.filter(field => !String(profile[field] || "").trim())
  if (missing.length) return approve({ ...session, business_profile:profile }, "business_discovery", "ask_missing_business_detail", { missing:missing[0], profile, speech_budget_ms:4_000, instruction:"Acknowledge only the newly confirmed detail in one short sentence, then ask exactly the next missing question." })
  return approve({ ...session, business_profile:profile, pitch:{ status:"preparing", data:null }, demo:{ status:"preparing", data:null } }, "experience_choice", "prepare_experiences_and_ask_choice", { profile })
}

function handleExperienceChoice(session, intent, details) {
  const choice = details.choice
  if (choice === "demo" || (intent === "accept" && choice !== "pitch")) {
    // A demo does not need the background pitch artifact. Never make a clear
    // demo selection wait in experience_choice: that is what caused repeated
    // choice prompts when preparation raced a fast caller.
    return approve({ ...session, journey:{ ...session.journey, selected_experience:"demo" } }, "demo_scenario", "ask_demo_scenario", demoContext(session))
  }
  if (choice === "pitch" || intent === "decline") {
    if (session.pitch.status === "failed") return approve(session, "demo_scenario", "ask_demo_scenario", demoContext(session))
    if (session.pitch.status !== "ready") return approve(session, "experience_choice", "bridge_preparation", { requested:"pitch" })
    return approve({ ...session, journey:{ ...session.journey, selected_experience:"pitch" } }, "tailored_pitch", "deliver_pitch", pitchContext(session))
  }
  return recover(session)
}

function chooseScenario(session, intent, details) {
  const requested = String(details.scenario || details.request || "").trim()
  const isAnything = /^(?:anything|any|whatever|default|ఏదైనా|ఏమైనా|कुछ भी|कोई भी)$/iu.test(requested)
  const scenario = normalizeScenario((isAnything || !requested) && intent === "accept" ? (session.demo.data?.default_scenario || "dynamic_business_request") : requested)
  if (scenario) {
    const updated = { ...session, demo_scenario:scenario }
    return approve(updated, "customer_request", "set_demo_roles", {
      ...demoContext(updated), scenario, scenario_instruction:scenarioInstruction(scenario),
      caller_role:"customer", agent_role:"business_representative",
      role_instruction:"DEMO ROLE LOCK: You are Woxza, the representative of the caller's business. The caller is always the customer. Wait for the caller's customer question and answer it as the business. Never say you are the customer, never ask the caller to answer as the business, and never act out both sides of the conversation."
    })
  }
  return recover(session)
}

function handleCustomerRequest(session, intent, details) {
  if (!(intent === "customer_request" || (intent === "provide_detail" && details.request))) return recover(session)
  const scenario = session.demo_scenario || "faq_catalogue"
  const base = { ...demoContext(session), scenario, request:details.request, scenario_instruction:scenarioInstruction(scenario) }
  if (scenario === "stock_order") return approve(withOrderRequest(session, details), "order_details", "deliver_simulated_answer_and_ask_quantity", { ...base, instruction:"Answer the stock/product request with clearly labelled example data, then ask exactly how many pieces, strips, cartons, or units the caller needs. Do not confirm, end the demo, or ask for feedback yet." })
  if (scenario === "billing_quote") return approve(session, "billing_details", "deliver_billing_quote_and_ask_measurement", { ...base, instruction:"Give an example per-unit or per-area rate, clearly label it as a demo quote, then ask for the quantity, square footage, or measurement needed. Do not confirm, end the demo, or ask for feedback yet." })
  if (scenario === "delivery") return approve(session, "task_confirmation", "deliver_delivery_status_and_ask_proceed", {
    ...base, order_terms:exampleOrderTerms(session.demo_order), example_delivery_window:"today between 4 PM and 6 PM",
    instruction:"Give a clearly labelled example delivery status with one concrete estimated delivery date/time window. Then ask whether to create the example delivery request. Never say you cannot check it, and do not end the demo or ask for feedback yet."
  })
  if (scenario === "payments") return approve(session, "task_confirmation", "explain_payment_and_ask_proceed", { ...base, instruction:"Give a clearly labelled example payment or invoice answer, then ask whether to create the example payment/invoice request. Do not end the demo or ask for feedback yet." })
  if (scenario === "service_status") return approve(session, "task_confirmation", "deliver_service_status_and_ask_proceed", { ...base, instruction:"Give a clearly labelled example repair/service status answer, then ask whether to create the example service follow-up. Do not end the demo or ask for feedback yet." })
  if (scenario === "dynamic_business_request") return approve(session, "task_confirmation", "deliver_dynamic_business_resolution_and_ask_proceed", {
    ...base, example_resolution:"Example request can be completed today; the exact timing is a demo value.",
    instruction:"Create a business-appropriate mock answer from the caller's business and request. Give one concrete, clearly labelled example outcome, such as an estimated time, quote total, availability, appointment slot, or request status. Then ask whether to create the example request. Never say you cannot check it, never leave the caller hanging, and do not claim a real live action."
  })
  return approve(session, "faq_follow_up", "answer_faq_and_offer_next_step", { ...base, instruction:"Answer the business FAQ using clearly labelled example catalogue, policy, or service information. Offer one relevant next step such as another question, availability check, or quote. Do not create an order, invoice, payment, or delivery unless the caller explicitly requests it." })
}

function handleBillingDetails(session, intent, details) {
  const measurement = String(details.quantity || details.measurement || "").trim()
  if (measurement) {
    const updated = { ...session, demo_order:{ ...(session.demo_order || {}), quantity:measurement } }
    return approve(updated, "task_confirmation", "present_billing_total_and_ask_proceed", { ...demoContext(updated), scenario:"billing_quote", order:updated.demo_order, order_terms:exampleOrderTerms(updated.demo_order), instruction:"State an example quote total, discount, and delivery/collection term for the measurement, then ask one clear question whether to create the example invoice or order. Do not confirm, end the demo, or ask for feedback yet." })
  }
  if (intent === "customer_request" || details.request) return approve(session, "billing_details", "answer_billing_follow_up_and_ask_measurement", { ...demoContext(session), scenario:"billing_quote", request:details.request || null, instruction:"Answer the billing or quote follow-up with clearly labelled example data, then ask for quantity, square footage, or measurement. Do not confirm, end the demo, or ask for feedback yet." })
  return recover(session)
}

function handleFaqFollowUp(session, intent, details) {
  if (intent === "decline") return approve(markJourney(session, { demo_completed:true }), "demo_feedback", "complete_simulated_task", { ...demoContext(session), scenario:"faq_catalogue", instruction:"Acknowledge the caller is finished with the FAQ demo, then ask how the demo felt." })
  if (intent === "customer_request" || intent === "ask_more" || details.request) return approve(session, "faq_follow_up", "answer_faq_and_offer_next_step", { ...demoContext(session), scenario:"faq_catalogue", request:details.request || null, instruction:"Answer the FAQ using clearly labelled example information and offer one relevant next step. Keep the caller in FAQ mode unless they explicitly ask to create a quote, delivery request, payment request, or order." })
  return recover(session)
}

function normalizeScenario(value="") {
  const text = String(value).toLowerCase()
  if (/stock|availability|order|inventory|స్టాక్|ఆర్డర్|स्टॉक|ऑर्डर/.test(text)) return "stock_order"
  if (/bill|billing|quote|price|invoice|rate|బిల్|బిల్లింగ్|ధర|कोट|बिल/.test(text)) return "billing_quote"
  if (/deliver|dispatch|parcel|shipping|డెలివ|డిస్పాచ్|डिलीवरी/.test(text)) return "delivery"
  if (/payment|pay|upi|receipt|పేమెంట్|చెల్లింపు|पेमेंट/.test(text)) return "payments"
  if (/repair|service|status|warranty|రిపేర్|సర్వీస్|स्थिति|रिपेयर/.test(text)) return "service_status"
  if (/faq|question|catalog|catalogue|design|timing|feature|ప్రశ్న|కేటలాగ్|सवाल/.test(text)) return "faq_catalogue"
  if (DEMO_SCENARIOS.includes(text)) return text
  // Unknown but intelligible scenarios are still valid demo material. Keep
  // them inside a bounded mock workflow instead of rejecting the caller.
  return text ? "dynamic_business_request" : null
}

function scenarioInstruction(scenario) {
  return {
    stock_order:"stock availability and order confirmation",
    billing_quote:"per-unit or per-area quote, measurement, and example invoice confirmation",
    delivery:"delivery status/options and delivery-request confirmation",
    faq_catalogue:"catalogue, policy, timing, design, or service FAQ without forcing an order",
    payments:"payment/invoice explanation and example payment-request confirmation",
    service_status:"repair or service-status explanation and example follow-up confirmation",
    dynamic_business_request:"a business-specific mock request with a concrete example outcome and confirmation"
  }[scenario] || "customer enquiry"
}

function handleOrderDetails(session, intent, details) {
  const updated = withOrderRequest(session, details)
  const quantity = String(updated.demo_order?.quantity || "").trim()
  if (quantity) {
    return approve(updated, "task_confirmation", "present_order_terms_and_ask_proceed", {
      ...demoContext(updated), order:updated.demo_order, order_terms:exampleOrderTerms(updated.demo_order),
      instruction:"Use clearly labelled example price, discount, and delivery terms for the stated quantity, then ask one clear question whether the caller wants to proceed. Do not confirm, end the demo, or ask for feedback yet."
    })
  }
  if (isOrderFollowUp(intent, details)) {
    return approve(updated, "order_details", "answer_order_follow_up_and_ask_quantity", {
      ...demoContext(updated), order:updated.demo_order, request:details.request || null,
      instruction:"Answer the caller's product follow-up using clearly labelled example data, then ask exactly how many pieces, strips, cartons, or units they need. Do not confirm, end the demo, or ask for feedback yet."
    })
  }
  return recover(updated)
}

function isOrderFollowUp(intent, details={}) {
  return intent === "customer_request" || Boolean(details.request) || Boolean(details.quantity) || Boolean(details.measurement)
}

function withOrderRequest(session, details={}) {
  const previous = session.demo_order || {}
  const request = String(details.request || "").trim()
  const quantity = String(details.quantity || "").trim()
  // Gemini uses `measurement` for both area-based quotes and natural pack
  // words such as "cartons". In a stock-order demo that value is the unit,
  // not a signal to leave the order-confirmation flow.
  const unit = session.demo_scenario === "stock_order" ? String(details.measurement || "").trim() : ""
  return {
    ...session,
    demo_order:{
      ...previous,
      product:previous.product || request || null,
      quantity:quantity || previous.quantity || null,
      unit:unit || previous.unit || null,
      follow_up_count:(previous.follow_up_count || 0) + (request ? 1 : 0)
    }
  }
}

function exampleOrderTerms(order={}) {
  const quantityNumber = Number.parseInt(String(order.quantity || "").match(/\d+/)?.[0] || "", 10)
  const unitPrice = 30
  return {
    example_label:"Example demo terms only",
    unit_price:`₹${unitPrice} per ${order.unit || "unit"}`,
    discount:"5% example discount",
    delivery:"today evening",
    total:quantityNumber > 0 ? `₹${quantityNumber * unitPrice}` : "example total to be confirmed"
  }
}

function recover(session) {
  const phase = session.stable_phase
  const count = (session.recovery_counts[phase] || 0) + 1
  const updated = { ...session, recovery_counts:{ ...session.recovery_counts, [phase]:count } }
  const limit = RECOVERY_LIMITS[phase] || 1
  if (count <= limit) return approve(updated, phase, "clarify", { phase, attempt:count })
  if (phase === "experience_choice") return approve(updated, "tailored_pitch", "deliver_pitch", pitchContext(updated))
  if (["business_discovery", "task_confirmation"].includes(phase)) return approve(updated, "closing", "close", { reason:"insufficient_confirmed_information" })
  if (phase === "customer_request") return approve(updated, "customer_request", "guide_customer_request", demoContext(updated))
  if (phase === "demo_feedback") return approve(updated, "business_value_offer", "ask_business_value_permission")
  if (phase === "business_value_offer") return approve(updated, "anything_else", "ask_anything_else")
  return approve(updated, "closing", "close", { reason:"recovery_limit" })
}

function pickProfile(details) {
  const profile = Object.fromEntries(DISCOVERY_FIELDS.map(field => [field, String(details[field] || "").trim()]).filter(([, value]) => value))
  const label = String(details.business_label || "").trim()
  const category = String(details.business_category || "").trim()
  const workflowTags = Array.isArray(details.workflow_tags)
    ? [...new Set(details.workflow_tags.filter(tag => WORKFLOW_TAGS.includes(tag)))]
    : []
  if (label) profile.business_label = label
  if (BUSINESS_CATEGORIES.includes(category)) profile.business_category = category
  if (workflowTags.length) profile.workflow_tags = workflowTags
  return profile
}
function markJourney(session, patch) { return { ...session, journey:{ ...session.journey, ...patch } } }
function pitchContext(session) { return { business_profile:session.business_profile, pitch:session.pitch.data || [], language:session.preferred_language } }
function demoContext(session) {
  return {
    business_profile:session.business_profile,
    demo:session.demo.data || null,
    language:session.preferred_language,
    caller_role:"customer",
    agent_role:"business_representative"
  }
}
function exampleReference(session) { return `DEMO-${String(session.call_id || "WOXZA").replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase()}` }

export function approve(session, nextPhase, action, response_context={}) {
  return { action, response_context, pending_session:{ ...session, last_processed_turn_id:session.turn_id, pending_action:{ action, next_phase:nextPhase, action_id:`${session.call_id}:${session.turn_id}:${session.state_version}:${action}`, pitch_point_ids:action === "deliver_pitch" ? (response_context.pitch?.approved_relevant_capabilities || []).map(point => point.id) : [] } } }
}

export function commitAction(session, actionId) {
  if (!session?.pending_action || session.pending_action.action_id !== actionId) return noOp("unknown_action")
  const previousPhase = session.stable_phase
  const nextPhase = session.pending_action.next_phase
  const deliveredIds = session.pending_action.pitch_point_ids || []
  return { ...session, stable_phase:nextPhase, pending_action:null, state_version:session.state_version + 1, pitch_points_used:[...new Set([...(session.pitch_points_used || []), ...deliveredIds])], recovery_counts:nextPhase === previousPhase ? session.recovery_counts : { ...session.recovery_counts, [previousPhase]:0 } }
}

export function cancelPendingAction(session, actionId) {
  if (!session?.pending_action || session.pending_action.action_id !== actionId) return session
  return { ...session, pending_action:null }
}
