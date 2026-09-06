// V3's compact conversation understanding layer.  This is deliberately not a
// workflow state machine: it records only caller-stated facts and derives the
// next helpful focus from their coverage.
const text = value => String(value || "").trim()
const values = value => (Array.isArray(value) ? value : [value]).map(text).filter(Boolean)
const distinct = (items=[]) => [...new Map(items.map(item => [item.toLocaleLowerCase(), item])).values()]

export const emptyConversationProfile = () => ({
  business:"", businessName:"", channels:[], workflows:[], painPoints:[],
  impact:"", manualEffort:"", desiredOutcomes:[]
})

export function mergeConversationProfile(profile={}, details={}) {
  const current = { ...emptyConversationProfile(), ...profile }
  const next = {
    ...current,
    business:text(details.business || details.business_type) || current.business,
    businessName:text(details.business_name) || current.businessName,
    impact:text(details.business_impact) || current.impact,
    manualEffort:text(details.scale_context || details.operating_detail) || current.manualEffort,
    channels:distinct([...values(current.channels), ...values(details.customer_interaction_channels)]),
    workflows:distinct([...values(current.workflows), ...values(details.current_workflow || details.current_process)]),
    painPoints:distinct([...values(current.painPoints), ...values(details.pain_points || details.primary_pain)]),
    desiredOutcomes:distinct([...values(current.desiredOutcomes), ...values(details.desired_outcome || details.request)])
  }
  return next
}

export function profileCoverage(profile={}) {
  const item = { ...emptyConversationProfile(), ...profile }
  const hasBusiness = Boolean(item.business || item.businessName)
  const hasChannelOrWorkflow = Boolean(item.channels.length || item.workflows.length)
  const hasOperatingNeed = Boolean(item.painPoints.length || item.impact || item.manualEffort)
  const hasOperation = Boolean(hasChannelOrWorkflow || item.painPoints.length)
  const hasImpactOrGoal = Boolean(item.impact || item.manualEffort || item.desiredOutcomes.length)
  // A request to hear how Woxza can help is a goal, not enough context for a
  // tailored pitch. We need a real operating path and an actual pain/effort
  // signal from the caller before presenting a solution.
  const readyForTailoredPitch = hasBusiness && hasChannelOrWorkflow && hasOperatingNeed
  return { hasBusiness, hasOperation, hasImpactOrGoal, hasChannelOrWorkflow, hasOperatingNeed, readyForTailoredPitch, sufficient:readyForTailoredPitch }
}

export function deriveConversationObjective({ profile={}, discoveryQuestions=0, explanationDelivered=false }={}) {
  if (explanationDelivered) return "continue_naturally"
  const coverage = profileCoverage(profile)
  // Four is a ceiling, not a target. It prevents an otherwise capable model
  // from turning a voluntary product demo into an endless intake form.
  if (coverage.sufficient || discoveryQuestions >= 4) return "tailored_explanation"
  return "focused_discovery"
}
