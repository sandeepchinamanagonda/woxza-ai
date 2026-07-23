import { GoogleGenAI } from "@google/genai"
import { logCallEvent } from "../call-events.js"
import { WebSocketServer } from "ws"
import { buildDemoPrompt, LANGUAGES, LOCALIZED_DEMO_NAMES, USE_CASE_CONFIG, localizedCompleteOpening, localizedDemoEnding, localizedDemoRoleHandoff, localizedDemoTaskConfirmation, localizedInitialWelcome, localizedPitchThinkingAcknowledgement, localizedPostCompletionOffer, localizedPostOrderActionCapability, localizedRedirect, localizedScopeBoundary } from "./prompt.js"
import { getCallMessages } from "./messages.js"
import { createPcmSpeechDetector, createSpeechSegmentBuffer, isPcmAudible, resamplePcm, swapPcm16Endianness } from "./audio-codec.js"
import { createStreamingOutputSafetyGuard, findDemoRoleReversal, findUnsafeOutput } from "./output-guardrail.js"
import { getFeaturePrompts, logFeatureMention, resolveFeatureContext } from "../features.js"
import { createAppointmentBookingState, transitionAppointmentBooking } from "./appointment-state.js"
import { getProofPoints } from "./proof-points.js"
import { buildPitchContext, buildPitchSpeechPlan } from "./pitch-selector.js"
import { createOpeningController } from "./opening-controller.js"
import { createLiveTranscriptTurnBuffer } from "./live-transcript-buffer.js"
import { createAudioChunkDeduplicator } from "./audio-deduplicator.js"
import { createLiveTurnGate, interpretationSignature } from "./live-turn-gate.js"
import { beginContextualDemo, completeContextualDemo, createContextualDemoState, prepareContextualDemoResponse } from "./contextual-demo-state.js"
import { BUSINESS_CATEGORIES, DEMO_SCENARIOS, WORKFLOW_TAGS, commitAction, noOp, submitTurn } from "./orchestrator.js"
import { createOrchestratorStore } from "./orchestrator-store.js"
import { buildApprovedActionRenderContract, RENDERED_ORDER_ACTIONS, validateApprovedActionRender } from "./approved-action-renderer.js"
import { normalizeTurnInterpretation } from "./turn-normalizer.js"
import { applyDeterministicDemoEngine } from "./deterministic-demo-engine.js"

const EXPIRY_MINUTES = 10
export const GEMINI_CAPACITY_MAX_RETRIES = 3

export function createApprovedActionSpeechWatchdog({ delayMs=1_200, schedule=setTimeout, cancel=clearTimeout, onTimeout } = {}) {
  let timer
  return {
    arm(action) {
      cancel(timer)
      timer = schedule(() => { timer = undefined; onTimeout?.(action) }, delayMs)
      timer?.unref?.()
    },
    noteOutput() { cancel(timer); timer = undefined },
    stop() { cancel(timer); timer = undefined }
  }
}
const INITIAL_CALLER_FIRST_WINDOW_MS = 750

function isAreYouThere(text="") {
  return /\b(hello|are you there|unna[rv]a|unnara|ఉన్నారా|హలో)\b/iu.test(String(text))
}

function isOpeningGreetingOnly(text="") {
  return /^\s*(?:(?:hello|hi|namaskar|namaste|నమస్కారం|నమస్తే|హలో|नमस्कार|नमस्ते)[\s,.!।]*)+\s*$/iu.test(String(text))
}

// Gemini closes a Live session with 1011 when its serving pool is temporarily
// exhausted. Spread reconnects out so a busy pool has time to recover and a
// single call never becomes a tight reconnect loop.
export function geminiCapacityRetryDelay(retries, random=Math.random) {
  return Math.min(1_000 * (2 ** Math.max(0, retries)) + random() * 1_000, 16_000)
}

export function isGeminiCapacityClose(event) {
  const reason = String(event?.reason || event?.message || "")
  return Number(event?.code) === 1011 && /resource\s+has\s+been\s+exhausted|quota|capacity/i.test(reason)
}
const SILENCE_REPROMPTS = {
  en:"Are you still there?",
  es:"¿Sigue ahí?",
  hi:"क्या आप अभी भी लाइन पर हैं जी?",
  te:"మీరు ఇంకా లైన్‌లో ఉన్నారా అండి?",
  ta:"நீங்கள் இன்னும் இணைப்பில் இருக்கிறீர்களா?",
  kn:"ನೀವು ಇನ್ನೂ ಲೈನ್‌ನಲ್ಲಿ ಇದ್ದೀರಾ?",
  ml:"നിങ്ങൾ ഇപ്പോഴും ലൈനിലുണ്ടോ?",
  mr:"आपण अजूनही लाईनवर आहात का?",
  gu:"શું આપ હજુ લાઇન પર છો?",
  bn:"আপনি কি এখনও লাইনে আছেন?",
  pa:"ਕੀ ਤੁਸੀਂ ਅਜੇ ਵੀ ਲਾਈਨ 'ਤੇ ਹੋ?",
  as:"আপুনি এতিয়াও লাইনত আছে নে?",
  ur:"کیا آپ ابھی بھی لائن پر ہیں جی؟"
}

// Twilio Media Streams use G.711 μ-law at 8 kHz. Keep this conversion at the
// provider boundary; Gemini always receives and emits signed 16-bit PCM here.
function muLawToPcm(input) {
  const output = Buffer.alloc(input.length * 2)
  for (let index = 0; index < input.length; index += 1) {
    const value = (~input[index]) & 0xff
    let sample = ((value & 0x0f) << 3) + 0x84
    sample <<= (value & 0x70) >> 4
    output.writeInt16LE((value & 0x80) ? 0x84 - sample : sample - 0x84, index * 2)
  }
  return output
}

function pcmToMuLaw(input) {
  const samples = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
  const output = Buffer.alloc(samples.length)
  for (let index = 0; index < samples.length; index += 1) {
    let sample = samples[index]
    const sign = sample < 0 ? 0x80 : 0
    if (sample < 0) sample = -sample
    sample = Math.min(32635, sample) + 0x84
    let exponent = 7
    for (let mask = 0x4000; exponent > 0 && !(sample & mask); mask >>= 1) exponent -= 1
    output[index] = (~(sign | (exponent << 4) | ((sample >> (exponent + 3)) & 0x0f))) & 0xff
  }
  return output
}

export function decodePlivoInboundAudio(payload, contentType=process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000", l16ByteOrder=process.env.PLIVO_L16_BYTE_ORDER || "little") {
  const raw = Buffer.from(payload, "base64")
  if (/audio\/x-l16;rate=16000/i.test(contentType)) {
    if (l16ByteOrder === "little") return raw
    if (l16ByteOrder === "big") return swapPcm16Endianness(raw)
    throw new Error(`Unsupported Plivo L16 byte order: ${l16ByteOrder}`)
  }
  if (/audio\/x-mulaw;rate=8000/i.test(contentType)) return resamplePcm(muLawToPcm(raw), 8000, 16000)
  throw new Error(`Unsupported Plivo stream content type: ${contentType}`)
}

async function findDemoCall(db, demoCallId) {
  const result = await db.query(
    `SELECT id,use_case,entry_hint,name,language,answered_at FROM demo_calls
     WHERE id=$1 AND created_at >= NOW() - INTERVAL '${EXPIRY_MINUTES} minutes' AND status IN ('ringing','connected')`,
    [demoCallId]
  )
  return result.rows[0] || null
}

function persistTranscript(db, demoCallId, speaker, text) {
  const value = String(text || "").trim()
  if (!value) return
  void db.query("INSERT INTO call_transcript_turns (demo_call_id,speaker,text) VALUES ($1,$2,$3) RETURNING id", [demoCallId, speaker, value])
    .then(result => logCallEvent(db, {
      callId:demoCallId, demoCallId, eventType:"turn_end", payload:{ speaker, transcript_row_id:result.rows?.[0]?.id || null }
    }))
    .catch(error => {
      console.warn("Transcript persistence failed", { demoCallId, error:error.message })
      logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"error", severity:"error", payload:{ message:error.message, exception_type:error.name, stack_trace:error.stack || null, component:"db", request_payload:{ query:"INSERT call_transcript_turns" } } })
    })
}

function isEscalationRequest(text) {
  return /\b(?:human|person|live agent|representative|transfer me|callback)\b/i.test(text)
}

function requestEscalation({ demoCallId, text }) {
  // TODO: replace this optional tenant webhook with a real transfer target.
  if (!process.env.ESCALATION_WEBHOOK_URL) return
  void fetch(process.env.ESCALATION_WEBHOOK_URL, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ demoCallId, text, type:"human_requested" }) })
    .catch(error => console.warn("Escalation webhook failed", { demoCallId, error:error.message }))
}

function promptLiveAgent(session, text) {
  // Live API realtime text starts model generation immediately. Client-content
  // messages caused this audio session to close on the configured Live model.
  session?.sendRealtimeInput({ text })
}

export function describeGeminiLiveError(event) {
  const detail = event?.error || event
  const message = detail?.message || event?.message || (typeof detail === "string" ? detail : "Unknown Gemini Live transport error")
  return {
    message,
    name:detail?.name || event?.name || null,
    code:detail?.code || event?.code || null,
    type:event?.type || null
  }
}

export function createDemoOrderState(demoCallId) {
  return {
    status:"collecting",
    summary:"",
    total:"",
    reference:`WX-${String(demoCallId || "ORDER").replaceAll("-", "").slice(0, 6).toUpperCase()}`,
    callerDetails:[],
    awaitingConfirmationTurn:false,
    confirmationPromptInjected:false,
    confirmationAttempts:0,
    postCompletionOffered:false
  }
}

export function missingOrderDetails({ restaurant, item, variant, quantity }) {
  const missing = []
  if (!String(restaurant || "").trim()) missing.push("restaurant or branch")
  if (!String(item || "").trim()) missing.push("item")
  if (/biryani|బిర్యానీ/iu.test(String(item || "")) && !String(variant || "").trim()) missing.push("vegetarian or non-vegetarian choice")
  if (!String(quantity || "").trim()) missing.push("quantity")
  return missing
}

export function createScopeRedirectState() {
  return { consecutive:0 }
}

export function advanceScopeRedirect(state, { language, currentUseCase, category="general", targetUseCase, ending }) {
  state.consecutive += 1
  const currentDemo = LOCALIZED_DEMO_NAMES[language]?.[currentUseCase] || LOCALIZED_DEMO_NAMES.en[currentUseCase]
  if (state.consecutive >= 3) return { count:state.consecutive, action:"close", sayExactly:ending }
  if (state.consecutive === 2) {
    return { count:state.consecutive, action:"offer_choices", sayExactly:localizedScopeBoundary(language, "second", currentDemo) }
  }
  const validTarget = category === "supported_demo" && targetUseCase !== currentUseCase && USE_CASE_CONFIG[targetUseCase]
  if (validTarget) {
    const targetDemo = LOCALIZED_DEMO_NAMES[language]?.[targetUseCase] || LOCALIZED_DEMO_NAMES.en[targetUseCase]
    return { count:state.consecutive, action:"redirect_demo", sayExactly:localizedRedirect(language, currentDemo, targetDemo) }
  }
  return { count:state.consecutive, action:"set_boundary", sayExactly:localizedScopeBoundary(language, "first", currentDemo) }
}

export function isOrderAffirmative(text) {
  return /(?:\b(?:yes|confirm|confirmed|okay|ok|sure|proceed)\b|అవును|కన్ఫర్మ్|చేయండి|हाँ|हां|कन्फर्म|ஆம்|உறுதி|ಹೌದು|ದೃಢ|അതെ|സ്ഥിരീകര|होय|पुष्टी|હા|પુષ્ટિ|হ্যাঁ|নিশ্চিত|ਹਾਂ|ਪੁਸ਼ਟੀ|হয়|নিশ্চিত|ہاں|تصدیق)/iu.test(String(text || ""))
}

