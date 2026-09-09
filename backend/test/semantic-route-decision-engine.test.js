import assert from "node:assert/strict"
import test from "node:test"
import { createSemanticRouteDecisionEngine } from "../src/demo/semantic-route-decision-engine.js"
import { buildSemanticRouteContext } from "../src/demo/semantic-route-policy.js"

const route = {
  id:"full_value_explanation",
  eligibility:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true },
  decision:{ actionOutcomeIds:["matched"], minimumScore:0.75, minimumNegativeMargin:0.10, minimumCompetingMargin:0.05, aggregateTopK:2 }
}

const indexWith = hits => ({ status:() => ({ documentCount:hits.length }), search:async () => hits })
const context = () => buildSemanticRouteContext({ callerText:"అవునా, ఎలా?", routeState:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true } })

test("returns an action only for a clear semantic winner", async () => {
  const engine = createSemanticRouteDecisionEngine({ index:indexWith([
    { routeId:route.id, outcomeId:"matched", action:"give_full_value_explanation", documentId:"positive-1", score:0.86 },
    { routeId:route.id, outcomeId:"matched", action:"give_full_value_explanation", documentId:"positive-2", score:0.82 },
    { routeId:route.id, outcomeId:"no_match", action:"normal_response", documentId:"negative-1", score:0.58 }
  ]) })
  const result = await engine.decide({ route, context:context() })
  assert.equal(result.decision, "action")
  assert.equal(result.action, "give_full_value_explanation")
  assert.equal(result.negative_margin, 0.26)
})

test("fails closed when positive and negative meanings are too close", async () => {
  const engine = createSemanticRouteDecisionEngine({ index:indexWith([
    { routeId:route.id, outcomeId:"matched", action:"give_full_value_explanation", documentId:"positive", score:0.82 },
    { routeId:route.id, outcomeId:"no_match", action:"normal_response", documentId:"negative", score:0.76 }
  ]) })
  assert.equal((await engine.decide({ route, context:context() })).reason, "negative_margin_too_small")
})

test("never queries the index when policy preflight rejects the route", async () => {
  let searched = false
  const engine = createSemanticRouteDecisionEngine({ index:{ status:() => ({ documentCount:1 }), search:async () => { searched = true; return [] } } })
  const rejected = buildSemanticRouteContext({ callerText:"How much does Woxza cost?", routeState:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true } })
  assert.deepEqual(await engine.decide({ route, context:rejected }), { decision:"no_decision", reason:"pricing" })
  assert.equal(searched, false)
})
