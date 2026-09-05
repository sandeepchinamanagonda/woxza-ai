-- Historical V3 calls predate durable cost telemetry, but their event stream
-- retained exact phrase lengths and cumulative Gemini usage. Backfill only
-- those recoverable units. Caller-audio seconds were not recorded then and
-- deliberately remain zero rather than being guessed from call duration.
WITH tts AS (
  SELECT demo_call_id, SUM((payload->>'characters')::INTEGER) AS characters
  FROM call_events
  WHERE event_type = 'tts_phrase_ready'
    AND COALESCE(payload->>'characters','') ~ '^[0-9]+$'
  GROUP BY demo_call_id
), latest_llm AS (
  SELECT DISTINCT ON (demo_call_id)
    demo_call_id,
    NULLIF(payload->>'model','') AS model,
    COALESCE(NULLIF(payload #>> '{call_usage,estimated_gemini_cost_usd}','')::NUMERIC, 0) AS gemini_usd
  FROM call_events
  WHERE event_type = 'llm_response'
    AND payload->>'provider' = 'gemini'
  ORDER BY demo_call_id, created_at DESC
)
UPDATE calls c
SET tts_characters = tts.characters,
    estimated_tts_inr = ROUND((tts.characters::NUMERIC / 1000) * 2.996, 6),
    llm_model = COALESCE(latest_llm.model, c.llm_model),
    estimated_gemini_usd = COALESCE(latest_llm.gemini_usd, 0),
    estimated_gemini_inr = ROUND(COALESCE(latest_llm.gemini_usd, 0) * 94.5, 6),
    estimated_llm_inr = ROUND(COALESCE(latest_llm.gemini_usd, 0) * 94.5, 6),
    estimated_total_inr = ROUND((tts.characters::NUMERIC / 1000) * 2.996 + COALESCE(latest_llm.gemini_usd, 0) * 94.5, 6),
    cost_estimation_version = 'historical-v3-events-2026-09'
FROM tts
LEFT JOIN latest_llm ON latest_llm.demo_call_id = tts.demo_call_id
WHERE c.demo_call_id = tts.demo_call_id
  AND c.cost_estimation_version IS NULL;