export function isOrderCorrection(text) {
  return /(?:\b(?:wrong(?:\s+item)?|mistake|incorrect|not that|that's not|that is not|cancel(?:\s+the\s+order)?|change (?:the )?item)\b|t+h?a+p+p+u+|తప్పు|गलत|गलत है|गलत था|incorrecto)/iu.test(String(text || ""))
}

export function isPostOrderActionQuestion(text) {
  return /(?:\b(?:call(?:\s+me)?\s+back|callback|follow[ -]?up|after\s+(?:checking|knowing|finding).*(?:price|availability)|(?:price|availability).*(?:call|callback|follow))\b|(?:ఫోన్|కాల్).{0,40}(?:చేయ|చేయగల|మళ్ళీ|తిరిగి)|(?:ధర|ప్రైస్).{0,60}(?:ఫోన్|కాల్|చేయ)|(?:తెలుసుకున్నాక|చూసిన తర్వాత).{0,60}(?:ఫోన్|కాల్|చేయ))/iu.test(String(text || ""))
}

export function looksLikeOrderConfirmationQuestion(text) {
  return /(?:confirm|confirmation|కన్ఫర్మ్|నిర్ధార|कन्फर्म|पुष्टि|உறுதி|ದೃಢ|സ്ഥിരീകര|पुष्टी|પુષ્ટિ|নিশ্চিত|ਪੁਸ਼ਟੀ|تصدیق)/iu.test(String(text || ""))
}

export function containsOrderConfirmation(text, reference) {
  const spokenReference = String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  const expectedReference = String(reference || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
  return spokenReference.includes(expectedReference) && /(?:confirmed|కన్ఫర్మ్|నిర్ధార|कन्फर्म|पुष्टि|உறுதி|ದೃಢ|സ്ഥിരീകര|पुष्टी|પુષ્ટિ|নিশ্চিত|ਪੁਸ਼ਟੀ|تصدیق)/iu.test(String(text || ""))
}

// Input transcriptions can arrive in partial chunks, so keep this deliberately
// conservative: only act on clear farewell / no-more-help intent rather than a
// lone "thanks" that may be followed by another request.
export function isConversationEndRequest(text) {
  const value = String(text || "").trim().toLowerCase()
  if (!value) return false
  if (/(?:చలో\s*(?:ఉంటాను|untanu)|chalo\s*untanu|ఇంకా\s*(?:వద్దు|వదdu)|inka\s*(?:vaddu|vaddhu|vadhu|vadu)|అక్కర్లేదు|akkarledu|లేదు\s*(?:అండి|andi)?\s*చాలు|not needed|no need|that will do)/iu.test(value)) return true
  return /(?:\b(?:bye(?:\s+bye)?|good\s*bye|good night|see you(?: later)?|talk to you later|that'?s all|that is all|nothing else|nothing more(?!\s+than)|no (?:thanks|thank you),?\s*(?:that'?s all|nothing (?:else|more)|i'?m done)|i(?: am|'m) (?:done|finished)|end (?:the )?(?:call|conversation)|hang up|disconnect (?:the )?(?:call|conversation))\b|अलविदा|बाय\b|बस इतना|यही है|धन्यवाद,?\s*बस|వీడ్కోలు|బై\b|ఇంతే|చాలు|ధన్యవాదాలు,?\s*చాలు|adiós|hasta luego|eso es todo|nada más|gracias,?\s*(?:eso es todo|nada más)|விடைபெறுகிறேன்|பை\b|அவ்வளவுதான்|போதும்|ವಿದಾಯ|ಬೈ\b|ಅಷ್ಟೇ|ಸಾಕು|വിട|ബൈ\b|അത്ര മതി|മതി|निरोप|बाय\b|इतकेच|बस झाले|અલવિદા|બાય\b|બસ એટલું|થૅન્ક યુ,?\s*બસ|বিদায়|বাই\b|এই পর্যন্ত|আর কিছু নেই|ਅਲવિદા|ਬਾਇ\b|ਬਸ ਇੰਨਾ|الوداع|بائے\b|بس اتنا)/iu.test(value)
}

// Speech-to-text commonly writes a spoken menu choice as a clock value (for
// example, “second” becomes “2:00”). These only apply while the two-choice
// welcome is active, never in an ordinary conversation.
export function resolveNumericOpeningChoice(text) {
  const value = String(text || "").trim().toLowerCase().replace(/[.!?,]+$/u, "")
  if (/^(?:1|1:00|01:00)$/u.test(value)) return "demo"
  if (/^(?:2|2:00|02:00)$/u.test(value)) return "business"
  return null
}

function openGeminiSession({ socket, call, language, demoCallId, db, orchestratorStore, onAudio, onOpeningAudioStart, onOutputBlocked, onInterrupted, onClosed, onCallerActivity, onConversationEndRequested, onAgentActivity, onOpeningComplete, onAgentTurnComplete, onClosingComplete, onTurnTiming, openingAlreadyHandled=false, isOpeningWelcomeDelivered=() => false }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini is not configured")
  const messages = { ...getCallMessages({ useCase:call.entry_hint || call.use_case, language, businessName:process.env.DEMO_BUSINESS_NAME, companyName:process.env.DEMO_COMPANY_NAME }), ending:localizedDemoEnding(language) }
  return getFeaturePrompts(db)
    .then(featurePrompts => buildDemoPrompt({ name:call.name, entryHint:call.entry_hint, language, featurePrompts, openingAlreadyHandled, ...messages }))
    .then(async prompt => {
    const ai = new GoogleGenAI({ apiKey:process.env.GEMINI_API_KEY })
    let liveSession
    // Plivo plays the only greeting itself before caller audio is released.
    // The live model must never own a second welcome, fallback, or menu.
    let openingChoicePending = false
    let openingPhase = "handshake"
    const conversation = { mode:"discover", activeDemo:null, business:"", demoOffered:false, askedAbout:[], discovery:null }
    const isOrderTaking = () => conversation.mode === "demonstrate" && conversation.activeDemo === "order_taking"
    const isAppointmentBooking = () => conversation.mode === "demonstrate" && conversation.activeDemo === "appointment_booking"
    const isContextualDemo = () => conversation.mode === "demonstrate" && conversation.activeDemo === "contextual_business_demo"
    const orderState = createDemoOrderState(demoCallId)
    const appointmentState = createAppointmentBookingState()
    const contextualDemo = createContextualDemoState()
    const featureState = { businessTag:"", mentionedIds:new Set(), productRevealDelivered:false }
    const scopeState = createScopeRedirectState()
    let latestCallerText = ""
    let appointmentConfirmationPending = false
    let appointmentToolRequired = false
    let agentTextChunks = []
    let turnAudioDurationMs = 0
    let rejectedTurnReason = null
    let conversationFinished = false
    let callerRequestedEnd = false
    let scopeRedirectUsedThisTurn = false
    let scopeClosingPending = false
    let turnCompleteTimer
    let responseStartedAt = null
    let modelTextSeen = false
    let modelAudioSeen = false
    let orchestratorSession
    let pendingOrchestratorAction
    let pendingApprovedRender
    let roleHandoffActive = false
    let roleHandoffText = ""
    let suppressNoOpOutput = false
    let callerTurnFinalizing = false
    let authorizedAudioActionId = null
    let onLiveMessage
    const liveTurnGate = createLiveTurnGate()
    const audioChunkDeduplicator = createAudioChunkDeduplicator()
    const callerTranscriptBuffer = createLiveTranscriptTurnBuffer({
      delayMs:700,
      onTurn:text => onLiveMessage?.({ serverContent:{ inputTranscription:{ text }, woxzaCombinedCallerTurn:true } })
    })
    const approvedActionWatchdog = createApprovedActionSpeechWatchdog({ delayMs:150,
      onTimeout:approved => {
        if (!approved || conversationFinished) return
        console.warn("Approved orchestrator action produced no speech; retrying delivery", { demoCallId, action:approved.action })
        const render = pendingApprovedRender
        if (render && !render.approved) {
          promptLiveAgent(liveSession, `[ORDER ACTION RENDER REQUIRED: Do not speak yet. Call render_approved_action with action_id=${render.action_id}, a natural ${languageName} localized_text, and every required included_fields: ${JSON.stringify(render.required_fields)}.]`)
          return
        }
        promptLiveAgent(liveSession, `[ORCHESTRATOR DELIVERY REQUIRED: Speak the approved action now in ${languageName}. Action=${approved.action}. Context=${JSON.stringify(approved.response_context)}. Do not call another tool, greet again, or add a different question.]`)
      }
    })
    const languageName = LANGUAGES.get(language) || "English"
    const actionDeliveryInstruction = action => {
      if (action === "set_demo_roles") return "DEMO ROLE LOCK: Speak the backend-provided role_handoff_text, then stop and wait for the caller's customer question. You are Woxza representing the caller's business; the caller is always the customer. Never say that you are the customer, never ask the caller to answer for the business, never act out both sides, and never add a scenario label."
      if (action === "deliver_simulated_answer_and_ask_quantity") return "Speak the simulated stock/product answer, then ask exactly how many pieces, strips, cartons, or units the caller needs. Do not confirm it, end the demo, or ask for feedback."
      if (action === "answer_order_follow_up_and_ask_quantity") return "Answer the caller's price, discount, delivery, or product follow-up with example data. Keep the example order open, then ask for the quantity if it is missing; otherwise ask whether to proceed. Do not confirm it, end the demo, or ask for feedback."
      if (action === "present_order_terms_and_ask_proceed") return "State the example price, applicable discount, and delivery terms for the stated quantity, then ask exactly one clear proceed question. Do not confirm it, end the demo, or ask for feedback."
      if (action === "deliver_billing_quote_and_ask_measurement") return "State an example quote rate, then ask for the required quantity, square footage, or measurement."
      if (action === "answer_billing_follow_up_and_ask_measurement") return "Answer the quote follow-up, then ask for the required quantity, square footage, or measurement."
      if (action === "present_billing_total_and_ask_proceed") return "State example billing total and terms, then ask whether to create the example invoice or order."
      if (action === "deliver_delivery_status_and_ask_proceed") return "State an example delivery status and one concrete estimated delivery date/time window, then ask whether to create the example delivery request. Never say you cannot check it."
      if (action === "deliver_dynamic_business_resolution_and_ask_proceed") return "Give a clearly labelled, business-appropriate mock resolution with one concrete outcome, then ask whether to create the example request. Never say you cannot check it or leave the request unresolved."
      if (action === "explain_payment_and_ask_proceed") return "State an example payment or invoice answer, then ask whether to create the example request."
      if (action === "deliver_service_status_and_ask_proceed") return "State an example service status, then ask whether to create the example follow-up."
      if (action === "confirm_simulated_task") return "Confirm the example order/task now using the supplied example reference, then ask how the demo felt."
      if (action === "complete_simulated_task") return "Acknowledge that the caller declined the example order/task, then ask how the demo felt."
      if (action === "ask_demo_scenario") return "Ask one short scenario menu in the configured language: stock or order, billing or quote, delivery, payments, FAQ or catalogue, service status, or another relevant customer request. Do not start the demo yet."
      if (action === "guide_customer_request") return "Remind the caller briefly that they are the customer, then ask them to state the customer request they want to try. Do not become the customer or start both sides of the conversation."
      if (action === "clarify_order_confirmation") return "Say the example order is still open and ask one short, clear question whether the caller wants to proceed. Do not confirm, end the demo, or ask for feedback."
      if (action === "ask_business_value_permission") return "Ask once whether the caller would like to hear how Woxza could help this specific business. Do not give the pitch unless they agree."
      if (action === "ask_anything_else") return "Ask one short question whether the caller wants to try or ask anything else. Do not repeat the pitch or demo unless requested."
      if (action === "close") return "Speak the exact backend-provided closing only, with no extra sentence."
      return "Speak only the approved action in response_context. Do not change phase, roles, business, or completion."
    }
    const authorizeDirectAudio = label => {
      const actionId = `${demoCallId}:direct:${label}:${Date.now()}`
      authorizedAudioActionId = actionId
      liveTurnGate.authorize(actionId)
      return actionId
    }
    const getOrchestratorSession = async () => orchestratorSession ||= await orchestratorStore?.load(demoCallId, language)
    const saveOrchestratorSession = async next => {
      orchestratorSession = next
      await orchestratorStore?.save(next)
      return next
    }
    const prepareExperiences = async pending => {
      const demo = { default_scenario:"customer enquiry", business:pending.business_profile.business, current_process:pending.business_profile.current_process, primary_pain:pending.business_profile.primary_pain }
      // Do not restore the stale pending session here. Audio may already have
      // committed the discovery action, so preparation must only augment the
      // latest state and never roll its phase/version back.
      const atPreparationStart = await getOrchestratorSession()
      if (atPreparationStart.call_id !== pending.call_id || atPreparationStart.business_profile.business !== pending.business_profile.business) return
      await saveOrchestratorSession({ ...atPreparationStart, pitch:{ status:"preparing", data:null }, demo:{ status:"preparing", data:null } })
      const deadline = setTimeout(() => {
        void getOrchestratorSession().then(latest => latest.pitch.status === "preparing" && saveOrchestratorSession({ ...latest, pitch:{ status:"failed", data:null }, demo:latest.demo.status === "preparing" ? { status:"failed", data:null } : latest.demo }))
      }, 2_500)
      deadline.unref?.()
      try {
        const points = await getProofPoints()
        const latest = await getOrchestratorSession()
        if (latest.call_id !== pending.call_id || latest.business_profile.business !== pending.business_profile.business) return
        const pitch = buildPitchContext({
          business:latest.business_profile.business,
          businessLabel:latest.business_profile.business_label || latest.business_profile.business,
          currentProcess:latest.business_profile.current_process,
          primaryPain:latest.business_profile.primary_pain,
          scale:latest.business_profile.operating_detail,
          vertical:latest.business_profile.business_category || "universal",
          workflowTags:latest.business_profile.workflow_tags || [],
          usedIds:latest.pitch_points_used || []
        }, points)
        pitch.speech_plan = buildPitchSpeechPlan(pitch)
        clearTimeout(deadline)
        await orchestratorStore?.saveArtifact(demoCallId, "pitch", pitch)
        await orchestratorStore?.saveArtifact(demoCallId, "demo", demo)
        await saveOrchestratorSession({ ...latest, pitch:{ status:"ready", data:pitch }, demo:{ status:"ready", data:demo } })
      } catch (error) {
        clearTimeout(deadline)
        const latest = await getOrchestratorSession()
        if (latest.call_id === pending.call_id && latest.business_profile.business === pending.business_profile.business) await saveOrchestratorSession({ ...latest, pitch:{ status:"failed", data:null }, demo:{ status:"ready", data:demo } })
      }
    }
    const logTurnTiming = (event, extra={}) => {
      if (!responseStartedAt) return
      onTurnTiming?.(event, { elapsedFromCallerTranscriptionMs:Date.now() - responseStartedAt, ...extra })
    }
    const streamingGuard = createStreamingOutputSafetyGuard({
      useCase:"discover",
      language,
      callId:demoCallId,
      safeFallback:"Please tell me how I can help with Woxza.",
      holdMs:120,
      onAudio:pcm24 => {
        // Keep the carrier path deliberately direct. Plivo is responsible for
        // playback buffering; the live model may speak naturally after the
        // atomic welcome without waiting on a per-fragment approval gate.
        if (openingPhase === "handshake") onOpeningAudioStart?.()
        if (pendingOrchestratorAction) {
          // Snapshot before clearing the shared reference. Streaming audio can
          // arrive while a tool response is still being assembled.
          const pendingAction = pendingOrchestratorAction
          const actionId = pendingAction.action_id
          pendingOrchestratorAction = null
          void getOrchestratorSession()
            .then(sessionState => commitAction(sessionState, actionId))
            .then(next => next?.action === "no_op" ? null : saveOrchestratorSession(next))
            .catch(error => console.warn("Orchestrator action commit failed", { demoCallId, error:error.message }))
        }
        onAudio(pcm24, { opening:openingPhase === "handshake", audible:isPcmAudible(pcm24) })
      },
      onAllowedTurn:() => {},
      onClear:() => onOutputBlocked?.(),
      onRegenerate:() => {},
      onFallback:() => {},
      onExhausted:() => {},
      onTrigger:event => console.warn("Gemini streaming output blocked", event)
    })
    const injectOrderConfirmation = () => {
      if (!isOrderTaking() || orderState.confirmationPromptInjected) return
      orderState.status = "confirmed"
      orderState.awaitingConfirmationTurn = true
      orderState.confirmationPromptInjected = true
      orderState.confirmationAttempts += 1
      const total = orderState.total ? ` Total: ${orderState.total}.` : " Do not invent a total because pricing is unavailable."
      authorizeDirectAudio("legacy_order_confirmation")
      promptLiveAgent(liveSession, `[ORDER CONFIRMATION TURN REQUIRED: Speak one distinct confirmation turn now in ${languageName}, using native script and the required formal register. Clearly say the order is confirmed, read this COMPLETE order summary: ${orderState.summary || orderState.callerDetails.join(", ")}.${total} Say the order reference exactly as ${orderState.reference}. Do not say the demo closing or thank the caller yet.]`)
    }
    const sendOrderToolResponse = calls => {
      if (!isOrderTaking()) return
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "update_order_state") continue
        const args = toolCall.args || toolCall.arguments || {}
        const details = {
          restaurant:String(args.restaurant || orderState.restaurant || "").trim(),
          item:String(args.item || orderState.item || "").trim(),
          variant:String(args.variant || orderState.variant || "").trim(),
          quantity:String(args.quantity || orderState.quantity || "").trim(),
          extras:String(args.extras || orderState.extras || "").trim()
        }
        if (args.action === "set_pending") {
          const missing = missingOrderDetails(details)
          if (missing.length) {
            responses.push({ id:toolCall.id, name:toolCall.name, response:{
              status:"collecting",
              missing,
              instruction:`Do not confirm or read back the order. In the configured language, ask exactly one short question for the next missing detail: ${missing[0]}.`
            } })
            continue
          }
          Object.assign(orderState, details)
          orderState.summary = String(args.summary || [details.restaurant, details.quantity, details.variant, details.item, details.extras].filter(Boolean).join(", ")).trim()
          if (args.total) orderState.total = String(args.total).trim()
          orderState.status = "pending_confirmation"
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ status:orderState.status, summary:orderState.summary, total:orderState.total || null, reference:orderState.reference, instruction:"Read back the complete order now, then ask for confirmation. Do not close." } })
        } else if (args.action === "confirm") {
          if (orderState.status !== "pending_confirmation") {
            responses.push({ id:toolCall.id, name:toolCall.name, response:{ status:"collecting", instruction:"Do not confirm yet. Collect the missing order details, then read the complete order back and ask for the caller's explicit confirmation." } })
            continue
          }
          orderState.status = "confirmed"
          orderState.awaitingConfirmationTurn = true
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ status:orderState.status, summary:orderState.summary, total:orderState.total || null, reference:orderState.reference, instruction:"Speak only the explicit confirmation, complete summary, available total, and reference. Do not include the closing." } })
        }
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
    }
    const sendAppointmentToolResponse = calls => {
      if (!isAppointmentBooking()) return
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "update_booking_state") continue
        appointmentToolRequired = false
        const args = toolCall.args || toolCall.arguments || {}
        if (args.action === "out_of_scope") {
          const currentDemo = LOCALIZED_DEMO_NAMES[language]?.appointment_booking || LOCALIZED_DEMO_NAMES.en.appointment_booking
          const otherDemo = LOCALIZED_DEMO_NAMES[language]?.order_taking || LOCALIZED_DEMO_NAMES.en.order_taking
          const text = localizedRedirect(language, currentDemo, otherDemo)
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            ok:true,
            state:appointmentState.status,
            error:null,
            details:{ ...appointmentState.details },
            say_exactly:text,
            instruction:"Speak say_exactly verbatim in one turn, with no preface, extra question, promise, or closing."
          } })
          continue
        }
        const result = transitionAppointmentBooking(appointmentState, {
          action:args.action,
          type:args.appointment_type,
          value:args.value,
          callerText:args.caller_text || latestCallerText,
          language
        })
        if (result.state === "confirmed") appointmentConfirmationPending = true
        responses.push({ id:toolCall.id, name:toolCall.name, response:{
          ok:result.ok,
          state:result.state,
          error:result.error || null,
          details:result.details || { ...appointmentState.details },
          say_exactly:result.sayExactly,
          instruction:"Speak say_exactly verbatim in one turn, with no preface, extra question, promise, or closing."
        } })
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
    }
    const sendFeatureToolResponse = async calls => {
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "resolve_feature_context") continue
        scopeState.consecutive = 0
        if (isAppointmentBooking()) appointmentToolRequired = false
        const args = toolCall.args || toolCall.arguments || {}
        const intent = args.intent || "recommend"
        const proofPoints = await getProofPoints()
        if (intent === "highlight_feature") {
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            intent,
            proof_points:proofPoints,
            instruction:"Use the FEATURE LIBRARY rules in the live prompt. Select one approved point that is distinct from earlier features and useful for the caller's stated business or question. Explain its practical benefit in one concise sentence. Do not say this is your personal preference or mention internal tags."
          } })
          continue
        }
        if (intent === "intro") {
          featureState.productRevealDelivered = true
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            intent,
            proof_points:proofPoints,
            instruction:"This is an explicit feature question. Use the FEATURE LIBRARY rules in the live prompt. Give a compact, varied three-point answer from the approved library, in plain everyday language for a non-technical 60-year-old business owner. Do not repeat the opening, read a generic list, or claim a connected action happened in this public demo. Then ask which practical help would matter most to their business."
          } })
          continue
        }
        const businessTagCandidate = intent === "more_features"
          ? (featureState.businessTag || args.business_tag_candidate || "general")
          : (args.business_tag_candidate || featureState.businessTag || "general")
        const context = await resolveFeatureContext(db, {
          businessTagCandidate,
          callerQuestion:args.caller_question,
          limit:3,
          excludeFeatureIds:[...featureState.mentionedIds]
        })
        featureState.businessTag = context.businessTag || businessTagCandidate
        const selected = [context.requestedMatch, ...context.features]
          .filter((feature, index, all) => feature && all.findIndex(candidate => candidate?.id === feature.id) === index)
          .filter(feature => !featureState.mentionedIds.has(String(feature.id)))
          .slice(0, 3)
        selected.forEach(feature => featureState.mentionedIds.add(String(feature.id)))
        if (selected.length) await logFeatureMention(db, demoCallId, { ...context, features:selected }, args.caller_question)
        responses.push({ id:toolCall.id, name:toolCall.name, response:{
          intent,
          business_tag:featureState.businessTag,
          features:selected,
          instruction:selected.length
            ? "Explain why these features suit the caller's business and their practical outcomes. Mark roadmap items as coming soon. Ask whether they would like to hear more."
            : "All relevant features for this business have been covered. Say that briefly and offer to continue the selected demo; do not repeat earlier features."
        } })
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
      if (responses.length) logTurnTiming("tool_response_sent", { tool:"resolve_feature_context" })
    }
    const sendScopeToolResponse = calls => {
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "handle_scope_redirect") continue
        scopeRedirectUsedThisTurn = true
        if (isAppointmentBooking()) appointmentToolRequired = false
        const args = toolCall.args || toolCall.arguments || {}
        const result = advanceScopeRedirect(scopeState, {
          language,
          currentUseCase:call.use_case,
          category:args.category,
          targetUseCase:args.target_use_case,
          ending:messages.ending
        })
        if (result.action === "close") scopeClosingPending = true
        responses.push({ id:toolCall.id, name:toolCall.name, response:{
          count:result.count,
          action:result.action,
          say_exactly:result.sayExactly,
          instruction:"Speak say_exactly verbatim and nothing else. Do not add a preface, explanation, question, or translation."
        } })
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
      if (responses.length) logTurnTiming("tool_response_sent", { tool:"handle_scope_redirect" })
    }
    const sendConversationToolResponse = calls => {
      const responses = []
      for (const toolCall of calls || []) {
        const args = toolCall.args || toolCall.arguments || {}
        if (toolCall.name === "update_conversation_context") {
          if (args.business) {
            const changed = conversation.business && conversation.business !== String(args.business).trim().toLowerCase()
            conversation.business = String(args.business).trim().toLowerCase()
            if (changed) conversation.demoOffered = false
          }
          if (["discover", "explain", "demonstrate"].includes(args.mode)) {
            conversation.mode = args.mode
            if (args.mode === "explain" || args.mode === "demonstrate") openingChoicePending = false
          }
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ mode:conversation.mode, business:conversation.business || null, demo_offered:conversation.demoOffered, instruction:"Continue naturally. Do not mention internal modes or tools." } })
        } else if (toolCall.name === "start_workflow" && USE_CASE_CONFIG[args.workflow]) {
          if (openingChoicePending) {
            responses.push({ id:toolCall.id, name:toolCall.name, response:{
              mode:"discover",
              active_demo:null,
              instruction:"Do not start a workflow. The caller is still answering the two opening choices. Treat a bare 1 or 1:00 as demo, and a bare 2 or 2:00 as business explanation. Ask only for the intended path if it is genuinely unclear."
            } })
            continue
          }
          conversation.mode = "demonstrate"
          conversation.activeDemo = args.workflow
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ mode:"demonstrate", active_demo:args.workflow, instruction:`Begin the ${USE_CASE_CONFIG[args.workflow].label} demonstration naturally. Do not claim any real-world action was completed.` } })
        } else if (toolCall.name === "start_contextual_demo") {
          const result = beginContextualDemo(contextualDemo, {
            business:conversation.discovery?.business_description || conversation.business,
            currentProcess:conversation.discovery?.current_process,
            primaryPain:conversation.discovery?.primary_pain,
            scale:conversation.discovery?.scale || conversation.discovery?.languages || conversation.discovery?.handoff,
            topic:args.topic,
            callerGoal:args.caller_goal
          })
          if (result.ok) {
            conversation.mode = "demonstrate"
            conversation.activeDemo = "contextual_business_demo"
            openingChoicePending = false
          }
          responses.push({ id:toolCall.id, name:toolCall.name, response:result.ok
            ? { ok:true, demo:result.details, instruction:"Start the contextual business simulation described by the live conversation prompt. Use the discovered business context and topic. The later answer may use believable sample stock, price, discount, delivery, or follow-up details to make the simulation feel real; keep those details consistent with what the caller said." }
            : { ok:false, error:result.error, instruction:"Do not start a demo yet. Ask the caller what business they run." }
          })
        } else if (toolCall.name === "prepare_contextual_demo_response") {
          const result = prepareContextualDemoResponse(contextualDemo, {
            customerRequest:args.customer_request,
            details:args.details,
            simulatedResult:args.simulated_result
          })
          responses.push({ id:toolCall.id, name:toolCall.name, response:result.ok
            ? { ok:true, demo:result.details, instruction:"Deliver the simulated customer answer now in the configured language. Give a concrete, believable example answer to the customer using the details collected: you may say an item is in stock, quote an example price or discount, describe delivery, or confirm a follow-up. Make it feel like a real customer call, but keep it clearly within this simulated demo rather than implying access to the caller's actual business data. Do not say you will check later, ask the caller to wait, or ask another question." }
            : { ok:false, error:result.error, instruction:"Continue collecting one missing customer detail at a time." }
          })
        } else if (toolCall.name === "offer_demo") {
          const allowed = Boolean(conversation.business) && !conversation.demoOffered
          if (allowed) conversation.demoOffered = true
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ allowed, instruction:allowed ? "Offer one short, gentle contextual customer-call simulation based on the caller's business and pain. If they accept, call start_contextual_demo; do not call start_workflow unless they explicitly name an existing workflow." : "Do not proactively offer a demo. Continue the current conversation naturally." } })
        } else if (toolCall.name === "resolve_action_capability") {
          conversation.askedAbout.push(String(args.action || "follow_up"))
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ capability_tier:"configurable", say_exactly:localizedPostOrderActionCapability(language), preserve_mode:conversation.mode, preserve_active_demo:conversation.activeDemo, instruction:"Speak say_exactly naturally and concisely. Do not say an action was scheduled. Then return to the prior conversation context." } })
        }
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
    }
    const sendOrchestratorToolResponse = async calls => {
      const responses = []
      let sessionState = await getOrchestratorSession()
      for (const toolCall of calls || []) {
        if (toolCall.name !== "submit_turn_interpretation") continue
        const rawArgs = toolCall.args || toolCall.arguments || {}
        const normalized = normalizeTurnInterpretation(rawArgs, { phase:sessionState.stable_phase, callerText:latestCallerText })
        const args = normalized.interpretation
        if (args.turn_id !== sessionState.turn_id || args.expected_state_version !== sessionState.state_version) {
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ ...noOp("duplicate_or_stale_turn"), silent:true, instruction:"Do not speak. Wait for the next caller turn." } })
          continue
        }
        if (normalized.changed) {
          logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"warning", payload:{ component:"turn_normalizer", phase:sessionState.stable_phase, raw_intent:normalized.raw_intent, canonical_intent:args.intent, choice:args.details?.choice || null } })
        }
        // The orchestrator owns phase transitions; the demo engine owns mock
        // facts used by all protected demo actions.
        const result = applyDeterministicDemoEngine(submitTurn(sessionState, args), sessionState)
        if (result.pending_session) {
          // This is deliberately a local snapshot. The first PCM chunk may
          // commit and clear pendingOrchestratorAction before this async tool
          // handler reaches sendToolResponse.
          const pendingAction = result.pending_session.pending_action
          if (!pendingAction) {
            responses.push({ id:toolCall.id, name:toolCall.name, response:{ ...noOp("missing_pending_action"), silent:true, instruction:"Do not speak. Wait for the next caller turn." } })
            continue
          }
          pendingOrchestratorAction = pendingAction
          if (result.action === "set_demo_roles") {
            result.response_context = {
              ...result.response_context,
              role_handoff_text:localizedDemoRoleHandoff(language, result.response_context.business_profile?.business)
            }
            roleHandoffActive = true
            roleHandoffText = result.response_context.role_handoff_text
          }
          if (result.action === "confirm_simulated_task") {
            result.response_context = {
              ...result.response_context,
              fixed_text:localizedDemoTaskConfirmation(language, result.response_context.example_reference)
            }
          }
          if (result.action === "close") {
            result.response_context = { ...result.response_context, fixed_text:messages.ending }
          }
          // The orchestrator records the next phase, but it does not block
          // natural speech with a second render/tool round-trip.
          pendingApprovedRender = null
          await saveOrchestratorSession(result.pending_session)
          sessionState = result.pending_session
          if (result.action === "prepare_experiences_and_ask_choice") void prepareExperiences(result.pending_session).catch(error => console.warn("Experience preparation failed", { demoCallId, error:error.message }))
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            action:result.action, response_context:result.response_context, action_id:pendingAction.action_id,
            state_version:result.pending_session.state_version, requires_localized_render:false,
            instruction:actionDeliveryInstruction(result.action)
          } })
        } else responses.push({ id:toolCall.id, name:toolCall.name, response:{ ...noOp(result.reason), silent:true, instruction:"Do not speak. Wait for the next caller turn." } })
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
    }
    const sendApprovedActionRenderToolResponse = calls => {
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "render_approved_action") continue
        const args = toolCall.args || toolCall.arguments || {}
        const result = validateApprovedActionRender(pendingApprovedRender, args)
        if (!result.ok) {
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ approved:false, reason:result.reason, missing:result.missing || [], instruction:"Do not speak. Regenerate the localized text for the same action and include every required field." } })
          promptLiveAgent(liveSession, `[INVALID PROTECTED ACTION RENDER: localized_text must be the complete ${languageName} sentence you will say to the caller, never a language name such as "Telugu". Re-call render_approved_action with action_id=${pendingApprovedRender?.action_id}, a complete sentence, and exactly these required fields: ${JSON.stringify(pendingApprovedRender?.required_fields || [])}. If render_contract.fixed_text is present, use it exactly. Do not speak.]`)
          continue
        }
        pendingApprovedRender = { ...pendingApprovedRender, approved:true, localized_text:result.text }
        authorizedAudioActionId = pendingApprovedRender.action_id
        liveTurnGate.authorize(pendingApprovedRender.action_id)
        logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"approved_action_rendered", payload:{ action:pendingApprovedRender.action, action_id:pendingApprovedRender.action_id, language:languageName } })
        responses.push({ id:toolCall.id, name:toolCall.name, response:{ approved:true, say_exactly:result.text, instruction:"Speak say_exactly now, in full, without adding or removing any order step, feature pitch, feedback, or closing." } })
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
    }
    const sendTailoredPitchToolResponse = async calls => {
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "build_tailored_pitch") continue
        const args = toolCall.args || toolCall.arguments || {}
        const discovery = {
          business_description:String(args.business_description || conversation.business || "").trim(),
          current_process:String(args.current_process || "").trim(),
          primary_pain:String(args.primary_pain || "").trim(),
          scale:String(args.scale || "").trim(),
          languages:String(args.languages || "").trim(),
          handoff:String(args.handoff || "").trim()
        }
        const operatingDetail = discovery.scale || discovery.languages || discovery.handoff
        if (!discovery.business_description || !discovery.current_process || !discovery.primary_pain || !operatingDetail) {
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            status:"needs_more_discovery",
            instruction:"Do not pitch yet. Ask exactly one short, specific question that fills the missing operational detail: their current process, main pain, or a concrete scale/language/handoff fact. Use the caller's business and words; do not ask a generic question."
          } })
          continue
        }
        conversation.discovery = discovery
        const proofPoints = await getProofPoints()
        responses.push({ id:toolCall.id, name:toolCall.name, response:{
          status:"ready",
          discovery,
          proof_points:proofPoints,
          instruction:proofPoints.length
            ? `The caller has completed discovery. Start with one short acknowledgement in the configured language that conveys this meaning: "${localizedPitchThinkingAcknowledgement(language)}" Then follow the live conversation prompt when selecting and explaining the approved proof points. Avoid jargon, repeat neither the opening nor a list of features, and do not invent claims.`
            : "No proof-point file is available yet. Briefly reflect the caller's pain, use only the verified Woxza capabilities in the system instruction, and offer the most relevant workflow. Do not invent claims."
        } })
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
      if (responses.length) logTurnTiming("tool_response_sent", { tool:"build_tailored_pitch" })
    }
    const finishAgentTurn = ({ interrupted=false } = {}) => {
      const text = agentTextChunks.filter(Boolean).join(" ").trim()
      let handledOrderRetry = false
      if (text) {
        persistTranscript(db, demoCallId, "agent", text)
        logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"llm_response", payload:{ component:"gemini", text_length:text.length, interrupted } })
      }
      if (isOrderTaking() && text) {
        if (looksLikeOrderConfirmationQuestion(text) && orderState.status === "collecting") {
          orderState.status = "pending_confirmation"
          orderState.summary ||= orderState.callerDetails.join(", ")
        }
        const usedClosing = text.includes(messages.ending)
        if (usedClosing && orderState.status !== "confirmed") {
          console.warn("Order closing reached without confirmed state", { demoCallId, orderStatus:orderState.status })
          persistTranscript(db, demoCallId, "system", `WARNING: order closing reached with state=${orderState.status}`)
        }
        if (orderState.awaitingConfirmationTurn) {
          if (!rejectedTurnReason && containsOrderConfirmation(text, orderState.reference)) {
            orderState.awaitingConfirmationTurn = false
            orderState.confirmationPromptInjected = false
            orderState.postCompletionOffered = true
            const offer = localizedPostCompletionOffer(language)
            queueMicrotask(() => { authorizeDirectAudio("post_order_choice"); promptLiveAgent(liveSession, `[POST-ORDER CHOICE: The explicit confirmation has been spoken. Say exactly this one separate line and nothing else: "${offer}". If the caller asks how Woxza can help or wants features, use resolve_feature_context. If they decline or ask to finish, speak the configured closing.]`) })
          } else if (!interrupted && orderState.confirmationAttempts < 2) {
            orderState.confirmationPromptInjected = false
            handledOrderRetry = true
            queueMicrotask(injectOrderConfirmation)
          } else {
            console.error("Order confirmation turn missing required reference", { demoCallId, reference:orderState.reference })
            persistTranscript(db, demoCallId, "system", `WARNING: confirmation turn missing required reference ${orderState.reference}`)
          }
        }
      }
      if (isAppointmentBooking() && text && appointmentConfirmationPending) {
        if (!interrupted && !rejectedTurnReason) {
          appointmentConfirmationPending = false
          queueMicrotask(() => { authorizeDirectAudio("appointment_closing"); promptLiveAgent(liveSession, `[APPOINTMENT CLOSING TURN: The simulated appointment details have been confirmed. Say exactly this configured closing and nothing else: "${messages.ending}"]`) })
        }
      }
      if (isContextualDemo() && contextualDemo.status === "responding" && text && !interrupted && !rejectedTurnReason) {
        const result = completeContextualDemo(contextualDemo)
        if (result.ok) {
          conversation.mode = "explain"
          conversation.activeDemo = null
          queueMicrotask(() => { authorizeDirectAudio("contextual_demo_completed"); promptLiveAgent(liveSession, `[CONTEXTUAL DEMO COMPLETED: In the configured language, say that this demo is complete. Then say in one short, plain-language sentence that this was one example and Woxza can be set up to handle many other customer questions and business tasks in the same way. Then ask exactly this feedback question: "${localizedPostCompletionOffer(language)}" Do not repeat the simulated customer answer or start another demo.]`) })
        }
      }
      if (text && !scopeRedirectUsedThisTurn) scopeState.consecutive = 0
      scopeRedirectUsedThisTurn = false
      if (rejectedTurnReason && rejectedTurnReason !== "orchestrator_no_op" && !interrupted && !handledOrderRetry) {
        const reason = rejectedTurnReason
        const retry = reason === "demo_role_reversal" && roleHandoffText
          ? `[DEMO ROLE HANDOFF RETRY: Say exactly this one line in ${languageName}: "${roleHandoffText}" The caller is the customer; you represent their business. Do not add any other words.]`
          : `[OUTPUT SAFETY RETRY: Regenerate the same script step in ${languageName}. Do not include ${reason}; stay inside the selected flow.]`
        queueMicrotask(() => { authorizeDirectAudio("output_safety_retry"); promptLiveAgent(liveSession, retry) })
      }
      agentTextChunks = []
      rejectedTurnReason = null
      roleHandoffActive = false
      roleHandoffText = ""
      authorizedAudioActionId = null
      liveTurnGate.clearAction()
      audioChunkDeduplicator.clear()
      suppressNoOpOutput = false
      const completedAudioDurationMs = turnAudioDurationMs
      turnAudioDurationMs = 0
      if (openingPhase === "handshake") {
        // The atomic greeting contains the complete welcome and the first
        // discovery question. Release caller audio only after that audio has
        // reached the carrier.
        openingPhase = "complete"
        onOpeningComplete?.()
      }
      if (!interrupted) {
        const isClosing = scopeClosingPending || text.includes(messages.ending)
        onAgentTurnComplete?.({ text, isClosing, playbackDelayMs:completedAudioDurationMs + 150 })
        if (isClosing) {
          conversationFinished = true
          scopeClosingPending = false
          onClosingComplete?.({ playbackDelayMs:completedAudioDurationMs + 150 })
        }
      }
    }
    const functionDeclarations = [{
      name:"submit_turn_interpretation",
      description:"Submit exactly one canonical structured interpretation of the latest caller turn. Never use demo, pitch, yes, no, features, or explain as intent values: for a demo/pitch choice use intent change_choice plus details.choice. The backend will normalize non-standard caller wording, but you must still return the canonical schema. Never change workflow state yourself; the backend returns the only approved next action.",
      parameters:{ type:"OBJECT", properties:{
        turn_id:{ type:"NUMBER" }, expected_state_version:{ type:"NUMBER" },
        intent:{ type:"STRING", enum:["accept","decline","provide_detail","customer_request","feedback","ask_more","change_choice","stop","unclear","unrelated"] },
        clarity:{ type:"STRING", enum:["clear","unclear"] },
        details:{ type:"OBJECT", properties:{ business:{ type:"STRING" }, business_label:{ type:"STRING", description:"After discovery, create a short caller-specific label from the business plus its actual workflow, such as 'tile showroom with contractor orders' or 'hospital patient-enquiry desk'. Never invent facts." }, business_category:{ type:"STRING", enum:BUSINESS_CATEGORIES, description:"Choose the closest approved capability category from the actual workflow, not merely a business name." }, workflow_tags:{ type:"ARRAY", items:{ type:"STRING", enum:WORKFLOW_TAGS }, description:"After discovery, choose two to five approved workflow tags supported by caller facts. Do not invent tags or details." }, current_process:{ type:"STRING" }, primary_pain:{ type:"STRING" }, operating_detail:{ type:"STRING" }, request:{ type:"STRING" }, quantity:{ type:"STRING", description:"Customer's requested number of pieces, strips, cartons, units, or other order quantity during a simulated order." }, measurement:{ type:"STRING", description:"Customer's square footage, length, area, or other billing measurement. In a stock-order demo, put a pack/unit clarification such as 'cartons', 'boxes', or 'pieces' here if no number is spoken." }, choice:{ type:"STRING", enum:["demo", "pitch"] }, scenario:{ type:"STRING", enum:DEMO_SCENARIOS }, feedback:{ type:"STRING" } } }
      }, required:["turn_id","expected_state_version","intent","clarity"] }
    }, {
      name:"render_approved_action",
      description:"Required before speaking any backend-approved protected action that requests a localized render. Convert only the supplied render_contract into caller-language speech. When fixed_text is present, copy it exactly. Do not add a feature pitch, feedback, demo completion, closing, role reversal, or a different question.",
      parameters:{ type:"OBJECT", properties:{
        action_id:{ type:"STRING" }, localized_text:{ type:"STRING", description:"The full natural sentence(s) to say to the caller in the configured language. Never provide only a language name, field name, JSON, or explanation. When render_contract.fixed_text is present, copy it exactly." },
        included_fields:{ type:"ARRAY", items:{ type:"STRING", enum:["scenario_prompt", "role_handoff", "customer_prompt", "example_label", "product_answer", "quantity_question", "follow_up_answer", "next_order_question", "price", "discount", "delivery", "proceed_question", "confirmation", "order_reference", "feedback_question", "measurement_question", "total", "status", "payment_answer", "faq_answer", "next_step", "order_status", "acknowledgement", "value_question", "anything_else_question", "response_answer", "next_question", "closing"] } }
      }, required:["action_id", "localized_text", "included_fields"] }
    }, {
      name:"update_conversation_context",
      description:"Persist a caller business context only when the caller plainly names their business or industry. Never infer a business from unclear, mixed-language, or unrelated speech, and never call for greetings, small talk, or clarification.",
      parameters:{ type:"OBJECT", properties:{ business:{ type:"STRING" }, mode:{ type:"STRING", enum:["discover", "explain", "demonstrate"] } } }
    }, {
      name:"offer_demo",
      description:"Request the backend's one-time permission to gently offer a contextual business demonstration after explaining value for a known business.",
      parameters:{ type:"OBJECT", properties:{} }
    }, {
      name:"start_workflow",
      description:"Start one of the named example workflows only after the caller explicitly asks for that exact workflow. Never use this for a business-specific demonstration; use start_contextual_demo instead.",
      parameters:{ type:"OBJECT", properties:{ workflow:{ type:"STRING", enum:Object.keys(USE_CASE_CONFIG) } }, required:["workflow"] }
    }, {
      name:"start_contextual_demo",
      description:"Start a simulated customer call based on the caller's discovered business, current process, and pain. Use after the caller explicitly accepts a relevant demo but has not named a specific existing workflow.",
      parameters:{ type:"OBJECT", properties:{ topic:{ type:"STRING", description:"The caller-relevant customer need to demonstrate, such as product availability, pricing, delivery, appointment request, or follow-up." }, caller_goal:{ type:"STRING", description:"The practical outcome the caller wants to see in the simulation." } }, required:["topic"] }
    }, {
      name:"prepare_contextual_demo_response",
      description:"Required in an active contextual business demo after the caller has supplied enough detail for a useful simulated customer answer. Prepare the answer before speaking it; never promise to check later or skip straight to feedback.",
      parameters:{ type:"OBJECT", properties:{ customer_request:{ type:"STRING" }, details:{ type:"STRING" }, simulated_result:{ type:"STRING", description:"How Woxza would handle the request using the business's connected information, without inventing a real result." } }, required:["customer_request","details"] }
    }, {
      name:"resolve_action_capability",
      description:"Answer a question about a real Woxza operational action such as callback, follow-up, price/stock lookup, transfer, CRM update, or notification. This preserves the current mode and workflow.",
      parameters:{ type:"OBJECT", properties:{ action:{ type:"STRING" }, caller_question:{ type:"STRING" } }, required:["action"] }
    }, {
      name:"resolve_feature_context",
      description:"Introduce Woxza's capabilities, recommend verified features after learning the caller's business, and return additional unmentioned features when asked for more.",
      parameters:{ type:"OBJECT", properties:{
        intent:{ type:"STRING", enum:["intro", "highlight_feature", "recommend", "more_features"] },
        business_tag_candidate:{ type:"STRING", description:"Closest available business tag inferred from the caller's business." },
        caller_question:{ type:"STRING", description:"The caller's business description or feature question." }
      }, required:["intent"] }
    }, {
      name:"handle_scope_redirect",
      description:"Required for every caller request outside both the selected demo workflow and Woxza feature-capability questions. The backend tracks consecutive unrelated turns and returns localized boundary or closing copy.",
      parameters:{ type:"OBJECT", properties:{
        category:{ type:"STRING", enum:["general", "supported_demo"], description:"Use general for news, sports, weather, politics, general knowledge, and unsupported requests. Use supported_demo only for an explicit request matching another available Woxza demo." },
        target_use_case:{ type:"STRING", enum:Object.keys(USE_CASE_CONFIG), description:"Set only for category supported_demo to the matching available Woxza use case." }
      }, required:["category"] }
    }, {
      name:"build_tailored_pitch",
      description:"Build the tailored Woxza pitch after learning the caller's business plus two or three operational details. Call only after discovery is complete; never call after a greeting, a vague business description, or before learning the caller's current process and primary pain.",
      parameters:{ type:"OBJECT", properties:{
        business_description:{ type:"STRING", description:"Use the caller's own words for their business." },
        current_process:{ type:"STRING", description:"How the caller handles the relevant work today." },
        primary_pain:{ type:"STRING", description:"The main operational problem or consequence they described." },
        scale:{ type:"STRING", description:"Optional call volume, peak-time, team-size, or growth context." },
        languages:{ type:"STRING", description:"Optional customer language context." },
        handoff:{ type:"STRING", description:"Optional description of how complex calls are handled today." }
      }, required:["business_description", "current_process", "primary_pain"] }
    }]
    functionDeclarations.push({
      name:"update_order_state",
      description:"Record the complete simulated order before confirmation, then mark it confirmed after the caller explicitly affirms. Do not set_pending until restaurant or branch, exact item details, and an explicit quantity are known. For biryani, exact item details include vegetarian or non-vegetarian, plus the non-vegetarian type when applicable. Never infer a quantity from an ambiguous word such as 'too'.",
      parameters:{ type:"OBJECT", properties:{
        action:{ type:"STRING", enum:["set_pending", "confirm"] },
        summary:{ type:"STRING", description:"Complete order summary with every item, quantity, and special request." },
        restaurant:{ type:"STRING", description:"Restaurant name and branch stated by the caller." },
        item:{ type:"STRING", description:"The exact ordered dish or item." },
        variant:{ type:"STRING", description:"Required for biryani: vegetarian, chicken, mutton, or another exact variant." },
        quantity:{ type:"STRING", description:"The caller's explicit quantity. Never infer this field." },
        extras:{ type:"STRING", description:"Optional extras or special instructions." },
        total:{ type:"STRING", description:"Total price only when actually available; otherwise omit." }
      }, required:["action", "summary"] }
    })
    functionDeclarations.push({
      name:"update_booking_state",
      description:"Advance the backend-owned salon, movie, or doctor appointment demo by exactly one validated step. Call this before every appointment response after the opening.",
      parameters:{ type:"OBJECT", properties:{
        action:{ type:"STRING", enum:["set_type", "set_date", "set_time", "set_name", "confirm", "out_of_scope"] },
        appointment_type:{ type:"STRING", enum:["salon", "movie", "doctor"], description:"Required only for set_type." },
        value:{ type:"STRING", description:"The caller's exact date, time, or name for the matching set action." },
        caller_text:{ type:"STRING", description:"For confirm, copy the caller's exact confirmation words without translating or normalizing them." }
      }, required:["action"] }
    })
    // Legacy workflow tools remain in this module only for old transcript
    // compatibility. The live session exposes exactly one state-changing
    // tool, so Gemini cannot bypass the orchestrator.
    const tools = [{ functionDeclarations:functionDeclarations.filter(tool => tool.name === "submit_turn_interpretation") }]
    liveSession = await ai.live.connect({
      model:process.env.GEMINI_LIVE_MODEL || "gemini-2.5-flash-native-audio-preview-12-2025",
      config:{
        responseModalities:["AUDIO"],
        tools,
        systemInstruction:{ parts:[{ text:prompt }] },
        speechConfig:{ voiceConfig:{ prebuiltVoiceConfig:{ voiceName:process.env.GEMINI_DEMO_VOICE || "Kore" } } },
        realtimeInputConfig:{ automaticActivityDetection:{
          disabled:false,
          startOfSpeechSensitivity:"START_SENSITIVITY_HIGH",
          endOfSpeechSensitivity:"END_SENSITIVITY_LOW",
          prefixPaddingMs:100,
          silenceDurationMs:600
        } },
        inputAudioTranscription:{}, outputAudioTranscription:{}
      },
      callbacks:{
        onmessage:onLiveMessage = async message => {
          const content = message.serverContent
          const usage = message.usageMetadata || content?.usageMetadata || message.usage_metadata
          if (usage) {
            const inputTokens = Number(usage.promptTokenCount ?? usage.inputTokenCount ?? usage.input_tokens) || 0
            const outputTokens = Number(usage.responseTokenCount ?? usage.outputTokenCount ?? usage.output_tokens) || 0
            const totalTokens = Number(usage.totalTokenCount ?? usage.total_tokens) || inputTokens + outputTokens
            if (inputTokens || outputTokens || totalTokens) logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"llm_response", payload:{ component:"gemini", usage:{ input_tokens:inputTokens, output_tokens:outputTokens, total_tokens:totalTokens }, input_tokens:inputTokens, output_tokens:outputTokens, total_tokens:totalTokens } })
          }
          if (content?.interrupted) {
            authorizedAudioActionId = null
            liveTurnGate.clearAction()
            audioChunkDeduplicator.clear()
            if (pendingOrchestratorAction) {
              const pendingAction = pendingOrchestratorAction
              const actionId = pendingAction.action_id
              pendingOrchestratorAction = null
              const sessionState = await getOrchestratorSession()
              if (sessionState.pending_action?.action_id === actionId) await saveOrchestratorSession({ ...sessionState, pending_action:null })
            }
            clearTimeout(turnCompleteTimer)
            finishAgentTurn({ interrupted:true })
            onInterrupted()
            onCallerActivity?.()
          }
          const callerText = content?.inputTranscription?.text
          const agentText = content?.outputTranscription?.text
          if (callerText) {
            if (conversationFinished) return
            suppressNoOpOutput = false
            latestCallerText = String(callerText).trim()
            const currentSession = await getOrchestratorSession()
            pendingOrchestratorAction = null
            // A hello captured while the carrier was deliberately completing
            // A greeting captured while the carrier completed the full
            // welcome is acknowledgement, not a discovery answer. The
            // welcome already asked the business question, so do not repeat it.
            if (isOpeningWelcomeDelivered()
              && currentSession.stable_phase === "business_discovery"
              && !Object.keys(currentSession.business_profile || {}).length
              && isOpeningGreetingOnly(latestCallerText)) {
              persistTranscript(db, demoCallId, "caller", callerText)
              onCallerActivity?.()
              return
            }
            if (currentSession.stable_phase === "business_discovery" && Object.keys(currentSession.business_profile || {}).length && isAreYouThere(latestCallerText)) {
              const missing = ["business", "current_process", "primary_pain", "operating_detail"].find(field => !currentSession.business_profile?.[field])
              authorizeDirectAudio("presence_recovery")
              promptLiveAgent(liveSession, `[DISCOVERY PRESENCE RECOVERY: The caller is checking whether you are present. In the configured language, say one brief acknowledgement that you are here, then ask only the next missing discovery question (${missing || "operating_detail"}). Do not repeat your previous explanation or pitch.]`)
              persistTranscript(db, demoCallId, "caller", callerText)
              onCallerActivity?.()
              return
            }
            const nextSession = await saveOrchestratorSession({ ...currentSession, turn_id:currentSession.turn_id + 1, pending_action:null })
            promptLiveAgent(liveSession, `[ORCHESTRATOR TURN: Before speaking, call submit_turn_interpretation exactly once with turn_id=${nextSession.turn_id}, expected_state_version=${nextSession.state_version}, the caller's contextual intent, clarity, and only plainly stated details. Do not use any other flow-changing tool for this caller turn.]`)
            responseStartedAt = Date.now()
            modelTextSeen = false
            modelAudioSeen = false
            onTurnTiming?.("caller_transcription_received", { textLength:latestCallerText.length })
            logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"turn_start", payload:{ speaker:"caller" } })
            logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"stt_result", payload:{ provider:"gemini", text_length:latestCallerText.length } })
            if (isAppointmentBooking()) appointmentToolRequired = true
            persistTranscript(db, demoCallId, "caller", callerText)
            onCallerActivity?.()
            if (openingChoicePending) {
              const numericChoice = resolveNumericOpeningChoice(callerText)
              if (numericChoice) {
                openingChoicePending = false
                const instruction = numericChoice === "demo"
                  ? "The caller selected the demo. Ask what kind of customer conversation they want to see. Do not start a named workflow until they describe it."
                  : "The caller selected the business explanation. Give two short, plain-language sentences about how Woxza helps, then ask what business they run."
                authorizeDirectAudio("numeric_opening_choice")
                promptLiveAgent(liveSession, `[OPENING NUMERIC CHOICE: ${instruction}]`)
                return
              }
            }
            if (!callerRequestedEnd && isConversationEndRequest(callerText)) {
              callerRequestedEnd = true
              persistTranscript(db, demoCallId, "system", "Caller requested to end the conversation")
              onConversationEndRequested?.()
              return
            }
            if (isOrderTaking()) {
              if (orderState.status !== "confirmed" && isOrderCorrection(callerText)) {
                orderState.status = "collecting"
                orderState.summary = ""
                orderState.total = ""
                orderState.callerDetails = []
                orderState.awaitingConfirmationTurn = false
                orderState.confirmationPromptInjected = false
                persistTranscript(db, demoCallId, "system", "Caller corrected the order; discarded the unconfirmed order state")
                authorizeDirectAudio("order_correction")
                promptLiveAgent(liveSession, "[CALLER CORRECTION: Discard every previously inferred or unconfirmed item immediately. Do not repeat, confirm, price, or substitute any earlier product. In the configured language, ask the caller to repeat the exact product name and quantity. If the name is unfamiliar or sounds like a medicine, preserve the caller's words exactly and ask for clarification; never turn it into a different familiar product.]")
                return
              }
              if (orderState.status === "confirmed" && isPostOrderActionQuestion(callerText)) {
                const response = localizedPostOrderActionCapability(language)
                persistTranscript(db, demoCallId, "system", "Caller asked whether Woxza can perform a post-order callback or follow-up action")
                authorizeDirectAudio("post_order_capability")
                promptLiveAgent(liveSession, `[REAL WOXZA ACTION CAPABILITY: Say exactly this and nothing else: "${response}" Do not say that a callback, price check, or follow-up was scheduled.]`)
                return
              }
              if (orderState.status === "pending_confirmation" && isOrderAffirmative(callerText)) injectOrderConfirmation()
              else if (orderState.status === "collecting" && !isOrderAffirmative(callerText)) orderState.callerDetails.push(String(callerText).trim())
            }
            if (isEscalationRequest(callerText)) requestEscalation({ demoCallId, text:callerText })
          }
          if (message.toolCall?.functionCalls) {
            logTurnTiming("tool_call_received")
            const calls = message.toolCall.functionCalls
            for (const toolCall of calls) {
              logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"tool_call", payload:{ tool_name:toolCall.name, arguments:toolCall.args || toolCall.arguments || {}, tool_call_id:toolCall.id || null } })
            }
            if (calls.some(toolCall => toolCall.name === "submit_turn_interpretation")) {
              await sendOrchestratorToolResponse(calls)
              return
            }
            if (calls.some(toolCall => toolCall.name === "render_approved_action")) {
              sendApprovedActionRenderToolResponse(calls)
              return
            }
            sendOrderToolResponse(calls)
            sendAppointmentToolResponse(calls)
            sendConversationToolResponse(calls)
            sendScopeToolResponse(calls)
            void sendTailoredPitchToolResponse(calls).catch(error => {
              console.error("Tailored pitch tool failed", { demoCallId, error:error.message })
            })
            void sendFeatureToolResponse(calls).catch(error => {
              console.error("Feature context tool failed", { demoCallId, error:error.message })
            })
          }
          if (agentText) {
            if (!modelTextSeen) {
              modelTextSeen = true
              logTurnTiming("first_model_text_received")
            }
            if (!rejectedTurnReason) agentTextChunks.push(String(agentText).trim())
            const fullText = agentTextChunks.filter(Boolean).join(" ")
            const unsafePhrase = findUnsafeOutput(fullText, language)
            const roleReversal = roleHandoffActive ? findDemoRoleReversal(fullText, language) : null
            const mergedClosing = ((isOrderTaking() && orderState.awaitingConfirmationTurn) || (isAppointmentBooking() && appointmentConfirmationPending)) && fullText.includes(messages.ending)
            const missingAppointmentTransition = isAppointmentBooking() && appointmentToolRequired
            if (!rejectedTurnReason && (unsafePhrase || roleReversal || mergedClosing || missingAppointmentTransition)) {
              rejectedTurnReason = unsafePhrase || roleReversal || (mergedClosing ? "the demo closing in a confirmation turn" : "speech before the required backend appointment transition")
              console.warn("Gemini output turn rejected", { demoCallId, reason:rejectedTurnReason })
              persistTranscript(db, demoCallId, "system", `Output turn rejected: ${rejectedTurnReason}`)
              onOutputBlocked?.()
              streamingGuard.interrupt()
            }
          }
          const audio = []
          for (const part of content?.modelTurn?.parts || []) {
            if (part.inlineData?.data && socket.readyState === 1 && !rejectedTurnReason && !(isAppointmentBooking() && appointmentToolRequired)) {
              const pcm24 = Buffer.from(part.inlineData.data, "base64")
              turnAudioDurationMs += pcm24.length / 48
              onAgentActivity?.(pcm24.length / 48)
              audio.push(pcm24)
            }
          }
          if (audio.length && !modelAudioSeen) {
            modelAudioSeen = true
            logTurnTiming("first_model_audio_received")
          }
          const guardResult = streamingGuard.push({ text:rejectedTurnReason ? "" : agentText, audio, turnComplete:Boolean(content?.turnComplete) })
          if (guardResult.blocked && !rejectedTurnReason) {
            rejectedTurnReason = guardResult.matchedPhrase
          }
          if (content?.turnComplete) {
            logTurnTiming("model_turn_complete")
            clearTimeout(turnCompleteTimer)
            // Gemini Live can deliver its final transcription just after the
            // turnComplete marker. A short state-only delay keeps the final
            // words/reference attached to the correct turn without delaying
            // audio, which has already been forwarded to the carrier.
            turnCompleteTimer = setTimeout(() => finishAgentTurn(), 150)
            turnCompleteTimer.unref?.()
          }
        },
        onerror(error) {
          callerTranscriptBuffer.stop()
          clearTimeout(turnCompleteTimer)
          console.error("Gemini Live demo bridge error", { demoCallId, ...describeGeminiLiveError(error) })
          logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"error", severity:"error", payload:{ message:error.message, exception_type:error.name, stack_trace:error.stack || null, component:"llm", response_payload:describeGeminiLiveError(error) } })
          // A Live API transport error is terminal for this call. Propagate it
          // to the provider-specific lifecycle owner without waiting for the
          // remote close callback, which is not guaranteed after a fault.
          onClosed?.(error)
        },
        onclose(event) {
          callerTranscriptBuffer.stop()
          clearTimeout(turnCompleteTimer)
          console.warn("Gemini Live demo bridge closed", { demoCallId, code:event?.code, reason:event?.reason || "no reason supplied" })
          logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"gemini_reconnect", severity:"warning", payload:{ reason:event?.reason || "closed", underlying_exception:event?.code || null } })
          onClosed?.(event)
        }
      }
    })
    return liveSession
  })
}

