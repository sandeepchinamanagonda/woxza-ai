import { randomUUID } from "node:crypto"

// The only module allowed to hand agent PCM to a carrier. Every callback is
// fenced by both job id and epoch so late TTS chunks cannot leak into a later turn.
export function createResponseJobManager({ db=null, demoCallId, onAudio=()=>{}, onEvent=()=>{}, persistTranscript=async()=>null, now=Date.now }={}) {
  let active = null
  const emit = (event, job=active, extra={}) => onEvent({ event, job, ...extra })
  const persist = async job => {
    if (!job || job.transcript_turn_id) return job
    const transcript_turn_id = await persistTranscript({ responseJobId:job.id, text:job.response_text, deliveryStatus:job.status })
    return { ...job, transcript_turn_id }
  }
  const update = async (job, patch={}) => {
    const next = { ...job, ...patch }
    if (active?.id === job.id) active = next
    if (db) await db.query(
      "UPDATE call_response_jobs SET status=$2, render_epoch=$3, first_audio_at=$4, completed_at=$5, cancelled_at=$6, transcript_turn_id=$7, failure_reason=$8 WHERE id=$1",
      [next.id, next.status, next.render_epoch, next.first_audio_at || null, next.completed_at || null, next.cancelled_at || null, next.transcript_turn_id || null, next.failure_reason || null]
    )
    return next
  }
  return {
    async create({ canonicalTurnId=null, action, responseText, language, textSource, ttsProvider="gemini-tts", ttsModel=null }) {
      if (active && ["rendering","locked_playing"].includes(active.status)) throw new Error("A response job is already active")
      const job = { id:randomUUID(), demo_call_id:demoCallId, canonical_turn_id:canonicalTurnId, action, response_text:responseText, language_code:language, text_source:textSource, tts_provider:ttsProvider, tts_model:ttsModel, status:"rendering", render_epoch:1, created_at:new Date(now()).toISOString(), first_audio_at:null, completed_at:null, cancelled_at:null, transcript_turn_id:null, audio_duration_ms:0 }
      active = job
      if (db) await db.query("INSERT INTO call_response_jobs (id,demo_call_id,canonical_turn_id,action,response_text,language_code,text_source,status,render_epoch,tts_provider,tts_model) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)", [job.id, job.demo_call_id, job.canonical_turn_id, job.action, job.response_text, job.language_code, job.text_source, job.status, job.render_epoch, job.tts_provider, job.tts_model])
      emit("response_job_created", job)
      return job
    },
    async deliver({ responseJobId, renderEpoch, pcm }) {
      if (!active || active.id !== responseJobId || active.render_epoch !== renderEpoch || !["rendering","locked_playing"].includes(active.status)) { emit("response_audio_discarded", active, { response_job_id:responseJobId, render_epoch:renderEpoch, reason:"stale_or_unowned_audio" }); return false }
      if (active.status === "rendering") {
        active = await update(active, { status:"locked_playing", first_audio_at:new Date(now()).toISOString() })
        active = await persist(active)
        if (db && active.transcript_turn_id) await db.query("UPDATE call_response_jobs SET transcript_turn_id=$2 WHERE id=$1", [active.id, active.transcript_turn_id])
        emit("response_job_locked", active)
      }
      // All approved renderers currently produce 24 kHz mono PCM16.
      active = { ...active, audio_duration_ms:active.audio_duration_ms + (pcm.length / 48) }
      onAudio(pcm, { responseJobId, renderEpoch, action:active.action })
      return true
    },
    async complete({ responseJobId, renderEpoch }) {
      if (!active || active.id !== responseJobId || active.render_epoch !== renderEpoch || active.status !== "locked_playing") return false
      active = await update(active, { status:"completed", completed_at:new Date(now()).toISOString() })
      emit("response_job_completed", active)
      return true
    },
    async interrupt(reason="caller_barge_in") {
      if (!active || !["rendering","locked_playing"].includes(active.status)) return null
      const controller = active.abort_controller
      active = await update(active, { status:active.status === "locked_playing" ? "interrupted" : "cancelled", render_epoch:active.render_epoch + 1, cancelled_at:new Date(now()).toISOString() })
      controller?.abort?.()
      emit("response_job_interrupted", active, { reason })
      return active
    },
    // This is the pre-network fence. A renderer must acquire it before it
    // makes a TTS request; a cancelled job can never start that request.
    beginRender(responseJobId, renderEpoch, controller) {
      if (!active || active.id !== responseJobId || active.render_epoch !== renderEpoch || active.status !== "rendering") {
        emit("response_render_discarded", active, { response_job_id:responseJobId, render_epoch:renderEpoch, reason:"cancelled_before_tts_request" })
        return false
      }
      active = { ...active, abort_controller:controller }
      return true
    },
    activeJob:() => active
  }
}
