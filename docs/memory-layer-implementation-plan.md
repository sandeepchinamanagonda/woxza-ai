# Memory layer implementation plan

## Scope and rollout order

This plan builds only on the canonical-turn architecture: backend-owned leases,
one-shot interpretation, and immutable `canonical_caller_turns` records.
Memory consumes accepted canonical turns. It never interprets raw Live audio,
never retries an interpretation, and never overrides the current caller turn.

Implementation order is mandatory:

1. Verify Fix A + Fix B with local replay and live-call tests.
2. Add per-call working memory only.
3. Add durable fact ledger and transactional outbox.
4. Add compact fact retrieval at call start and before pitch/demo preparation.
5. Consider playbook/knowledge retrieval only after steps 1–4 have production
   evidence of correctness.

No vector search, full transcript retrieval, or cross-call memory is added in
steps 1–3.

## Non-negotiable contracts

1. The current accepted canonical turn always wins. Retrieved memory is
   read-only context and cannot complete, overwrite, or be silently merged
   into the current turn's interpretation.
2. `business_type` and `business_name` begin provisional regardless of model
   confidence. They require explicit caller confirmation before durable reuse.
3. Only `accepted` `canonical_caller_turns` records can create a candidate
   event. Provisional values are retained in canonical-turn audit data and
   Redis working memory only; they never enter the durable ledger.
4. Durable writes use a transactional outbox. No live response path performs a
   fire-and-forget ledger write.
5. Every memory repository operation requires `tenantId`; every query,
   uniqueness constraint, and lookup includes tenant scope.
6. Provisional data expires when the call ends and, independently, no later
   than 30 minutes after creation. It never appears in cross-call retrieval.

## Explicit-confirmation contract

### Preconditions

A fact can be considered for confirmation only when all conditions hold:

- It came from an accepted canonical interpretation.
- The agent made an explicit read-back of that exact fact in the immediately
  preceding agent turn.
- The next committed caller turn contains only an accepted affirmative phrase;
  it must not introduce a correction, extra fact, or unrelated request.

Anything else leaves the fact provisional. The same confirmation is not
repeated in the same call unless the caller explicitly revisits or corrects
that fact.

### Initial accepted affirmative phrases

The first rollout enables durable confirmation only for English, Telugu, and
the explicit code-switched forms below. Other configured languages remain
safe-by-default: their business type/name stays provisional until their phrase
set is reviewed and added.

| Language / form | Accepted normalized phrases |
|---|---|
| English | `yes`, `yes please`, `correct`, `that's correct`, `that is correct`, `right`, `that's right`, `confirm`, `confirmed` |
| Telugu | `అవును`, `అవును అండి`, `సరే`, `సరే అండి`, `కరెక్ట్`, `కరెక్ట్ అండి`, `నిజమే`, `నిర్ధారించండి`, `కన్ఫర్మ్` |
| Telugu–English code-switch | `yes అండి`, `yes andi`, `correct అండి`, `correct andi`, `అవును correct`, `అవును కన్ఫర్మ్`, `sare correct`, `సరే correct`, `confirm అండి`, `confirm andi` |

Normalization may trim surrounding whitespace and terminal punctuation and
collapse internal spaces. It must not fuzzy-match, infer an affirmative from
prosody, accept a substring, or translate a caller response before matching.

The following are always non-confirming: `yeah I guess`, `maybe`, `mm-hmm`,
`uh huh`, silence, partial/unclear audio, a mixed-language phrase outside the
enumerated list, a new topic, or any correction such as “no, it is a medical
distribution business.” A second independently consistent statement can
increase in-call confidence but never substitutes for read-back confirmation.

## Data model

### Redis: per-call working memory

Extend the existing orchestrator session with a TTL-bound projection:

```js
working_memory: {
  provisional_facts: [{
    fact_key, value, confidence, source_canonical_turn_id,
    readback_turn_id: null, expires_at
  }],
  confirmed_facts: [{ fact_key, value, confirmed_by_turn_id }],
  asked_confirmation_keys: ["business_type", "business_name"],
  retrieved_fact_ids: []
}
```

The existing 30-minute call-session TTL is the hard ceiling. Call close
explicitly removes this projection sooner. It has no cross-call reader.

### Postgres migration `023_memory_fact_ledger.sql`

Create `business_memory_facts`:

```sql
id UUID PRIMARY KEY,
tenant_id TEXT NOT NULL,
scope_type VARCHAR(32) NOT NULL,       -- business | contact
scope_id TEXT NOT NULL,
fact_type VARCHAR(64) NOT NULL,        -- business_type | business_name | ...
value_json JSONB NOT NULL,
status VARCHAR(16) NOT NULL CHECK (status IN
  ('confirmed','corrected','superseded','revoked')),
confidence NUMERIC NOT NULL,
source_canonical_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
source_call_id UUID NOT NULL REFERENCES demo_calls(id),
confirmed_by_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
expires_at TIMESTAMPTZ
```

`provisional` is intentionally absent from the durable ledger. Use a partial
unique index over `(tenant_id, scope_type, scope_id, fact_type)` for active
statuses so two competing current facts cannot exist. A correction transaction
first marks the old active fact `superseded`, then inserts the replacement.

Create `memory_outbox_events`:

```sql
id UUID PRIMARY KEY,
tenant_id TEXT NOT NULL,
event_type VARCHAR(64) NOT NULL,
idempotency_key TEXT NOT NULL,
source_canonical_turn_id UUID NOT NULL REFERENCES canonical_caller_turns(id),
payload JSONB NOT NULL,
status VARCHAR(16) NOT NULL CHECK (status IN ('pending','processing','completed','failed')),
attempt_count INTEGER NOT NULL DEFAULT 0,
next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
last_error TEXT,
completed_at TIMESTAMPTZ,
failed_at TIMESTAMPTZ,
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
UNIQUE (tenant_id, idempotency_key)
```

