import assert from "node:assert/strict"
import test from "node:test"
import { buildSemanticRouteContext, preflightSemanticRoute, semanticRouteQuery } from "../src/demo/semantic-route-policy.js"

const fullValueRoute = {
  id:"full_value_explanation",
  eligibility:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true }
}

test("builds a bounded privacy-safe semantic route context", () => {
  const context = buildSemanticRouteContext({
    callStage:"full_value_explanation_candidate",
    language:"te",
    callerText:"అవునా, ఎలా?\u0000",
    previousAgentText:"Woxza can help with messages.",
    previousCallerText:"We manage WhatsApp ourselves.",
    businessSummary:"A small shop handles repeat customer questions.",
    recentTurns:[{ caller:"first", agent:"one" }, { caller:"second", agent:"two" }, { caller:"third", agent:"three" }, { caller:"fourth", agent:"four" }],
    routeState:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true, callerPhone:"do not retain" }
  })
  assert.equal(context.active_language, "te")
  assert.equal(context.caller_text, "అవునా, ఎలా?")
  assert.equal(context.recent_turns.length, 3)
  assert.deepEqual(context.route_state, { hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true })
  assert.doesNotMatch(JSON.stringify(context), /callerPhone|do not retain/)
})

test("formats a compact semantic query without internal metadata", () => {
  const context = buildSemanticRouteContext({ callStage:"opening_permission_pending", language:"te", callerText:"సరే, చెప్పండి.", previousAgentText:"May I take two minutes?" })
  const query = semanticRouteQuery({ route:{ id:"opening_permission" }, context })
  assert.match(query, /Route: opening_permission/)
  assert.match(query, /Caller statement:\nసరే, చెప్పండి\./)
  assert.doesNotMatch(query, /route_state|schema_version/)
})

test("requires configured context before an expensive semantic lookup", () => {
  const missing = buildSemanticRouteContext({ callerText:"అవునా, ఎలా?", routeState:{ hasKnownBusinessPainPoint:true } })
  assert.deepEqual(preflightSemanticRoute({ route:fullValueRoute, context:missing }), { eligible:false, reason:"missing_required_context" })
  const eligible = buildSemanticRouteContext({ callerText:"అవునా, ఎలా?", routeState:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true } })
  assert.deepEqual(preflightSemanticRoute({ route:fullValueRoute, context:eligible }), { eligible:true, reason:"eligible" })
})

test("keeps clear greeting, pricing, signup, and farewell turns out of semantic routing", () => {
  for (const [callerText, reason] of [["Hello", "greeting"], ["Woxza ధర ఎంత?", "pricing"], ["How do I sign up?", "signup"], ["No thanks, bye", "goodbye"]]) {
    const context = buildSemanticRouteContext({ callerText, routeState:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true } })
    assert.deepEqual(preflightSemanticRoute({ route:fullValueRoute, context }), { eligible:false, reason })
  }
})
