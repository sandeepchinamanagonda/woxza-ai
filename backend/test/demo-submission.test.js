import assert from "node:assert/strict"
import test from "node:test"
import { createDemoService } from "../src/demo/service.js"

test("stores live-demo form details before starting the outbound call", async () => {
  const queries = []
  const db = { async query(sql, values = []) {
    queries.push({ sql, values })
    if (sql.includes("SELECT COUNT(*)")) return { rows:[{ count:0 }], rowCount:1 }
    return { rows:[], rowCount:1 }
  }}
  const service = createDemoService({
    db,
    plivo:{ call:async () => ({ providerCallId:"plivo-call" }) },
    twilio:{ call:async () => ({ providerCallId:"twilio-call" }) },
    followupQueue:{ add:async () => {} }, publicUrl:"https://api.example.test", signingSecret:"test"
  })

  const result = await service.create({
    use_case:"order_taking", language:"en", name:"Ada Lovelace", country_code:"+1",
    phone_number:"312 555 0100", email:"ADA@EXAMPLE.COM", consent:true
  }, "203.0.113.25")

  assert.equal(result.status, "calling")
  const submission = queries.find(({ sql }) => sql.includes("INSERT INTO demo_submissions"))
  assert.ok(submission)
  assert.deepEqual(submission.values.slice(1), [
    "Ada Lovelace", "+1", "+13125550100", "ada@example.com", "en", "order_taking", true, "203.0.113.25"
  ])
  assert.ok(queries.some(({ sql, values }) => sql.includes("UPDATE demo_submissions") && values[1] === "calling"))
})

test("does not cap repeated valid demo attempts", async () => {
  const queries = []
  const db = { async query(sql, values = []) {
    queries.push({ sql, values })
    return { rows:[], rowCount:1 }
  }}
  const service = createDemoService({
    db, plivo:{ call:async () => ({ providerCallId:"plivo-call" }) }, twilio:{ call:async () => ({ providerCallId:"twilio-call" }) }, followupQueue:{ add:async () => {} },
    publicUrl:"https://api.example.test", signingSecret:"test"
  })

  const result = await service.create({ use_case:"order_taking", language:"en", name:"Ada", country_code:"+1", phone_number:"312 555 0100", consent:true }, "203.0.113.25")
  assert.equal(result.status, "calling")
  assert.ok(!queries.some(({ sql }) => sql.includes("SELECT COUNT(*)")))
})
