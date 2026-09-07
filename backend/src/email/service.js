import { renderDemoSummary, renderWaitlistConfirmation } from "./render.js"
import { sendEmail } from "./sender.js"

const minimumDemoDurationSeconds = 10
const workflowLabel = value => String(value || "General product exploration").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase())

export function createEmailService({ db, send = sendEmail, websiteUrl = process.env.WEBSITE_URL, waitlistUrl = process.env.WAITLIST_FORM_URL } = {}) {
  const schedule = task => setImmediate(() => void task().catch(error => console.warn("Background email task failed", { error:error.message })))
  const demoWaitlistUrl = sessionId => {
    const url = new URL(waitlistUrl || websiteUrl || "https://woxza.com/waitlist")
    url.searchParams.set("source", "demo")
    url.searchParams.set("session_id", sessionId)
    return url.toString()
  }
  return {
    scheduleDemoSummary(sessionId) { schedule(() => this.sendDemoSummary(sessionId)) },
    scheduleDemoSummaryTest({ email, name }) { schedule(async () => {
      const htmlContent = await renderDemoSummary({ name, session_id:"TEST-DEMO-001", workflow_explored:"General product exploration", demo_date:"Today", waitlist_url:demoWaitlistUrl("TEST-DEMO-001"), website_url:websiteUrl || "https://woxza.com" })
      return send({ toEmail:email, toName:name, subject:"Your Woxza demo recap", htmlContent, emailType:"demo_summary" })
    }) },
    scheduleWaitlistConfirmation(registration) { schedule(() => this.sendWaitlistConfirmation(registration)) },
    async sendDemoSummary(sessionId) {
      const result = await db.query(`SELECT id,name,email,use_case,status,call_duration_seconds,ended_at,email_sent_at,consent_marketing FROM demo_calls WHERE id=$1`, [sessionId])
      const call = result.rows[0]
      if (!call || call.email_sent_at || !call.consent_marketing || !call.email || call.status !== "completed" || Number(call.call_duration_seconds || 0) < minimumDemoDurationSeconds) return { ok:false, reason:"ineligible" }
      const htmlContent = await renderDemoSummary({
        name:call.name || "there", session_id:call.id, workflow_explored:workflowLabel(call.use_case),
        demo_date:new Date(call.ended_at || Date.now()).toLocaleString("en-US", { dateStyle:"medium", timeStyle:"short" }),
        waitlist_url:demoWaitlistUrl(call.id), website_url:websiteUrl || "https://woxza.com"
      })
      const outcome = await send({ toEmail:call.email, toName:call.name, subject:"Your Woxza demo recap", htmlContent, emailType:"demo_summary" })
      if (outcome.ok) await db.query("UPDATE demo_calls SET email_sent_at=NOW(),updated_at=NOW() WHERE id=$1 AND email_sent_at IS NULL", [call.id])
      return outcome
    },
    async sendWaitlistConfirmation({ email, name }) {
      const htmlContent = await renderWaitlistConfirmation({ name:name || "there", website_url:websiteUrl || "https://woxza.com" })
      return send({ toEmail:email, toName:name, subject:"You’re on the Woxza waitlist!", htmlContent, emailType:"waitlist_confirmation" })
    }
  }
}
