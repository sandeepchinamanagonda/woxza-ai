const withinSafeRange = (value, fallback) => Number.isFinite(value) ? Math.max(16, Math.min(256, Math.floor(value))) : fallback

// One provider-independent response budget for every text brain. The legacy
// Sarvam names remain only as a backwards-compatible fallback for old setups.
export function voiceResponseTokenLimit(language) {
  const languageSpecific = language === "te" ? (process.env.VOICE_RESPONSE_MAX_TOKENS_TE || process.env.SARVAM_CHAT_MAX_TOKENS_TE) : null
  const configured = languageSpecific || process.env.VOICE_RESPONSE_MAX_TOKENS || process.env.SARVAM_CHAT_MAX_TOKENS
  const fallback = language === "te" ? 64 : 56
  return withinSafeRange(Number(configured), fallback)
}
