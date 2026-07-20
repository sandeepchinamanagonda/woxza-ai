# Voxa: Gemini Live API integration review brief

Paste this file into Gemini together with the referenced project files (or give
Gemini repository access). The goal is to get an accurate, implementation-ready
set of Gemini Live API rules for **this specific Voxa project**.

## Your role

Act as a senior real-time voice/API integration reviewer. Inspect the project
before making recommendations. Verify all Live API claims against the current
official Google Gemini API documentation; do not rely on memory or generic
WebSocket advice.

Separate each finding into one of these categories:

- **Required now** — a documented requirement or a defect that can break this integration.
- **Strong recommendation** — improves reliability, safety, or production readiness.
- **Optional** — useful but not necessary for the current public demo.
- **Not applicable** — a common Live API rule that does not apply here, with the reason.

For every required rule, include an official Google documentation link, the
consequence of ignoring it, and the smallest code/configuration change needed.
Call out uncertain or preview-model behavior explicitly instead of presenting it
as a stable guarantee.

## Product and project context

Voxa is an enterprise AI voice platform. Its website offers a short public phone
demo of four **simulated** use cases:

1. Appointment booking
2. Restaurant reservations
3. Medical distribution orders
4. Payments support

The demo must never imply that it completed a real booking, order, payment, or
calendar action. It is intentionally constrained to a Voxa FAQ and selected
scenario. It supports English, Spanish, and several Indian languages.

This is a Vue 3 + Vite frontend and a Node.js 22+ backend using ES modules. The
backend uses `@google/genai` and bridges phone-provider WebSockets to Gemini
Live. PostgreSQL tracks demo calls and limits them to reduce abuse.

## Current integration architecture

```text
Caller phone
  -> Plivo (India) or Twilio (US)
  -> provider WebSocket media stream
  -> Node backend: backend/src/demo/gemini-bridge.js
  -> @google/genai `ai.live.connect(...)`
  -> Gemini Live API
  -> Node converts returned audio
  -> provider stream -> caller
```

The backend creates one Gemini Live session per answered call. It uses:

- `GEMINI_API_KEY` (server-side only)
- `GEMINI_LIVE_MODEL`, currently defaulting to `gemini-3.1-flash-live-preview`
- `GEMINI_DEMO_VOICE`, currently defaulting to `Kore`
- `responseModalities: [Modality.AUDIO]`
- a dynamic `systemInstruction` generated per call
- input and output audio transcriptions

The API key must never be exposed to the browser, caller, client logs, or
provider metadata.

## Audio contract currently implemented

Gemini-facing audio is handled as signed 16-bit little-endian PCM:

| Direction | Provider format | Backend conversion | Gemini-facing format |
| --- | --- | --- | --- |
| Plivo inbound | `audio/x-l16`, 16 kHz, network/big-endian | byte-swap 16-bit samples | PCM, 16 kHz, little-endian |
| Plivo outbound | Gemini audio assumed 24 kHz PCM LE | resample 24 kHz -> 16 kHz, then byte-swap | `audio/x-l16`, 16 kHz |
| Twilio inbound | G.711 mu-law, 8 kHz | decode then resample 8 kHz -> 16 kHz | PCM, 16 kHz, little-endian |
| Twilio outbound | Gemini audio assumed 24 kHz PCM LE | resample 24 kHz -> 8 kHz, then encode mu-law | G.711 mu-law, 8 kHz |

The current code sends realtime input with this shape:

```js
session.sendRealtimeInput({
  audio: {
    data: pcm16k.toString("base64"),
    mimeType: "audio/pcm;rate=16000"
  }
})
```

It reads response audio from `message.serverContent.modelTurn.parts[*].inlineData.data`.
When `message.serverContent.interrupted` is true, it clears queued provider
audio (`clearAudio` for Plivo and `clear` for Twilio).

