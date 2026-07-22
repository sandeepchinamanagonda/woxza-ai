const VALID_INTENTS = new Set([
  "accept", "decline", "provide_detail", "customer_request", "feedback",
  "ask_more", "change_choice", "stop", "unclear", "unrelated"
])

const DEMO_PATTERN = /\b(?:demo|demonstrate|show(?:\s+me)?|try(?:\s+it)?|simulate)\b|డెమో|చూపించ|डेमो|दिखा|ಡೆಮೋ|டெமோ/iu
const PITCH_PATTERN = /\b(?:pitch|feature|features|benefit|benefits|explain|tell(?:\s+me)?\s+more|how(?:\s+(?:can|does|would))?(?:\s+woxza)?\s+(?:help|helps|work|be useful))\b|ఫీచ|ప్రయోజన|వివరించ|ఫాయిదా|फीचर|फायदे|बताइए|कैसे मदद|ವೈಶಿಷ್ಟ್ಯ|ಹೇಗೆ ಸಹಾಯ|அம்ச|எப்படி உதவ/iu
const ACCEPT_PATTERN = /\b(?:yes|yeah|yep|sure|okay|ok|go ahead|do it|confirm)\b|అవును|సరే|హाँ|हाँ जी|जी हाँ|ಹೌದು|ஆம்/iu
const DECLINE_PATTERN = /\b(?:no|nope|not now|skip|don't|do not)\b|వద్దు|కాదు|నहीं|ना|ಬೇಡ|வேண்டாம்/iu

function normalizeProductText(value="") {
  return String(value)
    .replace(/\bd\s*[-. ]?o\s*[-. ]?l\s*[-. ]?o\s*(?:six\s*fifty|6\s*[-. ]?50)\b/iu, "Dolo 650")
    .replace(/\bdolo\s*(?:six\s*fifty|6\s*[-. ]?50)\b/iu, "Dolo 650")
    .trim()
}

function normalizeQuantity(value="") {
  const text = String(value).trim()
  if (!text) return ""
  const numberWords = new Map([["one","1"],["two","2"],["three","3"],["four","4"],["five","5"],["ten","10"],["do","2"],["ek","1"]])
  const normalized = text.replace(/\b(one|two|three|four|five|ten|do|ek)\b/giu, word => numberWords.get(word.toLowerCase()) || word)
  return normalized.replace(/\s+/g, " ").trim()
}

function inferChoice(text="") {
  if (DEMO_PATTERN.test(text)) return "demo"
  if (PITCH_PATTERN.test(text)) return "pitch"
  return null
}

function callerExplicitlyNamesBusiness(callerText="", extractedBusiness="") {
  const caller = String(callerText).toLowerCase()
  const terms = String(extractedBusiness).toLowerCase().match(/[\p{L}\p{N}]+/gu) || []
  const meaningful = terms.filter(term => !new Set(["shop", "store", "business", "the", "a", "an"]).has(term))
  return meaningful.length > 0 && meaningful.every(term => caller.includes(term))
}

export function normalizeTurnInterpretation(raw={}, { phase="", callerText="" }={}) {
  const details = { ...(raw.details || {}) }
  const rawIntent = String(raw.intent || "").trim().toLowerCase()
  const evidence = [rawIntent, details.choice, details.request, callerText].filter(Boolean).join(" ")
  const choice = details.choice === "demo" || details.choice === "pitch" ? details.choice : inferChoice(evidence)
  let intent = rawIntent

  // Confirmation is the one irreversible demo step. If structured model
  // output conflicts with an explicit caller yes/no, caller speech wins. A
  // mixed answer such as "yes... actually no" is deliberately unclear.
  if (phase === "task_confirmation") {
    const hasAcceptance = ACCEPT_PATTERN.test(callerText)
    const hasDecline = DECLINE_PATTERN.test(callerText)
    if (hasAcceptance && hasDecline) intent = "unclear"
    else if (hasDecline) intent = "decline"
    else if (hasAcceptance) intent = "accept"
  }

  if (choice && (phase === "experience_choice" || ["demo", "pitch", "features", "feature", "explain", "show"].includes(rawIntent))) {
    intent = "change_choice"
    details.choice = choice
  } else if (["yes", "yeah", "sure", "ok", "okay", "confirm"].includes(rawIntent)) {
    intent = "accept"
  } else if (["no", "nope", "skip", "decline"].includes(rawIntent)) {
    intent = "decline"
  } else if (!VALID_INTENTS.has(intent) && ACCEPT_PATTERN.test(evidence)) {
    intent = "accept"
  } else if (!VALID_INTENTS.has(intent) && DECLINE_PATTERN.test(evidence)) {
    intent = "decline"
  }

  if (details.request) details.request = normalizeProductText(details.request)
  if (details.quantity) details.quantity = normalizeQuantity(details.quantity)
  // At discovery, an LLM-generated category such as "bangle shop" is not a
  // fact when the caller only said a phonetic/local business name. Preserve
  // that wording as the business identity; a vertical can be assigned later
  // from confirmed process and workflow details.
  if (phase === "business_discovery" && details.business && callerText.trim() && !callerExplicitlyNamesBusiness(callerText, details.business)) {
    details.business = callerText.trim()
    delete details.business_label
    delete details.business_category
    delete details.workflow_tags
  }
  const interpretation = { ...raw, intent, details }
  const changed = JSON.stringify({ intent:raw.intent, details:raw.details || {} }) !== JSON.stringify({ intent, details })
  return { interpretation, changed, raw_intent:rawIntent }
}
