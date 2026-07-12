ALTER TABLE demo_calls
  ADD COLUMN IF NOT EXISTS language VARCHAR(8) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS warning_injected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_reason VARCHAR(32);

ALTER TABLE demo_calls DROP CONSTRAINT IF EXISTS demo_calls_use_case_check;
ALTER TABLE demo_calls ADD CONSTRAINT demo_calls_use_case_check
  CHECK (use_case IN ('appointment_booking','restaurant_reservations','medical_distribution','payments_support','appointment','restaurant','distribution','payments'));

ALTER TABLE demo_calls DROP CONSTRAINT IF EXISTS demo_calls_status_check;
ALTER TABLE demo_calls ADD CONSTRAINT demo_calls_status_check
  CHECK (status IN ('initiating','pending','ringing','connected','completed','no_answer','failed'));
