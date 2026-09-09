import { SUPPORTED_SEMANTIC_INTENT_LANGUAGES } from "./semantic-intent-router.js"

const asText = value => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
const boundedText = (value, maximum=480) => [...asText(value)].slice(0, maximum).join("")
const supportedLanguages = new Set(SUPPORTED_SEMANTIC_INTENT_LANGUAGES)

// This is the complete, bounded representation from which Phase 3 will make
// an embedding query. It deliberately excludes call IDs, phone numbers, raw
// prompts, full transcripts, credentials, and provider telemetry.
export function buildSemanticRouteContext({
  callStage="unspecified",
  language="en",
  callerText,
  previousAgentText,
  previousCallerText,
  recentTurns=[],
  businessSummary="",
  routeState={}
}={}) {
  return {
    schema_version:1,
    call_stage:boundedText(callStage, 80) || "unspecified",
    active_language:supportedLanguages.has(language) ? language : "en",
    caller_text:boundedText(callerText),
    previous_agent_text:boundedText(previousAgentText),
    previous_caller_text:boundedText(previousCallerText),
    business_summary:boundedText(businessSummary, 640),
    recent_turns:(Array.isArray(recentTurns) ? recentTurns : []).slice(-3).map(turn => ({
      caller:boundedText(turn?.caller, 240),
      agent:boundedText(turn?.agent, 240)
    })).filter(turn => turn.caller || turn.agent),
    // Flags are derived by normal Woxza controllers, never caller supplied.
    // They allow a catalog route to require known state without exposing data.
    route_state:Object.fromEntries(Object.entries(routeState || {}).filter(([, value]) => typeof value === "boolean"))
  }
}

export function semanticRouteQuery({ route, context }) {
  return [
    "Semantic routing query.",
    `Route: ${route.id}`,
    `Conversation stage: ${context.call_stage}`,
    `Language: ${context.active_language}`,
    "Caller statement:", context.caller_text,
    context.previous_agent_text ? "Previous Woxza statement:" : null,
    context.previous_agent_text || null,
    context.previous_caller_text ? "Previous caller statement:" : null,
    context.previous_caller_text || null,
    context.business_summary ? "Known business context:" : null,
    context.business_summary || null
  ].filter(Boolean).join("\n")
}

const EXCLUSIONS = [
  ["greeting", /^(?:hello|hi|hey|namaste|నమస్తే|హలో|नमस्ते|हेलो|வணக்கம்|ನಮಸ್ಕಾರ|നമസ്കാരം|નમસ્તે|আসসালামু আলাইকুম)[!?. ]*$/iu],
  ["goodbye", /(?:^|\s)(?:bye|goodbye|no thanks|not interested|వీడ్కోలు|బై|వద్దు|నమస్తే|अलविदा|नहीं चाहिए|வேண்டாம்|பை|ಬೇಡ|വേണ്ട|না চাই|نہیں)(?:\s|$)/iu],
  ["pricing", /(?:price|pricing|cost|how much|plan|subscription|ధర|ఎంత ఖర్చు|ఖర్చు|कीमत|कितना|वிலை|ಬೆಲೆ|വില|কত টাকা|قیمت)/iu],
  ["signup", /(?:sign ?up|join|waitlist|free trial|onboard|register|నమోదు|సైన్ ?అప్|వెయిట్‌లిస్ట్|साइन ?अप|रजिस्टर|பதிவு|ಸೈನ್ ?ಅಪ್|സൈൻ ?അപ്പ്)/iu],
  ["technical_question", /(?:integration|api|webhook|password|account|login|connect(?:ion)?|ఇంటిగ్రేషన్|పాస్‌వర్డ్|అకౌంట్|इंटीग्रेशन|पासवर्ड|खाता|இன்டிக்ரேஷன்|கடவுச்சொல்)/iu]
]

const hasRequiredContext = (requirements, context) => Object.entries(requirements || {}).every(([key, expected]) => expected !== true || context.route_state[key] === true)

// Phase 3 uses this gate before an embedding call. A rejected result is a
// normal conversational turn, not an error and never a caller-facing label.
export function preflightSemanticRoute({ route, context }) {
  if (!route?.id) return { eligible:false, reason:"missing_route" }
  if (!context?.caller_text) return { eligible:false, reason:"empty_caller_text" }
  if (route.enabled === false) return { eligible:false, reason:"route_disabled" }
  if (!hasRequiredContext(route.eligibility, context)) return { eligible:false, reason:"missing_required_context" }
  const exclusion = EXCLUSIONS.find(([, expression]) => expression.test(context.caller_text))
  if (exclusion) return { eligible:false, reason:exclusion[0] }
  return { eligible:true, reason:"eligible" }
}
