import test from "node:test"
import assert from "node:assert/strict"
import { LANGUAGES } from "../src/demo/prompt.js"
import { APPOINTMENT_TEMPLATE_LANGUAGES, classifyAppointmentConfirmation, createAppointmentBookingState, transitionAppointmentBooking } from "../src/demo/appointment-state.js"

const advanceToConfirmation = (language="en") => {
  const state = createAppointmentBookingState()
  transitionAppointmentBooking(state, { action:"set_type", type:"movie", language })
  transitionAppointmentBooking(state, { action:"set_date", value:"22 July", language })
  transitionAppointmentBooking(state, { action:"set_time", value:"6 PM", language })
  const readback = transitionAppointmentBooking(state, { action:"set_name", value:"Hemanth", language })
  return { state, readback }
}

test("gate 1: deterministic appointment copy covers every supported language", () => {
  assert.deepEqual([...APPOINTMENT_TEMPLATE_LANGUAGES].sort(), [...LANGUAGES.keys()].sort())
})

test("gate 2: only salon, movie, and doctor types are accepted", () => {
  for (const type of ["salon", "movie", "doctor"]) {
    const result = transitionAppointmentBooking(createAppointmentBookingState(), { action:"set_type", type, language:"en" })
    assert.equal(result.ok, true)
  }
  const invalid = transitionAppointmentBooking(createAppointmentBookingState(), { action:"set_type", type:"hotel", language:"en" })
  assert.equal(invalid.ok, false)
  assert.equal(invalid.error, "invalid_appointment_type")
})

test("gate 3: fields advance only in type, date, time, name order", () => {
  const state = createAppointmentBookingState()
  assert.equal(transitionAppointmentBooking(state, { action:"set_type", type:"movie" }).state, "awaiting_date")
  assert.equal(transitionAppointmentBooking(state, { action:"set_date", value:"22 July" }).state, "awaiting_time")
  assert.equal(transitionAppointmentBooking(state, { action:"set_time", value:"6 PM" }).state, "awaiting_name")
  assert.equal(transitionAppointmentBooking(state, { action:"set_name", value:"Hemanth" }).state, "awaiting_confirmation")
})

test("gate 4: missing and out-of-order values never advance state", () => {
  const state = createAppointmentBookingState()
  const missing = transitionAppointmentBooking(state, { action:"set_type", type:"" })
  assert.equal(missing.ok, false)
  assert.equal(state.status, "awaiting_type")
  const outOfOrder = transitionAppointmentBooking(state, { action:"set_time", value:"6 PM" })
  assert.equal(outOfOrder.error, "invalid_transition")
  assert.equal(state.status, "awaiting_type")
})

test("gate 5: read-back contains every collected detail and asks only for confirmation", () => {
  const { state, readback } = advanceToConfirmation("en")
  assert.equal(state.status, "awaiting_confirmation")
  for (const value of ["movie", "22 July", "6 PM", "Hemanth"]) assert.ok(readback.sayExactly.includes(value))
  assert.match(readback.sayExactly, /Is that correct\?$/)
  assert.doesNotMatch(readback.sayExactly, /booked|reserved/i)
})

test("gate 6: unclear speech cannot confirm an appointment", () => {
  for (const callerText of ["Then", "hudu", "maybe", "okay then"]) {
    const { state } = advanceToConfirmation("te")
    const result = transitionAppointmentBooking(state, { action:"confirm", callerText, language:"te" })
    assert.equal(result.error, "ambiguous_confirmation")
    assert.equal(state.status, "awaiting_confirmation")
    assert.equal(state.confirmed, false)
  }
})

test("gate 7: an explicit negative resets cleanly instead of confirming or looping", () => {
  const { state } = advanceToConfirmation("te")
  const result = transitionAppointmentBooking(state, { action:"confirm", callerText:"కాదు అండి", language:"te" })
  assert.equal(result.ok, true)
  assert.equal(state.status, "awaiting_type")
  assert.equal(state.confirmed, false)
  assert.deepEqual(state.details, { type:"", date:"", time:"", name:"" })
})

test("gate 8: only an explicit language-matched affirmative confirms simulated details", () => {
  assert.equal(classifyAppointmentConfirmation("అవును అండి", "te"), "affirmative")
  assert.equal(classifyAppointmentConfirmation("ಹೌದು", "te"), "unclear")
  const { state } = advanceToConfirmation("te")
  const result = transitionAppointmentBooking(state, { action:"confirm", callerText:"అవును అండి", language:"te" })
  assert.equal(result.ok, true)
  assert.equal(state.status, "confirmed")
  assert.equal(state.confirmed, true)
  assert.match(result.sayExactly, /సిమ్యులేటెడ్/)
  assert.doesNotMatch(result.sayExactly, /బుక్ చేశ|బుక్ అయ/)
})
