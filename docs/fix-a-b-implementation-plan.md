# Fix A + Fix B implementation plan

## Scope and non-goals

This plan removes model-owned turn sequencing and introduces one immutable,
canonical interpretation for each committed caller utterance.

It deliberately does **not** add the delivery watchdog or a caller-facing
fallback. That is Fix C and is out of scope for this change.

The invariant after this work is:

> A committed caller utterance has one backend-owned lease and at most one
> accepted interpretation. Workflow actions, confirmations, and agent speech
> consume that frozen interpretation; none re-interpret the source utterance.

## Current state being replaced

`gemini-bridge.js` currently increments `session.turn_id`, sends both that
number and `session.state_version` in an `ORCHESTRATOR TURN` prompt, and
requires Gemini to echo both in `submit_turn_interpretation`. The handler
rejects any mismatch. `state_version` is advanced only when the first agent
audio is emitted, a lifecycle detail that Gemini cannot observe.

This coupling must be removed completely from the model contract. Internal
`state_version` remains useful for store-level optimistic concurrency, but is
never sent to, accepted from, or compared against model output.

## Target data model

### Redis call session extension

Extend the existing session value with only current-call coordination data:

```js
{
  // Existing server-owned storage integrity version.
  state_version: 12,

  session_epoch: 3,
  next_turn_sequence: 8,
  active_turn_lease_id: "uuid",
  active_turn_status: "pending", // pending | interpreting | accepted | expired
  active_turn_started_at: "2026-08-09T...Z"
}
```

`session_epoch` is incremented by the backend whenever a Live Gemini session
is replaced after reconnect. It fences late callbacks from a former session.
`next_turn_sequence` is a backend-only monotonic convenience value. The
opaque lease id is the actual correlation key.

### Postgres: immutable caller-turn record

Add migration `021_canonical_caller_turns.sql`:

```sql
CREATE TABLE canonical_caller_turns (
  id UUID PRIMARY KEY,
  demo_call_id UUID NOT NULL REFERENCES demo_calls(id) ON DELETE CASCADE,
  session_epoch INTEGER NOT NULL,
  turn_sequence INTEGER NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN
    ('pending','interpreting','accepted','expired','failed')),
  transcript_turn_id BIGINT REFERENCES call_transcript_turns(id) ON DELETE SET NULL,
  authoritative_text TEXT NOT NULL,
  language_code VARCHAR(16),
  confidence NUMERIC,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  interpretation JSONB,
  normalized_interpretation JSONB,
  validation JSONB,
  interpreter_model VARCHAR(120),
  interpreter_version VARCHAR(120),
  interpreted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX canonical_caller_turns_active_per_call
  ON canonical_caller_turns (demo_call_id)
  WHERE status IN ('pending', 'interpreting');
CREATE UNIQUE INDEX canonical_caller_turns_sequence_per_epoch
  ON canonical_caller_turns (demo_call_id, session_epoch, turn_sequence);
CREATE INDEX canonical_caller_turns_call_created_idx
  ON canonical_caller_turns (demo_call_id, created_at);
```

The `accepted` record is immutable: application code must never update its
transcript, raw interpretation, normalized interpretation, or validation.
It may only be read. If an utterance needs clarification, that clarification
creates a new caller turn linked by a `clarifies_turn_id` field (add it now if
we expect that workflow in this release).

The implementation should persist the transcript row first and save its id in
`transcript_turn_id`. This gives the dashboard and interpreter a shared,
auditable transcript source rather than duplicate caller text.

### Repository module

Create `backend/src/demo/caller-turn-store.js`. It owns SQL and exposes:

- `createPendingTurn({ demoCallId, sessionEpoch, turnSequence, transcript })`
- `claimForInterpretation({ id, sessionEpoch })` — atomically changes
  `pending -> interpreting` using `UPDATE ... WHERE status='pending' ...
  RETURNING *`.
- `acceptInterpretation({ id, interpretation, normalizedInterpretation,
  validation, model, version })` — atomic `interpreting -> accepted`.
- `expireTurn({ id, reason })`
- `getAcceptedTurn(id)`
- `getActiveTurn(demoCallId)`

