import { createGeminiConversation } from "../src/demo/gemini-conversation.js"
import { createTurnInterpreter } from "../src/demo/turn-interpreter.js"
import { getCapabilityCatalog, getConversationIntentCatalog } from "../src/demo/capability-catalog.js"
import { emptyConversationProfile, mergeConversationProfile, profileCoverage } from "../src/demo/conversation-profile.js"
import { applySemanticPitchIntent, emptyPitchIntent, pitchReplySnapshot, recordPitchReply } from "../src/demo/conversation-pitch-state.js"
import { hasVerifiedValueRequest } from "../src/demo/value-intent-evidence.js"

const language = "te"
const brain = createGeminiConversation()
const interpreter = createTurnInterpreter()
const catalog = await getCapabilityCatalog(language)
const intents = await getConversationIntentCatalog()
const capabilityIndex = catalog.map(item => ({
  id:item.id, title:item.title, claim:item.callerSafeClaim, impact:item.callerImpact,
  availability:item.availability, requirements:item.requirements
}))

function state() {
  return {
    profile:emptyConversationProfile(), pitchIntent:emptyPitchIntent(), discoveryCompleteReady:false,
    discoveryCompleteOffered:false, explanationDelivered:false, discoveryQuestions:0, history:[]
  }
}

function memoryFor(testState, capabilityContext, { awaitingPostPitchChoice=false, awaitingDiscoveryChoice=false }={}) {
  return {
    opening_delivered:true,
    conversation_profile:testState.profile,
    conversation_objective:testState.explanationDelivered ? "continue_naturally" : profileCoverage(testState.profile).sufficient ? "tailored_explanation" : "focused_discovery",
    pitch_intent:testState.pitchIntent,
    capability_context:capabilityContext,
    post_pitch_next_step:{ awaiting_caller_choice:awaitingPostPitchChoice },
    discovery_complete:{ ready:testState.discoveryCompleteReady, awaiting_caller_choice:awaitingDiscoveryChoice },
    language_policy:{ active_language:language }
  }
}

async function modelReply({ testState, callerText, awaitingPostPitchChoice=false, awaitingDiscoveryChoice=false }) {
  const capabilityContext = pitchReplySnapshot({ pitchIntent:testState.pitchIntent, catalog })
  const memory = memoryFor(testState, capabilityContext, { awaitingPostPitchChoice, awaitingDiscoveryChoice })
  let response = ""
  for await (const item of brain.replyStream({ language, history:[...testState.history, { role:"user", content:callerText }], callerText, memory, signal:AbortSignal.timeout(30_000) })) {
    if (item.text) response += item.text
  }
  testState.history.push({ role:"user", content:callerText }, { role:"assistant", content:response })
  if (capabilityContext.mode === "value_pitch") {
    testState.pitchIntent = recordPitchReply({ pitchIntent:testState.pitchIntent, mode:"value_pitch", replyText:response })
    testState.explanationDelivered = true
  } else if (testState.pitchIntent.id === "explore_woxza_value") {
    testState.pitchIntent = recordPitchReply({ pitchIntent:testState.pitchIntent, mode:"inactive", replyText:response })
  }
  if (testState.discoveryCompleteReady) {
    testState.discoveryCompleteReady = false
    testState.discoveryCompleteOffered = true
  }
  return { response, capabilityContext }
}

