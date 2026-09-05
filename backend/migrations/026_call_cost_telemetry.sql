-- Provider invoices remain authoritative. These fields preserve the exact
-- units Woxza sent during a call plus a configuration-based INR estimate, so
-- local and production calls can be compared before the invoice arrives.
ALTER TABLE calls ADD COLUMN IF NOT EXISTS stt_audio_seconds NUMERIC(14,3) NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS tts_characters BIGINT NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS llm_cached_input_tokens BIGINT NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS estimated_stt_inr NUMERIC(14,6) NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS estimated_tts_inr NUMERIC(14,6) NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS estimated_llm_inr NUMERIC(14,6) NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS estimated_total_inr NUMERIC(14,6) NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS cost_estimation_version VARCHAR(64);

CREATE INDEX IF NOT EXISTS calls_estimated_total_inr_idx ON calls (estimated_total_inr DESC);
