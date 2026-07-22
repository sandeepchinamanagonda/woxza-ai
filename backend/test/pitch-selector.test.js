import assert from "node:assert/strict"
import test from "node:test"
import { buildPitchContext, selectPitchPoints } from "../src/demo/pitch-selector.js"

const library = {
  combined:{ claim:"combined", review_status:"approved", applicable_verticals:["retail_general"], applicable_pain:["missed_calls"], has_verified_metric:false },
  automated_touchpoint_stock_discount_workflow:{ claim:"combined workflow", review_status:"approved", applicable_verticals:["retail_general"], applicable_pain:["missed_calls"], has_verified_metric:false },
  stock_aware_order_receiving:{ claim:"stock", review_status:"approved", applicable_verticals:["retail_general"], applicable_pain:["missed_calls"], has_verified_metric:false },
  contact_channels:{ claim:"contact", review_status:"approved", applicable_verticals:["retail_general"], applicable_pain:["missed_calls"], has_verified_metric:false },
  unsafe:{ claim:"unsafe", review_status:"needs_review", applicable_verticals:["retail_general"], applicable_pain:["missed_calls"], has_verified_metric:false },
  metric:{ claim:"metric", review_status:"approved", applicable_verticals:["pharma_wholesale"], applicable_pain:["missed_calls"], has_verified_metric:true, metric_value:"1,500+ products" }
}

test("selector excludes unapproved, contact, used, and redundant pitch points", () => {
  const selected = selectPitchPoints({ vertical:"retail_general", painTags:["missed_calls"], excludeIds:["combined"] }, library)
  assert.deepEqual(selected.map(point => point.id), ["automated_touchpoint_stock_discount_workflow"])
})

test("selector falls back only to the same vertical and gates metrics structurally", () => {
  const context = buildPitchContext({ vertical:"pharma_wholesale", painTags:["after_hours_gap"] }, library)
  assert.deepEqual(context.approved_relevant_capabilities.map(point => point.id), ["metric"])
  assert.deepEqual(context.approved_metrics, [{ id:"metric", metric:"1,500+ products" }])
  assert.equal(selectPitchPoints({ vertical:"restaurant", painTags:["missed_calls"] }, library).length, 0)
})