An accepted row must never be overwritten. A duplicate accept returns the
already-accepted row for idempotency, but does not alter it.

## Dedicated structured interpreter

Create `backend/src/demo/turn-interpreter.js`.

It accepts exactly one frozen `canonical_caller_turns` source payload plus a
minimal backend-owned workflow snapshot (current phase, confirmed business
profile, configured language). It sends a single non-live Gemini structured
generation request and returns JSON matching the existing interpretation
shape:

```js
{ intent, clarity, details }
```

The interpreter prompt must say:

- Interpret only the provided canonical transcript; do not use remembered
  audio or prior model output.
- Preserve the caller's meaning and do not invent names, business facts, or
  quantities.
- Return JSON only; it cannot speak and cannot choose a workflow action.
- A previous turn's interpretation is immutable and is provided only as
  read-only context when it is relevant.

Use the same `TURN_INTENTS`, `BUSINESS_CATEGORIES`, `WORKFLOW_TAGS`, and
`DEMO_SCENARIOS` enums as the current tool schema. `turn-normalizer.js` stays
server-side and normalizes only this one response. Its output, plus schema
validation and transcript provenance, is what becomes frozen.

No model call is made for the same turn after the record becomes `accepted`.
Retries reuse the persisted accepted record. A failed interpreter attempt can
be retried only while the same row is `interpreting`; it records its attempt
metadata but cannot create a second semantic result. Exact retry policy is a
separate operational decision and should be explicit in the implementation.

## File-by-file change plan

### `backend/src/demo/prompt.js`

- Replace “wait for backend instruction containing a turn_id” with “wait for
  the backend-approved action before speaking.”
- Remove every instruction to track, increment, echo, or reason about turns
  or state versions.
- Remove instructions that ask Live Gemini to derive the caller intent or
  business fields. Live Gemini receives action-delivery instructions only.
- Retain language, safety, role, and action-delivery constraints.

### `backend/src/demo/gemini-bridge.js`

- Remove `submit_turn_interpretation` from `functionDeclarations` and from
  the Live session `tools` list. Remove `turn_id` and
  `expected_state_version` from all prompts and schemas; do not replace them
  with model-visible counters.
- On the authoritative STT commit path (currently the combined caller turn),
  persist a caller transcript and immediately create a backend-owned pending
  lease through `caller-turn-store`.
- Start the dedicated interpreter once for that lease. It receives the
  persisted transcript and a server-read workflow snapshot.
- Atomically accept and freeze the normalized result, then call the
  deterministic engine with the canonical record's normalized interpretation.
- Send Live Gemini only the approved action and response context. It must not
  receive raw original caller text for extraction, nor receive an instruction
  to invoke an interpretation tool.
- Replace `pendingOrchestratorAction` correlation from model-derived turn
  state with `lease_id` plus `action_id`; before committing first audio,
  confirm the lease is the active accepted lease in the current session epoch.
- On barge-in or socket reconnect, expire/cancel any still-pending or
  interpreting lease. Increment `session_epoch` before accepting work from a
  replacement Live session.
- Keep the existing approved-action speech watchdog unchanged. It is not the
  Fix C delivery watchdog and must not become the interpretation fallback.
- Add structured event logs: `caller_turn_committed`,
  `interpretation_claimed`, `interpretation_accepted`,
  `interpretation_duplicate_discarded`, and `turn_lease_expired`. Payloads
  contain lease id, epoch, sequence, status, model/version, and latency; do
  not copy transcript text into `call_events`.

### `backend/src/demo/orchestrator.js`

- Remove `turn_id` and `expected_state_version` arguments from `submitTurn`.
- Change `submitTurn(session, interpretation)` to accept a server-validated,
  frozen canonical interpretation plus its lease metadata for audit only.
- Delete model-counter and duplicate checks. The caller-turn store is the
  single authority for “has this turn already been interpreted?”
- Preserve phase checks, intent validation, deterministic workflow behavior,
  and internal `state_version` progression. `state_version` continues to be
  incremented as a backend storage version only.
- Update `pending_action.action_id` to include the server lease id rather
  than the model-visible turn id.

### `backend/src/demo/orchestrator-store.js`

