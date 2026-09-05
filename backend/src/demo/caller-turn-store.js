import { randomUUID } from "node:crypto"

const ACTIVE = ["pending", "interpreting"]

export function createCallerTurnStore({ db }={}) {
  if (!db?.query) throw new Error("Caller turn store requires a database")
  return {
    async createPendingTurn({ demoCallId, sessionEpoch, turnSequence, transcriptTurnId=null, text, languageCode=null, confidence=null, provenance={} }) {
      const id = randomUUID()
      const result = await db.query(
        `INSERT INTO canonical_caller_turns
          (id,demo_call_id,session_epoch,turn_sequence,status,transcript_turn_id,authoritative_text,language_code,confidence,provenance)
         VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9::jsonb)
         RETURNING *`,
        [id, demoCallId, sessionEpoch, turnSequence, transcriptTurnId, text, languageCode, confidence, JSON.stringify(provenance || {})]
      )
      return result.rows[0]
    },
    async claimForInterpretation({ id, sessionEpoch }) {
      const result = await db.query(
        `UPDATE canonical_caller_turns
         SET status='interpreting', updated_at=NOW()
         WHERE id=$1 AND session_epoch=$2 AND status='pending'
         RETURNING *`, [id, sessionEpoch]
      )
      return result.rows[0] || null
    },
    async acceptInterpretation({ id, sessionEpoch, interpretation, normalizedInterpretation, validation, model, version }) {
      const result = await db.query(
        `UPDATE canonical_caller_turns
         SET status='accepted', interpretation=$3::jsonb, normalized_interpretation=$4::jsonb,
             validation=$5::jsonb, interpreter_model=$6, interpreter_version=$7,
             interpreted_at=NOW(), accepted_at=NOW(), updated_at=NOW()
         WHERE id=$1 AND session_epoch=$2 AND status='interpreting'
         RETURNING *`,
        [id, sessionEpoch, JSON.stringify(interpretation), JSON.stringify(normalizedInterpretation), JSON.stringify(validation), model, version]
      )
      if (result.rows[0]) return result.rows[0]
      const existing = await db.query("SELECT * FROM canonical_caller_turns WHERE id=$1", [id])
      return existing.rows[0]?.status === "accepted" ? existing.rows[0] : null
    },
    async expireTurn({ id, sessionEpoch, reason="expired" }) {
      const result = await db.query(
        `UPDATE canonical_caller_turns
         SET status='expired', validation=COALESCE(validation,'{}'::jsonb) || jsonb_build_object('expiry_reason',$3::text), updated_at=NOW()
         WHERE id=$1 AND session_epoch=$2 AND status = ANY($4::varchar[])
         RETURNING *`, [id, sessionEpoch, reason, ACTIVE]
      )
      return result.rows[0] || null
    },
    async expireActiveForCall({ demoCallId, reason="session_replaced" }) {
      const result = await db.query(
        `UPDATE canonical_caller_turns
         SET status='expired', validation=COALESCE(validation,'{}'::jsonb) || jsonb_build_object('expiry_reason',$2::text), updated_at=NOW()
         WHERE demo_call_id=$1 AND status = ANY($3::varchar[])
         RETURNING *`, [demoCallId, reason, ACTIVE]
      )
      return result.rows
    },
    async getAcceptedTurn(id) {
      const result = await db.query("SELECT * FROM canonical_caller_turns WHERE id=$1 AND status='accepted'", [id])
      return result.rows[0] || null
    }
  }
}
