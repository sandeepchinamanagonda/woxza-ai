# Woxza Open Issues

This list tracks product and reliability work that is deliberately not mixed
into small prompt, voice, or cost experiments. Each item needs its own test
gate and rollback plan.

## Agreed current experience scope

These capabilities are one Woxza real-time conversation-control programme, not
separate product projects:

1. Talk-over interruption / barge-in.
2. Reliable caller turn detection.
3. Fast streaming response delivery.
4. Silence and uncertainty handling.
5. Basic filtering of irrelevant sound and false interruptions.
6. Natural adaptive emotion, pace, and tone.
7. Language and code-switching.
8. Recovery after a connection break while preserving completed call memory.

Caller-facing live captions are deferred to a web-voice experience. Advanced
noise suppression/echo cancellation is deferred until call metrics show that
the basic speech-confidence gate is insufficient. Phone calls already provide
background/lock-screen continuity without extra Woxza work.

### Silence and uncertainty test matrix

Each scenario must be tested against the active `hybrid` turn-control baseline
before silence and uncertainty handling can be marked complete.

| # | Scenario | Expected result | Latest evidence | Status |
|---|---|---|---|---|
| 1 | Caller remains silent for at least 8–10 seconds after the opening greeting | Woxza waits; no caller transcript, Gemini request, or extra agent audio | Call `2b8998be-4297-4189-94f4-13d49877dd5b`: 32-second call; one opening agent transcript only; no STT/Gemini events | Passed |
| 2 | Caller remains silent for 3–5 seconds after a normal agent question | Woxza waits naturally without rushing, repeating, or closing | Call `c8723d2f-68e7-4c96-b8e0-75a2b8a78271`: after Woxza's final question asking what kind of business the caller runs, the caller stayed silent for about 18 seconds until hangup; no further STT, Gemini, or agent-audio event occurred | Passed |
| 3 | Caller pauses mid-sentence and then continues | Prefer one complete caller turn; no response to the first fragment | Call `a95b7c49-38a9-44ec-ad6e-71319b3eec2e`: caller said they ran a medical shop, paused 1–2 seconds, then continued with the 3,000-medicines detail. Sarvam finalized the first phrase and Woxza began a response before the continuation; barge-in then stopped it and the later response retained both facts | Accepted for demo — fast response plus barge-in/context recovery; refine later only if needed |
| 4 | Caller stops after an incomplete thought | Briefly wait, then ask a gentle clarification only when the caller is truly finished | Call `b76f1d4b-deb1-4c14-8f8b-02a205aed78e`: caller said “మా customers” and stopped; Woxza asked for more about the customers without inventing a customer type, contact channel, or business fact | Passed — wording refinement belongs to the separate conversation-content workstream |
| 5 | Caller gives a valid short reply such as “అవును”, “yes”, or “సరే” | Accept it as a real answer when it fits the prior question | Call `d8496ddf-ad22-4964-9271-ba7ba7c0a487`: final “అవును” at 23:17:42 was accepted as a caller turn and received one normal Woxza response | Passed |
| 6 | Caller coughs, sneezes, or makes breath noise, then stays silent | Stay quiet; no Gemini request or interruption | Call `d8496ddf-ad22-4964-9271-ba7ba7c0a487`: caller-reported cough/sneeze-only interval created no visible caller transcript, Gemini request, or extra agent response | Passed |
| 7 | Caller coughs, then immediately gives a real answer | Ignore the cough and process the answer normally | Call `d8496ddf-ad22-4964-9271-ba7ba7c0a487`: after the caller-reported sneeze, the subsequent real answer was transcribed and received a normal Woxza response | Passed |

### Language and code-switching test matrix

Test language behaviour by listening to the full call, not only by reading the
transcript. Preserve caller facts, everyday wording, brands, and numbers;
never force a caller into a language they did not choose.

| # | Scenario | Suggested caller line | Expected Woxza behaviour | Status |
|---|---|---|---|---|
| 1 | Telugu-first conversation | `నేను గుంటూరులో మెడికల్ డిస్ట్రిబ్యూషన్ బిజినెస్ చేస్తున్నాను.` | Understand the business detail and reply naturally in Telugu | Pending |
| 2 | Telugu with everyday English business terms | `మేము WhatsApp, phone calls ద్వారా orders తీసుకుంటాం.` | Preserve WhatsApp, phone calls, and orders naturally; do not force awkward Telugu replacements | Pending |
| 3 | Telugu with numbers and ranges | `రోజుకు 25 నుంచి 30 orders వస్తాయి. ఒక్కో order 500 నుంచి 1,000 రూపాయలు.` | Preserve the values and speak the range naturally, without robotic digit-by-digit delivery | Pending |
| 4 | Hindi-first conversation | `मैं हैदराबाद में मेडिकल डिस्ट्रीब्यूशन का बिज़नेस चलाता हूँ.` | Understand and reply naturally in Hindi | Pending |
| 5 | Tamil-first conversation | `நான் சென்னையில் மருந்து விநியோக வியாபாரம் செய்கிறேன்.` | Understand and reply naturally in Tamil | Pending |
| 6 | English-first conversation | `I run a medical distribution business in Hyderabad.` | Reply naturally in English without unnecessary Indic-language words | Pending |
| 7 | Explicit switch during a call | Start in Telugu, then say `Actually, let's continue in English.` | Change the response language while retaining the earlier business facts | Pending |
| 8 | Switch back to an Indic language | After English context, say `ఇక నుంచి తెలుగులో మాట్లాడండి.` | Return to Telugu, keep the same conversation context, and use the tested Telugu voice/profile | Pending |

