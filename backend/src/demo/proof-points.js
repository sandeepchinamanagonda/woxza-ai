import { readFile } from "node:fs/promises"

const source = new URL("../../demo_prompts/proof-points.json", import.meta.url)
let cachedProofPoints
let warned = false

export function normalizeProofPoints(value) {
  const entries = Array.isArray(value)
    ? value.map(entry => [entry?.id || entry?.statement, entry])
    : Array.isArray(value?.proof_points)
      ? value.proof_points.map(entry => [entry?.id || entry?.statement, entry])
      : Object.entries(value || {}).filter(([id]) => !id.startsWith("_"))
  return entries
    .filter(([, entry]) => entry && typeof (entry.statement || entry.claim) === "string" && (entry.statement || entry.claim).trim())
    .filter(([, entry]) => !entry.status || entry.status === "approved")
    .filter(([, entry]) => ["live", "configurable", "roadmap"].includes(entry.truth_level))
    .map(([id, entry]) => ({
      id:String(id || entry.id || entry.statement || entry.claim).trim(),
      statement:String(entry.statement || entry.claim).trim(),
      truth_level:entry.truth_level,
      tags:[...new Set((Array.isArray(entry.tags) ? entry.tags : []).map(tag => String(tag).trim().toLowerCase()).filter(Boolean))],
      applicable_verticals:Array.isArray(entry.applicable_verticals) ? entry.applicable_verticals : [],
      applicable_pain:Array.isArray(entry.applicable_pain) ? entry.applicable_pain : [],
      has_verified_metric:entry.has_verified_metric === true,
      metric_value:entry.has_verified_metric === true ? entry.metric_value : null,
      review_status:entry.review_status || entry.status || "pending_review"
    }))
}

export async function getProofPoints() {
  if (cachedProofPoints) return cachedProofPoints
  cachedProofPoints = readFile(source, "utf8")
    .then(JSON.parse)
    .then(normalizeProofPoints)
    .catch(error => {
      if (!warned && error.code !== "ENOENT") console.warn("Could not load demo proof points", { error:error.message })
      warned = true
      return []
    })
  return cachedProofPoints
}
