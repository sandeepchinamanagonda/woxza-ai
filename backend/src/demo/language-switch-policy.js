// Language preference is a call-control decision, not a prompt heuristic.
// The UI choice remains the caller's selected language; a full different-
// language turn can only offer a switch, never change TTS automatically.
const SUPPORTED = new Set(["as", "bn", "en", "gu", "hi", "kn", "ml", "mr", "or", "pa", "ta", "te", "ur"])

const SCRIPT = {
  as:/[\u0980-\u09FF]/u, bn:/[\u0980-\u09FF]/u, gu:/[\u0A80-\u0AFF]/u,
  hi:/[\u0900-\u097F]/u, mr:/[\u0900-\u097F]/u, kn:/[\u0C80-\u0CFF]/u,
  ml:/[\u0D00-\u0D7F]/u, or:/[\u0B00-\u0B7F]/u, pa:/[\u0A00-\u0A7F]/u,
  ta:/[\u0B80-\u0BFF]/u, te:/[\u0C00-\u0C7F]/u, ur:/[\u0600-\u06FF]/u
}

const LANGUAGE_ALIASES = {
  as:["assamese", "অসমীয়া"],
  bn:["bengali", "bangla", "বাংলা"],
  en:["english", "अंग्रेज़ी", "अंग्रेजी", "ఇంగ్లీష్", "ఆంగ్లం", "ஆங்கிலம்"],
  gu:["gujarati", "ગુજરાતી"],
  hi:["hindi", "हिंदी", "हिन्दी", "హిందీ", "हिंदी में"],
  kn:["kannada", "ಕನ್ನಡ"],
  ml:["malayalam", "മലയാളം"],
  mr:["marathi", "मराठी"],
  or:["odia", "oriya", "ଓଡ଼ିଆ"],
  pa:["punjabi", "ਪੰਜਾਬੀ"],
  te:["telugu", "తెలుగు", "तेलुगु", "తెಲುಗು"],
  ta:["tamil", "தமிழ்", "तमिल", "తమిళం"],
  ur:["urdu", "اردو"]
}
const SWITCH_CUE = /\b(?:speak|talk|continue|switch|change|please)\b|बोल|बात|जारी|भाषा|మాట్లాడ|కొనసాగ|భాష|பேச|தொடர|மொழி/u
const AFFIRMATIVE = new Set(["yes", "yeah", "yep", "sure", "okay", "ok", "ha", "haan", "हाँ", "हां", "అవును", "సరే", "ஆமாம்", "சரி"])
const NEGATIVE = new Set(["no", "nope", "नहीं", "नहि", "లేదు", "వద్దు", "இல்லை", "வேண்டாம்"])

