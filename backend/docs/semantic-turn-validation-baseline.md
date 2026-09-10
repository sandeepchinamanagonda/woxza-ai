# Semantic turn-validation baseline

## Scope

This document records the V3 voice-turn behavior before the semantic
turn-validation work begins. It is the reference point for Phase 0 and is not
an implementation of the new gate.

## Protected workspace

- Branch: `Sachinam/changes_for_embeddings`
- Upstream: `origin/Sachinam/changes_for_embeddings`
- Baseline commit: `b696ec9 feat: add semantic routing for Woxza calls`
- Working tree: clean before this document was added.
- Scope boundary: only the V3 STT-final-to-reply path and its tests are in
  scope. Existing semantic routing, embeddings, opening workflow, and other
  unrelated work remain unchanged until their explicitly mapped phases.

## Current V3 behavior

1. Sarvam realtime STT performs voice activity detection (VAD) and emits
   partial and final transcripts.
2. The default V3 turn controller is `provider`; provider VAD can stop active
   Woxza playback at speech start.
3. The configured STT endpoint pause is 500 ms. Bridge-owned manual
   endpointing, when enabled, defaults to 750 ms.
4. On an STT final, `assessCallerTurn` performs a local lexical check. It
   holds empty text, acknowledgements, selected incomplete openings, and
   micro-fragments; every other final is treated as a meaningful caller turn.
5. A meaningful turn proceeds directly to semantic routing and the main
   conversation model. There is no model-based complete/incomplete/unclear
   validation gate and no held-fragment state.

## Required invariants for later phases

- No candidate transcript may become a business fact or conversation-history
  entry unless it has passed the semantic turn gate as `complete`.
- `incomplete` text must be retained only in bounded, per-call temporary
  state; it must not produce a reply or interrupt playback.
- `unclear` text must not be merged into a later caller turn or persisted as a
  business fact.
- Existing semantic routing must receive only `complete` candidate text after
  the gate is enabled.
- The gate must have a conservative failure path: an unavailable validator may
  not cause untrusted text to be accepted as complete.

## Automated baseline

The following focused test command must pass before Phase 1 work and after
each later phase:

```sh
node --test backend/test/turn-quality-policy.test.js \
  backend/test/sarvam-realtime.test.js \
  backend/test/caller-turn-controller.test.js \
  backend/test/phrase-buffer.test.js \
  backend/test/v3-completed-turn-workflow.test.js
```

Human audio review remains mandatory before production activation; see
`backend/docs/turn-completeness-human-review.md`.
