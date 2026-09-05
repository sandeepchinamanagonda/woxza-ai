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

export const callerFirstPresencePrompt = language => ({
  en:"Hello, I’m Woxza’s AI assistant. How may I help?",
  te:"నమస్కారం, నేను Woxza AI అసిస్టెంట్‌ని. మీకు ఎలా సహాయం చేయగలను?",
  hi:"नमस्ते, मैं Woxza का AI सहायक हूँ। मैं आपकी कैसे मदद कर सकता हूँ?",
  ta:"வணக்கம், நான் Woxza-வின் AI உதவியாளர். நான் உங்களுக்கு எப்படி உதவலாம்?"
}[language] || "Hello, I’m Woxza’s AI assistant. How may I help?")