async function backgroundUpdate(testState, callerText) {
  const [facts, routing] = await Promise.all([
    interpreter.interpret({ turn:{ authoritative_text:callerText }, phase:"focused_discovery", businessProfile:testState.profile, language }),
    interpreter.interpretValueIntent({ callerText, businessProfile:testState.profile, language, recentHistory:testState.history, isAlreadyActive:testState.pitchIntent.id === "explore_woxza_value", capabilityIndex })
  ])
  if (facts.raw?.clarity === "complete") testState.profile = mergeConversationProfile(testState.profile, facts.raw?.details || {})
  const validNewRequest = hasVerifiedValueRequest(routing.raw, testState.history)
  const coverage = profileCoverage(testState.profile)
  const semantic = validNewRequest ? {
    id:"explore_woxza_value", status:coverage.readyForTailoredPitch ? routing.raw.status : "collecting_context",
    missing_facts:routing.raw.missing_facts, candidate_capability_ids:routing.raw.candidate_capability_ids
  } : testState.pitchIntent.id === "explore_woxza_value" ? {
    id:"explore_woxza_value", status:coverage.readyForTailoredPitch ? routing.raw.status : "collecting_context",
    missing_facts:routing.raw.missing_facts, candidate_capability_ids:routing.raw.candidate_capability_ids
  } : {}
  testState.pitchIntent = applySemanticPitchIntent({ previous:testState.pitchIntent, semantic, intents, catalog })
  testState.discoveryCompleteReady = coverage.sufficient && !testState.explanationDelivered && !testState.discoveryCompleteOffered && !testState.pitchIntent.id
  return { facts:facts.raw, routing:routing.raw, coverage, pitchIntent:testState.pitchIntent }
}

async function turn(testState, callerText, options={}) {
  const reply = await modelReply({ testState, callerText, ...options })
  const update = await backgroundUpdate(testState, callerText)
  return { caller:callerText, agent:reply.response, mode:reply.capabilityContext.mode, update }
}

async function runCase(name, inputs) {
  const testState = state(); const turns = []
  for (const input of inputs) turns.push(await turn(testState, input.text, input.options))
  return { name, turns, finalProfile:testState.profile, finalPitchIntent:testState.pitchIntent, discoveryCompleteReady:testState.discoveryCompleteReady }
}

const cases = [
  ["Test 1 — explicit help request, then tailored pitch", [
  { text:"నేను ఒక మెడికల్ షాప్ నడుపుతున్నాను. Woxza ఎలా ఉపయోగపడుతుంది?" },
  { text:"కస్టమర్లు ఫోన్, వాట్సాప్ ద్వారా ఆర్డర్లు మరియు మందుల లభ్యత గురించి అడుగుతారు." },
  { text:"ఒక స్టాఫ్ మెంబర్ రోజంతా ఈ కాల్స్, మెసేజ్‌లకు సమాధానం ఇస్తూ ఉంటాడు." },
  { text:"ఇప్పుడు నా బిజినెస్‌కి Woxza ఎలా ఉపయోగపడుతుందో వివరించండి." }
  ]],
  ["Test 2 — extra discovery question must be new", [
  { text:"మాది డెంటల్ క్లినిక్." },
  { text:"పేషెంట్లు ఫోన్, వాట్సాప్ ద్వారా అపాయింట్మెంట్ల కోసం సంప్రదిస్తారు." },
  { text:"సాయంత్రం కాల్స్ మిస్ అవుతాయి, ఒక రిసెప్షనిస్ట్ అన్నీ హ్యాండిల్ చేస్తారు." },
  { text:"కొన్నిసార్లు పేషెంట్లకు తిరిగి కాల్ చేయడానికి కూడా ఆలస్యం అవుతుంది." }
  ]],
  ["Test 3 — neutral choice, pitch, then post-pitch action", [
  { text:"మాది డెంటల్ క్లినిక్." },
  { text:"పేషెంట్లు ఫోన్ కాల్స్ ద్వారా అపాయింట్మెంట్లు తీసుకుంటారు." },
  { text:"వెయిటింగ్ టైమ్ ఎక్కువగా ఉంటుంది, రిసెప్షనిస్ట్ కాల్స్‌లో బిజీగా ఉంటారు." },
  { text:"అవును", options:{ awaitingDiscoveryChoice:true } },
  { text:"Woxza మా క్లినిక్‌కి ఎలా ఉపయోగపడుతుందో వివరించండి." },
  { text:"అవును", options:{ awaitingPostPitchChoice:true } }
  ]]
]

const requestedCases = new Set(process.argv.slice(2))
const results = []
for (const [index, [name, inputs]] of cases.entries()) {
  if (requestedCases.size && !requestedCases.has(String(index + 1))) continue
  results.push(await runCase(name, inputs))
}
console.log(JSON.stringify(results, null, 2))
