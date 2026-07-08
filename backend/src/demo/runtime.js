import IORedis from "ioredis"
import { Queue, Worker } from "bullmq"
import { DemoRateLimiter, MemoryRateLimitStore, RedisRateLimitStore } from "./rate-limiter.js"
import { createPlivoClient } from "./plivo.js"
import { createExotelClient } from "./exotel.js"
import { createDemoService } from "./service.js"

let redis

async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY || !to) return false
  const response = await fetch("https://api.resend.com/emails", {
    method:"POST", headers:{ authorization:`Bearer ${process.env.RESEND_API_KEY}`, "content-type":"application/json" },
    body:JSON.stringify({ from:process.env.DEMO_EMAIL_FROM || "Voxa <demo@voxa.ai>", to:[to], subject, html })
  })
  if (!response.ok) throw new Error(`Resend request failed (${response.status})`)
  return true
}

export function createDemoRuntime(db) {
  const publicUrl = (process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 8787}`).replace(/\/$/, "")
  const redisUrl = process.env.REDIS_URL
  redis ||= redisUrl ? new IORedis(redisUrl, { maxRetriesPerRequest:null }) : null
  const limiter = new DemoRateLimiter(redis ? new RedisRateLimitStore(redis) : new MemoryRateLimitStore())
  const queue = redis ? new Queue("voxa-jobs", { connection:redis }) : { add:async () => {} }
  const plivo = createPlivoClient({
    authId:process.env.PLIVO_AUTH_ID, authToken:process.env.PLIVO_AUTH_TOKEN,
    fromNumber:process.env.PLIVO_FROM_NUMBER, publicUrl
  })
  const exotel = createExotelClient({
    accountSid:process.env.EXOTEL_ACCOUNT_SID,
    apiKey:process.env.EXOTEL_API_KEY,
    apiToken:process.env.EXOTEL_API_TOKEN,
    subdomain:process.env.EXOTEL_SUBDOMAIN,
    exophone:process.env.EXOTEL_EXOPHONE,
    appId:process.env.EXOTEL_APP_ID,
    publicUrl
  })
  const providerName = (process.env.TELEPHONY_PROVIDER || "exotel").toLowerCase()
  const provider = providerName === "plivo" ? plivo : exotel
  const unavailableProvider = { call:async () => { throw Object.assign(new Error(`${providerName === "plivo" ? "Plivo" : "Exotel"} is not fully configured`), { status:503 }) } }
  const service = createDemoService({
    db, limiter, plivo:provider || unavailableProvider, followupQueue:queue,
    bridgeUrl:process.env.GEMINI_LIVE_BRIDGE_URL || "wss://example.invalid/gemini-live",
    publicUrl, signingSecret:process.env.UNSUBSCRIBE_SIGNING_SECRET || "development-only-change-me"
  })

  const worker = redis ? new Worker("voxa-jobs", async job => {
    if (job.name !== "send-demo-followup") return
    const result = await db.query(`SELECT * FROM leads WHERE id=$1`, [job.data.leadId])
    const lead = result.rows[0]
    if (!lead?.consent_marketing || !lead.email || lead.contact_status === "unsubscribed") return
    const completed = lead.call_outcome === "connected"
    const subject = completed ? "Thanks for trying Voxa" : "We tried to reach you"
    const heading = completed ? "Thanks for trying Voxa — here’s what you just experienced" : "We tried to reach you — want to try again?"
    const cta = completed ? `${process.env.WEBSITE_URL || "https://voxa.ai"}/#contact` : `${process.env.WEBSITE_URL || "https://voxa.ai"}/#live-demo`
    const unsubscribe = service.signUnsubscribe(lead.id)
    const sent = await sendEmail({ to:lead.email, subject, html:`<h1>${heading}</h1><p>Voxa handled a real voice workflow in seconds.</p><p><a href="${cta}">${completed ? "Join the waitlist" : "Retry the demo"}</a></p><p><small><a href="${unsubscribe}">Unsubscribe</a></small></p>` })
    if (sent) await db.query(`UPDATE leads SET contact_status='emailed',last_contacted_at=NOW() WHERE id=$1 AND contact_status<>'unsubscribed'`, [lead.id])
  }, { connection:redis }) : null

  return { service, close:async () => { await worker?.close(); await queue?.close?.(); await redis?.quit(); redis=null } }
}
