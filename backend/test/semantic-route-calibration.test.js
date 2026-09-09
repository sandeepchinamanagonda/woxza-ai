import test from "node:test"
import assert from "node:assert/strict"
import { calibrateSemanticRoute } from "../src/demo/semantic-route-calibration.js"

test("calibration refuses activation until risky actions have enough labelled evidence", () => {
  const result = calibrateSemanticRoute({ rows:[{ expected_action:"grant_permission", semantic_decision:"action", semantic_action:"grant_permission", positive_score:.92, competing_margin:.14 }] })
  assert.equal(result.recommendation, "insufficient_labelled_evidence")
  assert.equal(result.by_action.grant_permission.true_positive, 1)
})

test("calibration identifies false positives and keeps a risky route in shadow", () => {
  const rows = []
  for (let index = 0; index < 30; index += 1) rows.push({ expected_action:"grant_permission", semantic_decision:"action", semantic_action:index === 0 ? "close_declined" : "grant_permission", positive_score:.92, competing_margin:.14 })
  for (let index = 0; index < 30; index += 1) rows.push({ expected_action:"close_declined", semantic_decision:"action", semantic_action:"close_declined", positive_score:.92, competing_margin:.14 })
  const result = calibrateSemanticRoute({ rows })
  assert.equal(result.by_action.close_declined.false_positive, 1)
  assert.equal(result.recommendation, "keep_shadow_and_improve_catalog_or_thresholds")
})
