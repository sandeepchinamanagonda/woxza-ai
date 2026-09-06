const normalize = value => String(value || "").trim().toLocaleLowerCase()

// A semantic model makes the decision, but it must cite exact caller words.
// This prevents an internal fact such as "steel shop" from silently becoming
// a product-value request during state promotion.
export function hasVerifiedValueRequest(result={}, history=[]) {
  if (result?.requested !== true || Number(result.confidence) < 0.9) return false
  const evidence = normalize(result.evidence)
  if (!evidence) return false
  return (Array.isArray(history) ? history : []).some(turn => turn?.role === "user" && normalize(turn.content).includes(evidence))
}
