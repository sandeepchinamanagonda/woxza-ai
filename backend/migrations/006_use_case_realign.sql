ALTER TABLE demo_calls DROP CONSTRAINT IF EXISTS demo_calls_use_case_check;
ALTER TABLE demo_calls ADD CONSTRAINT demo_calls_use_case_check
  CHECK (use_case IN (
    'order_taking',
    'customer_support',
    'lead_qualification',
    'appointment_booking',
    'event_rsvp',
    'feedback_survey',
    'recruiting_screening'
  ));
