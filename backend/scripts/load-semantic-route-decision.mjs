import { createSemanticRouteDecisionEngine } from "../src/demo/semantic-route-decision-engine.js"
import { buildSemanticRouteContext } from "../src/demo/semantic-route-policy.js"

const iterations = Math.max(1, Math.min(50_000, Number(process.env.SEMANTIC_LOAD_ITERATIONS || 2_000)))
const route = {
  id:"opening_permission",
  decision:{ actionOutcomeIds:["grant_permission"], minimumScore:.75, minimumNegativeMargin:.10, minimumCompetingMargin:.05, aggregateTopK:2 }
}
const index = {
  status:() => ({ documentCount:3 }),
  async search() {
    return [
      { routeId:"opening_permission", outcomeId:"grant_permission", action:"grant_permission", documentId:"grant-1", score:.93 },
      { routeId:"opening_permission", outcomeId:"grant_permission", action:"grant_permission", documentId:"grant-2", score:.91 },
      { routeId:"opening_permission", outcomeId:"close_declined", action:"close_declined", documentId:"decline-1", score:.61 }
    ]
  }
}
const engine = createSemanticRouteDecisionEngine({ index })
const context = buildSemanticRouteContext({ callStage:"permission_pending", language:"te", callerText:"కొంచెం చెప్పండి, వింటాను", routeState:{ openingPermissionPending:true } })
const started = performance.now()
const results = await Promise.all(Array.from({ length:iterations }, () => engine.decide({ route, context })))
const elapsedMs = performance.now() - started
if (results.some(result => result.decision !== "action" || result.action !== "grant_permission")) throw new Error("Semantic decision load check produced an unexpected route result")
console.log(JSON.stringify({ status:"ok", iterations, elapsed_ms:Number(elapsedMs.toFixed(2)), decisions_per_second:Number((iterations / (elapsedMs / 1_000)).toFixed(0)) }))
