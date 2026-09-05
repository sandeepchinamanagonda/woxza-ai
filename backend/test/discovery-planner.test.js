import assert from "node:assert/strict"
import test from "node:test"
import { eligibleDiscoveryGoals, planDiscovery, validateDiscoveryPlan } from "../src/demo/discovery-planner.js"
import { createCallSession, submitTurn } from "../src/demo/orchestrator.js"

test("planner preserves multi-fact discovery and selects only the highest ranked unresolved goal", () => {
  const profile = {
    business_type:"medical distributor",
    customer_interaction_channels:["calls", "messages"],
    current_workflow:"staff write orders in a notebook",
    pain_points:["missed follow-ups", "slow callbacks"],
    business_impact:"lost repeat orders",
    pain_tags:["missed_calls"],
    workflow_tags:["inventory_orders", "lead_follow_up"]
  }
  const plan = planDiscovery({ profile, acknowledgedFactIds:["business_type"] })
  assert.equal(plan.next_goal, "understand_scale")
  assert.deepEqual(eligibleDiscoveryGoals(profile).slice(0, 3), ["understand_scale", "select_tailored_demo", "understand_desired_outcome"])
  assert.equal(validateDiscoveryPlan(plan, { profile, acknowledgedFactIds:["business_type"] }).ok, true)
  assert.equal(validateDiscoveryPlan({ ...plan, next_goal:"select_tailored_demo" }, { profile, acknowledgedFactIds:["business_type"] }).ok, false)
})

test("orchestrator acknowledges each extracted fact once and does not revert to fixed slots", () => {
  const session = createCallSession({ callId:"adaptive-1" })
  const first = submitTurn(session, { intent:"provide_detail", clarity:"complete", details:{
    business_type:"hardware retailer",
    customer_interaction_channels:["calls", "walk-ins"],
    current_workflow:"staff answer calls at the counter",
    pain_points:["missed quote follow-ups"],
    business_impact:"lost contractor sales",
    vertical:"retail_general",
    workflow_tags:["catalogue_quotes", "lead_follow_up"],
    pain_tags:["missed_calls"]
  } })
  assert.equal(first.response_context.next_goal, "understand_scale")
  assert.deepEqual(first.response_context.acknowledge_fact_ids.sort(), ["business_impact", "business_type", "current_workflow", "customer_interaction_channels", "pain_points"].sort())
  const second = submitTurn({ ...first.pending_session, pending_action:null }, { intent:"provide_detail", clarity:"complete", details:{ scale_context:"40 calls a day" } })
  assert.equal(second.action, "prepare_experiences_and_ask_choice")
  assert.deepEqual(second.response_context.planner.acknowledge_fact_ids, ["scale_context"])
})
