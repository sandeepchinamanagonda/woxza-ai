-- Keeps P95/P50 production dashboard queries bounded as call-event volume grows.
CREATE INDEX IF NOT EXISTS call_events_created_type_latency_idx
  ON call_events (created_at DESC, event_type, latency_ms)
  WHERE latency_ms IS NOT NULL;
