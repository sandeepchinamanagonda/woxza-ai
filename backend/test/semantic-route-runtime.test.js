import assert from "node:assert/strict"
import test from "node:test"
import { createSemanticRouteRuntime } from "../src/demo/semantic-route-runtime.js"

const service = result => ({
  status:() => result,
  sync:async () => result
})

test("semantic route runtime exposes safe status and warms both indexes", async () => {
  const runtime = createSemanticRouteRuntime({
    openingPermission:service({ status:"ready", documentCount:1200, cachePath:"do-not-expose" }),
    fullValue:service({ status:"missing_or_stale", documentCount:390, catalogPath:"do-not-expose" })
  })
  assert.deepEqual(runtime.status(), {
    opening_permission:{ status:"ready", documentCount:1200, catalogHash:null, indexVersion:null, updatedAt:null, errors:[] },
    full_value_explanation:{ status:"missing_or_stale", documentCount:390, catalogHash:null, indexVersion:null, updatedAt:null, errors:[] }
  })
  assert.equal((await runtime.warm()).opening_permission.status, "ready")
})
