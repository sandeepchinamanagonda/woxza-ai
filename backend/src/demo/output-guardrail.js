const COMMON_BLOCKLIST = [
  "i'm not a professional",
  "i am not a professional",
  "consult a professional",
  "consult an expert",
  "consult a doctor",
  "medical advice",
  "as an ai",
  "as a language model",
  "i'm just a demo",
  "i am just a demo",
  "this is just a demo",
  "your wellbeing",
  "your well-being",
  "your health"
]

export const OUTPUT_SAFETY_BLOCKLIST = {
  en:COMMON_BLOCKLIST,
  es:[...COMMON_BLOCKLIST, "su salud", "tu salud", "consejo médico", "consulte a un médico", "consulta a un médico", "como una ia"],
  hi:[...COMMON_BLOCKLIST, "आपका स्वास्थ्य", "आपकी सेहत", "चिकित्सकीय सलाह", "डॉक्टर से सलाह", "विशेषज्ञ से सलाह", "एक एआई के रूप में"],
  te:[...COMMON_BLOCKLIST, "మీ ఆరోగ్యం", "మీ శ్రేయస్సు", "వైద్య సలహా", "డాక్టర్‌ను సంప్రదించ", "నిపుణులను సంప్రదించ", "నేను ఏఐ"],
  ta:[...COMMON_BLOCKLIST, "உங்கள் உடல்நலம்", "மருத்துவ ஆலோசனை", "மருத்துவரை அணுக", "நிபுணரை அணுக", "ஒரு செயற்கை நுண்ணறிவாக"],
  kn:[...COMMON_BLOCKLIST, "ನಿಮ್ಮ ಆರೋಗ್ಯ", "ವೈದ್ಯಕೀಯ ಸಲಹೆ", "ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ", "ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ", "ಎಐ ಆಗಿ"],
  ml:[...COMMON_BLOCKLIST, "നിങ്ങളുടെ ആരോഗ്യം", "വൈദ്യോപദേശം", "ഡോക്ടറെ സമീപിക്കുക", "വിദഗ്ധനെ സമീപിക്കുക", "ഒരു എഐ എന്ന നിലയിൽ"],
  mr:[...COMMON_BLOCKLIST, "तुमचे आरोग्य", "वैद्यकीय सल्ला", "डॉक्टरांचा सल्ला", "तज्ज्ञांचा सल्ला", "एआय म्हणून"],
  gu:[...COMMON_BLOCKLIST, "તમારું આરોગ્ય", "તબીબી સલાહ", "ડૉક્ટરની સલાહ", "નિષ્ણાતની સલાહ", "એઆઈ તરીકે"],
  bn:[...COMMON_BLOCKLIST, "আপনার স্বাস্থ্য", "চিকিৎসা পরামর্শ", "ডাক্তারের পরামর্শ", "বিশেষজ্ঞের পরামর্শ", "একজন এআই হিসেবে"],
  pa:[...COMMON_BLOCKLIST, "ਤੁਹਾਡੀ ਸਿਹਤ", "ਡਾਕਟਰੀ ਸਲਾਹ", "ਡਾਕਟਰ ਦੀ ਸਲਾਹ", "ਮਾਹਰ ਦੀ ਸਲਾਹ", "ਇੱਕ ਏਆਈ ਵਜੋਂ"],
  as:[...COMMON_BLOCKLIST, "আপোনাৰ স্বাস্থ্য", "চিকিৎসাৰ পৰামৰ্শ", "ডাক্তৰৰ পৰামৰ্শ", "বিশেষজ্ঞৰ পৰামৰ্শ", "এআই হিচাপে"],
  ur:[...COMMON_BLOCKLIST, "آپ کی صحت", "طبی مشورہ", "ڈاکٹر سے مشورہ", "ماہر سے مشورہ", "ایک اے آئی کے طور پر"]
}

export function findUnsafeOutput(text, language="en") {
  const normalized = String(text || "").toLocaleLowerCase()
  if (!normalized) return null
  const phrases = OUTPUT_SAFETY_BLOCKLIST[language] || COMMON_BLOCKLIST
  return phrases.find(phrase => normalized.includes(phrase.toLocaleLowerCase())) || null
}