export async function openGeminiSessionWithRetry(args, {
  openSession=openGeminiSession,
  maxAttempts=3,
  timeoutMs=7_000,
  retryDelayMs,
  onAttemptFailure=({ demoCallId, attempt, error }) => console.warn("Gemini Live connection attempt failed", { demoCallId, attempt, ...describeGeminiLiveError(error) })
} = {}) {
  let lastError
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let active = true
    let connected = false
    let candidateSession
    let rejectEarlyFailure
    let timeoutTimer
    const earlyFailure = new Promise((_, reject) => { rejectEarlyFailure = reject })
    const timeout = new Promise((_, reject) => {
      timeoutTimer = setTimeout(() => reject(new Error(`Gemini Live session was not ready within ${timeoutMs}ms`)), timeoutMs)
      timeoutTimer.unref?.()
    })
    const pending = Promise.resolve().then(() => openSession({
      ...args,
      onClosed:event => {
        if (!active) return
        if (connected) args.onClosed?.(event)
        else {
          const error = new Error("Gemini Live transport closed before session ready")
          error.closeEvent = event
          rejectEarlyFailure(error)
        }
      }
    }))
    void pending.then(session => {
      candidateSession = session
      if (!active) {
        try { session?.close() } catch {}
      }
    }, () => {})
    try {
      const session = await Promise.race([pending, earlyFailure, timeout])
      clearTimeout(timeoutTimer)
      connected = true
      return session
    } catch (error) {
      clearTimeout(timeoutTimer)
      active = false
      lastError = error
      try { candidateSession?.close() } catch {}
      onAttemptFailure({ demoCallId:args.demoCallId, attempt, error })
      logCallEvent(args.db, { callId:args.demoCallId, eventType:"gemini_reconnect", severity:"warning", payload:{ reason:error.message, underlying_exception:error.name, retry_attempt:attempt } })
      const delay = retryDelayMs === undefined ? geminiCapacityRetryDelay(attempt - 1) : retryDelayMs
      if (attempt < maxAttempts && delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw lastError || new Error("Gemini Live session failed before it became ready")
}

export function createCallerSilenceMonitor({ timeoutMs=25_000, schedule=setTimeout, cancel=clearTimeout, now=Date.now, onReprompt, onTimeout }) {
  let timer
  let silenceCount = 0
  let agentPlaybackUntil = 0
  let started = false
  const arm = () => {
    if (!started) return
    cancel(timer)
    timer = schedule(() => {
      silenceCount += 1
      if (silenceCount >= 2) {
        timer = undefined
        onTimeout()
        return
      }
      onReprompt({ silenceDurationMs:timeoutMs })
      arm()
    }, timeoutMs + Math.max(0, agentPlaybackUntil - now()))
    timer?.unref?.()
  }
  return {
    start() {
      started = true
      arm()
    },
    noteCallerActivity() {
      silenceCount = 0
      agentPlaybackUntil = now()
      arm()
    },
    // Gemini can emit turnComplete before its final transcription/audio
    // chunks and can deliver audio faster than the carrier plays it. Include
    // queued playback duration so agent speaking time never consumes the
    // caller's silence window.
    noteAgentActivity(audioDurationMs=0) {
      agentPlaybackUntil = Math.max(now(), agentPlaybackUntil) + audioDurationMs
      arm()
    },
    stop() {
      started = false
      cancel(timer)
      timer = undefined
    }
  }
}

export function attachDemoGeminiBridge(server, { db, redis=null }) {
  const orchestratorStore = createOrchestratorStore({ redis })
  const plivoWss = new WebSocketServer({ noServer:true })
  const twilioWss = new WebSocketServer({ noServer:true })
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost")
    const wss = url.pathname === "/telephony/plivo/stream" ? plivoWss : url.pathname === "/ws/twilio" ? twilioWss : null
    if (!wss) return
    wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, url))
  })

  plivoWss.on("connection", async (socket, url) => {
    const demoCallId = url.searchParams.get("demoCallId")
    const language = url.searchParams.get("lang") || "en"
    if (!demoCallId || !LANGUAGES.has(language)) return socket.close(1008, "Unknown demo call or language")
    let call
    try { call = await findDemoCall(db, demoCallId) } catch (error) { console.error("Plivo demo bridge lookup failed", error) }
    if (!call) return socket.close(1008, "Demo call not found or expired")
    let closed = false
    let session
    let capacityRetryTimer
    let capacityRetries = 0
    let reconnectingGemini = false
    let openLiveSession
    let closingTimer
    let callerFarewellTimer
    let openingController
    let firstAudioSent = false
    let inboundMediaFrames = 0
    let inboundMediaBytes = 0
    let inboundSpeechFrames = 0
    let openingComplete = false
    let atomicOpeningPlaying = true
    let openingWelcomeDelivered = false
    let openingCompletionTimer
    let openingAudiblePlaybackUntil = 0
    const openingSpeechBuffer = createSpeechSegmentBuffer()
    let acceptingCallerAudio = true
    let agentResponding = false
    let closingDispatched = false
    let callerRequestedEnd = false
    const callMessages = { ...getCallMessages({ useCase:call.use_case, language, businessName:process.env.DEMO_BUSINESS_NAME, companyName:process.env.DEMO_COMPANY_NAME }), ending:localizedDemoEnding(language) }
    const timing = { streamConnectedAt:Date.now(), answeredAt:call.answered_at ? new Date(call.answered_at).getTime() : null }
    const logTiming = (event, extra = {}) => console.info("voice-call-timing", { demoCallId, event, elapsedFromAnswerMs:timing.answeredAt ? Date.now() - timing.answeredAt : null, elapsedFromStreamMs:Date.now() - timing.streamConnectedAt, ...extra })
    // Keep provider operations in one small adapter. This makes interruption
    // clearing synchronous with Gemini's interrupted signal.
    const plivoStream = {
      clearAudio() {
        if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ event:"clearAudio" }))
      },
      playAudio(muLaw8k) {
        if (socket.readyState !== socket.OPEN) return
        socket.send(JSON.stringify({
          event:"playAudio",
          media:{ contentType:"audio/x-mulaw", sampleRate:8000, payload:muLaw8k.toString("base64") }
        }))
      },
      close() {
        if (socket.readyState === socket.OPEN) socket.close(1000, "Woxza demo complete")
      }
    }
    const callerSpeechDetector = createPcmSpeechDetector()
    // Match stable main: Plivo owns its playback buffer, so each Gemini audio
    // chunk is forwarded immediately. The JS pacing queue caused gaps under
    // real call load.
    const audioWriter = {
      push(value) {
        if (!value?.length) return
        if (!firstAudioSent) {
          firstAudioSent = true
          logTiming("first_ai_audio_sent")
          logCallEvent(db, { callId:demoCallId, demoCallId, eventType:"tts_start", payload:{ provider:"gemini" } })
        }
        plivoStream.playAudio(value)
      },
      flush() {},
      clear() {},
      close() {}
    }
    const writeTelemetry = async (endReason, durationSeconds) => {
      try {
        await db.query(
          `UPDATE demo_calls
           SET status='completed', end_reason=COALESCE(end_reason,$2),
               call_duration_seconds=COALESCE(call_duration_seconds,$3),
               ended_at=COALESCE(ended_at,NOW()), updated_at=NOW()
           WHERE id=$1`,
          [demoCallId, endReason, durationSeconds]
        )
      } catch (error) {
        console.error("Plivo demo bridge telemetry write failed", { demoCallId, error:error.message })
      }
    }
    const close = (endReason="caller_hangup", durationSeconds=null) => {
      if (closed) return
      closed = true
      clearTimeout(closingTimer)
      clearTimeout(callerFarewellTimer)
      clearTimeout(openingCompletionTimer)
      openingController?.stop()
      clearTimeout(capacityRetryTimer)
      console.info("voice-call-media-summary", { demoCallId, inboundMediaFrames, inboundMediaBytes, inboundSpeechFrames })
      silenceMonitor.stop()
      audioWriter.close()
      try { session?.close() } catch (error) { console.warn("Gemini Live close failed", { demoCallId, error:error.message }) }
      void writeTelemetry(endReason, durationSeconds)
      plivoStream.close()
    }
    const silenceMonitor = createCallerSilenceMonitor({
      onReprompt:({ silenceDurationMs }) => {
        const spokenReprompt = SILENCE_REPROMPTS[language] || SILENCE_REPROMPTS.en
        promptLiveAgent(session, `[SILENCE RE-PROMPT: Say exactly this one line and nothing else: "${spokenReprompt}"]`)
        persistTranscript(db, demoCallId, "system", `Silence re-prompt triggered after ${silenceDurationMs}ms; requested_text=${spokenReprompt}`)
      },
      onTimeout:() => {
        persistTranscript(db, demoCallId, "system", "Call ended after two caller-silence timeouts")
        promptLiveAgent(session, "[The caller has been silent twice. Politely say goodbye now using the configured ending.]")
        setTimeout(() => close("silence_timeout"), 3_000).unref()
      }
    })
    const markOpeningComplete = () => {
      if (openingComplete) return
      openingComplete = true
      silenceMonitor.start()
      logTiming("opening_completed")
    }
    const releaseQueuedOpeningAudio = () => {
      if (closed) return
      openingWelcomeDelivered = true
      const frames = openingSpeechBuffer.drain().flat()
      for (const pcm16k of frames) {
        session?.sendRealtimeInput({ audio:{ data:pcm16k.toString("base64"), mimeType:"audio/pcm;rate=16000" } })
      }
    }
    const reconnectAfterCapacityClose = event => {
      if (closed || reconnectingGemini) return
      if (!isGeminiCapacityClose(event)) return close("gemini_closed")
      if (capacityRetries >= GEMINI_CAPACITY_MAX_RETRIES) {
        console.error("Gemini Live capacity retries exhausted", { demoCallId, retries:capacityRetries })
        return close("gemini_capacity_exhausted")
      }
      const retry = capacityRetries++
      const delay = geminiCapacityRetryDelay(retry)
      reconnectingGemini = true
      session = undefined
      console.warn("Gemini Live capacity limit reached; reconnecting with backoff", { demoCallId, retry:retry + 1, delayMs:Math.round(delay) })
      capacityRetryTimer = setTimeout(async () => {
        if (closed) return
        try {
          session = await openLiveSession(openingComplete)
          reconnectingGemini = false
          logTiming("gemini_session_reconnected", { retry:retry + 1 })
        } catch (error) {
          reconnectingGemini = false
          console.warn("Gemini Live capacity reconnect failed", { demoCallId, retry:retry + 1, error:error.message })
          reconnectAfterCapacityClose({ code:1011, reason:error.message || "capacity reconnect failed" })
        }
      }, delay)
      capacityRetryTimer.unref?.()
    }
    const scheduleCompletedClose = playbackDelayMs => {
      acceptingCallerAudio = false
      silenceMonitor.stop()
      clearTimeout(closingTimer)
      closingTimer = setTimeout(() => close(callerRequestedEnd ? "caller_requested_end" : "completed_flow"), playbackDelayMs)
      closingTimer.unref?.()
    }
    const dispatchClosing = reason => {
      if (closed || closingDispatched || !session) return
      closingDispatched = true
      if (reason === "caller requested to end conversation") callerRequestedEnd = true
      acceptingCallerAudio = false
      silenceMonitor.stop()
      persistTranscript(db, demoCallId, "system", `Configured closing dispatched: ${reason}`)
      promptLiveAgent(session, `[CLOSING REQUIRED: Say exactly this configured ending and nothing else: "${callMessages.ending}"]`)
      if (callerRequestedEnd) {
        // A farewell should be polite but must never strand the caller on an
        // open line if the model does not complete its short closing turn.
        callerFarewellTimer = setTimeout(() => close("caller_requested_end"), 10_000)
        callerFarewellTimer.unref?.()
      }
    }
    socket.on("close", () => close("caller_hangup"))
    openLiveSession = openingAlreadyHandled => openGeminiSessionWithRetry({
      socket, call, language, demoCallId, db, orchestratorStore,
      onOpeningAudioStart:() => openingController?.markGreetingAudioStarted(),
      isOpeningWelcomeDelivered:() => openingWelcomeDelivered,
      openingAlreadyHandled,
        onAudio:(pcm24, { opening=false, audible=false } = {}) => {
          // Gemini emits signed 16-bit, 24 kHz little-endian PCM. Plivo
          // recommends native telephony G.711 μ-law at 8 kHz for reliable
          // bidirectional agent playback.
          const muLaw8k = pcmToMuLaw(resamplePcm(pcm24, 24000, 8000))
          if (opening && audible) {
            const now = Date.now()
            openingAudiblePlaybackUntil = Math.max(openingAudiblePlaybackUntil, now) + (muLaw8k.length / 8)
          }
          audioWriter.push(muLaw8k)
        },
        onOutputBlocked:() => { audioWriter.clear(); plivoStream.clearAudio() },
        onInterrupted:() => { audioWriter.clear(); plivoStream.clearAudio() },
        onCallerActivity:() => silenceMonitor.noteCallerActivity(),
        // Thank the caller once, then end the carrier call. If a closing is
        // already being played, do not generate another one.
        onConversationEndRequested:() => closingDispatched ? close("caller_requested_end") : dispatchClosing("caller requested to end conversation"),
        onAgentActivity:audioDurationMs => { agentResponding = true; silenceMonitor.noteAgentActivity(audioDurationMs) },
        onOpeningComplete:() => {
          clearTimeout(openingCompletionTimer)
          const playbackDelayMs = Math.max(0, openingAudiblePlaybackUntil - Date.now()) + 150
          openingCompletionTimer = setTimeout(() => openingController?.completeGreeting(), playbackDelayMs)
          openingCompletionTimer.unref?.()
        },
        onAgentTurnComplete:({ isClosing, playbackDelayMs } = {}) => {
          audioWriter.flush()
          agentResponding = false
          if (openingComplete) silenceMonitor.noteAgentActivity()
          if (isClosing) return scheduleCompletedClose(playbackDelayMs || 1_000)
          if (closingDispatched) {
            return promptLiveAgent(session, `[CLOSING REQUIRED: Say exactly this configured ending and nothing else: "${callMessages.ending}"]`)
          }
        },
        onClosingComplete:({ playbackDelayMs }) => {
          closingDispatched = true
          scheduleCompletedClose(playbackDelayMs)
        },
        onTurnTiming:(event, extra) => logTiming(event, extra),
        onClosed:reconnectAfterCapacityClose
      })
    try {
      // The carrier-owned atomic greeting below is the opening. Giving Gemini
      // this fact prevents the legacy full-welcome prompt from being emitted
      // again when the caller says hello during or just after that greeting.
      session = await openLiveSession(true)
      if (closed) {
        try { session.close() } catch {}
        return
      }
      socket.on("message", raw => {
        try {
          const event = JSON.parse(raw.toString())
          if (event.event === "stop") return close()
          if (event.event === "media" && event.media?.payload) {
            if (!acceptingCallerAudio) return
            const streamContentType = process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000"
            const l16ByteOrder = process.env.PLIVO_L16_BYTE_ORDER || "little"
            const rawAudio = Buffer.from(event.media.payload, "base64")
            inboundMediaFrames += 1
            inboundMediaBytes += rawAudio.length
            if (inboundMediaFrames === 1) console.info("voice-call-timing", { demoCallId, event:"first_plivo_media_received", bytes:rawAudio.length, codec:streamContentType, l16ByteOrder })
            const pcm16k = decodePlivoInboundAudio(event.media.payload, streamContentType, l16ByteOrder)
            if (callerSpeechDetector.push(pcm16k)) {
              inboundSpeechFrames += 1
              if (inboundSpeechFrames === 1) console.info("voice-call-timing", { demoCallId, event:"first_plivo_speech_detected" })
              silenceMonitor.noteCallerActivity()
              openingController?.noteCallerSpeech()
                  // Do not cut an active workflow short just because the caller
                  // is still talking during the wrap-up window.
            }
            if (atomicOpeningPlaying) {
              openingSpeechBuffer.push(pcm16k)
              return
            }
            if (!session) return
            session.sendRealtimeInput({ audio:{ data:pcm16k.toString("base64"), mimeType:"audio/pcm;rate=16000" } })
          }
        } catch (error) { console.warn("Invalid Plivo demo stream event", { demoCallId, error:error.message }) }
      })
      logTiming("gemini_session_ready")
      openingController = createOpeningController({
        atomicGreetingMs:30_000,
        onCallerFirst:() => logTiming("caller_spoke_during_atomic_opening"),
        onWoxzaFirst:() => {
          if (closed || !session) return
          promptLiveAgent(session, `[OPENING REQUIRED: Say exactly: ‘${localizedCompleteOpening(language)}’ Then stop. Do not add a second sentence.]`)
          logTiming("opening_turn_dispatched")
        },
        onGreetingComplete:({ source } = {}) => {
          // Change the gate before flushing. The loop is synchronous, so all
          // queued 20 ms frames reach Gemini in their original order before a
          // newly arriving live frame can be sent.
          atomicOpeningPlaying = false
          markOpeningComplete()
          logTiming("opening_input_released", { source, queuedFrames:openingSpeechBuffer.frameCount })
          releaseQueuedOpeningAudio()
        }
      })
      openingController.start()
      console.info("Gemini Live Plivo demo bridge connected", { demoCallId, language })
    } catch (error) { console.error("Gemini Live Plivo bridge setup failed", { demoCallId, error:error.message }); close() }
  })

  twilioWss.on("connection", async (socket, url) => {
    // Twilio sends custom TwiML <Parameter> values in the `start` event, not
    // in the WebSocket URL. The query fallback supports local diagnostics.
    let demoCallId = url.searchParams.get("demoCallId")
    let language = url.searchParams.get("lang") || "en"
    let call
    let closed = false
    let streamSid = null
    let session
    let starting = false
    let assistantSpeaking = false
    let openingComplete = false
    let acceptingCallerAudio = true
    let closingTimer
    let callerFarewellTimer
    let agentResponding = false
    let closingDispatched = false
    let callMessages
    const queuedAudio = []
    const close = () => { if (!closed) { closed=true; clearTimeout(closingTimer); clearTimeout(callerFarewellTimer); try { session?.close() } catch {}; try { socket.close() } catch {} } }
    const scheduleCompletedClose = playbackDelayMs => {
      acceptingCallerAudio = false
      clearTimeout(closingTimer)
      closingTimer = setTimeout(close, playbackDelayMs)
      closingTimer.unref?.()
    }
    const dispatchClosing = (callerFarewell=false) => {
      if (closed || closingDispatched || !session || !callMessages) return
      closingDispatched = true
      acceptingCallerAudio = false
      promptLiveAgent(session, `[CLOSING REQUIRED: Say exactly this configured ending and nothing else: "${callMessages.ending}"]`)
      if (callerFarewell) {
        callerFarewellTimer = setTimeout(close, 10_000)
        callerFarewellTimer.unref?.()
      }
    }
    const forwardAudio = payload => {
      if (!acceptingCallerAudio) return
      if (!session) return queuedAudio.length < 25 && queuedAudio.push(payload)
      if (assistantSpeaking && streamSid) {
        assistantSpeaking = false
        socket.send(JSON.stringify({ event:"clear", streamSid }))
      }
      const pcm16k = resamplePcm(muLawToPcm(Buffer.from(payload, "base64")), 8000, 16000)
      session.sendRealtimeInput({ audio:{ data:pcm16k.toString("base64"), mimeType:"audio/pcm;rate=16000" } })
    }
    const begin = async event => {
      if (starting || session) return
      starting = true
      streamSid = event.start?.streamSid || event.streamSid || null
      const parameters = event.start?.customParameters || {}
      demoCallId = parameters.demoCallId || demoCallId
      language = parameters.lang || language
      if (!demoCallId || !LANGUAGES.has(language)) return close()
      try { call = await findDemoCall(db, demoCallId) } catch (error) { console.error("Twilio demo bridge lookup failed", error) }
      if (!call) return close()
      callMessages = { ...getCallMessages({ useCase:call.use_case, language, businessName:process.env.DEMO_BUSINESS_NAME, companyName:process.env.DEMO_COMPANY_NAME }), ending:localizedDemoEnding(language) }
      try {
        session = await openGeminiSessionWithRetry({
          socket, call, language, demoCallId, db, orchestratorStore,
          onAudio:pcm24 => {
            if (!streamSid || socket.readyState !== 1) return
            const mulaw = pcmToMuLaw(resamplePcm(pcm24, 24000, 8000))
            assistantSpeaking = true
            socket.send(JSON.stringify({ event:"media", streamSid, media:{ payload:mulaw.toString("base64") } }))
          },
          onOutputBlocked:() => { if (streamSid && socket.readyState === 1) socket.send(JSON.stringify({ event:"clear", streamSid })) },
          onInterrupted:() => { if (streamSid) socket.send(JSON.stringify({ event:"clear", streamSid })) },
          onCallerActivity:() => {},
          onConversationEndRequested:() => closingDispatched ? close() : dispatchClosing(true),
          onAgentActivity:() => { agentResponding = true },
          onOpeningComplete:() => { openingComplete = true },
          onAgentTurnComplete:({ isClosing, playbackDelayMs } = {}) => {
            agentResponding = false
            if (isClosing) return scheduleCompletedClose(playbackDelayMs || 1_000)
            if (closingDispatched) {
              return promptLiveAgent(session, `[CLOSING REQUIRED: Say exactly this configured ending and nothing else: "${callMessages.ending}"]`)
            }
          },
          onClosingComplete:({ playbackDelayMs }) => {
            closingDispatched = true
            scheduleCompletedClose(playbackDelayMs)
          },
          onTurnTiming:(event, extra) => console.info("voice-turn-timing", { demoCallId, event, ...extra }),
          onClosed:() => close()
        })
        for (const payload of queuedAudio.splice(0)) forwardAudio(payload)
        promptLiveAgent(session, `[OPENING REQUIRED: Say exactly: ‘${localizedInitialWelcome(language)}’ Then wait for the caller.]`)
        console.info("Gemini Live Twilio demo bridge connected", { demoCallId, language })
      } catch (error) { console.error("Gemini Live Twilio bridge setup failed", { demoCallId, error:error.message }); close() }
    }
    const startTimeout = setTimeout(() => close(), 10_000)
    socket.on("message", raw => {
      try {
        const event = JSON.parse(raw.toString())
        if (event.event === "start") { clearTimeout(startTimeout); void begin(event); return }
        if (event.event === "stop") return close()
        if (event.event === "media" && event.media?.payload) forwardAudio(event.media.payload)
      } catch (error) { console.warn("Invalid Twilio demo stream event", { demoCallId, error:error.message }) }
    })
    socket.on("close", () => { clearTimeout(startTimeout); close() })
  })
  return { plivoWss, twilioWss }
}
