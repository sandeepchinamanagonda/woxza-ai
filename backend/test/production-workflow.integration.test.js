import assert from "node:assert/strict"
import test from "node:test"
import { buildApprovedActionRenderContract, validateApprovedActionRender } from "../src/demo/approved-action-renderer.js"
import { createOpeningController } from "../src/demo/opening-controller.js"
import { createOrchestratorStore } from "../src/demo/orchestrator-store.js"
import { commitAction, createCallSession, submitTurn } from "../src/demo/orchestrator.js"
import { normalizeTurnInterpretation } from "../src/demo/turn-normalizer.js"

function interpret(session, raw, callerText="") {
  const normalized = normalizeTurnInterpretation(raw, { phase:session.stable_phase, callerText })
  return submitTurn(session, {
    turn_id:session.turn_id,
    expected_state_version:session.state_version,
    clarity:"clear",
    ...normalized.interpretation
  })
}

function spoken(result) {
  assert.ok(result.pending_session, `Expected an approved action, got ${result.action}`)
  return commitAction(result.pending_session, result.pending_session.pending_action.action_id)
}

function nextCallerTurn(session) {
  return { ...session, turn_id:session.turn_id + 1 }
}

function discoveredSession({ callId="production-call", language="te" }={}) {
  let session = nextCallerTurn(createCallSession({ callId, language }))
  session = spoken(interpret(session, {
    intent:"provide_detail",
    details:{
      business:"Lakshmi Hardware",
      current_process:"staff answer calls and write orders in a notebook",
      primary_pain:"busy counter hours cause missed enquiries",
      operating_detail:"around 35 calls each day",
      business_label:"hardware retailer with phone orders",
      business_category:"retail_general",
      workflow_tags:["inventory_orders", "pricing_discounts", "high_call_volume"]
    }
  }))
  return {
    ...session,
    pitch:{ status:"ready", data:[{ id:"inventory" }, { id:"pricing" }, { id:"after-hours" }, { id:"follow-up" }] },
    demo:{ status:"ready", data:{ default_scenario:"stock_order" } }
  }
}

function beginDemo(session, scenario="stock_order") {
  session = nextCallerTurn(session)
  session = spoken(interpret(session, { intent:"demo", details:{} }, "show me a demo"))
  assert.equal(session.stable_phase, "demo_scenario")
  session = nextCallerTurn(session)
  session = spoken(interpret(session, { intent:"accept", details:{ scenario } }, scenario))
  assert.equal(session.stable_phase, "customer_request")
  return session
}

test("production stock-order path survives spelling, pack clarification, off-script follow-ups, and produces a protected reference", () => {
  let session = beginDemo(discoveredSession(), "stock_order")

  session = nextCallerTurn(session)
  let action = interpret(session, {
    intent:"customer_request",
    details:{ request:"D O L O six fifty" }
  }, "D O L O six fifty available?")
  assert.equal(action.action, "deliver_simulated_answer_and_ask_quantity")
  assert.equal(action.pending_session.demo_order.product, "Dolo 650")
  session = spoken(action)

  session = nextCallerTurn(session)
  action = interpret(session, { intent:"provide_detail", details:{ quantity:"ten" } }, "ten")
  assert.equal(action.action, "present_order_terms_and_ask_proceed")
  session = spoken(action)
  assert.equal(session.stable_phase, "task_confirmation")

  // This was the live regression: the caller supplied a pack unit after the
  // quoted quantity. It must remain an order detail, never become a decline.
  session = nextCallerTurn(session)
  action = interpret(session, { intent:"provide_detail", details:{ measurement:"cartons" } }, "cartons")
  assert.equal(action.action, "present_order_terms_and_ask_proceed")
  assert.equal(action.pending_session.demo_order.unit, "cartons")
  assert.equal(action.pending_session.pending_action.next_phase, "task_confirmation")
  assert.notEqual(action.action, "complete_simulated_task")
  session = spoken(action)

  // A customer may ask another practical question instead of saying yes/no.
  session = nextCallerTurn(session)
  action = interpret(session, { intent:"customer_request", details:{ request:"Can it arrive today?" } }, "Can it arrive today?")
  assert.equal(action.action, "present_order_terms_and_ask_proceed")
  assert.notEqual(action.pending_session.pending_action.next_phase, "demo_feedback")
  session = spoken(action)

  session = nextCallerTurn(session)
  action = interpret(session, { intent:"accept", details:{} }, "Sure, go ahead")
  assert.equal(action.action, "confirm_simulated_task")
  assert.match(action.response_context.example_reference, /^DEMO-/)

  const contract = buildApprovedActionRenderContract({
    action:action.action,
    actionId:action.pending_session.pending_action.action_id,
    language:"Telugu",
    responseContext:action.response_context
  })
  const rejected = validateApprovedActionRender(contract, {
    action_id:contract.action_id,
    localized_text:"మీ ఉదాహరణ ఆర్డర్ నిర్ధారించబడింది. ఎలా అనిపించింది?",
    included_fields:["example_label", "confirmation", "order_reference", "feedback_question"]
  })
  assert.equal(rejected.ok, false)
  assert.equal(rejected.reason, "missing_reference")
  const reference = action.response_context.example_reference
  const accepted = validateApprovedActionRender(contract, {
    action_id:contract.action_id,
    localized_text:`మీ ఉదాహరణ ఆర్డర్ నిర్ధారించబడింది. రిఫరెన్స్ నంబర్ ${reference}. డెమో ఎలా అనిపించింది?`,
    included_fields:["example_label", "confirmation", "order_reference", "feedback_question"]
  })
  assert.equal(accepted.ok, true)
})

