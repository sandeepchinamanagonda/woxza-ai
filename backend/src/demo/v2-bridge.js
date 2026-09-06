import { WebSocketServer } from "ws"
import { createCallerTurnController } from "./caller-turn-controller.js"
import { decodePlivoInboundAudio } from "./gemini-bridge.js"
import { LANGUAGES } from "./prompt.js"
import { createSarvamApi, woxzaLanguageFromSarvamCode } from "./sarvam-api.js"
import { createOpenRouterConversation } from "./openrouter-conversation.js"
import { createSarvamConversation } from "./sarvam-conversation.js"
import { createFishAudioTts } from "./fish-audio-tts.js"
import { logCallEvent } from "../call-events.js"
import { persistCallCost } from "../call-costs.js"
import { createTranscriptWriter } from "../transcript-writer.js"
import { createPhraseBuffer } from "./phrase-buffer.js"
import { agentFirstGreeting } from "./call-start-messages.js"
const findCall = async (db, id) => (await db.query("SELECT id,language,name FROM demo_calls WHERE id=$1 AND status IN ('ringing','connected')", [id])).rows[0]
const localReplyFallback = (language, callerText) => {
  const greeting = /^(hello|hi|hey|హలో|నమస్కారం|ఎలా ఉన్నారు|వినిపిస్తుందా)/i.test(String(callerText || "").trim())
  if (language === "te") return greeting
    ? "నమస్కారం, నేను వింటున్నాను. మీరు ఏ వ్యాపారం నడుపుతున్నారు?"
    : "మీరు చెప్పినది అర్థమవుతోంది. మీ వ్యాపారంలో కస్టమర్లు ఎక్కువగా ఎలా సంప్రదిస్తారు?"
  if (language === "hi") return greeting
    ? "नमस्ते, मैं सुन रहा हूँ। आप कौन सा व्यवसाय चलाते हैं?"
    : "मैं आपकी बात समझ रहा हूँ। ग्राहक आपसे ज़्यादातर कैसे संपर्क करते हैं?"
  return greeting
    ? "Hello, I’m here. What kind of business do you run?"
    : "I understand. How do customers usually reach your business today?"
}

