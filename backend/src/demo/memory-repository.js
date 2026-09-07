import { randomUUID } from "node:crypto"

const required = tenantId => { if (!tenantId) throw new Error("tenantId is required for memory access") }
export function createMemoryRepository({ db }) {
  return {
    async getActiveFacts({ tenantId, scopeType, scopeId }) {
      required(tenantId)
      const result = await db.query(`SELECT * FROM business_memory_facts WHERE tenant_id=$1 AND scope_type=$2 AND scope_id=$3 AND status IN ('confirmed','corrected') ORDER BY updated_at DESC`, [tenantId,scopeType,scopeId])
      return result.rows
    },
    async enqueueConfirmedFact({ tenantId, sourceCanonicalTurnId, sourceCallId, scopeType="business", scopeId, factType, value, confidence, confirmedByTurnId }) {
      required(tenantId)
      const payload = { tenantId, sourceCanonicalTurnId, sourceCallId, scopeType, scopeId, factType, value, confidence, confirmedByTurnId }
      const idempotencyKey = `${sourceCanonicalTurnId}:${factType}:${confirmedByTurnId}`
      await db.query(`INSERT INTO memory_outbox_events (id,tenant_id,event_type,idempotency_key,source_canonical_turn_id,payload) VALUES ($1,$2,'confirmed_fact',$3,$4,$5::jsonb) ON CONFLICT (tenant_id,idempotency_key) DO NOTHING`, [randomUUID(),tenantId,idempotencyKey,sourceCanonicalTurnId,JSON.stringify(payload)])
    },
    async getOpenContactConflicts(tenantId) {
      required(tenantId)
      const result = await db.query(`SELECT id,contact_scope_hash,business_scope_id,linked_from_turn_id,conflicting_turn_id,conflict_event_id,created_at FROM memory_contact_business_links WHERE tenant_id=$1 AND status='conflict' ORDER BY created_at DESC`, [tenantId])
      return result.rows
    },
    async linkContactToConfirmedBusiness({ tenantId, contactScopeHash, businessScopeId, confirmedTurnId }) {
      required(tenantId)
      if (!contactScopeHash || !businessScopeId || !confirmedTurnId) throw new Error("contact scope, business scope, and confirmed turn are required")
      const existing = await db.query(`SELECT * FROM memory_contact_business_links WHERE tenant_id=$1 AND contact_scope_hash=$2 AND status IN ('confirmed','conflict') ORDER BY created_at DESC LIMIT 1`, [tenantId,contactScopeHash])
      const current = existing.rows[0]
      if (!current) {
        await db.query(`INSERT INTO memory_contact_business_links (id,tenant_id,contact_scope_hash,business_scope_id,status,linked_from_turn_id) VALUES ($1,$2,$3,$4,'confirmed',$5)`, [randomUUID(),tenantId,contactScopeHash,businessScopeId,confirmedTurnId])
        return { status:"confirmed", linked:true }
      }
      if (current.status === "conflict") return { status:"conflict", linked:false, duplicate:true }
      if (current.business_scope_id === businessScopeId) return { status:"confirmed", linked:true, duplicate:true }
      // Manual/future tooling alone may resolve conflict to confirmed or
      // revoked. Automatic calls never retry a conflicted contact link.
      const eventId = randomUUID()
      const eventKey = `contact_business_conflict:${contactScopeHash}:${current.business_scope_id}:${businessScopeId}`
      const client = await db.connect()
      await client.query("BEGIN")
      try {
        await client.query(`INSERT INTO memory_outbox_events (id,tenant_id,event_type,idempotency_key,source_canonical_turn_id,payload) VALUES ($1,$2,'contact_business_conflict',$3,$4,$5::jsonb) ON CONFLICT (tenant_id,idempotency_key) DO NOTHING`, [eventId,tenantId,eventKey,confirmedTurnId,JSON.stringify({ contact_scope_hash:contactScopeHash, existing_business_scope_id:current.business_scope_id, conflicting_business_scope_id:businessScopeId, conflicting_turn_id:confirmedTurnId })])
        await client.query(`UPDATE memory_contact_business_links SET status='conflict',conflicting_turn_id=$3,conflict_event_id=COALESCE(conflict_event_id,$4),updated_at=NOW() WHERE id=$1 AND tenant_id=$2`, [current.id,tenantId,confirmedTurnId,eventId])
        await client.query("COMMIT")
      } catch (error) { await client.query("ROLLBACK"); throw error } finally { client.release() }
      return { status:"conflict", linked:false, duplicate:false }
    }
  }
}
