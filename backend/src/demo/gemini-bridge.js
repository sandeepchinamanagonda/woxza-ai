import { GoogleGenAI } from "@google/genai"
import { WebSocketServer } from "ws"
import { buildDemoPrompt, LANGUAGES, LOCALIZED_DEMO_NAMES, USE_CASE_CONFIG, localizedPostCompletionOffer, localizedRedirect, localizedScopeBoundary } from "./prompt.js"
import { getCallMessages } from "./messages.js"
import { createPcmSpeechDetector, resamplePcm } from "./audio-codec.js"
import { createStreamingOutputSafetyGuard, findUnsafeOutput } from "./output-guardrail.js"
import { getFeaturePrompts, logFeatureMention, resolveFeatureContext } from "../features.js"
import { createAppointmentBookingState, transitionAppointmentBooking } from "./appointment-state.js"

const EXPIRY_MINUTES = 10
export const WRAP_UP_MODE_MS = 90_000
export const FORCE_CLOSING_MS = 105_000
export const HARD_CUTOFF_MS = 120_000
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

// Carriers play G.711 most reliably as steady 20 ms frames. Gemini's audio
// chunks arrive at uneven sizes and intervals, so hold only 60 ms at startup
// and pace the carrier frames without introducing the former one-second lag.
export function createPacedMuLawWriter({ onFrame, frameMs=20, startupMs=60, schedule=setTimeout, cancel=clearTimeout }) {
  const frameBytes = Math.max(1, Math.round(8 * frameMs))
  const startupBytes = Math.max(frameBytes, Math.round(8 * startupMs))
  let queued = Buffer.alloc(0)
  let timer
  let closed = false
  const tick = () => {
    timer = undefined
    if (closed || queued.length < frameBytes) return
    const frame = queued.subarray(0, frameBytes)
    queued = queued.subarray(frameBytes)
    onFrame(frame)
    timer = schedule(tick, frameMs)
    timer?.unref?.()
  }
  const start = force => {
    if (closed || timer || (!force && queued.length < startupBytes) || queued.length < frameBytes) return
    tick()
  }
  return {
    push(value) {
      if (closed || !value?.length) return
      queued = queued.length ? Buffer.concat([queued, value]) : Buffer.from(value)
      start(false)
    },
    flush() {
      if (closed || !queued.length) return
      const remainder = queued.length % frameBytes
      if (remainder) queued = Buffer.concat([queued, Buffer.alloc(frameBytes - remainder, 0xff)])
      start(true)
    },
    clear() {
      cancel(timer)
      timer = undefined
      queued = Buffer.alloc(0)
    },
    close() {
      closed = true
      cancel(timer)
      timer = undefined
      queued = Buffer.alloc(0)
    }
  }
}

async function findDemoCall(db, demoCallId) {
  const result = await db.query(
    `SELECT id,use_case,name,language,answered_at FROM demo_calls
     WHERE id=$1 AND created_at >= NOW() - INTERVAL '${EXPIRY_MINUTES} minutes' AND status IN ('ringing','connected')`,
    [demoCallId]
  )
  return result.rows[0] || null
}

function persistTranscript(db, demoCallId, speaker, text) {
  const value = String(text || "").trim()
  if (!value) return
  void db.query("INSERT INTO call_transcript_turns (demo_call_id,speaker,text) VALUES ($1,$2,$3)", [demoCallId, speaker, value])
    .catch(error => console.warn("Transcript persistence failed", { demoCallId, error:error.message }))
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
  return /(?:\b(?:bye(?:\s+bye)?|good\s*bye|good night|see you(?: later)?|talk to you later|that'?s all|that is all|nothing else|nothing more(?!\s+than)|no (?:thanks|thank you),?\s*(?:that'?s all|nothing (?:else|more)|i'?m done)|i(?: am|'m) (?:done|finished)|end (?:the )?(?:call|conversation)|hang up|disconnect (?:the )?(?:call|conversation))\b|अलविदा|बाय\b|बस इतना|यही है|धन्यवाद,?\s*बस|వీడ్కోలు|బై\b|ఇంతే|చాలు|ధన్యవాదాలు,?\s*చాలు|adiós|hasta luego|eso es todo|nada más|gracias,?\s*(?:eso es todo|nada más)|விடைபெறுகிறேன்|பை\b|அவ்வளவுதான்|போதும்|ವಿದಾಯ|ಬೈ\b|ಅಷ್ಟೇ|ಸಾಕು|വിട|ബൈ\b|അത്ര മതി|മതി|निरोप|बाय\b|इतकेच|बस झाले|અલવિદા|બાય\b|બસ એટલું|થૅન્ક યુ,?\s*બસ|বিদায়|বাই\b|এই পর্যন্ত|আর কিছু নেই|ਅਲવિદા|ਬਾਇ\b|ਬਸ ਇੰਨਾ|الوداع|بائے\b|بس اتنا)/iu.test(value)
}

