const truthy = value => ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase())
const boundedInteger = (value, fallback, min, max) => {
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.floor(number))) : fallback
}

// A provider WebSocket accepting a connection does not prove the caller heard
// anything. The only successful opening is one whose first audio frame made it
// to the carrier. Keep this independently configurable from caller-first mode.
export const configuredOpeningDeliveryPolicy = (env=process.env) => ({
  enabled:env.V3_OPENING_DELIVERY_RETRY_ENABLED === undefined ? true : truthy(env.V3_OPENING_DELIVERY_RETRY_ENABLED),
  timeoutSeconds:boundedInteger(env.V3_OPENING_DELIVERY_TIMEOUT_SECONDS, 5, 2, 15),
  // Total attempts, including the first one. Two means one clean retry.
  maxAttempts:boundedInteger(env.V3_OPENING_DELIVERY_MAX_ATTEMPTS, 2, 1, 3)
})
