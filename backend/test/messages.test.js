import test from "node:test"
import assert from "node:assert/strict"
import { CALL_MESSAGES, getCallMessages } from "../src/demo/messages.js"

test("each use case provides the supplied greeting and ending for all 13 languages", () => {
  for (const messages of Object.values(CALL_MESSAGES)) assert.equal(Object.keys(messages).length, 13)
})

test("message lookup falls back safely and resolves tenant names", () => {
  const event = getCallMessages({ useCase:"event_rsvp", language:"en", businessName:"Northstar Events" })
  const recruiting = getCallMessages({ useCase:"recruiting_screening", language:"en", companyName:"Woxza Labs" })
  assert.match(event.greeting, /Northstar Events/)
  assert.match(recruiting.greeting, /Woxza Labs/)
})
