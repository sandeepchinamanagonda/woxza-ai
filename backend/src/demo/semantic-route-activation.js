const routeIds = new Set(["opening_first_reply", "opening_permission", "full_value_explanation"])

const list = value => new Set(String(value || "").split(",").map(item => item.trim()).filter(Boolean))
const enabled = value => ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase())

// Activation requires two explicit controls: a route rollout flag and an
// approval flag set only after its Phase 4 report passes. Local test runs may
// opt out of the approval gate, but production cannot do so by default.
export function resolveSemanticRouteActivation({ routeId, env=process.env }={}) {
  const configuredMode = String(env.V3_SEMANTIC_ROUTE_ROUTER || "shadow").trim().toLowerCase()
  const globalMode = ["off", "shadow", "active"].includes(configuredMode) ? configuredMode : "shadow"
  if (!routeIds.has(routeId)) return { routeId, mode:"off", reason:"unknown_route" }
  if (globalMode === "off") return { routeId, mode:"off", reason:"global_off" }
  if (enabled(env.V3_SEMANTIC_ROUTE_EMERGENCY_ROLLBACK)) return { routeId, mode:"shadow", reason:"emergency_rollback" }
  if (globalMode === "shadow") return { routeId, mode:"shadow", reason:"global_shadow" }
  if (!list(env.V3_SEMANTIC_ROUTE_ACTIVE_ROUTES).has(routeId)) return { routeId, mode:"shadow", reason:"route_not_enabled" }
  if (!list(env.V3_SEMANTIC_ROUTE_APPROVED_ROUTES).has(routeId) && !enabled(env.V3_SEMANTIC_ROUTE_ALLOW_UNCALIBRATED_LOCAL)) return { routeId, mode:"shadow", reason:"calibration_not_approved" }
  return { routeId, mode:"active", reason:enabled(env.V3_SEMANTIC_ROUTE_ALLOW_UNCALIBRATED_LOCAL) ? "local_override" : "approved_route" }
}

export function semanticRouteActivationStatus(env=process.env) {
  return Object.fromEntries([...routeIds].map(routeId => [routeId, resolveSemanticRouteActivation({ routeId, env })]))
}
