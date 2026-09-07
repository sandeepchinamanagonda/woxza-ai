-- Gemini V3 is a text-only brain. Keep its provider-native USD estimate next
-- to the INR call total, so a dashboard can reconcile tokens and FX later.
ALTER TABLE calls ADD COLUMN IF NOT EXISTS llm_model VARCHAR(160);
ALTER TABLE calls ADD COLUMN IF NOT EXISTS estimated_gemini_usd NUMERIC(18,10) NOT NULL DEFAULT 0;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS estimated_gemini_inr NUMERIC(14,6) NOT NULL DEFAULT 0;
