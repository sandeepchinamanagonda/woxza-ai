ALTER TABLE waitlist_preferences
  ADD COLUMN IF NOT EXISTS biggest_challenges JSONB NOT NULL DEFAULT '[]'::jsonb;
