import assert from "node:assert/strict"
import test from "node:test"
import { renderDemoSummary, renderWaitlistConfirmation } from "../src/email/render.js"
import { sendEmail } from "../src/email/sender.js"
import { createEmailService } from "../src/email/service.js"

test("email templates render with optional values absent", async () => {
  const demo = await renderDemoSummary({ name:"Ada", session_id:"abc", workflow_explored:"", demo_date:"Today", waitlist_url:"https://example.test/waitlist", website_url:"https://example.test" })
  const waitlist = await renderWaitlistConfirmation({ name:"", website_url:"https://example.test" })
  assert.match(demo, /Well, that didn't feel like talking to a robot/)
  assert.match(waitlist, /You're on the list/)
})

test("Brevo sender uses the expected payload and swallows provider errors", async () => {
  const original = { provider:process.env.EMAIL_PROVIDER, key:process.env.EMAIL_API_KEY, address:process.env.EMAIL_FROM_ADDRESS, name:process.env.EMAIL_FROM_NAME }
  Object.assign(process.env, { EMAIL_PROVIDER:"brevo", EMAIL_API_KEY:"key", EMAIL_FROM_ADDRESS:"hello@example.test", EMAIL_FROM_NAME:"Woxza" })
  let request
  const ok = await sendEmail({ toEmail:"ada@example.test", toName:"Ada", subject:"Hello", htmlContent:"<p>Hi</p>", emailType:"test", fetchImpl:async (url, options) => { request={ url, options }; return { ok:true, status:201 } } })
  assert.equal(ok.ok, true)
  assert.equal(request.url, "https://api.brevo.com/v3/smtp/email")
  assert.deepEqual(JSON.parse(request.options.body).to, [{ email:"ada@example.test", name:"Ada" }])
  const failed = await sendEmail({ toEmail:"ada@example.test", subject:"Hello", htmlContent:"<p>Hi</p>", emailType:"test", fetchImpl:async () => ({ ok:false, status:429 }) })
  assert.equal(failed.reason, "rate_limited")
  Object.assign(process.env, original)
})

test("demo summary only sends once for a completed meaningful call", async () => {
  const call = { id:"call-1", name:"Ada", email:"ada@example.test", use_case:"appointment_booking", status:"completed", call_duration_seconds:14, ended_at:"2026-07-25T12:00:00Z", email_sent_at:null, consent_marketing:true }
  let sends = 0; let marked = 0
  const db = { query:async sql => {
    if (sql.startsWith("SELECT id,name,email")) return { rows:[call] }
    if (sql.startsWith("UPDATE demo_calls SET email_sent_at")) { marked += 1; call.email_sent_at="now"; return { rowCount:1, rows:[] } }
    throw new Error(`Unexpected query: ${sql}`)
  }}
  const service = createEmailService({ db, send:async () => { sends += 1; return { ok:true } }, websiteUrl:"https://woxza.com", waitlistUrl:"https://woxza.com/waitlist" })
  assert.equal((await service.sendDemoSummary("call-1")).ok, true)
  assert.equal((await service.sendDemoSummary("call-1")).reason, "ineligible")
  assert.equal(sends, 1); assert.equal(marked, 1)
})
