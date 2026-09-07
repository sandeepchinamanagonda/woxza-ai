CREATE TABLE IF NOT EXISTS memory_contact_business_links (
  id UUID PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  contact_scope_hash TEXT NOT NULL,
  business_scope_id TEXT NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('confirmed','conflict','revoked')),
  linked_from_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
  conflicting_turn_id UUID REFERENCES canonical_caller_turns(id),
  conflict_event_id UUID REFERENCES memory_outbox_events(id),
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS memory_contact_business_links_one_active_idx
  ON memory_contact_business_links (tenant_id,contact_scope_hash)
  WHERE status IN ('confirmed','conflict');
CREATE INDEX IF NOT EXISTS memory_contact_business_links_open_conflicts_idx
  ON memory_contact_business_links (tenant_id,created_at DESC)
  WHERE status='conflict';
