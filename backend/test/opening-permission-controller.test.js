import assert from "node:assert/strict"
import test from "node:test"
import { createOpeningPermissionController, OPENING_PERMISSION_STATES } from "../src/demo/opening-permission-controller.js"

test("a normal first reply always leads to the fixed permission question", () => {
  const controller = createOpeningPermissionController()
  assert.deepEqual(controller.handle("మాది బట్టల business."), {
    action:"ask_permission", state:OPENING_PERMISSION_STATES.PERMISSION_PENDING, reason:"first_caller_reply"
  })
})

test("a clear first-turn decline closes without asking for two minutes", () => {
  const controller = createOpeningPermissionController()
  assert.equal(controller.handle("ఇప్పుడు బిజీగా ఉన్నాను").action, "close_declined")
})

test("permission uncertainty gets one reassurance and only yes can continue", () => {
  const controller = createOpeningPermissionController()
  controller.handle("hello")
  assert.equal(controller.handle("Maybe, I may not be free.").action, "reassure_permission")
  assert.equal(controller.handle("Maybe later.").action, "close_after_reassurance")
  assert.equal(controller.state(), OPENING_PERMISSION_STATES.DECLINED)
})

test("a Telugu affirmative after reassurance grants permission", () => {
  const controller = createOpeningPermissionController()
  controller.handle("hello")
  controller.handle("ఏమో")
  assert.deepEqual(controller.handle("అవును చెప్పండి"), {
    action:"grant_permission", state:OPENING_PERMISSION_STATES.GRANTED, reason:"clear_affirmative"
  })
})

test("an explicit statement of available time grants permission", () => {
  const controller = createOpeningPermissionController()
  controller.handle("I am fine, thank you.")
  assert.deepEqual(controller.handle("I have two minutes."), {
    action:"grant_permission", state:OPENING_PERMISSION_STATES.GRANTED, reason:"clear_affirmative"
  })
})

test("unrecognised permission wording is never inferred as permission", () => {
  const controller = createOpeningPermissionController()
  controller.handle("hello")
  assert.equal(controller.handle("I suppose we can discuss something sometime").action, "reassure_permission")
})

test("a high-confidence semantic action can resolve unfamiliar permission wording", () => {
  const controller = createOpeningPermissionController()
  controller.handle("hello")
  assert.deepEqual(controller.handleHighConfidenceSemanticAction("Yes, you can explain it briefly", "grant_permission"), {
    action:"grant_permission", state:OPENING_PERMISSION_STATES.GRANTED, reason:"high_confidence_semantic_action"
  })
})

test("semantic routing cannot override a clear deterministic answer or use an invalid transition", () => {
  const controller = createOpeningPermissionController()
  controller.handle("hello")
  assert.equal(controller.handleHighConfidenceSemanticAction("Maybe", "grant_permission").action, "reassure_permission")
  const second = createOpeningPermissionController()
  assert.equal(second.handleHighConfidenceSemanticAction("unfamiliar wording", "grant_permission").action, "ask_permission")
})
