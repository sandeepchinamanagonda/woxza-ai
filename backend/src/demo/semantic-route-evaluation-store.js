import { randomUUID } from "node:crypto"

const actions = new Set(["ask_permission", "grant_permission", "reassure_permission", "close_declined", "no_decision"])
const text = value => String(value || "").trim()
const number = value => Number.isFinite(Number(value)) ? Number(value) : null

// Stores decision evidence only. Caller text remains solely in the transcript
// table, linked by ID, so route review cannot create another PII copy.
export function createSemanticRouteEvaluationStore({ db }={}) {
  if (!db?.query) throw new Error("db.query is required")
  return {
    async record({ demoCallId, callerTranscriptTurnId=null, routeId, callStage, activeLanguage, deterministicAction=null, semantic={}, latencyMs=null, catalogVersion="unknown" }={}) {
      if (!text(demoCallId) || !text(routeId) || !text(callStage) || !text(activeLanguage)) return null
      const id = randomUUID()
      const result = await db.query(
        `INSERT INTO semantic_route_evaluations
          (id,demo_call_id,caller_transcript_turn_id,route_id,call_stage,active_language,deterministic_action,semantic_decision,semantic_action,semantic_outcome_id,decision_reason,positive_score,negative_score,competing_score,negative_margin,competing_margin,latency_ms,catalog_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         ON CONFLICT (demo_call_id,caller_transcript_turn_id,route_id) DO NOTHING
         RETURNING id`,
        [id,demoCallId,callerTranscriptTurnId,text(routeId),text(callStage),text(activeLanguage),text(deterministicAction) || null,text(semantic.decision) || "no_decision",text(semantic.action) || null,text(semantic.outcome_id) || null,text(semantic.reason) || "unknown",number(semantic.positive_score),number(semantic.negative_score),number(semantic.competing_score),number(semantic.negative_margin),number(semantic.competing_margin),number(latencyMs),text(catalogVersion) || "unknown"]
      )
      return result.rows[0] || null
    },
    async list({ routeId=null, reviewed=null, limit=50, offset=0 }={}) {
      const values = [], where = []
      if (text(routeId)) { values.push(text(routeId)); where.push(`route_id=$${values.length}`) }
      if (reviewed === true) where.push("expected_action IS NOT NULL")
      if (reviewed === false) where.push("expected_action IS NULL")
      values.push(Math.min(100, Math.max(1, Number(limit) || 50)), Math.max(0, Number(offset) || 0))
      const result = await db.query(`SELECT id,demo_call_id,caller_transcript_turn_id,route_id,call_stage,active_language,deterministic_action,semantic_decision,semantic_action,semantic_outcome_id,decision_reason,positive_score,negative_score,competing_score,negative_margin,competing_margin,latency_ms,catalog_version,expected_action,reviewer_id,reviewed_at,created_at FROM semantic_route_evaluations ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`, values)
      return result.rows
    },
    async label({ id, expectedAction, reviewerId }={}) {
      if (!text(id) || !actions.has(expectedAction)) return null
      const result = await db.query("UPDATE semantic_route_evaluations SET expected_action=$2,reviewer_id=$3,reviewed_at=NOW() WHERE id=$1 RETURNING id,expected_action,reviewer_id,reviewed_at", [id,expectedAction,text(reviewerId) || "admin"])
      return result.rows[0] || null
    },
    async labelled({ routeId=null }={}) {
      const values = text(routeId) ? [text(routeId)] : []
      const result = await db.query(`SELECT route_id,expected_action,semantic_decision,semantic_action,positive_score,competing_margin FROM semantic_route_evaluations WHERE expected_action IS NOT NULL ${values.length ? "AND route_id=$1" : ""} ORDER BY created_at`, values)
      return result.rows
    }
  }
}
