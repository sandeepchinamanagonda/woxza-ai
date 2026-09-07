import { randomUUID } from "node:crypto"

const DELAYS_MS = [60_000, 300_000, 900_000, 1_800_000, 3_600_000]

export function nextMemoryRetryAt(attempt, random=Math.random) {
  const delay = DELAYS_MS[Math.max(0, Math.min(attempt - 1, DELAYS_MS.length - 1))]
  return new Date(Date.now() + delay + Math.floor(random() * Math.min(delay * .2, 30_000)))
}

export function createMemoryOutboxWorker({ db, log=console }={}) {
  return {
    async processOne() {
      const client = await db.connect()
      try {
        await client.query("BEGIN")
        const claimed = await client.query(`WITH candidate AS (SELECT id FROM memory_outbox_events WHERE status='pending' AND next_attempt_at<=NOW() ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) UPDATE memory_outbox_events e SET status='processing',attempt_count=e.attempt_count+1,updated_at=NOW() FROM candidate WHERE e.id=candidate.id RETURNING e.*`)
        const event = claimed.rows[0]
        if (!event) { await client.query("COMMIT"); return null }
        if (event.event_type === "contact_business_conflict") {
          // Same outbox/operational-alert path as failed durable writes; this
          // is intentionally visible without a second alerting mechanism.
          log.error("Contact-to-business memory conflict", { eventId:event.id, tenantId:event.tenant_id, conflict:event.payload })
          await client.query("UPDATE memory_outbox_events SET status='completed',completed_at=NOW(),updated_at=NOW() WHERE id=$1", [event.id])
          await client.query("COMMIT")
          return { status:"completed", id:event.id, eventType:event.event_type }
        }
        const fact = event.payload
        try {
          await client.query(`UPDATE business_memory_facts SET status='superseded',updated_at=NOW() WHERE tenant_id=$1 AND scope_type=$2 AND scope_id=$3 AND fact_type=$4 AND status IN ('confirmed','corrected')`, [fact.tenantId,fact.scopeType,fact.scopeId,fact.factType])
          await client.query(`INSERT INTO business_memory_facts (id,tenant_id,scope_type,scope_id,fact_type,value_json,status,confidence,source_canonical_turn_id,source_call_id,confirmed_by_turn_id) VALUES ($1,$2,$3,$4,$5,$6::jsonb,'confirmed',$7,$8,$9,$10)`, [randomUUID(),fact.tenantId,fact.scopeType,fact.scopeId,fact.factType,JSON.stringify(fact.value),fact.confidence,fact.sourceCanonicalTurnId,fact.sourceCallId,fact.confirmedByTurnId])
          await client.query("UPDATE memory_outbox_events SET status='completed',completed_at=NOW(),updated_at=NOW() WHERE id=$1", [event.id])
          await client.query("COMMIT")
          return { status:"completed", id:event.id }
        } catch (error) {
          const exhausted = event.attempt_count >= 5
          // The fact write may have aborted this transaction. Roll it back
          // before recording retry state, otherwise PostgreSQL rejects the
          // retry update and leaves the event invisibly stuck in processing.
          await client.query("ROLLBACK")
          await client.query("BEGIN")
          await client.query(`UPDATE memory_outbox_events SET status=$2::varchar,next_attempt_at=$3,last_error=$4,failed_at=CASE WHEN $2::text='failed' THEN NOW() ELSE NULL END,updated_at=NOW() WHERE id=$1`, [event.id, exhausted ? "failed" : "pending", exhausted ? new Date() : nextMemoryRetryAt(event.attempt_count), error.message])
          await client.query("COMMIT")
          if (exhausted) log.error("Memory outbox event permanently failed", { eventId:event.id, sourceCanonicalTurnId:event.source_canonical_turn_id, error:error.message })
          return { status:exhausted ? "failed" : "retry", id:event.id }
        }
      } catch (error) { try { await client.query("ROLLBACK") } catch {}; throw error } finally { client.release() }
    }
  }
}
