import { isPcmAudible } from "./audio-codec.js"

// Audio energy starts a candidate, never an interruption. The bridge confirms
// an interruption only after STT observes meaningful words, filtering breath,
// TV noise, and fillers before they can cut Woxza off.
export function createCallerTurnController({
  sampleRate=16_000,
  startFrames=2,
  endSilenceMs=750,
  preRollFrames=10,
  audible=isPcmAudible,
  onActivityStart,
  onAudio,
  onActivityEnd,
  onUnconfirmedActivityEnd,
  onBargeIn
}={}) {
  let active = false, speechFrames = 0, silenceMs = 0, preRoll = [], utteranceFrames = [], utteranceId = 0, bargeInConfirmed = false
  const frameDurationMs = frame => Math.max(1, Math.round((frame.length / (sampleRate * 2)) * 1000))
  const send = frame => { utteranceFrames.push(frame); onAudio?.(frame, { utteranceId, confirmed:bargeInConfirmed }) }
  const finish = id => {
    if (!active || id !== utteranceId) return false
    const audio = Buffer.concat(utteranceFrames), confirmed = bargeInConfirmed
    active = false; speechFrames = 0; silenceMs = 0; bargeInConfirmed = false; utteranceFrames = []
    if (confirmed) onActivityEnd?.({ utteranceId:id, audio })
    else onUnconfirmedActivityEnd?.({ utteranceId:id, audio })
    return true
  }
  return {
    push(frame) {
      const value = Buffer.from(frame), isSpeech = audible(value)
      if (!active) {
        preRoll.push(value)
        if (preRoll.length > preRollFrames + startFrames) preRoll.shift()
        speechFrames = isSpeech ? speechFrames + 1 : 0
        if (speechFrames < startFrames) return { active:false, utteranceId:null }
        active = true; utteranceId += 1; silenceMs = 0
        onActivityStart?.({ utteranceId })
        for (const buffered of preRoll) send(buffered)
        preRoll = []
        return { active:true, utteranceId }
      }
      send(value)
      silenceMs = isSpeech ? 0 : silenceMs + frameDurationMs(value)
      if (silenceMs >= endSilenceMs) finish(utteranceId)
      return { active, utteranceId:active ? utteranceId : null }
    },
    // The bridge calls this only after a meaningful STT partial/final for the
    // same candidate. Repeated partial updates remain harmless.
    confirmBargeIn({ utteranceId:id=utteranceId, reason="meaningful_speech" }={}) {
      // Once endpointing has finished, a late partial/final describes a
      // completed turn. It must not re-fire barge-in and clear the final that
      // is waiting for processing. Only a currently active candidate can
      // interrupt Woxza's playback.
      if (!active || id !== utteranceId || bargeInConfirmed) return false
      bargeInConfirmed = true
      onBargeIn?.({ utteranceId:id, reason })
      return true
    },
    end:finish,
    reset() { active = false; speechFrames = 0; silenceMs = 0; preRoll = []; utteranceFrames = []; bargeInConfirmed = false },
    snapshot() { return { active, utteranceId, speechFrames, silenceMs, bargeInConfirmed } }
  }
}