// This guard is active only while the backend is handing off demo roles. It
// blocks Woxza becoming the customer, without blocking the valid handoff and
// creating a renderer/tool-call deadlock.
const ROLE_REVERSAL_PATTERNS = {
  en:/\b(?:i(?:'ll| will| am)|i am going to|let me)\s+(?:become|be|act as|play)?\s*(?:the |your )?(?:customer|client)\b/i,
  es:/\b(?:seré|voy a ser|haré de)\s+(?:el |la )?cliente\b/i,
  hi:/मैं\s*(?:(?:एक|आपका|तुम्हारा)\s*)?(?:ग्राहक|कस्टमर)\s*(?:बन|हूँ|होऊँ|की तरह)/iu,
  te:/నేను\s*(?:ఒక\s*)?(?:కస్టమర్‌గా|కస్టమర్)\s*(?:అవ|ఉంట|నటించ|అనుకో)/iu,
  ta:/நான்\s*(?:ஒரு\s*)?(?:வாடிக்கையாளராக|கஸ்டமராக)\s*(?:இருப்ப|நடிப்ப)/iu,
  kn:/ನಾನು\s*(?:ಗ್ರಾಹಕನಾಗಿ|ಕಸ್ಟಮರ್ ಆಗಿ)\s*(?:ಇರುತ್ತ|ನಟಿಸ)/iu,
  ml:/ഞാൻ\s*(?:ഒരു\s*)?(?:ഉപഭോക്താവായി|കസ്റ്റമറായി)\s*(?:ആക|നടിക്ക)/iu,
  mr:/मी\s*(?:ग्राहक|कस्टमर)\s*(?:बन|अस)/iu,
  gu:/હું\s*(?:ગ્રાહક|કસ્ટમર)\s*(?:બન|હોઈશ)/iu,
  bn:/আমি\s*(?:গ্রাহক|কাস্টমার)\s*(?:হব|হয়ে)/iu,
  pa:/ਮੈਂ\s*(?:ਗਾਹਕ|ਕਸਟਮਰ)\s*(?:ਬਣ|ਹੋਵਾਂ)/iu,
  as:/মই\s*(?:গ্ৰাহক|কাষ্টমাৰ)\s*(?:হম|হওঁ)/iu,
  ur:/میں\s*(?:گاہک|کسٹمر)\s*(?:بن|ہوں)/iu
}

export function findDemoRoleReversal(text, language="en") {
  const pattern = ROLE_REVERSAL_PATTERNS[language] || ROLE_REVERSAL_PATTERNS.en
  return pattern.test(String(text || "")) ? "demo_role_reversal" : null
}

export function createOutputSafetyGuard({ useCase, language, callId, safeFallback, onAllowed, onRegenerate, onFallback, onExhausted, onTrigger }) {
  let consecutiveBlocks = 0
  return {
    review({ text, audio }) {
      const matchedPhrase = findUnsafeOutput(text, language)
      if (!matchedPhrase) {
        consecutiveBlocks = 0
        onAllowed({ text, audio })
        return { allowed:true, matchedPhrase:null }
      }
      consecutiveBlocks += 1
      const event = { useCase, language, callId, matchedPhrase, attempt:consecutiveBlocks }
      onTrigger?.(event)
      if (consecutiveBlocks === 1) onRegenerate(event)
      else if (consecutiveBlocks === 2) onFallback({ ...event, safeFallback })
      else onExhausted?.(event)
      return { allowed:false, matchedPhrase }
    }
  }
}

export function createStreamingOutputSafetyGuard({
  useCase,
  language,
  callId,
  safeFallback,
  holdMs=1_000,
  onAudio,
  onAllowedTurn,
  onClear,
  onRegenerate,
  onFallback,
  onExhausted,
  onTrigger
}) {
  let consecutiveBlocks = 0
  let textChunks = []
  let audioQueue = []
  let queuedDurationMs = 0
  let blocked = false
  let matchedPhrase = null

  const release = flush => {
    while (audioQueue.length && (flush || queuedDurationMs > holdMs)) {
      const chunk = audioQueue.shift()
      queuedDurationMs -= chunk.durationMs
      onAudio(chunk.audio)
    }
  }
  const resetTurn = () => {
    textChunks = []
    audioQueue = []
    queuedDurationMs = 0
    blocked = false
    matchedPhrase = null
  }
  const recover = () => {
    const event = { useCase, language, callId, matchedPhrase, attempt:consecutiveBlocks }
    if (consecutiveBlocks === 1) onRegenerate(event)
    else if (consecutiveBlocks === 2) onFallback({ ...event, safeFallback })
    else onExhausted?.(event)
  }

  return {
    push({ text, audio=[], turnComplete=false }) {
      if (text) textChunks.push(String(text).trim())
      for (const pcm24 of audio) {
        const durationMs = pcm24.length / 48
        audioQueue.push({ audio:pcm24, durationMs })
        queuedDurationMs += durationMs
      }

      const fullText = textChunks.filter(Boolean).join(" ")
      const unsafePhrase = blocked ? matchedPhrase : findUnsafeOutput(fullText, language)
      if (unsafePhrase && !blocked) {
        blocked = true
        matchedPhrase = unsafePhrase
        consecutiveBlocks += 1
        audioQueue = []
        queuedDurationMs = 0
        const event = { useCase, language, callId, matchedPhrase, attempt:consecutiveBlocks }
        onTrigger?.(event)
        onClear?.(event)
      }

      if (!blocked) release(false)
      if (!turnComplete) return { blocked, matchedPhrase }

      if (blocked) recover()
      else {
        release(true)
        consecutiveBlocks = 0
        onAllowedTurn(fullText)
      }
      const result = { blocked, matchedPhrase }
      resetTurn()
      return result
    },
    interrupt() {
      resetTurn()
    }
  }
}