const normalize = text => String(text || "").replace(/[.,!?“”"']/gu, " ").replace(/\s+/gu, " ").trim().toLocaleLowerCase()
const characters = text => [...String(text || "").replace(/\s/gu, "")].length
const englishWords = text => (String(text || "").match(/[A-Za-z]+/gu) || []).length
const languageAlias = text => {
  const value = normalize(text)
  for (const [language, aliases] of Object.entries(LANGUAGE_ALIASES)) if (aliases.some(alias => value.includes(alias))) return language
  return null
}

export const configuredLanguageSwitchPolicy = (env=process.env) => String(env.V3_LANGUAGE_SWITCH_POLICY || "locked").trim().toLowerCase() === "confirm" ? "confirm" : "locked"

export function isExplicitLanguageSwitch(text) {
  const candidateLanguage = languageAlias(text)
  if (!candidateLanguage) return null
  const value = normalize(text)
  // A bare language name is meaningful only while answering an existing offer.
  if (!SWITCH_CUE.test(value) && !/\b(?:english|hindi|telugu|tamil)\s+(?:please|now)\b/u.test(value)) return null
  return candidateLanguage
}

export function isSubstantiveLanguageChange({ text, detectedLanguage, activeLanguage }) {
  const candidateLanguage = SUPPORTED.has(detectedLanguage) ? detectedLanguage : null
  if (!candidateLanguage || candidateLanguage === activeLanguage) return false
  const activeScript = SCRIPT[activeLanguage]
  // Mixed local-script turns are normal Indic code-mixing, not a preference
  // change, even if STT labels the turn as English.
  if (activeScript?.test(String(text || ""))) return false
  // Sarvam can label transliterated Telugu/Hindi such as "Madi mandu shop"
  // as English. Require a complete English thought before offering a switch;
  // short Latin-script local phrases are normal code-mixing/transliteration.
  if (candidateLanguage === "en") return englishWords(text) >= 5 && characters(text) >= 24
  const candidateScript = SCRIPT[candidateLanguage]
  return Boolean(candidateScript?.test(String(text || "")) && characters(text) >= 8)
}

const isAffirmative = text => AFFIRMATIVE.has(normalize(text))
const isNegative = text => NEGATIVE.has(normalize(text))

export function createLanguageSwitchController({ selectedLanguage="en", mode="locked" }={}) {
  const selected = SUPPORTED.has(selectedLanguage) ? selectedLanguage : "en"
  const policy = mode === "confirm" ? "confirm" : "locked"
  let activeLanguage = selected
  let pendingLanguage = null
  let foreignLanguage = null
  let foreignTurnCount = 0

  const resetForeignTurns = () => { foreignLanguage = null; foreignTurnCount = 0 }

  const snapshot = switchOffer => ({
    selected_language:selected,
    active_language:activeLanguage,
    switch_offer:switchOffer || (pendingLanguage ? { candidate_language:pendingLanguage } : null)
  })
  const result = ({ action="none", candidateLanguage=null, forceReply=false }={}) => ({
    action, candidateLanguage, activeLanguage, forceReply, languagePolicy:snapshot(action === "offer" ? { candidate_language:candidateLanguage } : null)
  })

  return {
    snapshot:() => snapshot(),
    observeTurn({ text, detectedLanguage }) {
      if (policy === "locked") return result()
      const explicitLanguage = isExplicitLanguageSwitch(text)
      if (explicitLanguage && explicitLanguage !== activeLanguage) {
        activeLanguage = explicitLanguage
        pendingLanguage = null
        resetForeignTurns()
        return result({ action:"switched", candidateLanguage:explicitLanguage, forceReply:true })
      }
      if (pendingLanguage) {
        if (explicitLanguage === activeLanguage || isNegative(text)) {
          const declined = pendingLanguage
          pendingLanguage = null
          resetForeignTurns()
          return result({ action:"declined", candidateLanguage:declined })
        }
        if (languageAlias(text) === pendingLanguage || isAffirmative(text)) {
          const confirmed = pendingLanguage
          activeLanguage = confirmed
          pendingLanguage = null
          resetForeignTurns()
          return result({ action:"switched", candidateLanguage:confirmed, forceReply:true })
        }
        // A further substantive sentence is not consent. The caller may have
        // continued a thought after a pause, so never treat it as a switch.
        // Clear the offer rather than repeating it on every later turn.
        pendingLanguage = null
        resetForeignTurns()
        return result()
      }
      if (isSubstantiveLanguageChange({ text, detectedLanguage, activeLanguage })) {
        if (foreignLanguage === detectedLanguage) foreignTurnCount += 1
        else { foreignLanguage = detectedLanguage; foreignTurnCount = 1 }
        // Let a caller naturally use a different language for a few turns.
        // Three consecutive substantive turns are evidence of a preference,
        // not merely code-mixing or one misrecognized transcript.
        if (foreignTurnCount >= 3) {
          pendingLanguage = detectedLanguage
          resetForeignTurns()
          return result({ action:"offer", candidateLanguage:detectedLanguage })
        }
        return result()
      }
      resetForeignTurns()
      return result()
    }
  }
}

const languageName = {
  en:"English", hi:"Hindi", te:"Telugu", ta:"Tamil", kn:"Kannada", ml:"Malayalam", mr:"Marathi", gu:"Gujarati", bn:"Bengali", pa:"Punjabi", as:"Assamese", or:"Odia", ur:"Urdu"
}

// This is call-control copy, not an LLM instruction: it guarantees the
// confirmation question is spoken once after the caller's answer.
export function languageSwitchQuestion(activeLanguage, candidateLanguage) {
  const candidate = languageName[candidateLanguage] || "that language"
  const active = languageName[activeLanguage] || "the current language"
  if (activeLanguage === "te") return `మీరు గత కొన్ని సమాధానాల్లో ${candidate}లో మాట్లాడుతున్నారు. ఇకపై ${candidate}లో కొనసాగాలనుకుంటున్నారా, లేక ${active === "Telugu" ? "తెలుగులోనే" : active} మాట్లాడాలనుకుంటున్నారా?`
  if (activeLanguage === "hi") return `मैंने देखा कि आप पिछले कुछ जवाबों में ${candidate} में बात कर रहे हैं। क्या आप आगे ${candidate} में बात करना चाहेंगे, या ${active === "Hindi" ? "हिंदी में ही" : active} जारी रखें?`
  if (activeLanguage === "ta") return `கடந்த சில பதில்களில் நீங்கள் ${candidate} மொழியில் பேசுவதை கவனித்தேன். இனி ${candidate} மொழியில் தொடர விரும்புகிறீர்களா, அல்லது ${active === "Tamil" ? "தமிழிலேயே" : active} தொடர விரும்புகிறீர்களா?`
  return `I’ve noticed you have been replying in ${candidate} for the last few turns. Would you like to continue in ${candidate}, or stay in ${active}?`
}
