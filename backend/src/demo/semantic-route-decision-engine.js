import { preflightSemanticRoute, semanticRouteQuery } from "./semantic-route-policy.js"

const rounded = value => Number(value.toFixed(4))

const decisionSettings = route => ({
  actionOutcomeIds:route?.decision?.actionOutcomeIds || [],
  minimumScore:route?.decision?.minimumScore ?? 0.75,
  minimumNegativeMargin:route?.decision?.minimumNegativeMargin ?? 0.10,
  minimumCompetingMargin:route?.decision?.minimumCompetingMargin ?? 0.05,
  aggregateTopK:route?.decision?.aggregateTopK ?? 3
})

const outcomeScores = (hits, aggregateTopK) => {
  const groups = new Map()
  for (const hit of hits) {
    const scores = groups.get(hit.outcomeId) || []
    scores.push(hit.score)
    groups.set(hit.outcomeId, scores)
  }
  return [...groups.entries()].map(([outcomeId, scores]) => ({
    outcomeId,
    score:scores.slice(0, aggregateTopK).reduce((total, score) => total + score, 0) / Math.min(scores.length, aggregateTopK),
    topExampleId:hits.find(hit => hit.outcomeId === outcomeId)?.documentId || null
  })).sort((left, right) => right.score - left.score || left.outcomeId.localeCompare(right.outcomeId))
}

// This engine never speaks to the caller. It produces only a backend action
// recommendation when a route clears all configured confidence margins.
export function createSemanticRouteDecisionEngine({ index }={}) {
  if (!index || typeof index.search !== "function" || typeof index.status !== "function") throw new Error("index with search and status is required")
  return {
    async decide({ route, context }) {
      const preflight = preflightSemanticRoute({ route, context })
      if (!preflight.eligible) return { decision:"no_decision", reason:preflight.reason }
      const settings = decisionSettings(route)
      if (!settings.actionOutcomeIds.length) return { decision:"no_decision", reason:"route_has_no_action_outcomes" }
      const documentCount = index.status().documentCount || 0
      const hits = (await index.search(semanticRouteQuery({ route, context }), { topK:documentCount })).filter(hit => hit.routeId === route.id)
      if (!hits.length) return { decision:"no_decision", reason:"no_route_examples" }
      const scores = outcomeScores(hits, settings.aggregateTopK)
      const actionCandidates = scores.filter(score => settings.actionOutcomeIds.includes(score.outcomeId))
      const winner = actionCandidates[0]
      if (!winner) return { decision:"no_decision", reason:"best_outcome_is_not_action", outcome_scores:scores.map(score => ({ ...score, score:rounded(score.score) })) }
      const nonAction = scores.filter(score => !settings.actionOutcomeIds.includes(score.outcomeId))
      const strongestNegative = nonAction[0]
      const strongestCompetitor = scores.filter(score => score.outcomeId !== winner.outcomeId)[0]
      const negativeMargin = strongestNegative ? winner.score - strongestNegative.score : 2
      const competingMargin = strongestCompetitor ? winner.score - strongestCompetitor.score : 2
      const diagnostic = {
        route_id:route.id,
        outcome_id:winner.outcomeId,
        action:hits.find(hit => hit.outcomeId === winner.outcomeId)?.action || null,
        positive_score:rounded(winner.score),
        negative_score:strongestNegative ? rounded(strongestNegative.score) : null,
        competing_score:strongestCompetitor ? rounded(strongestCompetitor.score) : null,
        negative_margin:rounded(negativeMargin),
        competing_margin:rounded(competingMargin),
        matched_example_id:winner.topExampleId,
        outcome_scores:scores.map(score => ({ ...score, score:rounded(score.score) }))
      }
      if (winner.score < settings.minimumScore) return { decision:"no_decision", reason:"below_minimum_score", ...diagnostic }
      if (negativeMargin < settings.minimumNegativeMargin) return { decision:"no_decision", reason:"negative_margin_too_small", ...diagnostic }
      if (competingMargin < settings.minimumCompetingMargin) return { decision:"no_decision", reason:"competing_margin_too_small", ...diagnostic }
      return { decision:"action", reason:"high_confidence", ...diagnostic }
    }
  }
}
