import { SUPPORTED_SEMANTIC_INTENT_LANGUAGES } from "./semantic-intent-router.js"

// This module is deliberately provider-neutral. Phase 2 will supply a model
// adapter; callers of this contract receive the same bounded request and
// deterministic actions regardless of which validator model is configured.
export const TURN_VALIDATION_SCHEMA_VERSION = 1
export const TURN_VALIDATION_DECISIONS = new Set(["complete", "incomplete", "unclear"])

const supportedLanguages = new Set(SUPPORTED_SEMANTIC_INTENT_LANGUAGES)
const asText = value => String(value || "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
const boundedText = (value, maximum) => [...asText(value)].slice(0, maximum).join("")
const boundedNumber = (value, { minimum=0, maximum, fallback=null }={}) => {
  const number = Number(value)
  return Number.isFinite(number) && number >= minimum && number <= maximum ? number : fallback
}

export function buildTurnValidationRequest({
  candidateText,
  heldFragment="",
  language="en",
  stt={},
  conversation={}
}={}) {
  const recentTurns = Array.isArray(conversation.recentTurns) ? conversation.recentTurns : []
  return {
    schema_version:TURN_VALIDATION_SCHEMA_VERSION,
    candidate_text:boundedText(candidateText, 640),
    held_fragment:boundedText(heldFragment, 640),
    language:{
      selected:supportedLanguages.has(language) ? language : "en",
      stt_detected:boundedText(stt.detectedLanguage, 32) || "auto",
      code_mixing_allowed:true
    },
    audio_evidence:{
      endpoint_silence_ms:boundedNumber(stt.endpointSilenceMs, { maximum:10_000 }),
      speech_duration_ms:boundedNumber(stt.speechDurationMs, { maximum:120_000 }),
      stt_overall_confidence:boundedNumber(stt.confidence, { maximum:1 }),
      noise_detected:Boolean(stt.noiseDetected),
      possible_agent_echo:Boolean(stt.possibleAgentEcho)
    },
    transcript_evidence:{
      final_transcript:boundedText(stt.finalTranscript || candidateText, 640),
      partial_transcripts:(Array.isArray(stt.partials) ? stt.partials : []).slice(-4).map(partial => boundedText(partial, 240)).filter(Boolean)
    },
    conversation_state:{
      phase:boundedText(conversation.phase, 80) || "unspecified",
      last_agent_message:boundedText(conversation.lastAgentMessage, 480),
      last_agent_question:boundedText(conversation.lastAgentQuestion, 320),
      expected_answer_type:boundedText(conversation.expectedAnswerType, 80) || "open",
      known_facts_summary:boundedText(conversation.knownFactsSummary, 640),
      recent_turns:recentTurns.slice(-3).map(turn => ({
        caller:boundedText(turn?.caller, 240),
        agent:boundedText(turn?.agent, 240)
      })).filter(turn => turn.caller || turn.agent)
    },
    validation_request:{
      task:"Classify the candidate caller text as complete, incomplete, or unclear in the supplied conversation context.",
      allowed_decisions:[...TURN_VALIDATION_DECISIONS],
      do_not_infer_missing_facts:true,
      do_not_generate_a_caller_response:true
    }
  }
}

export function deriveTurnValidationActions({ decision, priorUnclearAttempts=0, clarificationAfterAttempts=2 }={}) {
  const attempts = Math.max(0, Number(priorUnclearAttempts) || 0)
  const clarificationLimit = Math.max(1, Number(clarificationAfterAttempts) || 2)
  if (decision === "complete") return {
    should_interrupt_agent:true,
    should_send_to_conversation_model:true,
    should_hold_fragment:false,
    should_request_clarification:false,
    facts_safe_to_extract:true,
    next_action:"route_complete_turn"
  }
  if (decision === "incomplete") return {
    should_interrupt_agent:false,
    should_send_to_conversation_model:false,
    should_hold_fragment:true,
    should_request_clarification:false,
    facts_safe_to_extract:false,
    next_action:"hold_for_next_final"
  }
  if (decision === "unclear") return {
    should_interrupt_agent:false,
    should_send_to_conversation_model:false,
    should_hold_fragment:false,
    should_request_clarification:attempts + 1 >= clarificationLimit,
    facts_safe_to_extract:false,
    next_action:attempts + 1 >= clarificationLimit ? "ask_brief_clarification" : "listen_for_fresh_turn"
  }
  return null
}

export function normalizeTurnValidationResult(raw, { candidateText, priorUnclearAttempts=0, clarificationAfterAttempts=2 }={}) {
  const decision = asText(raw?.decision).toLowerCase()
  const confidence = boundedNumber(raw?.confidence, { maximum:1 })
  const reasonCode = asText(raw?.reason_code)
  const normalizedCandidate = boundedText(candidateText, 640)
  const errors = []
  if (!TURN_VALIDATION_DECISIONS.has(decision)) errors.push("decision must be complete, incomplete, or unclear")
  if (confidence === null) errors.push("confidence must be a number from 0 to 1")
  if (!/^[a-z][a-z0-9_]{2,79}$/u.test(reasonCode)) errors.push("reason_code must be snake_case")
  if (asText(raw?.candidate_text) !== normalizedCandidate) errors.push("candidate_text must exactly match the request")
  if (errors.length) return { valid:false, errors }
  return {
    valid:true,
    value:{
      schema_version:TURN_VALIDATION_SCHEMA_VERSION,
      decision,
      confidence,
      reason_code:reasonCode,
      candidate_text:normalizedCandidate,
      ...deriveTurnValidationActions({ decision, priorUnclearAttempts, clarificationAfterAttempts })
    }
  }
}
