const withinSafeRange = (value, fallback) => Number.isFinite(value) ? Math.max(16, Math.min(256, Math.floor(value))) : fallback

// One provider-independent response budget for every text brain. The legacy
// Sarvam names remain only as a backwards-compatible fallback for old setups.
export function voiceResponseTokenLimit(language) {
  const languageSpecific = language === "te" ? (process.env.VOICE_RESPONSE_MAX_TOKENS_TE || process.env.SARVAM_CHAT_MAX_TOKENS_TE) : null
  const configured = languageSpecific || process.env.VOICE_RESPONSE_MAX_TOKENS || process.env.SARVAM_CHAT_MAX_TOKENS
  const fallback = language === "te" ? 64 : 56
  return withinSafeRange(Number(configured), fallback)
}

// A tailored value pitch is intentionally the one longer phone turn. Keeping
// this separate prevents ordinary discovery replies from becoming slower or
// more expensive merely because a caller may later request a full pitch.
export function voicePitchTokenLimit(language) {
  const languageSpecific = process.env[`VOICE_PITCH_MAX_TOKENS_${String(language).toUpperCase()}`]
  const configured = languageSpecific || process.env.VOICE_PITCH_MAX_TOKENS
  // A tailored pitch happens once, unlike the many short discovery turns. A
  // 220-token ceiling lets Indic scripts finish a grounded two-sentence pitch;
  // it is a ceiling, not an amount charged on every call.
  const fallback = ["en", "es"].includes(String(language).toLowerCase()) ? 160 : 220
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
