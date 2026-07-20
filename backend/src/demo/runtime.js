import IORedis from "ioredis"
import { Queue, Worker } from "bullmq"
import { createPlivoClient } from "./plivo.js"
import { createTwilioClient } from "./twilio.js"
import { createDemoService } from "./service.js"

let redis

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !to) return false
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST", headers:{ authorization:`Bearer ${process.env.RESEND_API_KEY}`, "content-type":"application/json" },
    body:JSON.stringify({ from:process.env.DEMO_EMAIL_FROM || "Woxza <demo@woxza.ai>", to:[to], subject, html })
  })
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`)
  return true
}

export function createDemoRuntime(db) {
  const publicUrl = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 8787}`).replace(/\/$/, "")
  const redisUrl = process.env.REDIS_URL
  redis ||= redisUrl ? new IORedis(redisUrl, { maxRetriesPerRequest:null }) : null
  redis?.on("error", error => console.warn("Redis runtime error", { error:error.message }))
  const queue = redis ? new Queue("voxa-jobs", { connection:redis }) : { add:async () => {} }
  const plivo = createPlivoClient({
    authId:process.env.PLIVO_AUTH_ID, authToken:process.env.PLIVO_AUTH_TOKEN,
    fromNumber:process.env.PLIVO_FROM_NUMBER, publicUrl
  })
  const twilio = createTwilioClient({
    accountSid:process.env.TWILIO_ACCOUNT_SID,
    apiKeySid:process.env.TWILIO_API_KEY_SID,
    apiKeySecret:process.env.TWILIO_API_KEY_SECRET,
    authToken:process.env.TWILIO_AUTH_TOKEN,
    fromNumber:process.env.TWILIO_FROM_NUMBER,
    publicUrl
  })
  const unavailableProvider = name => ({ call:async () => { throw Object.assign(new Error(`${name} is not fully configured`), { status:503 }) } })
  const service = createDemoService({
    db, plivo:plivo || unavailableProvider("Plivo"), twilio:twilio || unavailableProvider("Twilio"), followupQueue:queue,
    bridgeUrl:process.env.GEMINI_LIVE_BRIDGE_URL || "wss://example.invalid/gemini-live",
    publicUrl, signingSecret:process.env.UNSUBSCRIBE_SIGNING_SECRET || "development-only-change-me"
  })

  const worker = redis ? new Worker("voxa-jobs", async job => {
    if (job.name !== "send-demo-followup") return
    const result = await db.query(`SELECT * FROM leads WHERE id=$1`, [job.data.leadId])
    const lead = result.rows[0]
    if (!lead?.consent_marketing || !lead.email || lead.contact_status === "unsubscribed") return
    const completed = lead.call_outcome === "connected"
    const subject = completed ? "Thanks for trying Woxza" : "We tried to reach you"
    const heading = completed ? "Thanks for trying Woxza — here’s what you just experienced" : "We tried to reach you — want to try again?"
    const cta = completed ? `${process.env.WEBSITE_URL || "https://woxza.ai"}/#contact` : `${process.env.WEBSITE_URL || "https://woxza.ai"}/#live-demo`
    const unsubscribe = service.signUnsubscribe(lead.id)
    const sent = await sendEmail({ to:lead.email, subject, html:`<h1>${heading}</h1><p>Woxza handled a real voice workflow in seconds.</p><p><a href="${cta}">${completed ? "Join the waitlist" : "Retry the demo"}</a></p><p><small><a href="${unsubscribe}">Unsubscribe</a></small></p>` })
    if (sent) await db.query(`UPDATE leads SET contact_status='emailed',last_contacted_at=NOW() WHERE id=$1 AND contact_status<>'unsubscribed'`, [lead.id])
  }, { connection:redis }) : null

  const health = async () => {
    const started = Date.now()
    let redisHealth = { available:false }
    try { if (redis) { await redis.ping(); redisHealth = { available:true, latencyMs:Date.now() - started } } } catch (error) { redisHealth = { available:false, error:error.message } }
    let queues = {}
    try { queues = queue?.getJobCounts ? await queue.getJobCounts("waiting", "active", "delayed", "failed") : {} } catch (error) { queues = { error:error.message } }
    return { redis:redisHealth, queues }
  }
  return { service, health, close:async () => { await worker?.close(); await queue?.close?.(); await redis?.quit(); redis=null } }
}
