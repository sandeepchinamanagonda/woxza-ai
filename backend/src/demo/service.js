import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import { readFile } from "node:fs/promises"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import { upsertLeadForTerminalCall } from "./lead.js"

const CASES = new Set(["appointment", "restaurant", "distribution", "payments"])
const TERMINAL = new Set(["completed", "no_answer", "failed"])
const xmlEscape = value => String(value).replace(/[<>&'\"]/g, c => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;", "'":"&apos;", '"':"&quot;" })[c])
const normalizePlivoStatus = value => {
  const status = String(value || "").toLowerCase().replaceAll("-", "_")
  if (["answered", "in_progress"].includes(status)) return "connected"
  if (["completed", "hangup"].includes(status)) return "completed"
  if (["no_answer", "busy", "timeout", "cancel"].includes(status)) return "no_answer"
  if (["ringing", "queued", "initiated"].includes(status)) return "ringing"
  return "failed"
}

export function createDemoService({ db, limiter, plivo, followupQueue, bridgeUrl, publicUrl, signingSecret }) {
  return {
    async create(input, ip) {
      if (input.website) return { silent:true }
      if (!CASES.has(input.useCase)) return { error:"Choose a valid use case", status:400 }
      if (typeof input.name !== "string" || !input.name.trim() || input.name.trim().length > 160) return { error:"Enter your name", status:400 }
      const parsed = parsePhoneNumberFromString(String(input.phone || ""))
      if (!parsed?.isValid()) return { error:"Enter a valid phone number including country code", status:400 }
      if (input.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return { error:"Enter a valid email address", status:400 }
      const phone = parsed.number
      const limited = await limiter.consume({ phone, ip })
      if (!limited.allowed) return { error:"Demo call limit reached", reason:limited.reason, status:429 }
      const id = randomUUID()
      await db.query(
        `INSERT INTO demo_calls (id,use_case,name,phone,email,ip,consent_marketing) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [id,input.useCase,input.name.trim(),phone,input.email?.trim().toLowerCase() || null,ip,Boolean(input.consentMarketing)]
      )
      try {
        const provider = await plivo.call({ callId:id, to:phone })
        await db.query(`UPDATE demo_calls SET status='ringing',provider_call_id=$2,updated_at=NOW() WHERE id=$1`, [id,provider.providerCallId || null])
      } catch (error) {
        await db.query(`UPDATE demo_calls SET status='failed',updated_at=NOW() WHERE id=$1`, [id])
        await this.finalize(id)
        throw error
      }
      return { status:"calling", callId:id, httpStatus:201 }
    },
    async status(id) {
      const result = await db.query(`SELECT id,status FROM demo_calls WHERE id=$1`, [id])
      return result.rows[0] ? { callId:result.rows[0].id, status:result.rows[0].status } : null
    },
    async answer(id) {
      const result = await db.query(`UPDATE demo_calls SET status='connected',updated_at=NOW() WHERE id=$1 RETURNING use_case`, [id])
      if (!result.rowCount) return null
      const stream = new URL(bridgeUrl)
      stream.searchParams.set("demoCallId", id)
      const promptUrl = new URL(`../../demo_prompts/${result.rows[0].use_case}.txt`, import.meta.url)
      stream.searchParams.set("systemPrompt", await readFile(promptUrl, "utf8"))
      return `<?xml version="1.0" encoding="UTF-8"?><Response><Stream bidirectional="true" keepCallAlive="true" contentType="audio/x-mulaw;rate=8000">${xmlEscape(stream.toString())}</Stream><Wait length="90"/><Hangup/></Response>`
    },
    async callback(id, fields) {
      const status = normalizePlivoStatus(fields.CallStatus || fields.Status || fields.Event || fields.EventType || fields.call_status)
      const duration = Number.parseInt(fields.Duration || fields.ConversationDuration || fields.BillDuration || fields.duration, 10)
      await db.query(`UPDATE demo_calls SET status=$2,call_duration_seconds=COALESCE($3,call_duration_seconds),provider_call_id=COALESCE($4,provider_call_id),updated_at=NOW() WHERE id=$1`,
        [id,status,Number.isFinite(duration) ? Math.min(duration,90) : null,fields.CallUUID || fields.CallSid || fields.call_uuid || null])
      if (TERMINAL.has(status)) await this.finalize(id)
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
}
