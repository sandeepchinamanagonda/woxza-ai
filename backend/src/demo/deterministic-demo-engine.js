// The demo engine owns every mock value and completion outcome. The model may
// identify a request/quantity/measurement, but it never selects a price,
// delivery promise, reference, or next state.
const DEMO_ACTIONS = new Set([
  "deliver_simulated_answer_and_ask_quantity", "answer_order_follow_up_and_ask_quantity",
  "present_order_terms_and_ask_proceed", "deliver_billing_quote_and_ask_measurement",
  "answer_billing_follow_up_and_ask_measurement", "present_billing_total_and_ask_proceed",
  "deliver_delivery_status_and_ask_proceed", "confirm_simulated_task", "complete_simulated_task"
])

function numberIn(value) {
  return Number.parseInt(String(value || "").match(/\d+/)?.[0] || "", 10) || 0
}

function stableReference(callId="") {
  return `DEMO-${String(callId).replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "WOXZA"}`
}

export function createDemoMock({ callId, business, scenario, request, order={} }={}) {
  const quantity = numberIn(order.quantity)
  const unit = order.unit || "unit"
  const unitPrice = scenario === "billing_quote" ? 500 : 30
  const total = quantity ? quantity * unitPrice : null
  return {
    label:"Example demo data only",
    business:business || "this business",
    scenario:scenario || "stock_order",
    product:order.product || request || "the requested item",
    quantity:order.quantity || null,
    unit,
    unit_price:`₹${unitPrice} per ${unit}`,
    total:total ? `₹${total.toLocaleString("en-IN")}` : null,
    discount:"5% example discount",
    delivery_window:"today between 4 PM and 6 PM",
    reference:stableReference(callId)
  }
}

export function applyDeterministicDemoEngine(result, session) {
  if (!result?.pending_session || !DEMO_ACTIONS.has(result.action)) return result
  const context = result.response_context || {}
  const mock = createDemoMock({
    callId:session.call_id,
    business:session.business_profile?.business_label || session.business_profile?.business,
    scenario:context.scenario || session.demo_scenario,
    request:context.request,
    order:context.order || result.pending_session.demo_order
  })
  const response_context = {
    ...context,
    deterministic_demo:true,
    mock,
    order_terms:{
      ...(context.order_terms || {}),
      example_label:mock.label,
      unit_price:mock.unit_price,
      total:mock.total || context.order_terms?.total || "example total to be confirmed",
      discount:mock.discount,
      delivery:mock.delivery_window
    },
    example_reference:context.example_reference || mock.reference,
    instruction:`Deterministic demo action. Use only mock data supplied by the backend. Do not alter price, discount, delivery window, or reference. ${context.instruction || ""}`
  }
  return { ...result, response_context }
}
