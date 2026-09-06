import { WebSocketServer } from "ws"
import { decodePlivoInboundAudio } from "./gemini-bridge.js"
import { LANGUAGES } from "./prompt.js"
import { woxzaLanguageFromSarvamCode } from "./sarvam-api.js"
import { createSarvamRealtimeStt, createSarvamStreamingTts } from "./sarvam-realtime.js"
import { createIndicTts } from "./indic-tts.js"
import { createSarvamConversation } from "./sarvam-conversation.js"
import { createOpenAiConversation } from "./openai-conversation.js"
import { createAnthropicConversation } from "./anthropic-conversation.js"
import { createGeminiConversation } from "./gemini-conversation.js"
import { createProsodyPhraseBuffer, createWordBoundaryBuffer } from "./phrase-buffer.js"
import { shapePhoneResponse } from "./phone-response-shaper.js"
import { logCallEvent } from "../call-events.js"
import { persistCallCost } from "../call-costs.js"
import { createTranscriptWriter } from "../transcript-writer.js"
import { createCallerTurnController } from "./caller-turn-controller.js"
import { assessCallerPartial, assessCallerTurn } from "./turn-quality-policy.js"
import { callerFirstPresencePrompt, configuredCallStartPolicy } from "./call-start-policy.js"
import { createPlaybackEchoDetector } from "./playback-echo-detector.js"
import { configuredLanguageSwitchPolicy, createLanguageSwitchController, languageSwitchQuestion } from "./language-switch-policy.js"
import { configuredOpeningDeliveryPolicy } from "./opening-delivery-policy.js"
import { createConversationTurnStore } from "./conversation-turn-store.js"
import { configuredStreamResumePolicy } from "./stream-resume-policy.js"
import { agentFirstGreeting } from "./call-start-messages.js"
import { createTurnInterpreter } from "./turn-interpreter.js"
import { deriveConversationObjective, emptyConversationProfile, mergeConversationProfile, profileCoverage } from "./conversation-profile.js"
import { getCapabilityCatalog, getConversationIntentCatalog } from "./capability-catalog.js"
import { applySemanticPitchIntent, consumePostPitchOffer, emptyPitchIntent, pitchReplySnapshot, recordPitchReply } from "./conversation-pitch-state.js"
import { hasVerifiedValueRequest } from "./value-intent-evidence.js"
import { randomUUID } from "node:crypto"

const findCall = async (db, id) => (await db.query("SELECT id,language FROM demo_calls WHERE id=$1 AND status IN ('ringing','connected')", [id])).rows[0]

