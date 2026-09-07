import { agentFirstGreeting } from "./call-start-messages.js"

const truthy = value => ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase())

// This is deliberately call-start policy rather than a prompt flag. It makes
// outbound/demo and inbound/product behaviour selectable without changing the
// STT, brain, or TTS pipeline.
export const configuredCallStartPolicy = (env=process.env) => {
  const speakFirst = env.SPEAK_FIRST === undefined ? true : truthy(env.SPEAK_FIRST)
  const timeoutEnabled = env.SPEAK_FIRST_TIMEOUT_ENABLED === undefined ? true : truthy(env.SPEAK_FIRST_TIMEOUT_ENABLED)
  const timeoutSeconds = Math.min(60, Math.max(1, Number(env.SPEAK_FIRST_TIMEOUT_SECONDS || "6")))
  return {
    speakFirst,
    timeoutEnabled:!speakFirst && timeoutEnabled,
    timeoutSeconds
  }
}

// A caller-first timeout and a caller's bare acknowledgement both mean Woxza
// has not yet delivered an opening. Reuse the same reviewed greeting rather
// than maintaining a second, inconsistent call-start script.
export const callerFirstPresencePrompt = agentFirstGreeting
