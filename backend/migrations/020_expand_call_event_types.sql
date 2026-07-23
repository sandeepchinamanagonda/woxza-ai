ALTER TABLE call_events DROP CONSTRAINT IF EXISTS call_events_event_type_check;
ALTER TABLE call_events ALTER COLUMN event_type TYPE VARCHAR(96);
ALTER TABLE call_events ADD CONSTRAINT call_events_event_type_check CHECK (event_type ~ '^[A-Za-z0-9_:-]+$');
