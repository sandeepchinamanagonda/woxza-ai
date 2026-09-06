// The interpreter may recommend IDs, but it never gets authority to create
// caller-facing claims. This boundary returns only approved, localized records.
export function approvedCapabilities({ catalog=[], candidateIds=[], limit=5 }={}) {
  const approved = new Map((Array.isArray(catalog) ? catalog : []).map(item => [item.id, item]))
  const uniqueIds = [...new Set(Array.isArray(candidateIds) ? candidateIds : [])]
  return uniqueIds.slice(0, Math.max(1, Math.min(5, Number(limit) || 5))).map(id => approved.get(id)).filter(Boolean).map(item => ({
    id:item.id, title:item.title, claim:item.callerSafeClaim, impact:item.callerImpact,
    availability:item.availability, requirements:item.requirements, demoMode:item.demoMode
  }))
}
