// The LLM is responsible for what to say. This small adapter is responsible
// only for making stable product names safe for the TTS engine to pronounce.
// It deliberately does not translate ordinary caller language or rewrite
// short numbers: those are conversational choices, not rendering concerns.
import pronunciationAsset from "../../demo_assets/woxza-pronunciations.json" with { type:"json" }

const CANONICAL_TERMS = [
  [/\bwhat\s*['’]?s\s*app\b/gi, "WhatsApp"],
  [/\bwhats\s*app\b/gi, "WhatsApp"],
  [/\binsta\s*gram\b/gi, "Instagram"],
  [/\byou\s*tube\b/gi, "YouTube"],
  [/\bwoxza\b/gi, "Woxza"],
  [/\bgoogle\b/gi, "Google"],
  [/\bwhatsapp\b/gi, "WhatsApp"],
  [/\binstagram\b/gi, "Instagram"],
  [/\byoutube\b/gi, "YouTube"]
]

// Keep this layer deliberately mechanical.  The brain decides whether a
// number is a price, an order ID, or a quantity; this renderer only replaces
// punctuation that would otherwise be spoken literally.  A range connector
// must sound local to the language of the reply.
const RANGE_CONNECTORS = {
  en:"to", as:"ৰ পৰা", bn:"থেকে", gu:"થી", hi:"से", kn:"ರಿಂದ", ml:"മുതൽ",
  mr:"ते", pa:"ਤੋਂ", ta:"முதல்", te:"నుంచి", ur:"سے", or:"ରୁ"
}

const fallbackPronunciations = (text, language) => {
  const locale = `${String(language || "en").toLowerCase()}-IN`
  const terms = pronunciationAsset.pronunciations?.[locale]
  if (!terms) return text
  // Long phrases must win over their components: replacing "Woxza" first
  // would prevent the exact "Woxza AI website" pronunciation from matching.
  return Object.entries(terms).sort(([left], [right]) => right.length - left.length).reduce((rendered, [term, pronunciation]) =>
    rendered.replace(new RegExp(`\\b${term}\\b`, "gi"), pronunciation), text)
}

const indianGrouping = digits => {
  if (digits.length <= 3) return digits
  const tail = digits.slice(-3)
  const head = digits.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",")
  return `${head},${tail}`
}

export function normalizeTtsText(text, { language="en", dictionaryEnabled=false }={}) {
  let normalized = String(text || "").trim()
  for (const [pattern, replacement] of CANONICAL_TERMS) normalized = normalized.replace(pattern, replacement)
  // A Sarvam dictionary is more accurate and easier to tune without a
  // deployment. When it is not configured, preserve a compact local fallback
  // for frequent Woxza/business vocabulary in the three actively tested Indic
  // languages.
  if (!dictionaryEnabled) normalized = fallbackPronunciations(normalized, language)
  // A dash is visual shorthand, not a spoken connector. Make ranges explicit
  // before Sarvam receives them.  For example, Telugu receives
  // "5 నుంచి 6 గంటలు", rather than an English connector inside the sentence.
  const connector = RANGE_CONNECTORS[String(language || "en").toLowerCase()] || RANGE_CONNECTORS.en
  normalized = normalized.replace(/\b(\d+)\s*[-–]\s*(\d+)\b/g, `$1 ${connector} $2`)
  // Sarvam recommends explicit Indian digit grouping for long numbers. Leave
  // 500, 10, and other short numbers untouched so the spoken register remains
  // the caller's language rather than a hard-coded English conversion.
  return normalized.replace(/\b\d{5,}\b/g, indianGrouping)
}