// V3 is deliberately separate from V2. Set VOICE_PIPELINE=v3 to opt in;
// changing it back to v2 restores the previous bridge without a code rollback.
const configuredBrainProvider = () => (process.env.V3_BRAIN_PROVIDER || "sarvam").toLowerCase()
export const configuredTtsProvider = (env=process.env) => String(env.V3_TTS_PROVIDER || "sarvam").trim().toLowerCase() === "indic" ? "indic" : "sarvam"
const configuredTts = () => configuredTtsProvider() === "indic" ? createIndicTts() : createSarvamStreamingTts()
const configuredBrain = () => {
  const provider = configuredBrainProvider()
  if (provider === "openai") return createOpenAiConversation()
  if (provider === "anthropic") return createAnthropicConversation()
  if (provider === "gemini") return createGeminiConversation()
  return createSarvamConversation()
}
const configuredBrainModel = provider => provider === "openai" ? (process.env.V3_OPENAI_MODEL || "gpt-4.1-mini") : provider === "anthropic" ? (process.env.V3_ANTHROPIC_MODEL || "claude-sonnet-4-6") : provider === "gemini" ? (process.env.V3_GEMINI_MODEL || "gemini-2.5-flash") : (process.env.SARVAM_CHAT_MODEL || "sarvam-105b-conversations")
const tokenNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0
const normalizedUsage = (provider, usage={}) => {
  if (provider === "gemini") {
    const inputTokens = tokenNumber(usage.promptTokenCount)
    const cachedInputTokens = Math.min(inputTokens, tokenNumber(usage.cachedContentTokenCount))
    const visibleOutputTokens = tokenNumber(usage.candidatesTokenCount)
    const thinkingTokens = tokenNumber(usage.thoughtsTokenCount)
    return { inputTokens, cachedInputTokens, outputTokens:visibleOutputTokens + thinkingTokens, visibleOutputTokens, thinkingTokens, totalTokens:inputTokens + visibleOutputTokens + thinkingTokens }
  }
  if (provider === "anthropic") {
    const inputTokens = tokenNumber(usage.input_tokens)
    const outputTokens = tokenNumber(usage.output_tokens)
    return { inputTokens, cachedInputTokens:tokenNumber(usage.cache_read_input_tokens), outputTokens, visibleOutputTokens:outputTokens, thinkingTokens:0, totalTokens:inputTokens + outputTokens }
  }
  const inputTokens = tokenNumber(usage.prompt_tokens)
  const outputTokens = tokenNumber(usage.completion_tokens)
  return { inputTokens, cachedInputTokens:tokenNumber(usage.cached_input_tokens), outputTokens, visibleOutputTokens:outputTokens, thinkingTokens:0, totalTokens:tokenNumber(usage.total_tokens) || inputTokens + outputTokens }
}
const geminiCostUsd = usage => {
  const inputPerMillion = tokenNumber(process.env.V3_GEMINI_INPUT_USD_PER_MILLION || "0.30")
  const cachedInputPerMillion = tokenNumber(process.env.V3_GEMINI_CACHED_INPUT_USD_PER_MILLION || "0.03")
  const outputPerMillion = tokenNumber(process.env.V3_GEMINI_OUTPUT_USD_PER_MILLION || "2.50")
  const cachedInputTokens = Math.min(usage.inputTokens, usage.cachedInputTokens || 0)
  return Number((((usage.inputTokens - cachedInputTokens) * inputPerMillion + cachedInputTokens * cachedInputPerMillion + usage.outputTokens * outputPerMillion) / 1_000_000).toFixed(8))
}
const configuredTtsChunker = () => String(process.env.V3_TTS_CHUNKER || "legacy").trim().toLowerCase() === "prosody" ? "prosody" : "legacy"
// Flash completes the short phone reply only milliseconds after its first
// sentence. Sending that reply as one utterance prevents audible joins between
// separately synthesized WebSocket text frames. Phrase delivery remains
// available for a controlled rollback or future latency experiments.
const configuredTtsDeliveryMode = () => String(process.env.V3_TTS_DELIVERY_MODE || "turn").trim().toLowerCase() === "phrase" ? "phrase" : "turn"
// Woxza owns this buffer. It decides what complete thought is safe to speak;
// Sarvam's independent `min_buffer_size` merely controls its socket internals.
// Legacy variables are preserved as fallbacks for one-step rollback safety.
export const configuredWoxzaPhraseBuffer = (env=process.env) => ({
  minimumCharacters:Number(env.V3_WOXZA_PHRASE_MIN_CHARS || env.V3_TTS_PHRASE_MIN_CHARS || env.V3_TTS_MIN_BUFFER_CHARS || "60"),
  maximumCharacters:Number(env.V3_WOXZA_PHRASE_MAX_CHARS || env.V3_TTS_PHRASE_MAX_CHARS || "140"),
  maxWaitMs:Number(env.V3_WOXZA_PHRASE_MAX_WAIT_MS || env.V3_TTS_PHRASE_MAX_WAIT_MS || "0")
})
const maximumSpokenCharacters = () => Number(process.env.V3_PHONE_REPLY_MAX_CHARS || "240")
const maximumPitchCharacters = () => Number(process.env.V3_PHONE_PITCH_MAX_CHARS || "480")
const inboundSampleRate = () => Number(String(process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000").match(/rate=(\d+)/i)?.[1] || 16_000)
const createTtsPlayback = values => {
  let resolveCompletion
  const completion = new Promise(resolve => { resolveCompletion = resolve })
  return { ...values, firstAudioSent:false, settled:false, completion, resolveCompletion }
}
const settleTtsPlayback = (playback, outcome) => {
  if (!playback || playback.settled) return
  playback.settled = true
  playback.onComplete?.({ ...outcome, firstAudioSent:playback.firstAudioSent })
  playback.resolveCompletion?.({ ...outcome, firstAudioSent:playback.firstAudioSent })
}
export const configuredTurnControl = (env=process.env) => {
  const value = String(env.V3_TURN_CONTROL || "provider").trim().toLowerCase()
  return ["provider", "shadow", "bridge", "hybrid"].includes(value) ? value : "provider"
}
export const configuredTurnControlSettings = (env=process.env) => ({
  startFrames:Math.max(1, Number(env.V3_TURN_START_FRAMES || "2")),
  endSilenceMs:Math.max(250, Number(env.V3_TURN_ENDPOINT_SILENCE_MS || "750")),
  preRollFrames:Math.max(0, Number(env.V3_TURN_PRE_ROLL_FRAMES || "10"))
})

export function attachDemoV3StreamingBridge(server, { db, stt=createSarvamRealtimeStt(), tts=configuredTts(), sarvamTts=createSarvamStreamingTts(), brain=configuredBrain(), turnInterpreter=process.env.GEMINI_API_KEY ? createTurnInterpreter() : null }={}) {
  const wss = new WebSocketServer({ noServer:true })
  const capabilityCatalogs = new Map()
  let conversationIntentCatalog
  const capabilityCatalogFor = language => {
    const code = String(language || "en").trim().toLowerCase() || "en"
    if (!capabilityCatalogs.has(code)) capabilityCatalogs.set(code, getCapabilityCatalog(code).catch(error => {
      console.warn("Could not load V3 capability catalog", { language:code, error:error.message })
      return []
    }))
    return capabilityCatalogs.get(code)
  }
  const conversationIntents = () => {
    if (!conversationIntentCatalog) conversationIntentCatalog = getConversationIntentCatalog().catch(error => {
      console.warn("Could not load V3 conversation intent catalog", { error:error.message })
      return []
    })
    return conversationIntentCatalog
  }
  // Process-local ownership prevents two simultaneous media sockets from
  // speaking for one call. PostgreSQL remains the source of truth for the
  // completed-turn history that is restored on reconnect or process restart.
  const streamLeases = new Map()
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost")
    if (url.pathname !== "/telephony/plivo/v3/stream") return
    wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, url))
  })
  wss.on("connection", async (socket, url) => {
    const demoCallId = url.searchParams.get("demoCallId"), requestedLanguage = url.searchParams.get("lang") || "en"
    if (!demoCallId || !LANGUAGES.has(requestedLanguage) || !stt || !tts || !brain) return socket.close(1011, "V3 providers are not configured")
    if (!await findCall(db, demoCallId).catch(() => null)) return socket.close(1008, "Unknown demo call")
    const resumePolicy = configuredStreamResumePolicy()
    const previousLease = streamLeases.get(demoCallId)
    if (previousLease?.active) return socket.close(1013, "Demo call already has an active media stream")
    const withinResumeWindow = Boolean(resumePolicy.enabled && previousLease?.expiresAt > Date.now())
    const connectionId = randomUUID()
    if (previousLease?.expiryTimer) clearTimeout(previousLease.expiryTimer)
    streamLeases.set(demoCallId, { connectionId, active:true, expiresAt:0 })
    const conversationTurns = createConversationTurnStore({ db })
    let restoredTurns = []
    if (withinResumeWindow) {
      try {
        restoredTurns = await conversationTurns.loadLatestCompletedTurns({ demoCallId, limit:resumePolicy.historyTurns })
      } catch (error) {
        streamLeases.delete(demoCallId)
        return socket.close(1011, "Unable to restore demo call")
      }
    }
    let closed = false, epoch = 0, activeTurn, ttsSession, ttsLanguage, ttsOpening, ttsConnectionId = 0, ttsPlayback
    const turnControl = configuredTurnControl()
    const turnControlSettings = configuredTurnControlSettings()
    const callStart = configuredCallStartPolicy()
    const openingDeliveryPolicy = configuredOpeningDeliveryPolicy()
    const pendingManualUtterances = []
    const echoDetector = createPlaybackEchoDetector({ sampleRate:inboundSampleRate() })
    const candidateEcho = new Map()
    const restoredPolicy = restoredTurns.at(-1)?.language_policy || {}
    const restoredLanguage = restoredPolicy.active_language || restoredTurns.at(-1)?.language || requestedLanguage
    const languageSwitch = createLanguageSwitchController({ selectedLanguage:requestedLanguage, activeLanguage:withinResumeWindow ? restoredLanguage : null, mode:configuredLanguageSwitchPolicy() })
    // This stays false until Plivo has actually received the first greeting
    // audio frame. A TTS socket opening is not evidence that a caller heard it.
    const history = restoredTurns.flatMap(turn => [{ role:"user", content:turn.caller_text }, { role:"assistant", content:turn.agent_text }])
    const restoredProfile = restoredTurns.at(-1)?.conversation_profile || emptyConversationProfile()
    const restoredPitchIntent = restoredTurns.at(-1)?.conversation_intent || {}
    const conversationState = {
      profile:restoredProfile,
      discoveryQuestions:restoredTurns.filter(turn => /[?？]$/u.test(String(turn.agent_text || "").trim())).length,
      explanationDelivered:restoredTurns.some(turn => turn.conversation_objective === "tailored_explanation"),
      pitchIntent:{ ...emptyPitchIntent(), id:String(restoredPitchIntent.id || ""), status:String(restoredPitchIntent.status || "none"), missingFacts:Array.isArray(restoredPitchIntent.missingFacts) ? restoredPitchIntent.missingFacts : [], candidateCapabilityIds:Array.isArray(restoredPitchIntent.candidateCapabilityIds) ? restoredPitchIntent.candidateCapabilityIds : [], followUpQuestions:Number(restoredPitchIntent.followUpQuestions) || 0, maximumFollowUpQuestions:Number(restoredPitchIntent.maximumFollowUpQuestions) || 2, delivered:Boolean(restoredPitchIntent.delivered), nextStepOffered:Boolean(restoredPitchIntent.nextStepOffered) },
      discoveryCompleteReady:Boolean(restoredPitchIntent.discoveryCompleteReady),
      discoveryCompleteOffered:Boolean(restoredPitchIntent.discoveryCompleteOffered)
    }
    let profileUpdateQueue = Promise.resolve()
    const memory = {
      opening_delivered:withinResumeWindow,
      pitch_intent:structuredClone(conversationState.pitchIntent),
      call_start_mode:withinResumeWindow ? "resumed" : (callStart.speakFirst ? "agent_first" : "caller_first"),
      language_policy:languageSwitch.snapshot(),
      conversation_profile:conversationState.profile,
      conversation_objective:deriveConversationObjective(conversationState),
      discovery_complete:{ ready:conversationState.discoveryCompleteReady, awaiting_caller_choice:false },
      turns:restoredTurns.map(turn => ({ turn:turn.turn_sequence, caller:turn.caller_text, agent:turn.agent_text }))
    }
    let firstCallerTurnSeen = withinResumeWindow, callerFirstTimer, completedTurnSequence = restoredTurns.at(-1)?.turn_sequence || 0
    let openingDelivery, openingDeliveryTimer, openingDeliverySequence = 0
    const callUsage = { inputTokens:0, cachedInputTokens:0, outputTokens:0, visibleOutputTokens:0, thinkingTokens:0, totalTokens:0, estimatedGeminiCostUsd:0, sttAudioSeconds:0, ttsCharacters:0, ttsProvider:tts.provider || (configuredTtsProvider() === "indic" ? "ai4bharat-indic-tts" : "sarvam-bulbul-streaming"), llmProvider:configuredBrainProvider(), llmModel:configuredBrainModel(configuredBrainProvider()) }
    const log = (eventType, payload={}, latencyMs=null) => logCallEvent(db, { callId:demoCallId, demoCallId, eventType, payload:{ pipeline:"v3-streaming", ...payload }, latencyMs })
    const transcripts = createTranscriptWriter({ db, demoCallId, onError:(error, turn) => log("error", { component:"transcript", message:error.message, speaker:turn.speaker }) })
    const recordTtsUsage = (sentText, source, session) => {
      const characters = [...String(sentText || "")].length
      if (!characters) return
      callUsage.ttsCharacters += characters
      log("tts_usage", {
        source, characters, call_tts_characters:callUsage.ttsCharacters,
        tts_voice:session?.speaker || null, tts_pace:session?.pace ?? null,
        tts_temperature:session?.temperature ?? null, tts_language:session?.language || ttsLanguage || null
      })
    }
    const updateConversationProfile = ({ callerText, language }) => {
      if (!turnInterpreter) return Promise.resolve(null)
      // The interpreter is intentionally asynchronous and serialized. It is
      // ready for the next caller turn, without adding an extra model round
      // trip before the current reply can begin streaming.
      profileUpdateQueue = profileUpdateQueue.then(async () => {
        const [catalog, intents] = await Promise.all([capabilityCatalogFor(language), conversationIntents()])
        const capabilityIndex = catalog.map(item => ({
          id:item.id, title:item.title, claim:item.callerSafeClaim, impact:item.callerImpact,
          availability:item.availability, requirements:item.requirements
        }))
        const factsPromise = turnInterpreter.interpret({
          turn:{ authoritative_text:callerText }, phase:memory.conversation_objective,
          businessProfile:conversationState.profile, language
        })
        const valueIntentPromise = typeof turnInterpreter.interpretValueIntent === "function"
          ? turnInterpreter.interpretValueIntent({ callerText, businessProfile:conversationState.profile, language, recentHistory:history, isAlreadyActive:conversationState.pitchIntent.id === "explore_woxza_value", capabilityIndex })
          : Promise.resolve(null)
        const [interpreted, valueIntent] = await Promise.all([factsPromise, valueIntentPromise])
        if (interpreted.raw?.clarity !== "complete") return
        conversationState.profile = mergeConversationProfile(conversationState.profile, interpreted.raw?.details || {})
        const routing = valueIntent?.raw || {}
        const validNewRequest = hasVerifiedValueRequest(routing, history)
        const coverage = profileCoverage(conversationState.profile)
        // A classifier can identify an explicit request immediately, but only
        // the backend may promote it to a pitch after caller-stated context is
        // actually present. This prevents an under-specified first-turn query
        // from being treated as a ready tailored explanation.
        const backendReady = coverage.readyForTailoredPitch
        const semantic = validNewRequest ? {
          id:"explore_woxza_value", status:backendReady ? routing.status : "collecting_context",
          missing_facts:routing.missing_facts, candidate_capability_ids:routing.candidate_capability_ids
        } : conversationState.pitchIntent.id === "explore_woxza_value" ? {
          id:"explore_woxza_value", status:backendReady ? routing.status : "collecting_context",
          missing_facts:routing.missing_facts, candidate_capability_ids:routing.candidate_capability_ids
        } : {}
        conversationState.pitchIntent = applySemanticPitchIntent({ previous:conversationState.pitchIntent, semantic, intents, catalog })
        // A completed discovery is an invitation point, not permission to
        // pitch. It becomes a neutral caller choice only if no value request
        // is active and we have not already offered that choice.
        conversationState.discoveryCompleteReady = coverage.sufficient &&
          !conversationState.explanationDelivered &&
          !conversationState.discoveryCompleteOffered &&
          !conversationState.pitchIntent.id
        memory.conversation_profile = conversationState.profile
        memory.pitch_intent = structuredClone(conversationState.pitchIntent)
        memory.conversation_objective = deriveConversationObjective(conversationState)
        memory.discovery_complete = { ready:conversationState.discoveryCompleteReady, awaiting_caller_choice:false }
        const usage = normalizedUsage("gemini", interpreted.usage)
        const routingUsage = normalizedUsage("gemini", valueIntent?.usage)
        const interpreterUsage = {
          inputTokens:usage.inputTokens + routingUsage.inputTokens,
          cachedInputTokens:usage.cachedInputTokens + routingUsage.cachedInputTokens,
          outputTokens:usage.outputTokens + routingUsage.outputTokens,
          visibleOutputTokens:usage.visibleOutputTokens + routingUsage.visibleOutputTokens,
          thinkingTokens:usage.thinkingTokens + routingUsage.thinkingTokens,
          totalTokens:usage.totalTokens + routingUsage.totalTokens
        }
        callUsage.inputTokens += interpreterUsage.inputTokens
        callUsage.cachedInputTokens += interpreterUsage.cachedInputTokens
        callUsage.outputTokens += interpreterUsage.outputTokens
        callUsage.visibleOutputTokens += interpreterUsage.visibleOutputTokens
        callUsage.thinkingTokens += interpreterUsage.thinkingTokens
        callUsage.totalTokens += interpreterUsage.totalTokens
        callUsage.estimatedGeminiCostUsd = Number((callUsage.estimatedGeminiCostUsd + geminiCostUsd(interpreterUsage)).toFixed(8))
        log("conversation_profile_updated", {
          objective:memory.conversation_objective, model:interpreted.model,
          semantic_intent:{ id:conversationState.pitchIntent.id, status:conversationState.pitchIntent.status, evidence:validNewRequest ? routing.evidence : null, prepared_capabilities:conversationState.pitchIntent.candidateCapabilityIds },
          coverage:{ business:Boolean(conversationState.profile.business || conversationState.profile.businessName), channels:conversationState.profile.channels.length, workflows:conversationState.profile.workflows.length, pains:conversationState.profile.painPoints.length, effort:Boolean(conversationState.profile.manualEffort), outcome:conversationState.profile.desiredOutcomes.length },
          usage:{ input_tokens:interpreterUsage.inputTokens, output_tokens:interpreterUsage.outputTokens, total_tokens:interpreterUsage.totalTokens }
        })
        return { coverage, pitchIntent:structuredClone(conversationState.pitchIntent), discoveryCompleteReady:conversationState.discoveryCompleteReady }
      }).catch(error => log("warning", { component:"conversation_profile", message:error.message }))
      return profileUpdateQueue
    }
    const clearCallerFirstTimer = () => { if (callerFirstTimer) { clearTimeout(callerFirstTimer); callerFirstTimer = undefined } }
    const noteFirstCallerTurn = source => {
      if (firstCallerTurnSeen) return false
      firstCallerTurnSeen = true
      clearCallerFirstTimer()
      log("call_start_caller_ready", { source, mode:memory.call_start_mode })
      return true
    }
    const persistUsage = reason => {
      const costs = persistCallCost(db, {
        callId:demoCallId, demoCallId,
        sttAudioSeconds:callUsage.sttAudioSeconds,
        sttModel:process.env.V3_STT_MODEL || "saaras:v3-realtime",
        ttsCharacters:callUsage.ttsCharacters,
        ttsProvider:callUsage.ttsProvider,
        llmProvider:callUsage.llmProvider,
        llmModel:callUsage.llmModel,
        inputTokens:callUsage.inputTokens,
        outputTokens:callUsage.outputTokens,
        cachedInputTokens:callUsage.cachedInputTokens
      })
      if (costs) log("call_cost_summary", { reason, billed_units:{ stt_audio_seconds:Number(callUsage.sttAudioSeconds.toFixed(3)), tts_characters:callUsage.ttsCharacters, input_tokens:callUsage.inputTokens, cached_input_tokens:callUsage.cachedInputTokens, output_tokens:callUsage.outputTokens }, estimated_inr:costs })
    }
    const sendAudio = result => {
      if (result.audio?.length) echoDetector.noteOutgoing(result.audio, result.sampleRate)
      if (socket.readyState !== socket.OPEN || !result.audio?.length) return false
      socket.send(JSON.stringify({ event:"playAudio", media:{ contentType:result.contentType, sampleRate:result.sampleRate, payload:result.audio.toString("base64") } }))
      return true
    }
    const clearOpeningDeliveryTimer = () => { if (openingDeliveryTimer) { clearTimeout(openingDeliveryTimer); openingDeliveryTimer = undefined } }
    const cancelOpeningDelivery = reason => {
      if (!openingDelivery || openingDelivery.delivered || openingDelivery.cancelled) return false
      openingDelivery.cancelled = true
      clearOpeningDeliveryTimer()
      log("opening_delivery_cancelled", { opening_id:openingDelivery.id, attempt:openingDelivery.attempt, reason })
      return true
    }
    const confirmOpeningDelivery = ({ openingId, attempt, requestId }) => {
      if (!openingDelivery || openingDelivery.id !== openingId || openingDelivery.attempt !== attempt || openingDelivery.delivered || openingDelivery.cancelled) return
      openingDelivery.delivered = true
      clearOpeningDeliveryTimer()
      memory.opening_delivered = true
      history.push({ role:"assistant", content:openingDelivery.text })
      void transcripts.write("agent", openingDelivery.text)
      log("opening_delivery_confirmed", { opening_id:openingId, attempt, source:openingDelivery.source, request_id:requestId, elapsed_ms:Date.now() - openingDelivery.startedAt })
    }
    const discardTts = () => { settleTtsPlayback(ttsPlayback, { status:"cancelled" }); ttsConnectionId += 1; ttsOpening = undefined; ttsSession?.close(); ttsSession = undefined; ttsLanguage = undefined; ttsPlayback = undefined }
    const stopAgent = reason => {
      epoch += 1; activeTurn?.abort(reason); activeTurn = undefined
      cancelOpeningDelivery(reason)
      // Sarvam cannot cancel an in-progress TTS response. Close only when it
      // is actively generating; an idle, pre-warmed connection is reusable.
      if (ttsPlayback) discardTts()
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ event:"clearAudio" }))
      log("barge_in", { reason })
    }
    const prepareTts = speechLanguage => {
      if (ttsSession && ttsLanguage === speechLanguage) return Promise.resolve(ttsSession)
      if (ttsOpening && ttsLanguage === speechLanguage) return ttsOpening
      discardTts(); const connectionId = ++ttsConnectionId; ttsLanguage = speechLanguage
      const openTts = (provider, fallback=false) => provider.open({ language:speechLanguage, onAudio:result => {
        const playback = ttsPlayback
        if (closed || connectionId !== ttsConnectionId || !playback || playback.epoch !== epoch) return
        const deliveredToCarrier = sendAudio(result)
        if (!deliveredToCarrier) return
        if (!playback.firstAudioSent) {
          playback.firstAudioSent = true
          log("first_audio_sent", { provider:ttsSession?.provider || callUsage.ttsProvider, request_id:result.requestId }, Date.now() - playback.startedAt)
          if (playback.openingDeliveryId) confirmOpeningDelivery({ openingId:playback.openingDeliveryId, attempt:playback.openingAttempt, requestId:result.requestId })
        }
      }, onComplete:() => {
        if (connectionId === ttsConnectionId) {
          const playback = ttsPlayback
          settleTtsPlayback(playback, { status:"completed" })
          ttsPlayback = undefined
        }
      }, onError:error => log("error", { component:"v3_tts", provider:provider.provider, message:error.message, fallback }) })
      ttsOpening = openTts(tts).catch(async error => {
        const canFallback = configuredTtsProvider() === "indic" && process.env.V3_TTS_FALLBACK !== "none" && sarvamTts && tts !== sarvamTts
        if (!canFallback) throw error
        log("tts_fallback", { from:tts.provider || "ai4bharat-indic-tts", to:"sarvam-bulbul-streaming", message:error.message })
        return openTts(sarvamTts, true)
      }).then(session => {
        if (closed || connectionId !== ttsConnectionId) { session?.close(); return null }
        // The local Indic service accepts an HTTP connection before synthesis.
        // Wrap send as well as open: a missing checkpoint or a service crash
        // must retry the same complete utterance through Sarvam.
        if (session?.provider === "ai4bharat-indic-tts" && sarvamTts && process.env.V3_TTS_FALLBACK !== "none") {
          let activeSession = session
          const resilientSession = {
            get provider() { return activeSession.provider },
            get model() { return activeSession.model },
            async send(text) {
              try { return await activeSession.send(text) }
              catch (error) {
                if (activeSession !== session) throw error
                log("tts_fallback", { from:"ai4bharat-indic-tts", to:"sarvam-bulbul-streaming", message:error.message, stage:"synthesis" })
                activeSession.close()
                activeSession = await openTts(sarvamTts, true)
                callUsage.ttsProvider = activeSession.provider || "sarvam-bulbul-streaming"
                return activeSession.send(text)
              }
            },
            flush() { return activeSession.flush() },
            close() { return activeSession.close() }
          }
          ttsSession = resilientSession
          callUsage.ttsProvider = resilientSession.provider
          return resilientSession
        }
        ttsSession = session
        callUsage.ttsProvider = session?.provider || callUsage.ttsProvider
        return session
      }).finally(() => { if (connectionId === ttsConnectionId) ttsOpening = undefined })
      return ttsOpening
    }
    const sendTtsChunk = async ({ sessionReady, text, turnEpoch, startedAt, playback=null }) => {
      const session = await sessionReady
      if (!session || closed || turnEpoch !== epoch) return
      if (!ttsPlayback || ttsPlayback.epoch !== turnEpoch) ttsPlayback = playback || createTtsPlayback({ epoch:turnEpoch, startedAt })
      const sentText = await session.send(text)
      recordTtsUsage(sentText, "agent_turn", session)
    }
    const scheduleOpeningAttempt = async (delivery, reason="initial") => {
      if (closed || delivery.cancelled || delivery.delivered) return
      if (delivery.attempt >= openingDeliveryPolicy.maxAttempts) {
        log("opening_delivery_failed", { opening_id:delivery.id, attempts:delivery.attempt, source:delivery.source, reason })
        return
      }
      clearOpeningDeliveryTimer()
      discardTts()
      delivery.attempt += 1
      const attempt = delivery.attempt, openingEpoch = epoch
      log("opening_delivery_attempt", { opening_id:delivery.id, attempt, source:delivery.source, reason, timeout_seconds:openingDeliveryPolicy.timeoutSeconds })
      if (openingDeliveryPolicy.enabled) {
        openingDeliveryTimer = setTimeout(() => {
          openingDeliveryTimer = undefined
          if (!closed && !delivery.cancelled && !delivery.delivered && openingDelivery === delivery && delivery.attempt === attempt) {
            log("opening_delivery_timeout", { opening_id:delivery.id, attempt, source:delivery.source, timeout_seconds:openingDeliveryPolicy.timeoutSeconds })
            scheduleOpeningAttempt(delivery, "first_audio_timeout")
          }
        }, openingDeliveryPolicy.timeoutSeconds * 1_000)
      }
      try {
        const session = await prepareTts(requestedLanguage)
        if (session && !closed && !delivery.cancelled && !delivery.delivered && openingDelivery === delivery && delivery.attempt === attempt && openingEpoch === epoch) {
          ttsPlayback = createTtsPlayback({ epoch:openingEpoch, startedAt:Date.now(), openingDeliveryId:delivery.id, openingAttempt:attempt })
          const spoken = await session.send(delivery.text)
          recordTtsUsage(spoken, delivery.source, session)
          session.flush()
        }
      } catch (error) {
        log("error", { component:"v3_call_start_tts", source:delivery.source, attempt, message:error.message })
        if (!closed && !delivery.cancelled && !delivery.delivered && openingDelivery === delivery && delivery.attempt === attempt) scheduleOpeningAttempt(delivery, "tts_error")
      }
    }
    const speakCallStartPrompt = ({ text, source }) => {
      // There is only one introductory prompt per call. A caller who speaks
      // before it reaches the carrier gets a normal first reply instead.
      if (closed || openingDelivery) return
      const delivery = { id:`opening-${++openingDeliverySequence}`, text, source, attempt:0, startedAt:Date.now(), delivered:false, cancelled:false }
      openingDelivery = delivery
      log("call_start_prompt", { opening_id:delivery.id, source, mode:memory.call_start_mode, characters:[...text].length })
      void scheduleOpeningAttempt(delivery)
    }
    const processFinal = async ({ text, languageCode, requestId, metrics, utteranceId=null }) => {
      if (!text || closed) return
      const detectedLanguage = woxzaLanguageFromSarvamCode(languageCode)
      const languageDecision = languageSwitch.observeTurn({ text, detectedLanguage })
      const language = languageDecision.activeLanguage
      memory.language_policy = languageDecision.languagePolicy
      if (languageDecision.action !== "none") log(`language_switch_${languageDecision.action}`, {
        selected_language:requestedLanguage,
        active_language:language,
        candidate_language:languageDecision.candidateLanguage,
        detected_language:detectedLanguage
      })
      const callerTranscript = transcripts.write("caller", text)
      const assessedTurn = assessCallerTurn(text)
      // A short "yes" or "okay" immediately after the tailored pitch is a
      // valid answer to Woxza's contextual invitation. Everywhere else the
      // conservative noise/acknowledgement protection remains unchanged.
      const answeringPostPitchOffer = conversationState.pitchIntent.nextStepOffered
      const answeringDiscoveryChoice = conversationState.discoveryCompleteOffered
      const answeringContextualOffer = answeringPostPitchOffer || answeringDiscoveryChoice
      const turnAssessment = answeringContextualOffer && assessedTurn.action !== "respond"
        ? { action:"respond", reason:answeringPostPitchOffer ? "post_pitch_next_step_answer" : "discovery_complete_choice_answer" }
        : assessedTurn
      if (turnAssessment.action === "respond" || languageDecision.forceReply) cancelOpeningDelivery("caller_turn_before_opening")
      // A language-switch confirmation can be a short acknowledgement such as
      // “okay”. It is meaningful only while the controller has a pending
      // offer, so let it clear old playback and produce the confirmation turn.
      if (turnControl === "hybrid" && (turnAssessment.action === "respond" || languageDecision.forceReply)) stopAgent("sarvam_final_valid_turn")
      const turnEpoch = epoch, started = Date.now(), controller = new AbortController(); activeTurn = controller
      if (turnAssessment.action !== "respond" && !languageDecision.forceReply) {
        // At the start of caller-first mode, a short acknowledgement means
        // the person is present—not an answer to an earlier Woxza question.
        // Give one brief identity prompt and never leave a live caller in
        // unexplained silence.
        if (!callStart.speakFirst && !firstCallerTurnSeen && turnAssessment.reason === "acknowledgement") {
          noteFirstCallerTurn("initial_acknowledgement")
          void speakCallStartPrompt({ text:callerFirstPresencePrompt(requestedLanguage), source:"caller_first_acknowledgement" })
          return
        }
        log("turn_held", { utterance_id:utteranceId, reason:turnAssessment.reason, text_length:text.length, language:languageCode, turn_control:turnControl })
        return
      }
      if (!callStart.speakFirst) noteFirstCallerTurn("meaningful_final")
      // Each Sarvam final is an authoritative caller turn. Do not hold or
      // merge finals here: a caller may intentionally pause between thoughts,
      // and immediate turn delivery preserves the responsive V3 behaviour.
      const callerText = text
      history.push({ role:"user", content:callerText })
      if (answeringPostPitchOffer) {
        conversationState.pitchIntent = consumePostPitchOffer({ pitchIntent:conversationState.pitchIntent })
        memory.pitch_intent = structuredClone(conversationState.pitchIntent)
      }
      if (answeringDiscoveryChoice) conversationState.discoveryCompleteOffered = false
      memory.conversation_objective = deriveConversationObjective(conversationState)
      // Snapshot the decision and caller-known facts before the parallel fact
      // extractor starts.  A later extraction must guide the *next* turn; it
      // must never relabel this already-generated reply as an explanation.
      const objectiveForReply = memory.conversation_objective
      const catalog = await capabilityCatalogFor(language)
      // The preceding background interpretation is the only route into a
      // pitch. The reply itself never waits for a second model call; it uses
      // the last completed semantic snapshot and lets this turn's interpreter
      // prepare state for the next one.
      const activePitch = conversationState.pitchIntent
      const capabilityContext = pitchReplySnapshot({ pitchIntent:activePitch, catalog })
      const selectedCapabilities = capabilityContext.selected
      const mustPitchNow = capabilityContext.mode === "value_pitch"
      memory.pitch_intent = structuredClone(activePitch)
      memory.capability_context = capabilityContext
      memory.post_pitch_next_step = { awaiting_caller_choice:answeringPostPitchOffer }
      memory.discovery_complete = {
        ready:conversationState.discoveryCompleteReady,
        awaiting_caller_choice:answeringDiscoveryChoice
      }
      if (activePitch.id) log("capability_context_prepared", {
        objective:objectiveForReply, status:activePitch.status, follow_up_questions:activePitch.followUpQuestions,
        selected:selectedCapabilities.map(item => item.id), ready_for_reply:mustPitchNow
      })
      const memoryForReply = structuredClone(memory)
      // Discovery facts and value intent remain asynchronous. A phone reply
      // must never wait behind the serialized background profile queue.
      void updateConversationProfile({ callerText, language })
      log("stt_final", { provider:"sarvam-saaras-realtime", request_id:requestId, utterance_id:utteranceId, language:languageCode, detected_language:detectedLanguage, response_language:language, language_switch_action:languageDecision.action, text_length:text.length, metrics, turn_control:turnControl }, 0)
      try {
        // Start establishing TTS, but do not await it before the LLM. This
        // overlaps the WebSocket handshake with model time instead of making
        // the caller pay for both delays in sequence.
        const speechLanguage = language
        const ttsReady = prepareTts(speechLanguage)
        const chunker = configuredTtsChunker()
        const deliveryMode = configuredTtsDeliveryMode()
        const phraseConfig = configuredWoxzaPhraseBuffer()
        const voiceDelivery = createTtsPlayback({ epoch:turnEpoch, startedAt:started })
        const words = chunker === "prosody"
          ? createProsodyPhraseBuffer(phraseConfig)
          : createWordBoundaryBuffer({ minimumCharacters:phraseConfig.minimumCharacters })
        let phraseSequence = 0, phraseTimer, ttsPhraseQueue = Promise.resolve()
        const clearPhraseTimer = () => { if (phraseTimer) { clearTimeout(phraseTimer); phraseTimer = undefined } }
        const queuePhrase = phrase => {
          if (!phrase?.text) return ttsPhraseQueue
          const sequence = ++phraseSequence
          const queuedAt = Date.now()
          ttsPhraseQueue = ttsPhraseQueue.then(async () => {
            if (closed || turnEpoch !== epoch) return
            log("tts_phrase_ready", {
              chunker,
              turn_epoch:turnEpoch,
              phrase_sequence:sequence,
              characters:[...phrase.text].length,
              release_reason:phrase.releaseReason || "legacy_boundary",
              phrase_wait_ms:queuedAt - started
            })
            await sendTtsChunk({ sessionReady:ttsReady, text:phrase.text, turnEpoch, startedAt:started, playback:voiceDelivery })
          })
          return ttsPhraseQueue
        }
        const armPhraseTimer = () => {
          if (deliveryMode !== "phrase" || chunker !== "prosody") return
          clearPhraseTimer()
          const delay = words.millisecondsUntilTimeout()
          if (delay === null) return
          phraseTimer = setTimeout(() => {
            phraseTimer = undefined
            const phrase = words.releaseTimedOut()
            if (phrase) void queuePhrase(phrase)
            armPhraseTimer()
          }, delay)
        }
        let replyText = "", firstToken = true, completion = null
        for await (const chunk of brain.replyStream({ language, history, callerText, memory:memoryForReply, signal:controller.signal })) {
          if (chunk.completion) completion = { ...(completion || {}), ...chunk.completion }
          if (!chunk.text) continue
          if (firstToken) { firstToken = false; log("llm_first_token", {}, Date.now() - started) }
          replyText += chunk.text
          if (deliveryMode !== "phrase") continue
          const phrases = words.push(chunk.text)
          for (const phrase of phrases) await queuePhrase(typeof phrase === "string" ? { text:phrase, releaseReason:"legacy_boundary" } : phrase)
          armPhraseTimer()
        }
        clearPhraseTimer()
        // `MAX_TOKENS` is a provider-side stop, not a valid sentence boundary.
        // Shape before sending or saving so callers never hear an unfinished
        // phrase and future turns remember exactly what was actually spoken.
        const isPitchReply = memoryForReply.capability_context?.mode === "value_pitch"
        const responseCharacterLimit = isPitchReply ? maximumPitchCharacters() : maximumSpokenCharacters()
        let shapedReply = shapePhoneResponse(replyText, {
          language,
          maximumCharacters:responseCharacterLimit,
          stopReason:completion?.stopReason || null
        })
        // A complete grammatical sentence can still be an abandoned answer.
        // Never speak that fragment when the provider confirms a token cutoff.
        // Gemini repairs only this exceptional turn with a concise replacement;
        // normal turns retain their existing latency and token budget.
        // A MAX_TOKENS completion is never a trustworthy finished thought,
        // even when the phone shaper could preserve a later question. Repair
        // it rather than speaking a clipped pitch or a dangling example.
        if (completion?.stopReason === "MAX_TOKENS" && typeof brain.repairStream === "function") {
          log("llm_response_repair_started", { provider:brain.provider || configuredBrainProvider(), raw_characters:[...replyText].length, stop_reason:completion?.stopReason || null })
          let repairedText = "", repairedCompletion = null
          for await (const chunk of brain.repairStream({ language, history, callerText, memory:memoryForReply, draft:replyText, signal:controller.signal })) {
            if (chunk.completion) repairedCompletion = { ...(repairedCompletion || {}), ...chunk.completion }
            if (chunk.text) repairedText += chunk.text
          }
          const repaired = shapePhoneResponse(repairedText, {
            language,
            maximumCharacters:responseCharacterLimit,
            stopReason:repairedCompletion?.stopReason || null
          })
          if (repaired.reason !== "model_cutoff_trimmed") {
            replyText = repairedText
            shapedReply = repaired
            completion = repairedCompletion || completion
            log("llm_response_repaired", { provider:brain.provider || configuredBrainProvider(), response_characters:[...repairedText].length, spoken_characters:repaired.spokenCharacters, stop_reason:repairedCompletion?.stopReason || null })
          } else {
            // A second cutoff must not turn back into a half-answer. The
            // existing complete recovery is preferable to hanging the caller.
            shapedReply = shapePhoneResponse("", { language, maximumCharacters:responseCharacterLimit, stopReason:"MAX_TOKENS" })
            replyText = shapedReply.text
            completion = repairedCompletion || completion
            log("llm_response_repair_failed", { provider:brain.provider || configuredBrainProvider(), reason:"repair_token_cutoff" })
          }
        }
        if (shapedReply.reason !== "complete") log("phone_reply_shaped", {
          reason:shapedReply.reason,
          raw_characters:shapedReply.rawCharacters,
          spoken_characters:shapedReply.spokenCharacters,
          raw_has_question:/[?？]/u.test(replyText),
          spoken_has_question:/[?？]$/u.test(shapedReply.text),
          model_stop_reason:completion?.stopReason || null
        })
        replyText = shapedReply.text
        // A language offer is control-plane output. Keep the caller's actual
        // answer from the brain, then guarantee the one consent question in
        // the currently active language instead of hoping a model follows it.
        if (languageDecision.action === "offer") {
          const question = languageSwitchQuestion(language, languageDecision.candidateLanguage)
          replyText = `${replyText}${replyText ? " " : ""}${question}`.trim()
          log("language_switch_question_added", {
            active_language:language,
            candidate_language:languageDecision.candidateLanguage,
            characters:[...question].length
          })
        }
        if (deliveryMode === "turn") {
          const completeTurn = replyText.trim()
          if (completeTurn) await queuePhrase({ text:completeTurn, releaseReason:"complete_turn" })
        } else {
          const last = words.flush(); if (last) await queuePhrase(typeof last === "string" ? { text:last, releaseReason:"legacy_final_flush" } : last)
        }
        await ttsPhraseQueue
        replyText = replyText.trim(); if (!replyText || closed || turnEpoch !== epoch) return
        const provider = brain.provider || configuredBrainProvider()
        callUsage.llmProvider = provider
        callUsage.llmModel = brain.model || configuredBrainModel(provider)
        const turnUsage = normalizedUsage(provider, completion?.usage)
        callUsage.inputTokens += turnUsage.inputTokens
        callUsage.cachedInputTokens += turnUsage.cachedInputTokens
        callUsage.outputTokens += turnUsage.outputTokens
        callUsage.visibleOutputTokens += turnUsage.visibleOutputTokens
        callUsage.thinkingTokens += turnUsage.thinkingTokens
        callUsage.totalTokens += turnUsage.totalTokens
        if (provider === "gemini") callUsage.estimatedGeminiCostUsd = Number((callUsage.estimatedGeminiCostUsd + geminiCostUsd(turnUsage)).toFixed(8))
        const agentTranscript = transcripts.write("agent", replyText)
        const turnSequence = ++completedTurnSequence, turnId = randomUUID()
        // Snapshot state now. The next caller turn may update language policy
        // before this asynchronous durable write runs.
        const languagePolicy = structuredClone(memory.language_policy || {})
        // This callback runs only after Sarvam confirms the TTS turn ended.
        // It updates in-memory continuity immediately, then persists the
        // compact pair asynchronously so the caller never waits on Postgres.
        voiceDelivery.onComplete = outcome => {
          if (outcome.status !== "completed" || !outcome.firstAudioSent) {
            log("conversation_turn_not_persisted", { turn_id:turnId, turn_sequence:turnSequence, reason:outcome.status || "no_audio" })
            return
          }
          history.push({ role:"assistant", content:replyText })
          memory.turns.push({ turn:turnSequence, caller:callerText, agent:replyText }); memory.turns = memory.turns.slice(-16)
          if (objectiveForReply === "focused_discovery" && /[?？]$/u.test(replyText)) conversationState.discoveryQuestions += 1
          if (memoryForReply.pitch_intent?.id === "explore_woxza_value") {
            if (memoryForReply.capability_context?.mode === "value_pitch") {
              conversationState.pitchIntent = recordPitchReply({ pitchIntent:conversationState.pitchIntent, mode:"value_pitch", replyText })
              conversationState.explanationDelivered = true
            } else if (conversationState.pitchIntent.id === "explore_woxza_value") {
              conversationState.pitchIntent = recordPitchReply({ pitchIntent:conversationState.pitchIntent, mode:"inactive", replyText })
            }
            memory.pitch_intent = structuredClone(conversationState.pitchIntent)
          }
          if (memoryForReply.discovery_complete?.ready) {
            conversationState.discoveryCompleteReady = false
            conversationState.discoveryCompleteOffered = true
            memory.discovery_complete = { ready:false, awaiting_caller_choice:false }
          }
          memory.conversation_objective = deriveConversationObjective(conversationState)
          const conversationIntent = {
            ...conversationState.pitchIntent,
            discoveryCompleteReady:conversationState.discoveryCompleteReady,
            discoveryCompleteOffered:conversationState.discoveryCompleteOffered
          }
          void Promise.all([callerTranscript, agentTranscript]).then(([callerRow, agentRow]) => conversationTurns.completeTurn({
            turnId, demoCallId, turnSequence, callerText, agentText:replyText, language,
            languagePolicy, conversationProfile:conversationState.profile, conversationObjective:objectiveForReply, conversationIntent,
            callerTranscriptTurnId:callerRow?.id || null, agentTranscriptTurnId:agentRow?.id || null
          })).then(saved => {
            if (saved) log("conversation_turn_persisted", { turn_id:turnId, turn_sequence:turnSequence, language })
          }).catch(error => log("error", { component:"conversation_turn_store", turn_id:turnId, message:error.message }))
        }
        // Arm persistence before flushing. Sarvam can emit its final event
        // immediately after a flush, and that event is the delivery proof.
        const session = await ttsReady; if (session && !closed && turnEpoch === epoch) session.flush()
        log("llm_response", {
          provider,
          model:callUsage.llmModel,
          completion,
          turn_usage:{ input_tokens:turnUsage.inputTokens, cached_input_tokens:turnUsage.cachedInputTokens, output_tokens:turnUsage.outputTokens, visible_output_tokens:turnUsage.visibleOutputTokens, thinking_tokens:turnUsage.thinkingTokens, total_tokens:turnUsage.totalTokens, estimated_gemini_cost_usd:provider === "gemini" ? geminiCostUsd(turnUsage) : null },
          call_usage:{ input_tokens:callUsage.inputTokens, cached_input_tokens:callUsage.cachedInputTokens, output_tokens:callUsage.outputTokens, visible_output_tokens:callUsage.visibleOutputTokens, thinking_tokens:callUsage.thinkingTokens, total_tokens:callUsage.totalTokens, estimated_gemini_cost_usd:provider === "gemini" ? callUsage.estimatedGeminiCostUsd : null },
          input_tokens:callUsage.inputTokens,
          output_tokens:callUsage.outputTokens,
          total_tokens:callUsage.totalTokens,
          response_characters:replyText.length,
          response_has_terminal_punctuation:/[.!?…。！？]$/u.test(replyText),
          response_has_question:/[?？]$/u.test(replyText)
        }, Date.now() - started)
      } catch (error) { if (!controller.signal.aborted) log("error", { component:"v3_turn", message:error.message }, Date.now() - started) }
      finally { if (activeTurn === controller) activeTurn = undefined }
    }
    let sttSession, bridgeTurnController
    try {
      sttSession = await stt.open({
        language:"auto",
        endpointing:turnControl === "bridge" ? "manual" : "vad",
        onPartial:partial => {
          const assessment = assessCallerPartial(partial.text)
          if (turnControl === "hybrid") {
            log("stt_partial", { text_length:partial.text.length, language:partial.languageCode, partial_assessment:assessment.reason, turn_control:turnControl })
            if (assessment.action === "confirm_barge_in") stopAgent("sarvam_meaningful_partial")
            return
          }
          const snapshot = bridgeTurnController?.snapshot()
          const echo = snapshot?.utteranceId ? candidateEcho.get(snapshot.utteranceId) : null
          const likelyEcho = Boolean(echo && echo.echoFrames >= 2 && echo.echoFrames / Math.max(1, echo.audioFrames) >= 0.65)
          log("stt_partial", { text_length:partial.text.length, language:partial.languageCode, partial_assessment:likelyEcho ? "likely_agent_echo" : assessment.reason, echo_correlation:echo?.maximumCorrelation || 0, turn_control:turnControl })
          if (likelyEcho) return
          if (turnControl === "bridge" && assessment.action === "confirm_barge_in") bridgeTurnController?.confirmBargeIn({ reason:"meaningful_stt_partial" })
        },
        onSpeechStart:() => {
          if (turnControl === "provider") stopAgent("sarvam_vad_speech_start")
          if (turnControl === "hybrid") log("sarvam_speech_start", { turn_control:turnControl })
        },
        onSpeechEnd:() => {
          if (turnControl === "provider") log("stt_speech_end", { turn_control:turnControl })
          if (turnControl === "hybrid") log("sarvam_speech_end", { turn_control:turnControl })
        },
        onFinal:result => {
          if (turnControl === "hybrid") {
            // Sarvam owns the boundary. Woxza only clears playback once a
            // completed caller turn is useful, preserving one-word answers
            // while preventing cough/noise activity from stopping speech.
            return void processFinal(result)
          }
          if (turnControl !== "bridge") return void processFinal(result)
          const utterance = pendingManualUtterances.shift()
          if (!utterance) return log("stt_final_discarded", { reason:"no_pending_manual_utterance", request_id:result.requestId })
          const echo = candidateEcho.get(utterance.utteranceId)
          candidateEcho.delete(utterance.utteranceId)
          if (echo && echo.echoFrames >= 2 && echo.echoFrames / Math.max(1, echo.audioFrames) >= 0.65) return log("stt_final_discarded", { reason:"likely_agent_audio_echo", request_id:result.requestId, utterance_id:utterance.utteranceId, echo_correlation:echo.maximumCorrelation || 0 })
          const snapshot = bridgeTurnController?.snapshot()
          if (snapshot?.active && snapshot.utteranceId !== utterance.utteranceId) return log("stt_final_discarded", { reason:"caller_continued_before_final", request_id:result.requestId, utterance_id:utterance.utteranceId, active_utterance_id:snapshot.utteranceId })
          // A very short valid caller turn can arrive as a final before a
          // useful partial. Confirm only when the final is meaningful; an
          // acknowledgement or breath transcript leaves current audio intact.
          if (assessCallerTurn(result.text).action === "respond") bridgeTurnController?.confirmBargeIn({ utteranceId:utterance.utteranceId, reason:"meaningful_stt_final" })
          void processFinal({ ...result, utteranceId:utterance.utteranceId })
        },
        onError:error => log("error", { component:"v3_stt", message:error.message })
      })
    } catch (error) { log("error", { component:"v3_stt_connect", message:error.message }); return socket.close(1011, "Sarvam realtime STT unavailable") }
    if (["bridge", "shadow"].includes(turnControl)) {
      bridgeTurnController = createCallerTurnController({
        sampleRate:inboundSampleRate(),
        ...turnControlSettings,
        onActivityStart:({ utteranceId }) => {
          candidateEcho.set(utteranceId, { audioFrames:0, echoFrames:0, maximumCorrelation:0 })
          log("turn_activity_candidate", { utterance_id:utteranceId, turn_control:turnControl, ...turnControlSettings })
          if (turnControl === "bridge") sttSession.speechStart?.()
        },
        onBargeIn:({ utteranceId, reason }) => {
          log("turn_activity_confirmed", { utterance_id:utteranceId, reason, turn_control:turnControl, ...turnControlSettings })
          if (turnControl === "bridge") {
            // A new thought invalidates an older utterance that has not yet
            // produced a final transcript. It must never trigger stale audio.
            pendingManualUtterances.length = 0
            stopAgent("woxza_turn_activity_start")
          }
        },
        onActivityEnd:({ utteranceId, audio }) => {
          log("turn_activity_end", { utterance_id:utteranceId, audio_bytes:audio.length, turn_control:turnControl })
          if (turnControl === "bridge") {
            pendingManualUtterances.push({ utteranceId, endedAt:Date.now() })
            sttSession.speechEnd?.()
            sttSession.flush?.()
            log("turn_endpoint_committed", { utterance_id:utteranceId, endpoint_silence_ms:turnControlSettings.endSilenceMs })
          }
        },
        onUnconfirmedActivityEnd:({ utteranceId, audio }) => {
          log("turn_activity_unconfirmed", { utterance_id:utteranceId, audio_bytes:audio.length, reason:"no_meaningful_partial", turn_control:turnControl })
          if (turnControl === "bridge") {
            pendingManualUtterances.push({ utteranceId, endedAt:Date.now() })
            sttSession.speechEnd?.(); sttSession.flush?.()
          }
        },
        onAudio:(frame, { utteranceId }={}) => {
          if (turnControl === "bridge") sttSession.push(frame)
          const candidate = candidateEcho.get(utteranceId)
          if (!candidate) return
          const echo = echoDetector.assessIncoming(frame)
          candidate.audioFrames += 1
          if (echo.likelyEcho) candidate.echoFrames += 1
          candidate.maximumCorrelation = Math.max(candidate.maximumCorrelation, echo.correlation || 0)
        }
      })
    }
    const close = ({ resumable=false, reason="stream_closed" }={}) => {
      if (closed) return
      closed = true
      clearCallerFirstTimer(); clearOpeningDeliveryTimer(); candidateEcho.clear(); echoDetector.reset(); bridgeTurnController?.reset(); pendingManualUtterances.length = 0
      sttSession?.close(); discardTts(); stopAgent(reason)
      const lease = streamLeases.get(demoCallId)
      if (lease?.connectionId === connectionId) {
        if (resumable && resumePolicy.enabled) {
          lease.active = false
          lease.expiresAt = Date.now() + resumePolicy.graceSeconds * 1_000
          lease.expiryTimer = setTimeout(() => {
            const current = streamLeases.get(demoCallId)
            if (current?.connectionId === connectionId && !current.active) {
              streamLeases.delete(demoCallId)
              log("stream_resume_expired", { grace_seconds:resumePolicy.graceSeconds })
            }
          }, resumePolicy.graceSeconds * 1_000)
          // The timer is only cleanup state; it must not keep a server process
          // alive after the call infrastructure has otherwise shut down.
          lease.expiryTimer.unref?.()
          log("stream_resume_waiting", { grace_seconds:resumePolicy.graceSeconds })
        } else streamLeases.delete(demoCallId)
      }
      void transcripts.flush().finally(() => persistUsage(reason))
    }
    socket.on("close", () => close({ resumable:true, reason:"media_socket_closed" }))
    socket.on("message", raw => { try { const event = JSON.parse(raw.toString()); if (event.event === "stop") return close({ reason:"provider_stream_stopped" }); if (event.event === "media" && event.media?.payload) { const pcm = decodePlivoInboundAudio(event.media.payload, process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000", process.env.PLIVO_L16_BYTE_ORDER || "little"); callUsage.sttAudioSeconds += pcm.length / 2 / inboundSampleRate(); if (bridgeTurnController) bridgeTurnController.push(pcm); else sttSession.push(pcm) } } catch (error) { log("error", { component:"v3_plivo_input", message:error.message }) } })
    log("call_started", { provider:"plivo", agentId:"sarvam-streaming-v3", brain_provider:configuredBrainProvider(), brain_model:brain.model || configuredBrainModel(configuredBrainProvider()), stt_model:process.env.V3_STT_MODEL || "saaras:v3-realtime", tts_provider:callUsage.ttsProvider, tts_model:tts.model || (configuredTtsProvider() === "indic" ? "indic-tts-fastpitch-hifigan" : process.env.SARVAM_TTS_MODEL || "bulbul:v3"), turn_control:turnControl, turn_control_settings:turnControlSettings, language_switch_policy:configuredLanguageSwitchPolicy(), call_start:callStart, resumed:withinResumeWindow })
    if (withinResumeWindow) {
      log("stream_resumed", { restored_turns:restoredTurns.length, restored_language:languageSwitch.snapshot().active_language, next_turn_sequence:completedTurnSequence + 1 })
    } else if (callStart.speakFirst) {
      // If the caller begins speaking during the TTS handshake, never send a
      // delayed welcome afterwards. That would overlap their first response.
      void speakCallStartPrompt({ text:agentFirstGreeting(requestedLanguage), source:"agent_first_welcome" })
    } else if (callStart.timeoutEnabled) {
      callerFirstTimer = setTimeout(() => {
        callerFirstTimer = undefined
        if (closed || firstCallerTurnSeen) return
        // Resolve the call-start state before starting audio so a later short
        // acknowledgement cannot trigger a second introductory prompt.
        firstCallerTurnSeen = true
        log("call_start_timeout", { seconds:callStart.timeoutSeconds, mode:memory.call_start_mode })
        void speakCallStartPrompt({ text:callerFirstPresencePrompt(requestedLanguage), source:"caller_first_timeout" })
      }, callStart.timeoutSeconds * 1_000)
      log("call_start_waiting", { timeout_enabled:true, timeout_seconds:callStart.timeoutSeconds, mode:memory.call_start_mode })
    } else {
      log("call_start_waiting", { timeout_enabled:false, mode:memory.call_start_mode })
    }
  })
}
