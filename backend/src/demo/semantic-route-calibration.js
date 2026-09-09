const actions = ["ask_permission", "grant_permission", "reassure_permission", "close_declined"]
const number = value => Number.isFinite(Number(value)) ? Number(value) : null
const predictedAction = (row, { minimumScore=0.75, minimumCompetingMargin=0.05 }={}) => {
  if (row.semantic_decision !== "action" || !row.semantic_action) return "no_decision"
  if ((number(row.positive_score) ?? -1) < minimumScore) return "no_decision"
  if ((number(row.competing_margin) ?? -1) < minimumCompetingMargin) return "no_decision"
  return row.semantic_action
}

export function calibrateSemanticRoute({ rows=[], minimumReviewedPerAction=30 }={}) {
  const labelled = rows.filter(row => row?.expected_action)
  const thresholds = { minimumScore:0.75, minimumCompetingMargin:0.05 }
  const matrix = Object.fromEntries([...actions, "no_decision"].map(expected => [expected, Object.fromEntries([...actions, "no_decision"].map(predicted => [predicted, 0]))]))
  for (const row of labelled) {
    const expected = row.expected_action
    const predicted = predictedAction(row, thresholds)
    if (matrix[expected]?.[predicted] !== undefined) matrix[expected][predicted] += 1
  }
  const byAction = Object.fromEntries(actions.map(action => {
    const truePositive = matrix[action][action]
    const expectedCount = Object.values(matrix[action]).reduce((sum, count) => sum + count, 0)
    const falsePositive = actions.filter(expected => expected !== action).reduce((sum, expected) => sum + matrix[expected][action], 0)
    const predictedCount = truePositive + falsePositive
    return [action, {
      reviewed:expectedCount,
      true_positive:truePositive,
      false_positive:falsePositive,
      false_negative:expectedCount - truePositive,
      abstained:matrix[action].no_decision,
      precision:predictedCount ? Number((truePositive / predictedCount).toFixed(4)) : null,
      recall:expectedCount ? Number((truePositive / expectedCount).toFixed(4)) : null
    }]
  }))
  const riskyActions = ["grant_permission", "close_declined"]
  const enoughEvidence = riskyActions.every(action => byAction[action].reviewed >= minimumReviewedPerAction)
  const safe = enoughEvidence && riskyActions.every(action => byAction[action].false_positive === 0 && byAction[action].recall >= 0.9)
  return {
    reviewed_count:labelled.length,
    unlabelled_count:Math.max(0, rows.length - labelled.length),
    minimum_reviewed_per_action:minimumReviewedPerAction,
    thresholds,
    confusion_matrix:matrix,
    by_action:byAction,
    recommendation:safe ? "eligible_for_controlled_activation" : enoughEvidence ? "keep_shadow_and_improve_catalog_or_thresholds" : "insufficient_labelled_evidence"
  }
}
