import { randomUUID } from "node:crypto"

export const terminalOutcome = status => ({ completed:"connected", no_answer:"no_answer", failed:"failed" })[status]

export async function upsertLeadForTerminalCall(db, callId) {
  const result = await db.query(
    `INSERT INTO leads (id, name, phone, email, use_case, demo_call_id, call_outcome, call_duration_seconds, consent_marketing)
     SELECT $2, name, phone, email, use_case, id,
       CASE status WHEN 'completed' THEN 'connected' WHEN 'no_answer' THEN 'no_answer' ELSE 'failed' END,
       call_duration_seconds, consent_marketing
     FROM demo_calls WHERE id=$1 AND status IN ('completed','no_answer','failed')
     ON CONFLICT (demo_call_id) DO UPDATE SET
       call_outcome=EXCLUDED.call_outcome, call_duration_seconds=EXCLUDED.call_duration_seconds,
       consent_marketing=CASE WHEN leads.contact_status='unsubscribed' THEN FALSE ELSE EXCLUDED.consent_marketing END
     RETURNING *`,
    [callId, randomUUID()]
  )
  return result.rows[0] ?? null
}
