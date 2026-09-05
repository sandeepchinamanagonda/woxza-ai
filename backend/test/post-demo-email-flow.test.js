import assert from "node:assert/strict"
import test from "node:test"
import { createDemoService } from "../src/demo/service.js"

test("call callback schedules a summary only for a completed meaningful call", async () => {
  const scheduled = []
  const claimed = new Set()
  const db = { query:async (sql, values = []) => {
    if (sql.startsWith("UPDATE demo_calls SET status")) return { rowCount:1, rows:[] }
    if (sql.startsWith("INSERT INTO leads")) return { rowCount:0, rows:[] }
    if (sql.startsWith("UPDATE demo_calls SET email_summary_scheduled_at")) {
      if (claimed.has(values[0])) return { rowCount:0, rows:[] }
      claimed.add(values[0]); return { rowCount:1, rows:[{ id:values[0] }] }
    }
    return { rowCount:0, rows:[] }
  }}
  const service = createDemoService({ db, plivo:{}, twilio:{}, followupQueue:{}, emailService:{ scheduleDemoSummary:id => scheduled.push(id) }, publicUrl:"https://api.example.test", signingSecret:"test" })
  await service.callback("valid-call", { CallStatus:"completed", Duration:"12" })
  await service.callback("valid-call", { CallStatus:"completed", Duration:"12" })
  await service.callback("short-call", { CallStatus:"completed", Duration:"2" })
  await service.callback("missed-call", { CallStatus:"no-answer", Duration:"42" })
  assert.deepEqual(scheduled, ["valid-call"])
})
