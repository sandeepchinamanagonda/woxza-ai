function canonicalValue(value) {
  if (Array.isArray(value)) return value.map(canonicalValue).sort().join(",")
  return String(value || "").trim().toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").replace(/\s+/g, " ")
}

export function interpretationSignature({ intent, clarity, details={} }={}) {
  return JSON.stringify({
    intent:canonicalValue(intent), clarity:canonicalValue(clarity),
    business:canonicalValue(details.business || details.business_label),
    choice:canonicalValue(details.choice), scenario:canonicalValue(details.scenario),
    request:canonicalValue(details.request), quantity:canonicalValue(details.quantity || details.measurement),
    feedback:canonicalValue(details.feedback)
  })
}

// A caller turn may produce repeated Live function calls or repeat the same
// phrase while the prior action is still being spoken. Suppress only within
// that in-flight window; a later "yes" after a phase transition stays valid.
export function createLiveTurnGate({ now=Date.now, duplicateWindowMs=8_000 }={}) {
  let activeTurnId = null
  let claimed = false
  let authorizedActionId = null
  let last
  return {
    begin(turnId) { activeTurnId = turnId; claimed = false; authorizedActionId = null },
    claim(turnId) {
      if (turnId !== activeTurnId || claimed) return false
      claimed = true
      return true
    },
    authorize(actionId) { authorizedActionId = actionId || null },
    clearAction() { authorizedActionId = null },
    canPlay(actionId) { return Boolean(actionId) && authorizedActionId === actionId },
    record(signature, phase) { last = { signature, phase, at:now() } },
    isInFlightDuplicate(signature, phase, inFlight) {
      return Boolean(inFlight && last && last.phase === phase && last.signature === signature && now() - last.at <= duplicateWindowMs)
    },
    snapshot() { return { activeTurnId, claimed, authorizedActionId, last } }
  }
}
