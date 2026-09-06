import test from "node:test"
import assert from "node:assert/strict"
import { createConversationTurnStore } from "../src/demo/conversation-turn-store.js"

test("completed conversation turn is inserted once in one transaction", async () => {
  const calls = []
  const client = {
    async query(sql, values=[]) {
      calls.push({ sql, values })
      if (/INSERT INTO call_conversation_turns/.test(sql)) return { rows:[{ id:4, turn_id:values[0], turn_sequence:values[2] }] }
      return { rows:[] }
    },
    release() { calls.push({ sql:"RELEASE" }) }
  }
  const store = createConversationTurnStore({ db:{ async connect() { return client } } })
  const saved = await store.completeTurn({ turnId:"f6b6e628-f873-49e9-9ef5-b7278af9c9c7", demoCallId:"e60cd19f-3ab4-42ca-bc84-2d24c1cfb409", turnSequence:2, callerText:"We use WhatsApp.", agentText:"That makes follow-up easier.", language:"te", languagePolicy:{ active_language:"te" }, conversationIntent:{ id:"explore_woxza_value", status:"collecting_context" }, callerTranscriptTurnId:11, agentTranscriptTurnId:12 })
  assert.equal(saved.turn_sequence, 2)
  assert.match(calls[0].sql, /BEGIN/)
  assert.match(calls[1].sql, /INSERT INTO call_conversation_turns/)
  assert.deepEqual(JSON.parse(calls[1].values[9]), { id:"explore_woxza_value", status:"collecting_context" })
  assert.match(calls[2].sql, /COMMIT/)
})
