const withinSafeRange = (value, fallback) => Number.isFinite(value) ? Math.max(16, Math.min(256, Math.floor(value))) : fallback

// One provider-independent response budget for every text brain. The legacy
// Sarvam names remain only as a backwards-compatible fallback for old setups.
export function voiceResponseTokenLimit(language, { extended=false }={}) {
  const ordinaryLanguageSpecific = language === "te" ? (process.env.VOICE_RESPONSE_MAX_TOKENS_TE || process.env.SARVAM_CHAT_MAX_TOKENS_TE) : null
  const ordinaryConfigured = ordinaryLanguageSpecific || process.env.VOICE_RESPONSE_MAX_TOKENS || process.env.SARVAM_CHAT_MAX_TOKENS
  // A full value explanation is the only intentionally long response type.
  // Keep its ceiling independent so normal conversational turns cannot become
  // slower or more costly just because an occasional pitch needs more room.
  const extendedLanguageSpecific = language === "te" ? process.env.VOICE_FULL_PICTURE_MAX_TOKENS_TE : null
  const configured = extended
    ? (extendedLanguageSpecific || process.env.VOICE_FULL_PICTURE_MAX_TOKENS)
    : ordinaryConfigured
  const fallback = extended ? 256 : (language === "te" ? 64 : 56)
  return withinSafeRange(Number(configured), fallback)
}

// Used only after a provider reports that its normal voice turn was cut off.
// This is deliberately independent of the normal budget: it buys one concise,
// self-contained repair without making every ordinary call slower or costlier.
export function voiceRepairTokenLimit(language) {
  const languageSpecific = process.env[`VOICE_REPAIR_MAX_TOKENS_${String(language).toUpperCase()}`]
  const configured = languageSpecific || process.env.VOICE_REPAIR_MAX_TOKENS
  const fallback = language === "te" ? 112 : 72
  return withinSafeRange(Number(configured), fallback)
}
