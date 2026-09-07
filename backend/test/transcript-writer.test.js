import test from "node:test"
import assert from "node:assert/strict"
import { createTranscriptWriter } from "../src/transcript-writer.js"

test("persists transcript turns in write order and flushes the final turn", async () => {
  const rows = []
  const db = { query:async (_sql, values) => {
    await new Promise(resolve => setTimeout(resolve, values[2] === "caller" ? 5 : 0))
    rows.push({ speaker:values[1], text:values[2] })
    return { rows:[{ id:rows.length }] }
  } }
  const writer = createTranscriptWriter({ db, demoCallId:"call-1" })
  const first = writer.write("caller", "Hello")
  const second = writer.write("agent", "Welcome")
  await writer.flush()
  assert.equal((await first).id, 1)
  assert.equal((await second).id, 2)
  assert.deepEqual(rows, [{ speaker:"caller", text:"Hello" }, { speaker:"agent", text:"Welcome" }])
})
