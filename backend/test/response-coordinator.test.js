import assert from "node:assert/strict"
import test from "node:test"
import { createResponseCoordinator } from "../src/demo/response-coordinator.js"

test("one caller turn has one winning plan and unowned audio cannot pass", () => {
  const events=[]; const c=createResponseCoordinator({ onEvent:e=>events.push(e) })
  assert.equal(c.acceptDraftAudio(null, Buffer.alloc(2), true), false)
  c.submitPlan({ plan_id:"workflow", owner:"workflow" })
  c.submitPlan({ plan_id:"memory", owner:"memory_confirmation" })
  assert.equal(c.acceptDraftAudio("workflow", Buffer.alloc(2), true), false)
  assert.equal(c.acceptDraftAudio("memory", Buffer.alloc(2), true), true)
  assert.equal(c.activePlan().state, "locked_playing")
  assert.ok(events.some(e=>e.event === "response_plan_replaced"))
})

test("barge-in interrupts locked plan and a later draft is discarded", () => {
  const c=createResponseCoordinator()
  c.submitPlan({ plan_id:"a", owner:"workflow" }); c.acceptDraftAudio("a", Buffer.alloc(2), true)
  c.interrupt()
  assert.equal(c.activePlan().state, "interrupted")
  assert.equal(c.acceptDraftAudio("a", Buffer.alloc(2), true), false)
})
