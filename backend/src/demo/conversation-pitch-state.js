import { approvedCapabilities } from "./capability-retriever.js"

export const emptyPitchIntent = () => ({
  id:"", status:"none", missingFacts:[], candidateCapabilityIds:[],
  followUpQuestions:0, maximumFollowUpQuestions:2, delivered:false,
  nextStepOffered:false
})

export function applySemanticPitchIntent({ previous=emptyPitchIntent(), semantic={}, intents=[], catalog=[] }={}) {
  const allowed = (Array.isArray(intents) ? intents : []).find(item => item.id === semantic.id)
  if (previous.delivered || allowed?.id !== "explore_woxza_value") return previous
  const selected = approvedCapabilities({ catalog, candidateIds:semantic.candidate_capability_ids, limit:5 })
  return {
    id:allowed.id,
    status:selected.length && semantic.status === "ready_for_pitch" ? "ready_for_pitch" : "collecting_context",
    missingFacts:Array.isArray(semantic.missing_facts) ? semantic.missing_facts.slice(0, 2) : [],
    candidateCapabilityIds:selected.map(item => item.id),
    followUpQuestions:previous.followUpQuestions,
    maximumFollowUpQuestions:allowed.maximumFollowUpQuestions,
    delivered:false,
    nextStepOffered:false
  }
}

export function pitchReplySnapshot({ pitchIntent=emptyPitchIntent(), catalog=[] }={}) {
  const selected = approvedCapabilities({ catalog, candidateIds:pitchIntent.candidateCapabilityIds, limit:5 })
  const ready = pitchIntent.id === "explore_woxza_value" && selected.length > 0 &&
    (pitchIntent.status === "ready_for_pitch" || pitchIntent.followUpQuestions >= pitchIntent.maximumFollowUpQuestions)
  return { mode:ready ? "value_pitch" : "inactive", selected:ready ? selected : [] }
}

export function recordPitchReply({ pitchIntent=emptyPitchIntent(), mode="inactive", replyText="" }={}) {
  if (pitchIntent.id !== "explore_woxza_value") return pitchIntent
  // A pitch should lead somewhere. Once its audio is delivered, the next
  // caller turn is an answer to a contextual demo/example invitation—not a
  // disposable acknowledgement such as a normal "okay".
  if (mode === "value_pitch") return { ...pitchIntent, delivered:true, status:"none", nextStepOffered:true }
  if (/[?？]$/u.test(String(replyText))) return {
    ...pitchIntent,
    followUpQuestions:Math.min(pitchIntent.maximumFollowUpQuestions, pitchIntent.followUpQuestions + 1)
  }
  return pitchIntent
}

export function consumePostPitchOffer({ pitchIntent=emptyPitchIntent() }={}) {
  return pitchIntent.nextStepOffered ? { ...pitchIntent, nextStepOffered:false } : pitchIntent
}
