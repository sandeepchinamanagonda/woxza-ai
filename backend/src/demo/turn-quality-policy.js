// Conservative lexical confirmation for the voice controller. It decides only
// whether a transcript is signal enough to interrupt or schedule a reply.
const ACKNOWLEDGEMENT_WORDS = new Set([
  "ok", "okay", "hmm", "hm", "uh", "um", "ah",
  "sare", "sarele", "sare le", "adhe", "ade",
  "సరే", "సరేలే", "అదే", "హ్మ్", "హమ్", "అం",
  "ठीक", "ठीक है", "हम्म", "उम्",
  "சரி", "ம்", "ஹ்ம்ம்"
])
const INTERRUPTION_PHRASES = new Set([
  "wait", "stop", "hold on", "listen",
  "ఆగండి", "వినండి", "ఒక్క నిమిషం",
  "रुकिए", "सुनिए", "एक मिनट",
  "நிறுத்துங்கள்", "கேளுங்கள்", "ஒரு நிமிடம்"
])

const normalize = text => String(text || "").replace(/[.,!?"'“”]/gu, " ").replace(/\s+/gu, " ").trim().toLocaleLowerCase()
const isAcknowledgement = value => {
  if (ACKNOWLEDGEMENT_WORDS.has(value)) return true
  const words = value.split(" ").filter(Boolean)
  return words.length > 0 && words.every(word => ACKNOWLEDGEMENT_WORDS.has(word))
}

export function assessCallerTurn(text) {
  const value = normalize(text)
  if (!value) return { action:"hold", reason:"empty_final" }
  if (isAcknowledgement(value)) return { action:"hold", reason:"acknowledgement" }
  if ([...value].length <= 2) return { action:"hold", reason:"micro_fragment" }
  return { action:"respond", reason:"meaningful_turn" }
}

// A partial is only used to decide whether to interrupt current playback, so
// it is intentionally stricter than a completed caller turn.
export function assessCallerPartial(text) {
  const value = normalize(text)
  if (!value || isAcknowledgement(value) || [...value].length < 3) return { action:"observe", reason:"not_meaningful_yet" }
  // A single ordinary word may be a complete, valid answer ("pharmacy",
  // "yes"), but it is not reliable enough to cut off active phone audio.
  // Let Sarvam finalise those answers. Explicit interruption phrases remain
  // immediate, and a normal multi-word partial can safely barge in early.
  if (INTERRUPTION_PHRASES.has(value)) return { action:"confirm_barge_in", reason:"explicit_interruption" }
  if (value.split(" ").filter(Boolean).length >= 2) return { action:"confirm_barge_in", reason:"meaningful_multiword_partial" }
  return { action:"observe", reason:"await_final_single_word" }
}
