ALTER TABLE demo_calls ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ;
ALTER TABLE demo_calls ADD COLUMN IF NOT EXISTS email_summary_scheduled_at TIMESTAMPTZ;
ALTER TABLE waitlist_registrations ADD COLUMN IF NOT EXISTS demo_session_id UUID REFERENCES demo_calls(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS waitlist_registrations_demo_session_id_idx ON waitlist_registrations (demo_session_id);
