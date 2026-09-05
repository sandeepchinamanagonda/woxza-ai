const truthy = value => ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase())

const boundedInteger = (value, fallback, minimum, maximum) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(minimum, Math.min(maximum, Math.round(number)))
}

// A resume window is deliberately short. It is enough for Plivo to replace a
// temporarily lost media socket, without turning a later unrelated connection
// into a continuation of an old call.
export const configuredStreamResumePolicy = (env=process.env) => ({
  enabled:env.V3_STREAM_RESUME_ENABLED === undefined ? true : truthy(env.V3_STREAM_RESUME_ENABLED),
  graceSeconds:boundedInteger(env.V3_STREAM_RESUME_GRACE_SECONDS, 20, 5, 60),
  historyTurns:boundedInteger(env.V3_STREAM_RESUME_HISTORY_TURNS, 16, 1, 32)
})
