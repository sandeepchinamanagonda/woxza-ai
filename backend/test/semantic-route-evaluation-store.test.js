import test from "node:test"
import assert from "node:assert/strict"
import { createSemanticRouteEvaluationStore } from "../src/demo/semantic-route-evaluation-store.js"

test("semantic route evaluation store records evidence without caller text and accepts reviewed labels", async () => {
  const queries = []
  const db = { async query(sql, values) {
    queries.push({ sql, values })
    if (sql.startsWith("INSERT")) return { rows:[{ id:"evaluation-1" }] }
    if (sql.startsWith("UPDATE")) return { rows:[{ id:values[0], expected_action:values[1], reviewer_id:values[2] }] }
    return { rows:[] }
  } }
  const store = createSemanticRouteEvaluationStore({ db })
  assert.deepEqual(await store.record({ demoCallId:"call-1", callerTranscriptTurnId:"turn-1", routeId:"opening_permission", callStage:"permission_pending", activeLanguage:"te", deterministicAction:"grant_permission", semantic:{ decision:"action", action:"grant_permission", outcome_id:"grant_permission", reason:"high_confidence", positive_score:.91 }, latencyMs:31, catalogVersion:"v1" }), { id:"evaluation-1" })
  assert.doesNotMatch(queries[0].sql, /caller_text/i)
  assert.equal(queries[0].values.includes("grant_permission"), true)
  assert.deepEqual(await store.label({ id:"evaluation-1", expectedAction:"grant_permission", reviewerId:"reviewer@example.test" }), { id:"evaluation-1", expected_action:"grant_permission", reviewer_id:"reviewer@example.test" })
  assert.equal(await store.label({ id:"evaluation-1", expectedAction:"invented_action" }), null)
})
