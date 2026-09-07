# Adaptive-discovery trial launch gates

Committed trial configuration is explicit: `APPROVED_TTS_RENDERER_ENABLED=true`,
`APPROVED_TTS_PROVIDER=chirp3-hd-streaming`, and
`CHIRP_TTS_SPEAKING_RATE=1.15` in `deploy/production.env.example`.

The following require evidence from the actual trial environment and cannot be
completed by source code alone:

- [ ] Confirm deployed `.env.production` contains the three values above and a valid Google Cloud STT credential.
- [ ] Run `backend/scripts/evaluate-turn-completeness.mjs` against the live interpreter and archive its JSON output.
- [ ] Replay consented real calls in Telugu, Hindi, Tamil, English, and code-switched speech through the adaptive suite.
- [ ] Human listener signs off Chirp pace (1.15), interruption behavior, and no repeated acknowledgement in each language.
- [ ] Verify production call-event traces contain `google-cloud-stt-streaming` or `google-cloud-stt`, never `gemini`, for canonical caller turns.