Index pending work by `(status, next_attempt_at)` and all source/retrieval
paths by `tenant_id`.

## File-by-file implementation plan

### `backend/src/demo/orchestrator.js`

- Add a deterministic `deriveMemoryCandidate(acceptedTurn, session)` helper.
- It may expose business type/name candidates and confirmation state but may
  not mutate durable memory.
- Add actions for explicit read-back only when a fact is provisional and its
  key has not already been asked in this call.
- Confirmation turns are linked to their read-back candidate; arbitrary
  `accept` intent must not promote a fact without that linkage.

### `backend/src/demo/turn-normalizer.js`

- Add `classifyMemoryConfirmation({ text, language })` using an exact,
  reviewed phrase registry rather than broad affirmative regexes.
- Export the registry and its test fixtures so language additions require an
  explicit review.
- Return `not_confirmed` by default, including unknown language, unsupported
  code-switch, ambiguous speech, or any text containing an extra claim.

### `backend/src/demo/orchestrator-store.js`

- Store and expire the `working_memory` projection with the existing call
  session. Set `expires_at` to the earliest of call end or now + 30 minutes.
- Add `clearWorkingMemory(callId, tenantId)` to the normal call-close path.
- Keep this data strictly call-scoped; do not add a generic cross-call Redis
  lookup.

### `backend/src/demo/memory-repository.js` (new)

- Every public method takes a required `tenantId` argument; reject missing
  tenant IDs before querying.
- Implement `getActiveFacts`, `confirmFact`, `supersedeAndConfirm`, and
  tenant-scoped replay helpers.
- Apply tenant predicates in every `SELECT`, `UPDATE`, and `INSERT` conflict
  key. Do not trust a caller-supplied scope id without tenant filtering.

### `backend/src/demo/memory-outbox.js` (new)

- In the same Postgres transaction that records a confirmed memory candidate,
  insert an idempotent outbox row.
- Worker claims one pending row using `FOR UPDATE SKIP LOCKED` (or equivalent
  atomic claim), validates that the source canonical turn is still accepted,
  and writes/supersedes the fact ledger atomically.
- Retries at attempts 1–5 with jittered target delays of 1, 5, 15, 30, and 60
  minutes. After the fifth failed attempt, set `failed`, retain `last_error`
  and source turn id, emit an operational alert event, and expose an
  idempotent replay operation. Never retry forever.
- Worker execution is background-only; the live bridge never awaits it.

### `backend/src/demo/memory-context.js` (new)

- Build a compact context packet from confirmed, tenant-scoped facts only:
  language preference, business type/name, confirmed pain points, workflow,
  and last verification date.
- Enforce a fixed field/count and byte budget. Never retrieve full
  transcripts, unconfirmed facts, or arbitrary historical conversation.
- Annotate the packet as read-only and lower priority than the current
  canonical transcript.

### `backend/src/demo/gemini-bridge.js`

- After a canonical interpretation is accepted, update working memory through
  deterministic orchestration only.
- Enqueue durable-memory candidates only after a linked explicit confirmation
  is itself accepted; do not enqueue after first extraction.
- At call start, load the compact memory packet by tenant and pass it only to
  the one-shot interpreter as read-only context. The current canonical turn is
  the higher-priority source.
- Before pitch/demo preparation, request the same compact context packet to
  improve relevance. This is outside the first-response latency-critical
  path.
- Call `clearWorkingMemory` on all terminal close paths.

### `backend/src/demo/turn-interpreter.js`

- Accept `memoryContext` as an optional, bounded, read-only field.
- Prompt explicitly: current canonical transcript wins; do not extract facts
  from memory; do not re-state a historical fact as caller speech.
- The interpreter does not decide durable-memory status and cannot enqueue a
  write.

### `backend/src/database.js`

- Register migration `023_memory_fact_ledger.sql` after the canonical-turn
  migration.

### Runtime / worker bootstrap

- Add a dedicated outbox worker process or a guarded periodic worker in the
  backend runtime. It must have independent health metrics and must not share
  the Live-call event loop.
- Add metrics: outbox pending age, completed count, retry count, failed count,
  and tenant-scoped retrieval latency.

## Tests required before enablement

1. First extraction of `hardware shop` is provisional and is never persisted
   to `business_memory_facts`.
2. Exact Telugu, English, and enumerated code-switched affirmatives promote
   only the immediately read-back fact.
3. Every ambiguous, partial, mixed-but-unlisted, unrelated, and corrective
   response remains provisional and does not trigger a repeated read-back in
   the same call.
4. A second matching caller statement does not promote without explicit
   read-back confirmation.
5. Call close and the 30-minute ceiling remove provisional working memory.
6. Fact written under tenant A is impossible to retrieve, update, supersede,
   or replay under tenant B.
7. Corrections leave one active current fact and an auditable superseded fact.
8. Outbox success is idempotent; retries use the five bounded delays; attempt
   six does not run and produces a failed/alerted event.
9. A failed/delayed outbox event never delays an agent response.
10. Memory context cannot change the interpretation of a contradictory current
    canonical transcript.

## Deployment gates

- Do not enable durable writes until Fix A+B production traces show one
  accepted interpretation per committed caller turn and no lease divergence.
- Deploy schema and repository first, with all read/write features disabled.
- Enable working memory for new calls only, then durable writes, then compact
  retrieval behind separate feature flags.
- Start with English/Telugu confirmation only. Add each language only with an
  explicit phrase table and passing test matrix.
