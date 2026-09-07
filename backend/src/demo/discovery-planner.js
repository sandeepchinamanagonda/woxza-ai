// Discovery is goal-driven rather than a vertical-specific questionnaire.
// The interpreter may extract many facts from one frozen turn; this module is
// the backend authority that decides which still-useful goal may be asked next.
export const DISCOVERY_GOALS = [
  "identify_business_type",
  "understand_interaction_and_workflow",
  "identify_pain_and_impact",
  "understand_scale",
  "select_tailored_demo",
  "understand_desired_outcome"
]

const requirements = {
  identify_business_type:["business_type"],
  understand_interaction_and_workflow:["customer_interaction_channels", "current_workflow"],
  identify_pain_and_impact:["pain_points", "business_impact"],
  understand_scale:["scale_context"],
  select_tailored_demo:[],
  understand_desired_outcome:["desired_outcome"]
}
const ACKNOWLEDGEABLE_FACTS = new Set([
  "business_type", "business_name", "customer_interaction_channels", "current_workflow",
  "pain_points", "business_impact", "scale_context", "desired_outcome"
])

const present = value => Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim())
const missing = (profile, goal) => (requirements[goal] || []).filter(key => !present(profile?.[key]))

export function eligibleDiscoveryGoals(profile={}) {
  const goals = []
  for (const goal of DISCOVERY_GOALS) {
    // A tailored demo is eligible only after the minimum useful context.
    if (goal === "select_tailored_demo") {
      if (present(profile.business_type) && present(profile.current_workflow) && present(profile.pain_points)) goals.push(goal)
      continue
    }
    if (missing(profile, goal).length) goals.push(goal)
  }
  return goals
}

export function planDiscovery({ profile={}, acknowledgedFactIds=[] }={}) {
  const eligible = eligibleDiscoveryGoals(profile)
  const next_goal = eligible[0] || "select_tailored_demo"
  const newlyKnown = Object.keys(profile).filter(key => ACKNOWLEDGEABLE_FACTS.has(key) && present(profile[key]) && !acknowledgedFactIds.includes(key))
  return {
    next_goal,
    reason:eligible.length ? `highest-ranked unresolved goal: ${next_goal}` : "minimum demo context is established",
    acknowledge_fact_ids:newlyKnown,
    question_style:"open",
    eligible_goals:eligible
  }
}

// Defensive validation is intentionally independent of the planner. It keeps
// future text-only planner implementations from skipping the ranked policy.
export function validateDiscoveryPlan(plan={}, { profile={}, acknowledgedFactIds=[] }={}) {
  const eligible = eligibleDiscoveryGoals(profile)
  const expected = eligible[0] || "select_tailored_demo"
  if (plan.next_goal !== expected) return { ok:false, reason:"goal_not_highest_ranked", expected }
  if (!DISCOVERY_GOALS.includes(plan.next_goal)) return { ok:false, reason:"unknown_goal" }
  const acknowledgement = Array.isArray(plan.acknowledge_fact_ids) ? plan.acknowledge_fact_ids : []
  if (acknowledgement.some(key => acknowledgedFactIds.includes(key) || !present(profile[key]))) return { ok:false, reason:"invalid_acknowledgement" }
  if (plan.question_style !== "open" && plan.question_style !== "focused") return { ok:false, reason:"invalid_question_style" }
  return { ok:true, plan:{ ...plan, eligible_goals:eligible } }
}
