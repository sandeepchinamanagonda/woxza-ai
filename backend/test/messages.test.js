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

test("greetings use Woxza consistently in all 13 languages", () => {
  const english = getCallMessages({ useCase:"order_taking", language:"en" })
  const hindi = getCallMessages({ useCase:"order_taking", language:"hi" })
  const telugu = getCallMessages({ useCase:"order_taking", language:"te" })
  assert.match(english.greeting, /Welcome to Woxza! I'm Woxza/)
  assert.match(english.greeting, /What type of order would you like to place today?/)
  assert.match(hindi.greeting, /Woxza में आपका स्वागत है! मैं Woxza/)
  assert.match(telugu.greeting, /Woxzaకు స్వాగతం! నేను Woxza/)
  for (const scenarios of Object.values(CALL_MESSAGES)) {
    for (const messages of Object.values(scenarios)) assert.doesNotMatch(messages.greeting, /\bVoxa\b/)
  }
})

test("appointment booking offers only salon, movie, or doctor reservations", () => {
  const appointment = getCallMessages({ useCase:"appointment_booking", language:"en" })
  assert.match(appointment.greeting, /a salon, a movie, or a doctor's appointment/)
  assert.doesNotMatch(appointment.greeting, /hotel|clinic/i)
})

test("every use case shares the universal ending in each language", () => {
  const useCases = Object.values(CALL_MESSAGES)
  for (const language of Object.keys(useCases[0])) {
    assert.equal(new Set(useCases.map(messages => messages[language].ending)).size, 1)
  }
})
