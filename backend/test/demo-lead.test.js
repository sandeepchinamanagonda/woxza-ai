import assert from "node:assert/strict"
import test from "node:test"
import { upsertLeadForTerminalCall } from "../src/demo/lead.js"

test("terminal webhook lead upsert is idempotent", async () => {
  const calls = new Map([["call-1", { id:"call-1", status:"completed", name:"Ada", phone:"+13125550100", email:"ada@example.com", use_case:"appointment", call_duration_seconds:42, consent_marketing:true }]])
  const leads = new Map()
  const db = { async query(sql, values) {
    const call = calls.get(values[0])
    if (!call || !["completed","no_answer","failed"].includes(call.status)) return { rowCount:0, rows:[] }
    const current = leads.get(call.id) || { id:values[1], demo_call_id:call.id, contact_status:"new" }
    const lead = { ...current, ...call, call_outcome:call.status === "completed" ? "connected" : call.status, consent_marketing:current.contact_status === "unsubscribed" ? false : call.consent_marketing }
    leads.set(call.id,lead)
    return { rowCount:1, rows:[lead] }
  }}
  const first = await upsertLeadForTerminalCall(db,"call-1")
  const second = await upsertLeadForTerminalCall(db,"call-1")
  assert.equal(first.id,second.id)
  assert.equal(leads.size,1)
  assert.equal(second.call_outcome,"connected")
})

test("non-terminal calls do not create leads", async () => {
  const db = { query:async () => ({ rowCount:0, rows:[] }) }
  assert.equal(await upsertLeadForTerminalCall(db,"ringing-call"),null)
})