## P0 — Authoritative voice turn-taking

**Problem.** A caller can pause mid-thought, speak over Woxza, or produce
several speech-recognition finals. If STT finals, model VAD, and the bridge
each decide independently that a turn has ended, Woxza can answer a partial
thought, repeat itself, or allow stale audio to play.

**Important decision.** Do not solve this by blindly merging completed STT
texts. That experiment regressed the Gemini request path and can add latency
or join two intentionally separate caller turns. The V3 bridge currently
restores one immediate response per authoritative STT final as the stable
baseline.

**Correct target.** The bridge becomes the only owner of caller turn
boundaries:

```text
caller speech starts
  → clear any agent audio and cancel the active response
  → buffer STT only as live telemetry
  → detect a stable silence boundary
  → allow a short transcript-settle window
  → commit exactly one idempotent caller turn
  → request one model response
```

### Acceptance criteria

- Clear carrier playback and invalidate old model/TTS work within 150 ms of
  genuine caller speech.
- Start with a 750 ms silence endpoint and a 350 ms transcript-settle window;
  tune only from replayed calls and production timings.
- Disable competing automatic turn ownership once the bridge controller is
  enabled.
- A resumed caller utterance cancels its pending commit rather than creating a
  second caller turn.
- Every committed utterance has an ID; duplicate or stale endpoint events
  cannot create another model response.
- Log speech start, playback clear, endpoint, final transcript, model first
  token, first carrier audio, false interrupts, and partial-turn rate.

See [turn-boundary-architecture-fix.md](../turn-boundary-architecture-fix.md)
for the target state diagram and replay test matrix.

## P1 — Conversation quality validation

The current behavioural prompt is intentionally retained while turn-taking is
stabilised. Test it only after P0 has a reliable baseline.

- Confirm that known facts such as phone, WhatsApp, staff visits, and walk-ins
  are not asked again.
- Confirm the agent uses a short acknowledgement only when it adds value and
  does not restate the caller's entire sentence.
- Confirm one useful next question follows a meaningful business detail.
- Review Telugu, Hindi, Tamil, and English calls for natural local phrasing,
  code-mixing, brands, and number pronunciation.

## P1 — Audio and language operations

- A repeatable pronunciation audit corpus and Sarvam synthesis runner now
  cover brands, acronyms, short numbers, prices, and ranges in Telugu, Hindi,
  Tamil, and English. Run `node scripts/run-pronunciation-audit.mjs --dry-run`
  to review rendered text without provider cost, or run it with a Sarvam key
  to generate an audio listening pack.
- Maintain a tested voice ranking per language: two female voices and one male
  voice, selected by the caller preference and language quality score.
- Continue pronunciation-dictionary and language-policy testing separately
  from turn-boundary work.
- Add explicit custom vocabulary and language-detection evaluation for Woxza,
  customer business names, brands, and frequent business terms.
- **Speakerphone audio parity:** validate each approved voice on both handset
  and speakerphone playback. The aim is the same natural, continuous speech
  experience in both modes; investigate stream phrase handoff, playback gaps,
  level consistency, and phone-speaker-safe rendering without changing the
  current handset baseline until an A/B test proves an improvement.

## P1 — Observability and recovery

- Surface live transcript, interruption markers, language, timestamps, and
  what was actually sent to carrier playback in the admin experience.
- Preserve the conversation safely across transient bridge/API reconnects.
- Add operational metrics for answer latency, duplicate turns, false/missed
  interruptions, abandoned calls, and silence re-prompts.
- **Silent connected-call recovery:** Call `74aef6e8-3889-4664-810d-fdec30604b8f`
  reached Plivo but never opened the Woxza V3 media stream, so no greeting or
  audio could play. Detect the missing bridge-start acknowledgement after call
  connection, retry the call once when safe, then surface a clear failed-call
  status if the retry also cannot establish streaming audio.

## P2 — Later evaluation

- Caller controls: “repeat that”, “slower”, “speak Telugu”, and “speak
  English”.
- Evaluate noise suppression or echo cancellation only after VAD replay tests
  prove a need; aggressive processing may hurt Indic-language recognition.
- Evaluate affective dialogue and proactive audio only after a chosen Gemini
  Live model and safety policy are stable.

## Security follow-up

The external architecture review reported that a service-account private-key
JSON may be present in the repository. This has not been acted on in the voice
work. Treat it as a separate security task: verify its location, rotate/revoke
the credential if real, remove it from tracked history, and move runtime
credentials to secret storage.
