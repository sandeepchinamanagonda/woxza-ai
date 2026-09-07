import test from "node:test"
import assert from "node:assert/strict"
import { configuredOpeningDeliveryPolicy } from "../src/demo/opening-delivery-policy.js"

test("opening delivery watchdog defaults to one retry after five seconds", () => {
  assert.deepEqual(configuredOpeningDeliveryPolicy({}), { enabled:true, timeoutSeconds:5, maxAttempts:2 })
})

test("opening delivery watchdog has safe operational bounds", () => {
  assert.deepEqual(configuredOpeningDeliveryPolicy({ V3_OPENING_DELIVERY_RETRY_ENABLED:"false", V3_OPENING_DELIVERY_TIMEOUT_SECONDS:"1", V3_OPENING_DELIVERY_MAX_ATTEMPTS:"9" }), { enabled:false, timeoutSeconds:2, maxAttempts:3 })
})
