import { buildTurnValidationRequest } from "./turn-validation-contract.js"
import { createTurnValidationState } from "./turn-validation-state.js"

// The gate owns model invocation and volatile state, but deliberately does
// not touch TTS, semantic routing, or facts. Phase 3 consumes its actions.
export function createTurnValidationGate({ validator=null, state=createTurnValidationState(), clarificationAfterAttempts=2 }={}) {
  return {
    available:Boolean(validator?.validate),
    async evaluate({ finalTranscript, language, stt={}, conversation={}, signal }={}) {
      const startedAt = Date.now()
      const prepared = state.prepare(finalTranscript)
      const request = buildTurnValidationRequest({
        candidateText:prepared.candidateText,
        heldFragment:prepared.heldFragment,
        language,
        stt:{ ...stt, finalTranscript },
        conversation
      })
      const payloadBuiltAt = Date.now()
      if (!validator?.validate) return { status:"unavailable", request, result:null, state:state.snapshot(), timing:{ payload_build_ms:payloadBuiltAt - startedAt, validator_ms:0, state_apply_ms:0, total_ms:payloadBuiltAt - startedAt } }
      try {
        const result = await validator.validate(request, {
          signal,
          priorUnclearAttempts:prepared.priorUnclearAttempts,
          clarificationAfterAttempts
        })
        const validatorFinishedAt = Date.now()
        if (!result.valid) return { status:"invalid_result", request, result, state:state.snapshot(), timing:{ payload_build_ms:payloadBuiltAt - startedAt, validator_ms:validatorFinishedAt - payloadBuiltAt, state_apply_ms:0, total_ms:validatorFinishedAt - startedAt } }
        const nextState = state.apply(result)
        const appliedAt = Date.now()
        return { status:"validated", request, result, state:nextState, timing:{ payload_build_ms:payloadBuiltAt - startedAt, validator_ms:validatorFinishedAt - payloadBuiltAt, state_apply_ms:appliedAt - validatorFinishedAt, total_ms:appliedAt - startedAt } }
      } catch (error) {
        const failedAt = Date.now()
        return { status:"failed", request, result:null, state:state.snapshot(), error:{ name:error?.name || "Error", message:error?.message || "turn validation failed" }, timing:{ payload_build_ms:payloadBuiltAt - startedAt, validator_ms:failedAt - payloadBuiltAt, state_apply_ms:0, total_ms:failedAt - startedAt } }
      }
    },
    reset() { state.reset() },
    snapshot() { return state.snapshot() }
  }
}
