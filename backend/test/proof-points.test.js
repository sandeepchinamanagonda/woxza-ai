import assert from "node:assert/strict"
import test from "node:test"
import { normalizeProofPoints } from "../src/demo/proof-points.js"

test("proof-point library accepts approved keyed claims and excludes pending or illustrative claims", () => {
  const points = normalizeProofPoints({
    _notes:"metadata",
    approved:{ claim:"Approved live claim", truth_level:"live", tags:["Calls"], status:"approved" },
    pending:{ claim:"Hold this claim", truth_level:"live", tags:[], status:"pending_review" },
    illustrative:{ claim:"Illustrative target", truth_level:"illustrative", tags:[], status:"approved" }
  })
  assert.deepEqual(points, [{ id:"approved", statement:"Approved live claim", truth_level:"live", tags:["calls"], applicable_verticals:[], applicable_pain:[], has_verified_metric:false, metric_value:null, review_status:"approved" }])
})
