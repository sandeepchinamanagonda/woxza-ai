CREATE TABLE IF NOT EXISTS business_memory_facts (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  scope_type VARCHAR(32) NOT NULL,
  scope_id TEXT NOT NULL,
  fact_type VARCHAR(64) NOT NULL,
  value_json JSONB NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('confirmed','corrected','superseded','revoked')),
  confidence NUMERIC NOT NULL,
  source_canonical_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
  source_call_id UUID NOT NULL REFERENCES demo_calls(id),
  confirmed_by_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX IF NOT EXISTS business_memory_facts_one_current_idx
  ON business_memory_facts (tenant_id,scope_type,scope_id,fact_type)
  WHERE status IN ('confirmed','corrected');
CREATE INDEX IF NOT EXISTS business_memory_facts_lookup_idx
  ON business_memory_facts (tenant_id,scope_type,scope_id,created_at DESC);

CREATE TABLE IF NOT EXISTS memory_outbox_events (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  idempotency_key TEXT NOT NULL,
  source_canonical_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
  payload JSONB NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_error TEXT,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id,idempotency_key)
);
CREATE INDEX IF NOT EXISTS memory_outbox_events_pending_idx ON memory_outbox_events (status,next_attempt_at);
