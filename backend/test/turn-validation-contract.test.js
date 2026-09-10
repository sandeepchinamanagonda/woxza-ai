import assert from "node:assert/strict"
import test from "node:test"
import { buildTurnValidationRequest, deriveTurnValidationActions, normalizeTurnValidationResult, TURN_VALIDATION_SCHEMA_VERSION } from "../src/demo/turn-validation-contract.js"
import { createTurnValidationState } from "../src/demo/turn-validation-state.js"

test("builds a bounded state-aware validator request", () => {
  const request = buildTurnValidationRequest({
    candidateText:"మాది medical shop ఉంది",
    heldFragment:"మాది",
    language:"te",
    stt:{ finalTranscript:"medical shop ఉంది", confidence:0.81, endpointSilenceMs:2200, partials:["మాది", "మాది medical"] },
    conversation:{ phase:"focused_discovery", lastAgentQuestion:"మీది ఎలాంటి వ్యాపారం?", expectedAnswerType:"business_type", recentTurns:[{ caller:"old", agent:"older" }, { caller:"new", agent:"latest" }] }
  })
  assert.equal(request.schema_version, TURN_VALIDATION_SCHEMA_VERSION)
  assert.equal(request.candidate_text, "మాది medical shop ఉంది")
  assert.equal(request.language.selected, "te")
  assert.equal(request.audio_evidence.stt_overall_confidence, 0.81)
  assert.deepEqual(request.transcript_evidence.partial_transcripts, ["మాది", "మాది medical"])
  assert.equal(request.conversation_state.last_agent_question, "మీది ఎలాంటి వ్యాపారం?")
})

test("normalizes only traceable complete, incomplete, and unclear model results", () => {
  const complete = normalizeTurnValidationResult({ decision:"complete", confidence:0.94, reason_code:"contextually_complete_answer", candidate_text:"medical shop" }, { candidateText:"medical shop" })
  assert.equal(complete.valid, true)
  assert.equal(complete.value.should_send_to_conversation_model, true)

  const incomplete = normalizeTurnValidationResult({ decision:"incomplete", confidence:0.97, reason_code:"continuing_thought", candidate_text:"I think" }, { candidateText:"I think" })
  assert.equal(incomplete.value.should_hold_fragment, true)

  const unclear = normalizeTurnValidationResult({ decision:"unclear", confidence:0.88, reason_code:"garbled_transcript", candidate_text:"medical think card" }, { candidateText:"medical think card", priorUnclearAttempts:1 })
  assert.equal(unclear.value.should_request_clarification, true)

  const invalid = normalizeTurnValidationResult({ decision:"complete", confidence:1.2, reason_code:"bad reason", candidate_text:"different" }, { candidateText:"medical shop" })
  assert.equal(invalid.valid, false)
  assert.equal(invalid.errors.length, 3)
})

test("derives actions in the backend rather than trusting a model-provided action", () => {
  assert.deepEqual(deriveTurnValidationActions({ decision:"unclear", priorUnclearAttempts:0 }), {
    should_interrupt_agent:false,
    should_send_to_conversation_model:false,
    should_hold_fragment:false,
    should_request_clarification:false,
    facts_safe_to_extract:false,
    next_action:"listen_for_fresh_turn"
  })
})

test("holds only incomplete text, merges it into the next candidate, and discards unclear text", () => {
  let time = 0
  const state = createTurnValidationState({ now:() => time, fragmentTtlMs:8000 })
  const first = state.prepare("మాది")
  const incomplete = normalizeTurnValidationResult({ decision:"incomplete", confidence:0.98, reason_code:"trailing_possessive", candidate_text:"మాది" }, first)
  state.apply(incomplete)
  assert.deepEqual(state.prepare("medical shop"), { heldFragment:"మాది", candidateText:"మాది medical shop", priorUnclearAttempts:0 })
  time = 8_001
  assert.deepEqual(state.prepare("new answer"), { heldFragment:"", candidateText:"new answer", priorUnclearAttempts:0 })

  const unclear = normalizeTurnValidationResult({ decision:"unclear", confidence:0.8, reason_code:"garbled_transcript", candidate_text:"medical think card" }, { candidateText:"medical think card" })
  state.apply(unclear)
  assert.deepEqual(state.prepare("clear answer"), { heldFragment:"", candidateText:"clear answer", priorUnclearAttempts:1 })
})
