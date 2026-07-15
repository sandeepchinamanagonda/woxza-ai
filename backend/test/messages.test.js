import test from "node:test"
import assert from "node:assert/strict"
import { CALL_MESSAGES, getCallMessages, interpolateCallMessage } from "../src/demo/messages.js"

test("each use case provides the supplied greeting and ending for all 13 languages", () => {
  for (const messages of Object.values(CALL_MESSAGES)) assert.equal(Object.keys(messages).length, 13)
})

test("message lookup falls back safely and preserves named interpolation", () => {
  const event = getCallMessages({ useCase:"event_rsvp", language:"en", businessName:"Northstar Events" })
  assert.match(event.greeting, /event RSVP demo/)
  assert.equal(
    interpolateCallMessage("{business_name} / {company_name}", { businessName:"Northstar Events", companyName:"Woxza Labs" }),
    "Northstar Events / Woxza Labs"
  )
})

test("greetings use the unified Woxza demo-selection intro", () => {
  const english = getCallMessages({ useCase:"order_taking", language:"en" })
  const telugu = getCallMessages({ useCase:"order_taking", language:"te" })
  assert.match(english.greeting, /Hi, I'm Woxza! We're glad you're here trying out our demo/)
  assert.match(english.greeting, /Thanks for choosing the order taking demo/)
  assert.match(telugu.greeting, /నమస్కారం, నేను Woxza!/)
  assert.match(telugu.greeting, /ఆర్డర్ తీసుకోవడం డెమోను ఎంచుకున్నందుకు ధన్యవాదాలు/)
})
