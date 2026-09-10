const actions = ["ask_permission", "grant_permission", "reassure_permission", "close_declined"]
const riskyActions = ["grant_permission", "close_declined"]
const defaultThresholds = { minimumScore:0.75, minimumNegativeMargin:0.10, minimumCompetingMargin:0.05 }
const number = value => Number.isFinite(Number(value)) ? Number(value) : null
const rounded = value => Number(Number(value).toFixed(4))
const margin = value => number(value) ?? 2 // Mirrors the decision engine when there is no competing outcome.

const predictedAction = (row, { minimumScore=defaultThresholds.minimumScore, minimumNegativeMargin=defaultThresholds.minimumNegativeMargin, minimumCompetingMargin=defaultThresholds.minimumCompetingMargin }={}) => {
  if (row.semantic_decision !== "action" || !row.semantic_action) return "no_decision"
  if ((number(row.positive_score) ?? -1) < minimumScore) return "no_decision"
  if (margin(row.negative_margin) < minimumNegativeMargin) return "no_decision"
  if ((number(row.competing_margin) ?? -1) < minimumCompetingMargin) return "no_decision"
  return row.semantic_action
}

const matrixFor = (rows, thresholds) => {
  const matrix = Object.fromEntries([...actions, "no_decision"].map(expected => [expected, Object.fromEntries([...actions, "no_decision"].map(predicted => [predicted, 0]))]))
  for (const row of rows) {
    const expected = row.expected_action
    const predicted = predictedAction(row, thresholds)
    if (matrix[expected]?.[predicted] !== undefined) matrix[expected][predicted] += 1
  }
  return matrix
}

const metricsFor = matrix => Object.fromEntries(actions.map(action => {
  const truePositive = matrix[action][action]
  const expectedCount = Object.values(matrix[action]).reduce((sum, count) => sum + count, 0)
  const falsePositive = [...actions, "no_decision"].filter(expected => expected !== action).reduce((sum, expected) => sum + matrix[expected][action], 0)
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

const candidateValues = (rows, field, fallback) => [...new Set([fallback, ...rows.map(row => number(row[field])).filter(value => value !== null)].map(rounded))].sort((left, right) => left - right)

// Prefer the highest-recall threshold set that produces no risky false positives.
// This recommendation is evidence only: Phase 5 is responsible for activation.
const selectThresholds = rows => {
  if (!rows.length) return { thresholds:defaultThresholds, byAction:metricsFor(matrixFor(rows, defaultThresholds)), source:"defaults_no_labels" }
  const candidates = {
    minimumScore:candidateValues(rows, "positive_score", defaultThresholds.minimumScore),
    minimumNegativeMargin:candidateValues(rows, "negative_margin", defaultThresholds.minimumNegativeMargin),
    minimumCompetingMargin:candidateValues(rows, "competing_margin", defaultThresholds.minimumCompetingMargin)
  }
  let best = null
  for (const minimumScore of candidates.minimumScore) for (const minimumNegativeMargin of candidates.minimumNegativeMargin) for (const minimumCompetingMargin of candidates.minimumCompetingMargin) {
    const thresholds = { minimumScore, minimumNegativeMargin, minimumCompetingMargin }
    const byAction = metricsFor(matrixFor(rows, thresholds))
    const riskyFalsePositives = riskyActions.reduce((sum, action) => sum + byAction[action].false_positive, 0)
    const riskyRecall = riskyActions.reduce((sum, action) => sum + (byAction[action].recall ?? 0), 0)
    const strictness = minimumScore + minimumNegativeMargin + minimumCompetingMargin
    const candidate = { thresholds, byAction, riskyFalsePositives, riskyRecall, strictness }
    if (!best || candidate.riskyFalsePositives < best.riskyFalsePositives || (candidate.riskyFalsePositives === best.riskyFalsePositives && candidate.riskyRecall > best.riskyRecall) || (candidate.riskyFalsePositives === best.riskyFalsePositives && candidate.riskyRecall === best.riskyRecall && candidate.strictness > best.strictness)) best = candidate
  }
  return { ...best, source:"labelled_evidence" }
}

export function calibrateSemanticRoute({ rows=[], minimumReviewedPerAction=30 }={}) {
  const labelled = rows.filter(row => row?.expected_action)
  const calibration = selectThresholds(labelled)
  const thresholds = calibration.thresholds
  const matrix = matrixFor(labelled, thresholds)
  const byAction = calibration.byAction
  const enoughEvidence = riskyActions.every(action => byAction[action].reviewed >= minimumReviewedPerAction)
  const safe = enoughEvidence && riskyActions.every(action => byAction[action].false_positive === 0 && byAction[action].recall >= 0.9)
  return {
    reviewed_count:labelled.length,
    unlabelled_count:Math.max(0, rows.length - labelled.length),
    minimum_reviewed_per_action:minimumReviewedPerAction,
    thresholds,
    threshold_source:calibration.source,
    confusion_matrix:matrix,
    by_action:byAction,
    recommendation:safe ? "eligible_for_controlled_activation" : enoughEvidence ? "keep_shadow_and_improve_catalog_or_thresholds" : "insufficient_labelled_evidence"
  }
}