// V2 intentionally owns turn boundaries. Sarvam and OpenRouter are providers,
// not the source of truth for when the caller has finished or may interrupt.
export function attachDemoV2Bridge(server, { db, sarvam=createSarvamApi(), conversation=createOpenRouterConversation(), sarvamConversation=createSarvamConversation(), fishTts=createFishAudioTts() }={}) {
  const wss = new WebSocketServer({ noServer:true })
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost")
    if (url.pathname !== "/telephony/plivo/v2/stream") return
    wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, url))
  })
  wss.on("connection", async (socket, url) => {
    const demoCallId = url.searchParams.get("demoCallId")
    const language = url.searchParams.get("lang") || "en"
    const useFishTts = (process.env.V2_TTS_PROVIDER || "fish").toLowerCase() === "fish"
    const brainProvider = (process.env.V2_BRAIN_PROVIDER || "openrouter").toLowerCase()
    const brain = brainProvider === "sarvam" ? sarvamConversation : conversation
    const audioConfig = {
      sttModel:process.env.SARVAM_STT_MODEL || "saaras:v4",
      sttMode:process.env.V2_STT_MODE || "codemix",
      sttLanguageCode:process.env.V2_STT_LANGUAGE_CODE || "unknown",
      endSilenceMs:Number(process.env.V2_END_SILENCE_MS || 750),
      ttsModel:process.env.SARVAM_TTS_MODEL || "bulbul:v3",
      ttsSpeaker:process.env.SARVAM_TTS_SPEAKER || "ritu",
      ttsPace:Number(process.env.SARVAM_TTS_PACE || "1.15"),
      ttsTemperature:Number(process.env.SARVAM_TTS_TEMPERATURE || "0.70"),
      ttsCodec:process.env.V2_TTS_CODEC || "linear16",
      ttsSampleRate:Number(process.env.V2_TTS_SAMPLE_RATE || 16000),
      plivoInboundContentType:process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000"
    }
    if (!demoCallId || !LANGUAGES.has(language) || !sarvam || !brain || (useFishTts && !fishTts)) return socket.close(1011, "V2 providers are not configured")
    const call = await findCall(db, demoCallId).catch(() => null)
    if (!call) return socket.close(1008, "Unknown demo call")
    let closed = false
    let generation = 0
    let speechController
    let turnRequestController
    const callUsage = { sttAudioSeconds:0, ttsCharacters:0, inputTokens:0, outputTokens:0, llmProvider:brainProvider === "sarvam" ? "sarvam-conversations" : brainProvider }
    const history = []
    const transcripts = createTranscriptWriter({ db, demoCallId, onError:(error, turn) => log("error", { component:"transcript", message:error.message, speaker:turn.speaker }) })
    // Structured, paired history preserves exactly which agent question each
    // caller statement answered. It is more useful than two unrelated lists.
    const callMemory = { opening_delivered:true, turns:[] }
    const log = (eventType, payload={}, latencyMs=null) => logCallEvent(db, { callId:demoCallId, demoCallId, eventType, payload:{ pipeline:"v2", ...payload }, latencyMs })
    const persistUsage = reason => {
      const costs = persistCallCost(db, {
        callId:demoCallId, demoCallId,
        sttAudioSeconds:callUsage.sttAudioSeconds,
        sttModel:audioConfig.sttModel,
        ttsCharacters:callUsage.ttsCharacters,
        llmProvider:callUsage.llmProvider,
        inputTokens:callUsage.inputTokens,
        outputTokens:callUsage.outputTokens
      })
      if (costs) log("call_cost_summary", { reason, billed_units:{ stt_audio_seconds:Number(callUsage.sttAudioSeconds.toFixed(3)), tts_characters:callUsage.ttsCharacters, input_tokens:callUsage.inputTokens, output_tokens:callUsage.outputTokens }, estimated_inr:costs })
    }
    const sendAudio = ({ audio, contentType="audio/x-mulaw", sampleRate=8000 }={}) => {
      if (socket.readyState !== socket.OPEN || !audio?.length) return
      socket.send(JSON.stringify({ event:"playAudio", media:{ contentType, sampleRate, payload:audio.toString("base64") } }))
    }
    const cancelSpeech = reason => {
      generation += 1
      speechController?.abort(reason)
      speechController = undefined
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify({ event:"clearAudio" }))
      log("barge_in", { reason })
    }
    const speak = async (text, epoch=generation, turnStartedAt=null, speechLanguage=language) => {
      const started = Date.now(); const requestController = new AbortController(); speechController = requestController
      try {
        let result
        try {
          result = useFishTts
            ? await fishTts.synthesizeMuLaw8k(text, { language:speechLanguage, signal:requestController.signal })
            : await sarvam.synthesizeTelephonyAudio(text, { language:speechLanguage, signal:requestController.signal })
        } catch (error) {
          if (requestController.signal.aborted) return
          if (!useFishTts || process.env.V2_TTS_FALLBACK !== "sarvam") throw error
          log("tts_fallback", { from:"fish-audio", to:"sarvam", message:error.message })
          result = await sarvam.synthesizeTelephonyAudio(text, { language:speechLanguage, signal:requestController.signal })
        }
        if (closed || epoch !== generation) return
        sendAudio(result)
        if (result.provider === "sarvam-bulbul") {
          const characters = [...String(text || "")].length
          callUsage.ttsCharacters += characters
          log("tts_usage", { source:"agent_turn", characters, call_tts_characters:callUsage.ttsCharacters })
        }
        const ttsLatencyMs = Date.now() - started
        log("tts_start", { provider:result.provider, request_id:result.requestId, characters:[...text].length, content_type:result.contentType || "audio/x-mulaw", sample_rate:result.sampleRate || 8000, speaker:result.speaker, pace:result.pace, temperature:result.temperature }, ttsLatencyMs)
        if (turnStartedAt) {
          const turnLatencyMs = Date.now() - turnStartedAt
          log("first_audio_sent", { provider:result.provider, request_id:result.requestId, characters:[...text].length, turn_latency_ms:turnLatencyMs }, turnLatencyMs)
        }
      } catch (error) { if (!requestController.signal.aborted) log("error", { component:"v2_tts", message:error.message }, Date.now() - started) }
      finally { if (speechController === requestController) speechController = undefined }
    }
    const processTurn = async ({ audio, utteranceId }) => {
      const epoch = generation; const started = Date.now(); const requestController = new AbortController(); turnRequestController = requestController
      log("turn_processing_started", { utterance_id:utteranceId, audio_bytes:audio.length })
      try {
        // The website preference controls the greeting, but not what a caller
        // is allowed to say. Saaras detects the actual language per turn.
        callUsage.sttAudioSeconds += audio.length / 2 / audioConfig.ttsSampleRate
        const stt = await sarvam.transcribePcm16(audio, { language:audioConfig.sttLanguageCode, signal:requestController.signal })
        if (closed || epoch !== generation || !stt.text) return
        const turnLanguage = woxzaLanguageFromSarvamCode(stt.languageCode)
        void transcripts.write("caller", stt.text); history.push({ role:"user", content:stt.text })
        log("stt_result", { provider:stt.provider, request_id:stt.requestId, utterance_id:utteranceId, language:stt.languageCode, response_language:turnLanguage, text_length:stt.text.length }, Date.now() - started)
        const llmStarted = Date.now()
        const replyTimeoutMs = Number(process.env.V2_LLM_TIMEOUT_MS || (brainProvider === "sarvam" ? 5000 : 3000))
        let reply
        try {
          const streamResponse = process.env.V2_RESPONSE_STREAMING === "true" && brainProvider === "sarvam" && typeof brain.replyStream === "function"
          if (streamResponse) {
            const phraseBuffer = createPhraseBuffer({ minimumCharacters:Number(process.env.V2_TTS_PHRASE_MIN_CHARS || 18) })
            let fullText = ""; let usage = {}; let firstTokenAt = 0
            for await (const chunk of brain.replyStream({ language:turnLanguage, history, callerText:stt.text, memory:callMemory, signal:AbortSignal.any([requestController.signal, AbortSignal.timeout(replyTimeoutMs)]) })) {
              if (!firstTokenAt) { firstTokenAt = Date.now(); log("llm_first_token", { utterance_id:utteranceId }, firstTokenAt - llmStarted) }
              fullText += chunk.text; usage = chunk.usage || usage
              const phrase = phraseBuffer.push(chunk.text)
              if (phrase) { log("tts_phrase_ready", { utterance_id:utteranceId, characters:[...phrase].length }); await speak(phrase, epoch, started, turnLanguage) }
            }
            const lastPhrase = phraseBuffer.flush()
            if (lastPhrase) { log("tts_phrase_ready", { utterance_id:utteranceId, characters:[...lastPhrase].length }); await speak(lastPhrase, epoch, started, turnLanguage) }
            reply = { text:fullText.trim(), usage, provider:"sarvam-conversations", model:"sarvam-105b-conversations", streamed:true }
          } else reply = await brain.reply({ language:turnLanguage, history, callerText:stt.text, memory:callMemory, signal:AbortSignal.any([requestController.signal, AbortSignal.timeout(replyTimeoutMs)]) })
        } catch (error) {
          if (requestController.signal.aborted) return
          reply = { text:localReplyFallback(turnLanguage, stt.text), provider:"local-fallback", model:"timeout" }
          log("llm_fallback", { utterance_id:utteranceId, reason:error.name || "request_failed", timeout_ms:replyTimeoutMs }, Date.now() - llmStarted)
        }
        if (closed || epoch !== generation) return
        history.push({ role:"assistant", content:reply.text })
        callMemory.turns.push({ turn:callMemory.turns.length + 1, caller:stt.text, agent:reply.text })
        callMemory.turns = callMemory.turns.slice(-16)
        // Store one complete agent turn, even when audio was delivered in
        // multiple streaming phrases. That makes the debug transcript match
        // the conversational meaning rather than the transport chunks.
        void transcripts.write("agent", reply.text)
        log("llm_response", { provider:reply.provider, model:reply.model, utterance_id:utteranceId, input_tokens:reply.usage?.prompt_tokens || 0, output_tokens:reply.usage?.completion_tokens || 0, total_tokens:reply.usage?.total_tokens || 0 }, Date.now() - llmStarted)
        callUsage.llmProvider = reply.provider || callUsage.llmProvider
        callUsage.inputTokens += Number(reply.usage?.prompt_tokens) || 0
        callUsage.outputTokens += Number(reply.usage?.completion_tokens) || 0
        // Streaming already speaks each completed phrase as it arrives.  A
        // second whole-reply speak here duplicated the final sentence.
        if (!reply.streamed) await speak(reply.text, epoch, started, turnLanguage)
      } catch (error) { if (!requestController.signal.aborted) log("error", { component:"v2_turn", message:error.message || String(error) }, Date.now() - started) }
      finally { if (turnRequestController === requestController) turnRequestController = undefined }
    }
    const turnController = createCallerTurnController({
      // Keep a natural pause, but do not add more than three quarters of a
      // second before the network pipeline may start its work.
      endSilenceMs:audioConfig.endSilenceMs,
      onBargeIn:() => {
        // A caller beginning a new thought must stop agent audio immediately.
        // It also makes an earlier, incomplete user turn obsolete; preserving
        // that request was the source of the silent-call race.
        turnRequestController?.abort("caller_continued_speaking")
        turnRequestController = undefined
        cancelSpeech("caller_started_speaking")
      },
      onActivityStart:({ utteranceId }) => log("vad_start", { utterance_id:utteranceId }),
      onActivityEnd:turn => { log("vad_end", { utterance_id:turn.utteranceId, audio_bytes:turn.audio.length }); void processTurn(turn) }
    })
    const close = () => { if (closed) return; closed = true; turnRequestController?.abort("call_closed"); turnController.reset(); cancelSpeech("call_closed"); void transcripts.flush().finally(() => persistUsage("stream_closed")) }
    socket.on("close", close)
    socket.on("message", raw => {
      try {
        const event = JSON.parse(raw.toString())
        if (event.event === "stop") return close()
        if (event.event !== "media" || !event.media?.payload) return
        const pcm = decodePlivoInboundAudio(event.media.payload, process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000", process.env.PLIVO_L16_BYTE_ORDER || "little")
        turnController.push(pcm)
      } catch (error) { log("error", { component:"plivo_v2_input", message:error.message }) }
    })
    log("call_started", { provider:"plivo", language, agentId:"sarvam-openrouter-v2", audio_config:audioConfig })
    // V2 starts with an open invitation. It must not place the caller into a
    // discovery, pitch, demo, or simulated-order workflow.
    const welcome = agentFirstGreeting(language)
    history.push({ role:"assistant", content:welcome })
    void transcripts.write("agent", welcome)
    void speak(welcome)
  })
}