test("every scenario retains its own completion contract and never forces an order for FAQ", () => {
  const cases = [
    ["billing_quote", "deliver_billing_quote_and_ask_measurement", "billing_details"],
    ["delivery", "deliver_delivery_status_and_ask_proceed", "task_confirmation"],
    ["payments", "explain_payment_and_ask_proceed", "task_confirmation"],
    ["service_status", "deliver_service_status_and_ask_proceed", "task_confirmation"],
    ["faq_catalogue", "answer_faq_and_offer_next_step", "faq_follow_up"]
  ]
  for (const [scenario, expectedAction, expectedPhase] of cases) {
    let session = beginDemo(discoveredSession({ callId:`scenario-${scenario}` }), scenario)
    session = nextCallerTurn(session)
    const action = interpret(session, { intent:"customer_request", details:{ request:"Can you help with this?" } }, "Can you help with this?")
    assert.equal(action.action, expectedAction, scenario)
    assert.equal(action.pending_session.pending_action.next_phase, expectedPhase, scenario)
    assert.notEqual(action.pending_session.pending_action.next_phase, "demo_feedback", scenario)
  }
})

test("pitch-first flow cannot pitch twice after a demo and closes cleanly when the caller declines a demo", () => {
  let session = discoveredSession({ callId:"pitch-first" })
  session = nextCallerTurn(session)
  let action = interpret(session, { intent:"ask_more", details:{} }, "Tell me how Woxza helps")
  assert.equal(action.action, "deliver_pitch")
  session = spoken(action)
  assert.equal(session.stable_phase, "tailored_pitch")

  session = nextCallerTurn(session)
  action = interpret(session, { intent:"feedback", details:{} }, "okay")
  assert.equal(action.action, "deliver_pitch")
  // This turn is the controlled tailored_pitch phase itself.
  session = spoken(action)
  assert.equal(session.stable_phase, "demo_offer")

  session = nextCallerTurn(session)
  action = interpret(session, { intent:"decline", details:{} }, "No thanks, I am in a rush")
  assert.equal(action.action, "close")
  assert.equal(action.pending_session.pending_action.next_phase, "closing")
})

test("stale, duplicate, and interrupted actions cannot advance a session", () => {
  let session = nextCallerTurn(createCallSession({ callId:"stale-call" }))
  const proposed = interpret(session, { intent:"provide_detail", details:{ business:"door shop" } }, "I run a door shop")
  assert.equal(proposed.action, "ask_missing_business_detail")

  const duplicate = submitTurn(proposed.pending_session, {
    turn_id:session.turn_id,
    expected_state_version:session.state_version,
    intent:"provide_detail",
    clarity:"clear",
    details:{ current_process:"staff take calls" }
  })
  assert.equal(duplicate.action, "no_op")
  assert.equal(duplicate.reason, "duplicate_turn")

  // Simulates a caller barge-in before audio begins: no phase/version commit.
  assert.equal(proposed.pending_session.stable_phase, "business_discovery")
  assert.equal(proposed.pending_session.state_version, 0)
  const stale = submitTurn(session, {
    turn_id:session.turn_id - 1,
    expected_state_version:session.state_version,
    intent:"accept",
    clarity:"clear",
    details:{}
  })
  assert.equal(stale.action, "no_op")
})

test("opening is atomic: caller speech is queued until carrier completion and is released once", () => {
  const events = []
  let completion
  const controller = createOpeningController({
    onWoxzaFirst:() => events.push("welcome"),
    onCallerFirst:() => events.push("queue-caller-audio"),
    onGreetingComplete:({ source }) => { completion = source; events.push("release-caller-audio") }
  })
  controller.start()
  assert.equal(controller.noteCallerSpeech(), true)
  assert.deepEqual(events, ["welcome", "queue-caller-audio"])
  assert.equal(controller.completeGreeting(), true)
  assert.equal(completion, "carrier_playback_complete")
  assert.equal(controller.completeGreeting(), false)
  assert.equal(controller.noteCallerSpeech(), false)
  assert.deepEqual(events, ["welcome", "queue-caller-audio", "release-caller-audio"])
})

test("per-call store state and prepared artifacts are isolated across simultaneous businesses", async () => {
  const first = createOrchestratorStore({ tenantId:"tenant-a" })
  const second = createOrchestratorStore({ tenantId:"tenant-b" })
  const firstSession = { ...createCallSession({ callId:"same-call", tenantId:"tenant-a" }), stable_phase:"demo_scenario" }
  await first.save(firstSession)
  await first.saveArtifact("same-call", "pitch", { business:"hardware" })
  await second.saveArtifact("same-call", "pitch", { business:"hospital" })

  assert.equal((await first.load("same-call")).stable_phase, "demo_scenario")
  assert.deepEqual(await first.loadArtifact("same-call", "pitch"), { business:"hardware" })
  assert.deepEqual(await second.loadArtifact("same-call", "pitch"), { business:"hospital" })
})
