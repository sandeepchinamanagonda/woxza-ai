import assert from "node:assert/strict"
import test from "node:test"
import { createCallSession, submitTurn } from "../src/demo/orchestrator.js"

// Sanitized replay-shaped fixtures. Replace their text with consented call
// transcripts before trial sign-off; assertions exercise frozen extracted
// facts, never keyword rules or raw audio.
const replays = [
  { language:"en", vertical:"retail_general", details:{ business_type:"hardware retailer", customer_interaction_channels:["calls", "walk-ins"], current_workflow:"counter staff answer calls", pain_points:["missed contractor quotes"], business_impact:"lost sales", scale_context:"40 calls daily", workflow_tags:["catalogue_quotes"], pain_tags:["missed_calls"] } },
  { language:"te", vertical:"pharma_wholesale", details:{ business_type:"medical distributor", customer_interaction_channels:["calls", "messages"], current_workflow:"staff note orders by phone", pain_points:["missed follow-ups"], business_impact:"late orders", scale_context:"three staff", workflow_tags:["inventory_orders"], pain_tags:["missed_calls"] } },
  { language:"hi", vertical:"restaurant", details:{ business_type:"restaurant", customer_interaction_channels:["calls", "walk-ins"], current_workflow:"staff take orders during rush", pain_points:["missed calls"], business_impact:"lost orders", scale_context:"two branches", workflow_tags:["inventory_orders"], pain_tags:["missed_calls"] } },
  { language:"ta", vertical:"appointment_services", details:{ business_type:"clinic", customer_interaction_channels:["calls", "website"], current_workflow:"reception schedules appointments", pain_points:["double follow-ups"], business_impact:"staff load", scale_context:"four receptionists", workflow_tags:["appointment_enquiries"], pain_tags:["staffing_cost"] } }
]

test("multilingual vertical replays reach a tailored-demo decision without duplicate acknowledgements", () => {
  for (const replay of replays) {
    const session = createCallSession({ callId:`replay-${replay.language}`, language:replay.language })
    const result = submitTurn(session, { intent:"provide_detail", clarity:"complete", details:{ ...replay.details, vertical:replay.vertical } })
    assert.equal(result.action, "prepare_experiences_and_ask_choice", replay.language)
    assert.equal(result.pending_session.business_profile.vertical, replay.vertical, replay.language)
    const acknowledged = result.pending_session.acknowledged_fact_ids
    assert.equal(new Set(acknowledged).size, acknowledged.length, replay.language)
    assert.equal(result.response_context.planner.next_goal, "select_tailored_demo", replay.language)
  }
})

test("unsupported vertical remains generic instead of claiming a vertical-specific demo", () => {
  const result = submitTurn(createCallSession({ callId:"replay-unsupported" }), { intent:"provide_detail", clarity:"complete", details:{
    business_type:"recruiting agency", customer_interaction_channels:["calls"], current_workflow:"staff return candidate calls", pain_points:["slow follow-up"], business_impact:"delays", scale_context:"two recruiters", vertical:"universal"
  } })
  assert.equal(result.pending_session.business_profile.vertical, "universal")
  assert.equal(result.action, "prepare_experiences_and_ask_choice")
})
