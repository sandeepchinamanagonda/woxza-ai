const number = (value, fallback=0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

const rate = (name, fallback) => number(process.env[name], fallback)

// Rates are deliberately configuration, not source code. Update them from a
// provider invoice without redeploying application logic. They are estimates:
// the provider dashboard/invoice remains the billing authority.
export function estimateCallCosts({
  sttAudioSeconds=0,
  sttModel="saaras:v3-realtime",
  ttsCharacters=0,
  ttsProvider="sarvam-bulbul",
  llmProvider="",
  llmModel="",
  inputTokens=0,
  outputTokens=0,
  cachedInputTokens=0
}={}) {
  const sttRate = String(sttModel).includes("v4")
    ? rate("VOICE_COST_SARVAM_STT_V4_INR_PER_MIN", 0.5)
    : rate("VOICE_COST_SARVAM_STT_V3_INR_PER_MIN", 0.3)
  const sttInr = number(sttAudioSeconds) / 60 * sttRate
  // Self-hosted providers do not have a per-character provider charge. Their
  // character count is still persisted for utilization and capacity planning.
  const ttsInr = String(ttsProvider).toLowerCase().startsWith("sarvam")
    ? number(ttsCharacters) / 1000 * rate("VOICE_COST_SARVAM_TTS_INR_PER_1K_CHARS", 3)
    : 0
  const provider = String(llmProvider).toLowerCase()
  const cachedTokens = Math.min(number(inputTokens), Math.max(0, number(cachedInputTokens)))
  const uncachedInputTokens = Math.max(0, number(inputTokens) - cachedTokens)
  const isSarvam = provider.startsWith("sarvam")
  const isGemini = provider === "gemini" || provider.startsWith("google")
  const sarvamLlmInr = isSarvam
    ? uncachedInputTokens / 1_000_000 * rate("VOICE_COST_SARVAM_105B_INPUT_INR_PER_MILLION", 29.28)
      + cachedTokens / 1_000_000 * rate("VOICE_COST_SARVAM_105B_CACHED_INPUT_INR_PER_MILLION", 10.98)
      + number(outputTokens) / 1_000_000 * rate("VOICE_COST_SARVAM_105B_OUTPUT_INR_PER_MILLION", 73.2)
    : 0
  // V3 Gemini is text-only Flash. Do not use this calculation for Gemini Live:
  // Live has separately priced audio input/output token classes.
  const geminiUsd = isGemini
    ? uncachedInputTokens / 1_000_000 * rate("V3_GEMINI_INPUT_USD_PER_MILLION", 0.30)
      + cachedTokens / 1_000_000 * rate("V3_GEMINI_CACHED_INPUT_USD_PER_MILLION", 0.03)
      + number(outputTokens) / 1_000_000 * rate("V3_GEMINI_OUTPUT_USD_PER_MILLION", 2.50)
    : 0
  const geminiInr = geminiUsd * rate("VOICE_COST_USD_TO_INR", 94.5)
  const llmInr = sarvamLlmInr + geminiInr
  return {
    sttInr:Number(sttInr.toFixed(6)),
    ttsInr:Number(ttsInr.toFixed(6)),
    llmInr:Number(llmInr.toFixed(6)),
    geminiUsd:Number(geminiUsd.toFixed(10)),
    geminiInr:Number(geminiInr.toFixed(6)),
    llmModel:String(llmModel || "") || null,
    totalInr:Number((sttInr + ttsInr + llmInr).toFixed(6)),
    version:process.env.VOICE_COST_ESTIMATION_VERSION || "sarvam-2026-09"
  }
}

// Best-effort accounting: a telemetry write can never delay or fail a call.
// INSERT makes this safe even if the call-start event has not reached Postgres
// yet; the normal lifecycle event later fills in provider and caller metadata.
export function persistCallCost(db, {
  callId,
  demoCallId=null,
  sttAudioSeconds=0,
  sttModel,
  ttsCharacters=0,
  ttsProvider="sarvam-bulbul",
  llmProvider,
  llmModel,
  inputTokens=0,
  outputTokens=0,
  cachedInputTokens=0
}={}) {
  if (!db?.query || !callId) return
  const costs = estimateCallCosts({ sttAudioSeconds, sttModel, ttsCharacters, ttsProvider, llmProvider, llmModel, inputTokens, outputTokens, cachedInputTokens })
  void db.query(
    `INSERT INTO calls (call_id,demo_call_id,org_id,provider,status,cost_estimation_version)
     VALUES ($1,$2,'woxza','unknown','in_progress',$3)
     ON CONFLICT (call_id) DO NOTHING`,
    [String(callId), demoCallId, costs.version]
  ).then(() => db.query(
    `UPDATE calls
     SET stt_audio_seconds=$2, tts_characters=$3, llm_cached_input_tokens=$4,
         input_tokens=$5, output_tokens=$6, total_tokens=$7,
         estimated_stt_inr=$8, estimated_tts_inr=$9, estimated_llm_inr=$10,
         estimated_gemini_usd=$11, estimated_gemini_inr=$12, llm_model=$13,
         estimated_total_inr=$14, cost_estimation_version=$15
     WHERE call_id=$1`,
    [String(callId), number(sttAudioSeconds), Math.max(0, Math.round(number(ttsCharacters))), Math.max(0, Math.round(number(cachedInputTokens))), Math.max(0, Math.round(number(inputTokens))), Math.max(0, Math.round(number(outputTokens))), Math.max(0, Math.round(number(inputTokens) + number(outputTokens))), costs.sttInr, costs.ttsInr, costs.llmInr, costs.geminiUsd, costs.geminiInr, costs.llmModel, costs.totalInr, costs.version]
  )).catch(error => console.warn("Call cost persistence failed", { callId:String(callId), error:error.message }))
  return costs
}
