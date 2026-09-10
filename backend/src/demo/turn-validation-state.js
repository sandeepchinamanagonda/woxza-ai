const asText = value => String(value || "").replace(/\s+/g, " ").trim()
const join = (...values) => values.map(asText).filter(Boolean).join(" ")

// Per-call volatile state only. It is intentionally never persisted as caller
// history or business facts until a later validation returns `complete`.
export function createTurnValidationState({ now=Date.now, fragmentTtlMs=8_000, maximumFragmentCharacters=640 }={}) {
  let heldFragment = "", heldAt = null, unclearAttempts = 0
  const expiresHeldFragment = () => heldAt !== null && now() - heldAt >= fragmentTtlMs
  const clearHeldFragment = () => { heldFragment = ""; heldAt = null }
  const activeFragment = () => {
    if (expiresHeldFragment()) clearHeldFragment()
    return heldFragment
  }
  const bounded = value => [...asText(value)].slice(0, maximumFragmentCharacters).join("")
  return {
    prepare(finalTranscript) {
      const previous = activeFragment()
      const finalText = bounded(finalTranscript)
      return { heldFragment:previous, candidateText:bounded(join(previous, finalText)), priorUnclearAttempts:unclearAttempts }
    },
    apply(result) {
      if (!result?.valid) return { applied:false, reason:"invalid_result" }
      const value = result.value
      if (value.decision === "complete") {
        clearHeldFragment()
        unclearAttempts = 0
      } else if (value.decision === "incomplete") {
        heldFragment = bounded(value.candidate_text)
        heldAt = now()
        unclearAttempts = 0
      } else {
        clearHeldFragment()
        unclearAttempts += 1
      }
      return { applied:true, ...this.snapshot() }
    },
    snapshot() { return { heldFragment:activeFragment(), unclearAttempts, fragmentExpiresAt:heldAt === null ? null : heldAt + fragmentTtlMs } },
    reset() { clearHeldFragment(); unclearAttempts = 0 }
  }
}