function openGeminiSession({ socket, call, language, demoCallId, db, onAudio, onOutputBlocked, onInterrupted, onClosed, onCallerActivity, onConversationEndRequested, onAgentActivity, onOpeningComplete, onAgentTurnComplete, onClosingComplete, onTurnTiming, openingAlreadyHandled=false }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini is not configured")
  const messages = getCallMessages({ useCase:call.use_case, language, businessName:process.env.DEMO_BUSINESS_NAME, companyName:process.env.DEMO_COMPANY_NAME })
  return getFeaturePrompts(db)
    .then(featurePrompts => buildDemoPrompt({ name:call.name, useCase:call.use_case, language, featurePrompts, openingAlreadyHandled, ...messages }))
    .then(async prompt => {
    const ai = new GoogleGenAI({ apiKey:process.env.GEMINI_API_KEY })
    let liveSession
    let openingPending = !openingAlreadyHandled
    const isOrderTaking = call.use_case === "order_taking"
    const isAppointmentBooking = call.use_case === "appointment_booking"
    const orderState = createDemoOrderState(demoCallId)
    const appointmentState = createAppointmentBookingState()
    const featureState = { businessTag:"", mentionedIds:new Set() }
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
    const languageName = LANGUAGES.get(language) || "English"
    const logTurnTiming = (event, extra={}) => {
      if (!responseStartedAt) return
      onTurnTiming?.(event, { elapsedFromCallerTranscriptionMs:Date.now() - responseStartedAt, ...extra })
    }
    const streamingGuard = createStreamingOutputSafetyGuard({
      useCase:call.use_case,
      language,
      callId:demoCallId,
      safeFallback:USE_CASE_CONFIG[call.use_case]?.safeFallback || "Please tell me how I can help.",
      holdMs:120,
      onAudio,
      onAllowedTurn:() => {},
      onClear:() => onOutputBlocked?.(),
      onRegenerate:() => {},
      onFallback:() => {},
      onExhausted:() => {},
      onTrigger:event => console.warn("Gemini streaming output blocked", event)
    })
    const injectOrderConfirmation = () => {
      if (!isOrderTaking || orderState.confirmationPromptInjected) return
      orderState.status = "confirmed"
      orderState.awaitingConfirmationTurn = true
      orderState.confirmationPromptInjected = true
      orderState.confirmationAttempts += 1
      const total = orderState.total ? ` Total: ${orderState.total}.` : " Do not invent a total because pricing is unavailable."
      promptLiveAgent(liveSession, `[ORDER CONFIRMATION TURN REQUIRED: Speak one distinct confirmation turn now in ${languageName}, using native script and the required formal register. Clearly say the order is confirmed, read this COMPLETE order summary: ${orderState.summary || orderState.callerDetails.join(", ")}.${total} Say the order reference exactly as ${orderState.reference}. Do not say the demo closing or thank the caller yet.]`)
    }
    const sendOrderToolResponse = calls => {
      if (!isOrderTaking) return
      const responses = []
      for (const toolCall of calls || []) {
        if (toolCall.name !== "update_order_state") continue
        const args = toolCall.args || toolCall.arguments || {}
        if (args.summary) orderState.summary = String(args.summary).trim()
        if (args.total) orderState.total = String(args.total).trim()
        if (args.action === "set_pending") {
          orderState.status = "pending_confirmation"
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ status:orderState.status, summary:orderState.summary, total:orderState.total || null, reference:orderState.reference, instruction:"Read back the complete order now, then ask for confirmation. Do not close." } })
        } else if (args.action === "confirm") {
          orderState.status = "confirmed"
          orderState.awaitingConfirmationTurn = true
          responses.push({ id:toolCall.id, name:toolCall.name, response:{ status:orderState.status, summary:orderState.summary, total:orderState.total || null, reference:orderState.reference, instruction:"Speak only the explicit confirmation, complete summary, available total, and reference. Do not include the closing." } })
        }
      }
      if (responses.length) liveSession?.sendToolResponse({ functionResponses:responses })
    }
    const sendAppointmentToolResponse = calls => {
      if (!isAppointmentBooking) return
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
        if (isAppointmentBooking) appointmentToolRequired = false
        const args = toolCall.args || toolCall.arguments || {}
        const intent = args.intent || "recommend"
        if (intent === "highlight_feature") {
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            intent,
            feature:{ title:"AI phone agent that talks to customers in real time", description:"A natural voice agent that handles customer conversations as they happen.", status:"live" },
            instruction:"Answer in the configured language with one concise sentence. Do not say this is your personal preference. Say this is a particularly useful Woxza feature and explain its practical benefit. Do not ask a follow-up question."
          } })
          continue
        }
        if (intent === "intro") {
          const prompts = await getFeaturePrompts(db)
          responses.push({ id:toolCall.id, name:toolCall.name, response:{
            intent,
            introduction:prompts.feature_intro_pitch || "Woxza answers calls and makes calls on behalf of a business.",
            instruction:"Give this introduction briefly, then ask what kind of business the caller runs. Do not list features yet."
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
        if (isAppointmentBooking) appointmentToolRequired = false
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
    const finishAgentTurn = ({ interrupted=false } = {}) => {
      const text = agentTextChunks.filter(Boolean).join(" ").trim()
      let handledOrderRetry = false
      if (text) persistTranscript(db, demoCallId, "agent", text)
      if (isOrderTaking && text) {
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
            queueMicrotask(() => promptLiveAgent(liveSession, `[POST-ORDER CHOICE: The explicit confirmation has been spoken. Say exactly this one separate line and nothing else: "${offer}". If the caller asks how Woxza can help or wants features, use resolve_feature_context. If they decline or ask to finish, speak the configured closing.]`))
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
      if (isAppointmentBooking && text && appointmentConfirmationPending) {
        if (!interrupted && !rejectedTurnReason) {
          appointmentConfirmationPending = false
          queueMicrotask(() => promptLiveAgent(liveSession, `[APPOINTMENT CLOSING TURN: The simulated appointment details have been confirmed. Say exactly this configured closing and nothing else: "${messages.ending}"]`))
        }
      }
      if (text && !scopeRedirectUsedThisTurn) scopeState.consecutive = 0
      scopeRedirectUsedThisTurn = false
      if (rejectedTurnReason && !interrupted && !handledOrderRetry) {
        const reason = rejectedTurnReason
        queueMicrotask(() => promptLiveAgent(liveSession, `[OUTPUT SAFETY RETRY: Regenerate the same script step in ${languageName}. Do not include ${reason}; stay inside the selected flow.]`))
      }
      agentTextChunks = []
      rejectedTurnReason = null
      const completedAudioDurationMs = turnAudioDurationMs
      turnAudioDurationMs = 0
      if (openingPending) {
        openingPending = false
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
    }]
    if (isOrderTaking) functionDeclarations.push({
      name:"update_order_state",
      description:"Record the complete simulated order before confirmation, then mark it confirmed after the caller explicitly affirms.",
      parameters:{ type:"OBJECT", properties:{
        action:{ type:"STRING", enum:["set_pending", "confirm"] },
        summary:{ type:"STRING", description:"Complete order summary with every item, quantity, and special request." },
        total:{ type:"STRING", description:"Total price only when actually available; otherwise omit." }
      }, required:["action", "summary"] }
    })
    if (isAppointmentBooking) functionDeclarations.push({
      name:"update_booking_state",
      description:"Advance the backend-owned salon, movie, or doctor appointment demo by exactly one validated step. Call this before every appointment response after the opening.",
      parameters:{ type:"OBJECT", properties:{
        action:{ type:"STRING", enum:["set_type", "set_date", "set_time", "set_name", "confirm", "out_of_scope"] },
        appointment_type:{ type:"STRING", enum:["salon", "movie", "doctor"], description:"Required only for set_type." },
        value:{ type:"STRING", description:"The caller's exact date, time, or name for the matching set action." },
        caller_text:{ type:"STRING", description:"For confirm, copy the caller's exact confirmation words without translating or normalizing them." }
      }, required:["action"] }
    })
    const tools = [{ functionDeclarations }]
    liveSession = await ai.live.connect({
      model:process.env.GEMINI_LIVE_MODEL || "gemini-2.5-flash",
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
        onmessage(message) {
          const content = message.serverContent
          if (content?.interrupted) {
            clearTimeout(turnCompleteTimer)
            finishAgentTurn({ interrupted:true })
            onInterrupted()
            onCallerActivity?.()
          }
          const callerText = content?.inputTranscription?.text
          const agentText = content?.outputTranscription?.text
          if (callerText) {
            if (conversationFinished) return
            latestCallerText = String(callerText).trim()
            responseStartedAt = Date.now()
            modelTextSeen = false
            modelAudioSeen = false
            onTurnTiming?.("caller_transcription_received", { textLength:latestCallerText.length })
            if (isAppointmentBooking) appointmentToolRequired = true
            persistTranscript(db, demoCallId, "caller", callerText)
            onCallerActivity?.()
            if (!callerRequestedEnd && isConversationEndRequest(callerText)) {
              callerRequestedEnd = true
              persistTranscript(db, demoCallId, "system", "Caller requested to end the conversation")
              onConversationEndRequested?.()
              return
            }
            if (isOrderTaking) {
              if (orderState.status === "pending_confirmation" && isOrderAffirmative(callerText)) injectOrderConfirmation()
              else if (orderState.status === "collecting" && !isOrderAffirmative(callerText)) orderState.callerDetails.push(String(callerText).trim())
            }
            if (isEscalationRequest(callerText)) requestEscalation({ demoCallId, text:callerText })
          }
          if (message.toolCall?.functionCalls) {
            logTurnTiming("tool_call_received")
            sendOrderToolResponse(message.toolCall.functionCalls)
            sendAppointmentToolResponse(message.toolCall.functionCalls)
            sendScopeToolResponse(message.toolCall.functionCalls)
            void sendFeatureToolResponse(message.toolCall.functionCalls).catch(error => {
              console.error("Feature context tool failed", { demoCallId, error:error.message })
            })
          }
          if (agentText) {
            if (!modelTextSeen) {
              modelTextSeen = true
              logTurnTiming("first_model_text_received")
            }
            agentTextChunks.push(String(agentText).trim())
            const fullText = agentTextChunks.filter(Boolean).join(" ")
            const unsafePhrase = findUnsafeOutput(fullText, language)
            const mergedClosing = ((isOrderTaking && orderState.awaitingConfirmationTurn) || (isAppointmentBooking && appointmentConfirmationPending)) && fullText.includes(messages.ending)
            const missingAppointmentTransition = isAppointmentBooking && appointmentToolRequired
            if (!rejectedTurnReason && (unsafePhrase || mergedClosing || missingAppointmentTransition)) {
              rejectedTurnReason = unsafePhrase || (mergedClosing ? "the demo closing in a confirmation turn" : "speech before the required backend appointment transition")
              console.warn("Gemini output turn rejected", { demoCallId, reason:rejectedTurnReason })
              persistTranscript(db, demoCallId, "system", `Output turn rejected: ${rejectedTurnReason}`)
              onOutputBlocked?.()
              streamingGuard.interrupt()
            }
          }
          const audio = []
          for (const part of content?.modelTurn?.parts || []) {
            if (part.inlineData?.data && socket.readyState === 1 && !rejectedTurnReason && !(isAppointmentBooking && appointmentToolRequired)) {
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
          const guardResult = streamingGuard.push({ text:agentText, audio, turnComplete:Boolean(content?.turnComplete) })
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
          clearTimeout(turnCompleteTimer)
          console.error("Gemini Live demo bridge error", { demoCallId, ...describeGeminiLiveError(error) })
          // A Live API transport error is terminal for this call. Propagate it
          // to the provider-specific lifecycle owner without waiting for the
          // remote close callback, which is not guaranteed after a fault.
          onClosed?.()
        },
        onclose(event) {
          clearTimeout(turnCompleteTimer)
          console.warn("Gemini Live demo bridge closed", { demoCallId, code:event?.code, reason:event?.reason || "no reason supplied" })
          onClosed?.()
        }
      }
    })
    return liveSession
  })
}

export async function openGeminiSessionWithRetry(args, {
  openSession=openGeminiSession,
  maxAttempts=2,
  timeoutMs=7_000,
  retryDelayMs=250,
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
      onClosed:() => {
        if (!active) return
        if (connected) args.onClosed?.()
        else rejectEarlyFailure(new Error("Gemini Live transport closed before session ready"))
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
      if (attempt < maxAttempts && retryDelayMs > 0) await new Promise(resolve => setTimeout(resolve, retryDelayMs))
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

export function attachDemoGeminiBridge(server, { db }) {
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
    let wrapUpTimer
    let forceClosingTimer
    let terminationTimer
    let closingTimer
    let callerFarewellTimer
    let firstAudioSent = false
    let openingComplete = false
    let acceptingCallerAudio = true
    let wrapUpMode = false
    let closeAfterNextAgentTurn = false
    let agentResponding = false
    let closingDispatched = false
    let callerRequestedEnd = false
    const callMessages = getCallMessages({ useCase:call.use_case, language, businessName:process.env.DEMO_BUSINESS_NAME, companyName:process.env.DEMO_COMPANY_NAME })
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
    // Plivo already buffers playAudio payloads. Forward each generated chunk
    // directly so JavaScript timer jitter cannot create carrier underruns.
    const audioWriter = {
      push(value) {
        if (!value?.length) return
        if (!firstAudioSent) { firstAudioSent = true; logTiming("first_ai_audio_sent") }
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
      clearTimeout(wrapUpTimer)
      clearTimeout(forceClosingTimer)
      clearTimeout(terminationTimer)
      clearTimeout(closingTimer)
      clearTimeout(callerFarewellTimer)
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
    // Start the clocks from the active Plivo connection, not from Gemini's
    // asynchronous connection completion.
    wrapUpTimer = setTimeout(() => {
      wrapUpMode = true
      persistTranscript(db, demoCallId, "system", "Wrap-up mode entered at 90 seconds")
    }, WRAP_UP_MODE_MS)
    wrapUpTimer.unref()
    forceClosingTimer = setTimeout(() => {
      closeAfterNextAgentTurn = true
      acceptingCallerAudio = false
      silenceMonitor.stop()
      if (!agentResponding) dispatchClosing("105-second deadline")
    }, FORCE_CLOSING_MS)
    forceClosingTimer.unref()
    terminationTimer = setTimeout(() => close("hard_cutoff", 120), HARD_CUTOFF_MS)
    terminationTimer.unref()
    socket.on("close", () => close("caller_hangup"))
    try {
      session = await openGeminiSessionWithRetry({
        socket, call, language, demoCallId, db,
        onAudio:pcm24 => {
          // Gemini emits signed 16-bit, 24 kHz little-endian PCM. Plivo
          // recommends native telephony G.711 μ-law at 8 kHz for reliable
          // bidirectional agent playback.
          const muLaw8k = pcmToMuLaw(resamplePcm(pcm24, 24000, 8000))
          audioWriter.push(muLaw8k)
        },
        onOutputBlocked:() => { audioWriter.clear(); plivoStream.clearAudio() },
        onInterrupted:() => { audioWriter.clear(); plivoStream.clearAudio() },
        onCallerActivity:() => silenceMonitor.noteCallerActivity(),
        // Thank the caller once, then end the carrier call. If a closing is
        // already being played, do not generate another one.
        onConversationEndRequested:() => closingDispatched ? close("caller_requested_end") : dispatchClosing("caller requested to end conversation"),
        onAgentActivity:audioDurationMs => { agentResponding = true; silenceMonitor.noteAgentActivity(audioDurationMs) },
        onOpeningComplete:markOpeningComplete,
        onAgentTurnComplete:({ isClosing, playbackDelayMs } = {}) => {
          audioWriter.flush()
          agentResponding = false
          if (openingComplete) silenceMonitor.noteAgentActivity()
          if (isClosing) return scheduleCompletedClose(playbackDelayMs || 1_000)
          if (closingDispatched) {
            return promptLiveAgent(session, `[CLOSING REQUIRED: Say exactly this configured ending and nothing else: "${callMessages.ending}"]`)
          }
          if (closeAfterNextAgentTurn) dispatchClosing("post-90-second response completed")
        },
        onClosingComplete:({ playbackDelayMs }) => {
          closingDispatched = true
          clearTimeout(wrapUpTimer)
          clearTimeout(forceClosingTimer)
          scheduleCompletedClose(playbackDelayMs)
        },
        onTurnTiming:(event, extra) => logTiming(event, extra),
        onClosed:() => close("gemini_closed")
      })
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
            // Plivo delivers media frames continuously, including silence. Do
            // not treat every frame as a caller interruption: Gemini's VAD
            // emits `interrupted` only when it detects real caller speech.
            // Likewise, caller activity is recorded from transcription rather
            // than from carrier silence frames.
            const pcm8k = muLawToPcm(Buffer.from(event.media.payload, "base64"))
            if (callerSpeechDetector.push(pcm8k)) {
              silenceMonitor.noteCallerActivity()
              if (wrapUpMode) closeAfterNextAgentTurn = true
            }
            const pcm16k = resamplePcm(pcm8k, 8000, 16000)
            session.sendRealtimeInput({ audio:{ data:pcm16k.toString("base64"), mimeType:"audio/pcm;rate=16000" } })
          }
        } catch (error) { console.warn("Invalid Plivo demo stream event", { demoCallId, error:error.message }) }
      })
      logTiming("gemini_session_ready")
      promptLiveAgent(session, "Start the demo now. Speak the configured OPENING greeting exactly, then wait for the caller.")
      logTiming("opening_turn_dispatched")
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
    let wrapUpTimer
    let forceClosingTimer
    let terminationTimer
    let wrapUpMode = false
    let closeAfterNextAgentTurn = false
    let agentResponding = false
    let closingDispatched = false
    let callMessages
    const queuedAudio = []
    const close = () => { if (!closed) { closed=true; clearTimeout(closingTimer); clearTimeout(callerFarewellTimer); clearTimeout(wrapUpTimer); clearTimeout(forceClosingTimer); clearTimeout(terminationTimer); try { session?.close() } catch {}; try { socket.close() } catch {} } }
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
      callMessages = getCallMessages({ useCase:call.use_case, language, businessName:process.env.DEMO_BUSINESS_NAME, companyName:process.env.DEMO_COMPANY_NAME })
      wrapUpTimer = setTimeout(() => { wrapUpMode = true }, WRAP_UP_MODE_MS)
      wrapUpTimer.unref?.()
      forceClosingTimer = setTimeout(() => {
        closeAfterNextAgentTurn = true
        acceptingCallerAudio = false
        if (!agentResponding) dispatchClosing()
      }, FORCE_CLOSING_MS)
      forceClosingTimer.unref?.()
      terminationTimer = setTimeout(close, HARD_CUTOFF_MS)
      terminationTimer.unref?.()
      try {
        session = await openGeminiSessionWithRetry({
          socket, call, language, demoCallId, db,
          onAudio:pcm24 => {
            if (!streamSid || socket.readyState !== 1) return
            const mulaw = pcmToMuLaw(resamplePcm(pcm24, 24000, 8000))
            assistantSpeaking = true
            socket.send(JSON.stringify({ event:"media", streamSid, media:{ payload:mulaw.toString("base64") } }))
          },
          onOutputBlocked:() => { if (streamSid && socket.readyState === 1) socket.send(JSON.stringify({ event:"clear", streamSid })) },
          onInterrupted:() => { if (streamSid) socket.send(JSON.stringify({ event:"clear", streamSid })) },
          onCallerActivity:() => { if (wrapUpMode) closeAfterNextAgentTurn = true },
          onConversationEndRequested:() => closingDispatched ? close() : dispatchClosing(true),
          onAgentActivity:() => { agentResponding = true },
          onOpeningComplete:() => { openingComplete = true },
          onAgentTurnComplete:({ isClosing, playbackDelayMs } = {}) => {
            agentResponding = false
            if (isClosing) return scheduleCompletedClose(playbackDelayMs || 1_000)
            if (closingDispatched) {
              return promptLiveAgent(session, `[CLOSING REQUIRED: Say exactly this configured ending and nothing else: "${callMessages.ending}"]`)
            }
            if (closeAfterNextAgentTurn) dispatchClosing()
          },
          onClosingComplete:({ playbackDelayMs }) => {
            closingDispatched = true
            scheduleCompletedClose(playbackDelayMs)
          },
          onTurnTiming:(event, extra) => console.info("voice-turn-timing", { demoCallId, event, ...extra }),
          onClosed:() => close()
        })
        for (const payload of queuedAudio.splice(0)) forwardAudio(payload)
        promptLiveAgent(session, "Start the demo now. Speak the configured OPENING greeting exactly, then wait for the caller.")
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
