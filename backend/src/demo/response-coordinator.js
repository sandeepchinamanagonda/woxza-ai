import { randomUUID } from "node:crypto"

export function createResponseCoordinator({ now=Date.now, onEvent=()=>{} }={}) {
  let active = null
  let deferred = null
  const emit = (event, extra={}) => onEvent({ event, plan:active, deferred, at:now(), ...extra })
  return {
    submitPlan(plan) {
      const next = { ...plan, plan_id:plan.plan_id || randomUUID(), state:"planned", created_at:now(), locked_at:null }
      if (active?.state === "planned") emit("response_plan_replaced", { replaced_plan_id:active.plan_id, reason:"superseded_before_audio" })
      else if (active?.state === "locked_playing") {
        if (plan.deferable) { if (deferred) emit("draft_discarded", { plan_id:deferred.plan_id, reason:"deferred_superseded" }); deferred = next; emit("response_deferred", { plan_id:next.plan_id }); return { deferred:true } }
        emit("draft_discarded", { plan_id:next.plan_id, reason:"late_after_lock" }); return { discarded:true }
      }
      active = next; emit("response_plan_created", { plan_id:next.plan_id }); return next
    },
    acceptDraftAudio(planId, pcm, audible) {
      if (!active || active.plan_id !== planId || active.state === "cancelled" || active.state === "interrupted") { emit("draft_discarded", { plan_id:planId || null, reason:"unowned_or_stale_live_output" }); return false }
      if (active.state === "planned" && audible) { active = { ...active, state:"locked_playing", locked_at:now() }; emit("response_plan_locked", { plan_id:active.plan_id }); }
      return active.state === "planned" || active.state === "locked_playing"
    },
    interrupt() { if (!active) return; active = { ...active, state:active.state === "locked_playing" ? "interrupted" : "cancelled" }; emit(active.state === "interrupted" ? "response_interrupted" : "draft_discarded", { plan_id:active.plan_id, reason:"caller_barge_in" }) },
    complete() { if (active?.state === "locked_playing") { active = { ...active, state:"completed", completed_at:now() }; emit("response_plan_completed", { plan_id:active.plan_id }) } },
    activePlan:() => active,
    takeDeferred:() => { const value=deferred; deferred=null; return value }
  }
}
