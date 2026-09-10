import test from "node:test"
import assert from "node:assert/strict"
import { resolveSemanticRouteActivation, semanticRouteActivationStatus } from "../src/demo/semantic-route-activation.js"

test("semantic routes remain shadowed until both rollout and calibration approval are explicit", () => {
  const env = { V3_SEMANTIC_ROUTE_ROUTER:"active", V3_SEMANTIC_ROUTE_ACTIVE_ROUTES:"opening_permission" }
  assert.deepEqual(resolveSemanticRouteActivation({ routeId:"opening_permission", env }), { routeId:"opening_permission", mode:"shadow", reason:"calibration_not_approved" })
  env.V3_SEMANTIC_ROUTE_APPROVED_ROUTES = "opening_permission"
  assert.deepEqual(resolveSemanticRouteActivation({ routeId:"opening_permission", env }), { routeId:"opening_permission", mode:"active", reason:"approved_route" })
})

test("emergency rollback immediately prevents caller-facing semantic actions while preserving shadow telemetry", () => {
  const env = { V3_SEMANTIC_ROUTE_ROUTER:"active", V3_SEMANTIC_ROUTE_ACTIVE_ROUTES:"opening_permission", V3_SEMANTIC_ROUTE_APPROVED_ROUTES:"opening_permission", V3_SEMANTIC_ROUTE_EMERGENCY_ROLLBACK:"true" }
  assert.equal(resolveSemanticRouteActivation({ routeId:"opening_permission", env }).mode, "shadow")
  assert.equal(resolveSemanticRouteActivation({ routeId:"opening_permission", env }).reason, "emergency_rollback")
})

test("local testing may explicitly activate an uncalibrated route without enabling other routes", () => {
  const env = { V3_SEMANTIC_ROUTE_ROUTER:"active", V3_SEMANTIC_ROUTE_ACTIVE_ROUTES:"opening_permission", V3_SEMANTIC_ROUTE_ALLOW_UNCALIBRATED_LOCAL:"true" }
  assert.equal(resolveSemanticRouteActivation({ routeId:"opening_permission", env }).mode, "active")
  assert.equal(resolveSemanticRouteActivation({ routeId:"full_value_explanation", env }).mode, "shadow")
  assert.equal(semanticRouteActivationStatus(env).opening_first_reply.reason, "route_not_enabled")
})
