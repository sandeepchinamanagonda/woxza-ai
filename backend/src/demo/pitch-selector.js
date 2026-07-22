const REDUNDANT_WITH_COMBINED = new Set([
  "proactive_customer_supplier_touchpoints",
  "stock_aware_order_receiving",
  "configured_prices_and_discounts"
])

function verticalMatches(point, vertical) {
  return point.applicable_verticals?.includes(vertical) || point.applicable_verticals?.includes("universal")
}

function painMatches(point, painTags) {
  return point.applicable_pain?.some(tag => painTags.includes(tag))
}

const WORKFLOW_MATCHERS = {
  inventory_orders:["inventory", "orders", "availability", "stock-aware", "catalog"],
  pricing_discounts:["pricing", "discounts", "business-rules"],
  delivery_fulfilment:["orders", "follow-up", "outbound"],
  catalogue_quotes:["catalog", "inventory", "pricing"],
  lead_follow_up:["follow-up", "customers", "proactive", "outbound"],
  appointment_enquiries:["appointments", "calendar", "crm"],
  patient_enquiries:["appointments", "healthcare", "escalation", "handoff"],
  call_routing_handoff:["escalation", "handoff", "trust"],
  after_hours_coverage:["never-miss", "calls", "outbound"],
  manual_data_entry:["manual_data_entry", "integration", "real-time"],
  high_call_volume:["missed_calls", "staffing_cost", "never-miss", "scale", "calls"],
  customer_specific_rules:["pricing", "discounts", "business-rules", "configuration"]
}

function workflowMatches(point, workflowTags) {
  const pointTags = new Set([...(point.tags || []), ...(point.applicable_pain || [])])
  return workflowTags.some(workflowTag => (WORKFLOW_MATCHERS[workflowTag] || []).some(tag => pointTags.has(tag)))
}

export function selectPitchPoints({ vertical="universal", painTags=[], workflowTags=[], excludeIds=[] }={}, allPoints={}) {
  const excluded = new Set(excludeIds)
  const entries = Array.isArray(allPoints) ? allPoints.map(point => [point.id, point]) : Object.entries(allPoints)
  const candidates = entries
    .filter(([id, point]) => id[0] !== "_" && point?.review_status === "approved" && id !== "contact_channels" && !excluded.has(id))
    .map(([id, point]) => ({ id, ...point }))
    .filter(point => verticalMatches(point, vertical))

  // A vertical-specific capability is always preferable to a universal claim
  // when both match. This keeps a pharmacy/retail pitch about stock, rules,
  // and fulfilment instead of leading with generic company descriptions.
  candidates.sort((left, right) => Number(right.applicable_verticals?.includes(vertical)) - Number(left.applicable_verticals?.includes(vertical)))
  let selected = candidates.filter(point => workflowMatches(point, workflowTags) || painMatches(point, painTags))
  if (selected.length < 2) selected = candidates
  if (selected.some(point => point.id === "automated_touchpoint_stock_discount_workflow")) {
    selected = selected.filter(point => point.id === "automated_touchpoint_stock_discount_workflow" || !REDUNDANT_WITH_COMBINED.has(point.id))
  }
  return selected.map(point => ({
    id:point.id,
    claim:point.claim || point.statement,
    metric:point.has_verified_metric === true ? point.metric_value : null
  }))
}

export function buildPitchContext({ business, businessLabel, currentProcess, primaryPain, scale, vertical, painTags=[], workflowTags=[], usedIds=[] }={}, allPoints={}) {
  const approved = selectPitchPoints({ vertical, painTags, workflowTags, excludeIds:usedIds }, allPoints).slice(0, 5)
  return {
    business,
    business_label:businessLabel || business,
    current_process:currentProcess,
    primary_pain:primaryPain,
    scale,
    workflow_tags:workflowTags,
    already_mentioned:usedIds,
    approved_relevant_capabilities:approved.map(({ id, claim }) => ({ id, claim })),
    approved_metrics:approved.filter(point => point.metric).map(({ id, metric }) => ({ id, metric }))
  }
}

export function buildPitchSpeechPlan(context) {
  const points = context.approved_relevant_capabilities || []
  return points.map((point, index) => ({ order:index + 1, id:point.id, claim:point.claim }))
}
