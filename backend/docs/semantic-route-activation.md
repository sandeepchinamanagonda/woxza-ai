# Controlled semantic-route activation

Phase 5 separates observing a route from allowing it to change a caller-facing
response. Set `V3_SEMANTIC_ROUTE_ROUTER=active` only with both of these lists:

- `V3_SEMANTIC_ROUTE_ACTIVE_ROUTES`: routes selected for the rollout.
- `V3_SEMANTIC_ROUTE_APPROVED_ROUTES`: routes whose Phase 4 calibration report
  is eligible for controlled activation.

Every other route remains in shadow, even when the global router is active.
For local testing only, `V3_SEMANTIC_ROUTE_ALLOW_UNCALIBRATED_LOCAL=true`
allows explicitly listed routes to run before review evidence is complete.

Set `V3_SEMANTIC_ROUTE_EMERGENCY_ROLLBACK=true` to immediately return every
route to shadow evaluation without deleting telemetry or redeploying code.
The `/api/admin/semantic-route-status` response includes the effective mode and
reason for each route.
