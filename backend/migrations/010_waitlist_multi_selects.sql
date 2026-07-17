ALTER TABLE waitlist_preferences
  ADD COLUMN IF NOT EXISTS call_handlings JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_call_volumes JSONB NOT NULL DEFAULT '[]'::jsonb;