- Add `compareAndSave(session, expectedStateVersion)` implemented atomically.
  For Redis this must use `WATCH/MULTI` or a Lua compare-and-set script; a
  process-local read/mutate/write is insufficient across instances.
- Session updates that create a lease, transition phase, or commit an action
  use CAS and retry/reload on conflict.
- Store only active-lease references in Redis; Postgres is the durable source
  for all turn records and accepted interpretations.

### `backend/src/demo/turn-normalizer.js`

- Keep its current server-only language and business normalization behavior.
- Change its input contract to reject/remove legacy `turn_id` and
  `expected_state_version` rather than carrying them through.
- Return explicit validation/provenance metadata so it can be frozen with the
  interpretation. It must not call any model or mutate prior turn records.

### `backend/src/database.js` and migrations

- Register `021_canonical_caller_turns.sql` in migration order.
- Add any needed `call_events` enum migration for the new audit event names
  (the current regex-based type constraint already accepts them, so only
  verify migration order is compatible).
- No destructive migration is needed: old transcript and events remain
  queryable, while new calls populate the canonical table.

### Tests

Update unit tests that construct interpretations to remove version fields.
Add:

1. one committed transcript creates exactly one lease and one interpreter
   request;
2. two delivery/retry callbacks for the same lease return the same accepted
   frozen interpretation and produce one workflow action;
3. a late result from a prior `session_epoch` is discarded;
4. a barge-in expires a pending lease and cannot later commit its action;
5. accepted interpretation is immutable at the repository layer;
6. Gemini Live schema contains neither `turn_id` nor
   `expected_state_version`;
7. replay fixtures for `940ac...` and `405cc...` cannot create a second
   interpretation from the same committed caller turn.

## Runtime sequence

1. VAD identifies endpoint; authoritative STT returns final transcript.
2. Backend persists caller transcript and creates the only active lease.
3. Backend claims the lease and invokes the structured interpreter once.
4. Backend normalizes, validates, and atomically freezes the interpretation.
5. The deterministic orchestrator consumes the frozen result and produces an
   approved action.
6. Live Gemini receives only that approved action to render/speak.
7. Any duplicate callback, stale session epoch, or repeated tool behavior is
   non-mutating and cannot cause another interpretation.

## Deployment and migration plan

### Schema first

Deploy migration 021 and the new repository before enabling the new execution
path. It is additive and does not alter existing calls or transcript rows.

### Compatibility release

Ship code that can read legacy Redis sessions that lack `session_epoch`,
`next_turn_sequence`, and active lease fields; default them to `0`, `0`, and
`null`. Do not attempt to manufacture canonical records for active legacy
calls.

Existing in-flight calls retain the old bridge/session behavior until their
process/session ends. New calls after enablement use only the new path. This
avoids mixing an LLM-generated counter with a backend lease inside a single
conversation.

### Cutover

1. Drain or let the maximum call TTL (currently 30 minutes) expire after the
   compatibility release.
2. Enable the lease/interpreter feature flag for new calls.
3. Confirm telemetry shows one `interpretation_accepted` at most per
   `caller_turn_committed`, zero legacy-version rejections, and no cross-epoch
   commits.
4. Remove legacy tool schema/prompt/handler code in the subsequent release,
   after no active legacy sessions remain.

### Legacy state cleanup

`expected_state_version`, `turn_id`, and `last_processed_turn_id` may remain
in old Redis JSON until TTL expiry; they can be ignored safely. They do not
require a destructive database migration because they are not durable tables.
After the drain window, remove them from `createCallSession` and from new
sessions. Keep `state_version` internally, rename it to
`storage_version` only in a later cleanup if that improves clarity.

## Decision points before code

1. **Interpreter model:** choose the lowest-latency Gemini structured model
   that supports strict JSON/schema output in the deployed account. The model
   and version are persisted for audit.
2. **Lease expiry:** define a server-side interpretation deadline. This is not
   a caller-facing fallback; it is required to prevent an abandoned pending
   lease from blocking future turns.
3. **Confirmation linkage:** approve adding `clarifies_turn_id` now, so
   business-name confirmation and corrections create a new canonical turn
   rather than mutating an old interpretation.
4. **Cutover policy:** recommended default is new-call-only activation, not
   switching an in-progress call across protocols.