Verify every part of this contract: allowed MIME strings, required input/output
sample rates, PCM endian/signing expectations, output rate assumptions,
chunking/backpressure, and interruption semantics. Identify whether any current
assumption is undocumented or version/model dependent.

## Call lifecycle and safeguards

- A demo call is valid only for 10 minutes after creation and only while its DB
  status is `ringing` or `connected`.
- The public endpoint validates consent and rate-limits phone attempts.
- A hard call limit is enforced elsewhere at 95 seconds.
- At 85 seconds, the backend sends a text realtime input asking the agent to
  deliver the configured wrap-up after the caller finishes speaking.
- Plivo triggers the initial greeting by sending a text realtime input as soon
  as the stream connects. Check whether Twilio needs the same explicit opening
  trigger; the current Twilio path does not send one.
- Closing either socket attempts to close the Gemini session.
- Gemini errors are logged; a Gemini close currently closes the provider socket
  with WebSocket code 1011.

Review lifecycle rules: Live session duration/limits, reconnect behavior,
session resumption, provider disconnects, idempotency, retries, timeouts,
graceful error messages, cleanup, and resource leakage. Recommend a clear
production policy for each.

## Prompt, privacy, and safety rules

`backend/src/demo/prompt.js` dynamically builds the system instruction and
reads `backend/demo_agent/voxa_faq.md` for every answered call. It requires the
agent to:

- speak entirely in the caller's chosen language;
- stay in the selected scenario;
- use the FAQ as the only authority on Voxa facts;
- not invent capabilities, integrations, guarantees, contracts, availability,
  or pricing;
- redirect unrelated conversation;
- handle rude callers calmly and redirect/end the demo;
- briefly acknowledge sensitive health, financial hardship, or distress topics
  and redirect because this is a public demo, not support.

Evaluate what must be added for Gemini Live specifically: prompt-injection
resistance, user data minimization, retention/data-use settings, consent and
disclosure requirements, medical/payments boundary wording, logging redaction,
content safety behavior, and handling of transcription data.

## Files to inspect

Read these files in full before producing the review:

- `backend/src/demo/gemini-bridge.js`
- `backend/src/demo/prompt.js`
- `backend/src/demo/runtime.js`
- `backend/src/demo/service.js`
- `backend/src/demo/twilio.js`
- `backend/src/demo/plivo.js`
- `backend/src/demo/lead.js`
- `backend/src/validation.js`
- `backend/demo_agent/voxa_faq.md`
- `backend/README.md`
- `backend/test/gemini-bridge.test.js`
- `backend/package.json`

Also inspect deployment/environment documentation and all uses of
`GEMINI_`, `sendRealtimeInput`, `ai.live`, `WebSocket`, `Twilio`, and `Plivo`.

## Deliverable

Return a practical **Voxa Gemini Live API Rules** document with:

1. An executive summary of the current design and the highest-risk gaps.
2. A table of required rules, including evidence from this repository and an
   official Gemini documentation citation for each API-specific rule.
3. Exact configuration rules: model lifecycle/status, supported voices,
   authentication, API-key restrictions, environment variables, regions, and
   version pinning/upgrade strategy.
4. Exact audio/media rules for both provider paths, including a corrected audio
   matrix if this brief's assumptions are wrong.
5. A session and interruption state machine that covers barge-in, errors,
   socket close, timeouts, and the 85/95-second end-of-call behavior.
6. Security, privacy, and safety rules appropriate to a public phone demo.
7. A prioritized implementation checklist, with file names and focused code
   changes. Do **not** propose a frontend API key.
8. A test plan covering unit, integration, manual-call, resilience, and
   observability tests. Include exact cases for audio conversion and barge-in.
9. A short list of questions that cannot be answered from the repository, such
   as account tier, data residency, consent language, and production traffic.

Be precise. Do not invent undocumented API behavior. If the SDK, a model name,
or a field appears outdated, say so and give a migration path backed by current
official documentation.
