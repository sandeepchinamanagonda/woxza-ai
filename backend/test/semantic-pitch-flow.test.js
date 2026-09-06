import test from "node:test"
import assert from "node:assert/strict"
import { normalizeCapabilityCatalog } from "../src/demo/capability-catalog.js"
import { applySemanticPitchIntent, consumePostPitchOffer, emptyPitchIntent, pitchReplySnapshot, recordPitchReply } from "../src/demo/conversation-pitch-state.js"

const catalog = normalizeCapabilityCatalog({ capabilities:[
  { id:"appointment_enquiries", title:"Appointments", callerSafeClaim:"Can handle appointment enquiries when configured.", callerImpact:"Staff can spend more time with patients.", availability:"configurable", requirements:["calendar"], demoMode:"fictional_example_only", reviewStatus:"approved" },
  { id:"connected_system_workflows", title:"Connected systems", callerSafeClaim:"Can work with a connected CRM.", callerImpact:"Approved details need less manual copying.", availability:"configurable", requirements:["connected CRM"], demoMode:"fictional_example_only", reviewStatus:"approved" },
  { id:"unsafe", title:"Unsafe", callerSafeClaim:"Never use.", callerImpact:"", availability:"roadmap", requirements:[], demoMode:"fictional_example_only", reviewStatus:"approved" }
] })
const intents = [{ id:"explore_woxza_value", maximumFollowUpQuestions:2 }]

test("dummy clinic call prepares a semantic pitch in the background without blocking the current reply", () => {
  // Turn 1: the voice path has no prior semantic result, so it can answer
  // normally while the background interpreter finishes below.
  let state = emptyPitchIntent()
  assert.equal(pitchReplySnapshot({ pitchIntent:state, catalog }).mode, "inactive")

  // Mocked background interpreter result for: "We run a dental clinic. How
  // can Woxza help us?" It selects IDs, never caller-facing claims.
  state = applySemanticPitchIntent({ previous:state, intents, catalog, semantic:{
    id:"explore_woxza_value", status:"collecting_context", missing_facts:["current pain point"],
    candidate_capability_ids:["appointment_enquiries", "connected_system_workflows", "unsafe"]
  } })
  assert.equal(state.status, "collecting_context")
  assert.deepEqual(state.candidateCapabilityIds, ["appointment_enquiries", "connected_system_workflows"])

  // Turn 2: the caller gives the missing fact. It still does not wait for
  // that turn's background work before speaking.
  assert.equal(pitchReplySnapshot({ pitchIntent:state, catalog }).mode, "inactive")
  state = applySemanticPitchIntent({ previous:state, intents, catalog, semantic:{
    id:"explore_woxza_value", status:"ready_for_pitch", missing_facts:[],
    candidate_capability_ids:["appointment_enquiries", "connected_system_workflows"]
  } })

  // Turn 3: the prepared state produces the approved, two-capability pitch.
  const pitch = pitchReplySnapshot({ pitchIntent:state, catalog })
  assert.equal(pitch.mode, "value_pitch")
  assert.deepEqual(pitch.selected.map(item => item.id), ["appointment_enquiries", "connected_system_workflows"])
  state = recordPitchReply({ pitchIntent:state, mode:pitch.mode, replyText:"Here is how Woxza could help." })
  assert.equal(state.delivered, true)
  assert.equal(state.status, "none")
  assert.equal(state.nextStepOffered, true)
  state = consumePostPitchOffer({ pitchIntent:state })
  assert.equal(state.nextStepOffered, false)
})

test("business facts alone never activate a Woxza-value pitch", () => {
  const state = applySemanticPitchIntent({ previous:emptyPitchIntent(), intents, catalog, semantic:{
    id:"", status:"none", missing_facts:[], candidate_capability_ids:["appointment_enquiries"]
  } })
  assert.equal(state.id, "")
  assert.equal(pitchReplySnapshot({ pitchIntent:state, catalog }).mode, "inactive")
})
