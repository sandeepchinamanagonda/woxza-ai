import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import { upsertLeadForTerminalCall } from "./lead.js"
// USE_CASES is derived from USE_CASE_CONFIG in prompt.js; add scenarios there only.
import { LANGUAGES, normalizeUseCase, USE_CASES } from "./prompt.js"

const TERMINAL = new Set(["completed", "no_answer", "failed"])
export const DEMO_RING_TIMEOUT_MS = 75_000
const xmlEscape = value => String(value).replace(/[<>&'\"]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" })[c])
const normalizePlivoStatus = value => {
  const status = String(value || "").toLowerCase().replaceAll("-", "_")
  if (["answered", "in_progress"].includes(status)) return "connected"
  if (["completed", "hangup"].includes(status)) return "completed"
  if (["no_answer", "busy", "timeout", "cancel"].includes(status)) return "no_answer"
  if (["ringing", "queued", "initiated"].includes(status)) return "ringing"
  return "failed"
}

export function createDemoService({ db, plivo, twilio, followupQueue, bridgeUrl, publicUrl, signingSecret }) {
  const timers = new Map()
  const clearTimers = id => {
    const callTimers = timers.get(id)
    if (!callTimers) return
    timers.delete(id)
  }
  const service = {
    async create(input, ip) {
      if (input.website) return { silent:true }
      const entryHint = input.entry_hint || input.entryHint || input.use_case || input.useCase || null
      const useCase = entryHint ? normalizeUseCase(entryHint) : "discover"
      const language = input.language || "en"
      if (!USE_CASES.has(useCase)) return { error:"Choose a valid use case", status:400 }
      if (!LANGUAGES.has(language)) return { error:"Choose a supported language", status:400 }
      if (input.consent !== true && input.consentMarketing !== true) return { error:"Consent is required to try the live demo", status:400 }
      if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 160) return { error:"Enter your name", status:400 }
      const suppliedPhone = input.phone_number ? `${input.country_code || ""}${input.phone_number}` : input.phone
      const parsed = parsePhoneNumberFromString(String(suppliedPhone || ""))
      if (!parsed?.isValid()) return { error:"Enter a valid phone number including country code", status:400 }
      if (process.env.NODE_ENV === "production" && parsed.countryCallingCode !== "91") {
        return { error:"Live demo calls are currently available in India only.", status:403 }
      }
      if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return { error:"Enter a valid email address", status:400 }
      const phone = parsed.number
      const submissionId = randomUUID()
      const countryCode = `+${parsed.countryCallingCode}`
      await db.query(
        `INSERT INTO demo_submissions
          (id,name,country_code,phone,email,language,use_case,consent_marketing,ip)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [submissionId, input.name.trim(), countryCode, phone, input.email?.trim().toLowerCase() || null,
          language, useCase, true, ip]
      )
      const updateSubmission = (status, failureReason = null, demoCallId = null) => db.query(
        `UPDATE demo_submissions
         SET status=$2, failure_reason=$3, demo_call_id=COALESCE($4,demo_call_id), updated_at=NOW()
         WHERE id=$1`,
        [submissionId, status, failureReason, demoCallId]
      )
      const id = randomUUID()
      await db.query(
        `INSERT INTO demo_calls (id,use_case,entry_hint,language,name,phone,email,ip,consent_marketing,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'initiating')`,
        [id,useCase,entryHint ? useCase : null,language,input.name.trim(),phone,input.email?.trim().toLowerCase() || null,ip,true]
      )
      await updateSubmission("calling", null, id)
      try {
        const providerClient = parsed.countryCallingCode === "1" ? twilio : plivo
        const provider = await providerClient.call({ callId:id, to:phone })
        await db.query(`UPDATE demo_calls SET status='ringing',provider_call_id=$2,updated_at=NOW() WHERE id=$1`, [id,provider.providerCallId || null])
      } catch (error) {
        await db.query(`UPDATE demo_calls SET status='failed',updated_at=NOW() WHERE id=$1`, [id])
        await updateSubmission("failed", "provider_error", id)
        await this.finalize(id)
        throw error
      }
      return { status:"calling", callId:id, httpStatus:202 }
    },
    async status(id) {
      const expired = await db.query(
        `UPDATE demo_calls
         SET status='no_answer',end_reason='callback_timeout',ended_at=NOW(),updated_at=NOW()
         WHERE id=$1
           AND status IN ('initiating','ringing')
           AND created_at < NOW() - ($2 * INTERVAL '1 millisecond')
         RETURNING id`,
        [id,DEMO_RING_TIMEOUT_MS]
      )
      if (expired.rowCount) await this.finalize(id)
      const result = await db.query(`SELECT id,status FROM demo_calls WHERE id=$1`, [id])
      return result.rows[0] ? { callId:result.rows[0].id, status:result.rows[0].status } : null
    },
    async answer(id, fields = {}) {
      const result = await db.query(`UPDATE demo_calls SET status='connected',answered_at=COALESCE(answered_at,NOW()),provider_call_id=COALESCE($2,provider_call_id),updated_at=NOW() WHERE id=$1 RETURNING use_case,language,name,provider_call_id`, [id,fields.CallUUID || fields.call_uuid || fields.CallSid || null])
      if (!result.rowCount) return null
      const call = result.rows[0]
      const stream = new URL(publicUrl.replace(/^http/, "ws") + "/telephony/plivo/stream")
      stream.searchParams.set("demoCallId", id)
      stream.searchParams.set("lang", call.language)
      console.info("demo-language-config", { callId:id, requested:call.language, configured:call.language })
      clearTimers(id)
      timers.set(id, {})
      // Plivo's current docs disallow audioTrack="both" for bidirectional streams;
      // inbound is the valid caller-audio track while model audio is sent via playAudio.
      // L16 wideband input preserves substantially more speech detail than
      // phone-native μ-law. The bridge converts network-order L16 to the
      // little-endian PCM Gemini Live expects.
      const streamContentType = process.env.PLIVO_STREAM_CONTENT_TYPE || "audio/x-l16;rate=16000"
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Stream bidirectional="true" audioTrack="inbound" keepCallAlive="true" contentType="${xmlEscape(streamContentType)}">${xmlEscape(stream.toString())}</Stream><Wait length="95"/><Hangup/></Response>`
    },
    async twilioAnswer(id, fields = {}) {
      const result = await db.query(`UPDATE demo_calls SET status='connected',answered_at=COALESCE(answered_at,NOW()),provider_call_id=COALESCE($2,provider_call_id),updated_at=NOW() WHERE id=$1 RETURNING language`, [id,fields.CallSid || null])
      if (!result.rowCount) return null
      // Twilio does not preserve query parameters on a Media Stream URL.
      // Pass the short-lived demo identity as TwiML Parameters instead; Twilio
      // returns them in the WebSocket `start.customParameters` envelope.
      const stream = new URL(publicUrl.replace(/^http/, "ws") + "/ws/twilio")
      clearTimers(id)
      timers.set(id, {})
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Connect><Stream url="${xmlEscape(stream.toString())}"><Parameter name="demoCallId" value="${xmlEscape(id)}" /><Parameter name="lang" value="${xmlEscape(result.rows[0].language)}" /></Stream></Connect></Response>`
    },
    async createInboundTwilioCall(fields = {}) {
      const callSid = String(fields.CallSid || "").trim()
      if (!callSid) return null
      const existing = await db.query(`SELECT id FROM demo_calls WHERE provider_call_id=$1 ORDER BY created_at DESC LIMIT 1`, [callSid])
      if (existing.rowCount) return existing.rows[0].id
      const id = randomUUID()
      const from = String(fields.From || "anonymous").slice(0, 32)
      await db.query(`INSERT INTO demo_calls (id,use_case,language,name,phone,email,ip,consent_marketing,status,provider_call_id) VALUES ($1,'appointment_booking','en','Woxza caller',$2,NULL,'0.0.0.0',FALSE,'ringing',$3)`, [id,from,callSid])
      return id
    },
    async callback(id, fields) {
      const status = normalizePlivoStatus(fields.CallStatus || fields.Status || fields.Event || fields.EventType || fields.call_status)
      const duration = Number.parseInt(fields.Duration || fields.ConversationDuration || fields.BillDuration || fields.duration, 10)
      const endReason = status === "completed" ? "caller_hangup" : status === "no_answer" ? "no_answer" : status === "failed" ? "provider_failed" : null
      await db.query(`UPDATE demo_calls SET status=$2,call_duration_seconds=COALESCE($3,call_duration_seconds),provider_call_id=COALESCE($4,provider_call_id),end_reason=COALESCE(end_reason,$5),ended_at=CASE WHEN $6 THEN NOW() ELSE ended_at END,updated_at=NOW() WHERE id=$1`,
        [id,status,Number.isFinite(duration) ? duration : null,fields.CallUUID || fields.CallSid || fields.call_uuid || null,endReason,TERMINAL.has(status)])
      if (TERMINAL.has(status)) { clearTimers(id); await this.finalize(id) }
      return status
    },
    async finalize(id) {
      const lead = await upsertLeadForTerminalCall(db,id)
      if (lead?.consent_marketing && lead.email) {
        const claimed = await db.query(`UPDATE demo_calls SET followup_enqueued_at=NOW() WHERE id=$1 AND followup_enqueued_at IS NULL RETURNING id`, [id])
        if (claimed.rowCount) await followupQueue.add("send-demo-followup", { leadId:lead.id }, { delay:300000, jobId:`demo-followup-${id}` })
      }
      return lead
    },
    signUnsubscribe(leadId) {
      const signature = createHmac("sha256", signingSecret).update(leadId).digest("hex")
      return `${publicUrl}/api/leads/unsubscribe?lead=${leadId}&token=${signature}`
    },
    verifyUnsubscribe(leadId, token) {
      const expected = createHmac("sha256", signingSecret).update(leadId).digest("hex")
      if (typeof token !== "string" || token.length !== expected.length) return false
      return timingSafeEqual(Buffer.from(token),Buffer.from(expected))
    }
  }
  return service
}
