# V3 Value-Intent Classifier Validation

Date: 2026-09-05  
Method: real `gemini-2.5-flash` structured classifier calls; no mock classifier, phone call, STT, or TTS.

## What was tested

For each supported language, the classifier received two independent caller turns:

1. A plain statement of business type. Expected result: do **not** activate a Woxza-value pitch.
2. An explicit question asking how Woxza can help that business. Expected result: activate the pitch-request state with an exact caller-language evidence quote.

## Results

| Language | Plain business statement | Explicit Woxza-help request | Result |
|---|---:|---:|---|
| English | false | true (1.00) | Pass |
| Spanish | false | true (1.00) | Pass |
| Assamese | false | true (0.99) | Pass |
| Bengali | false | true (0.95) | Pass |
| Gujarati | false | true (0.95) | Pass |
| Hindi | false | true (0.95) | Pass |
| Kannada | false | true (1.00) | Pass |
| Malayalam | false | true (0.99) | Pass |
| Marathi | false | true (1.00) | Pass |
| Punjabi | false | true (0.95) | Pass |
| Tamil | false | true (0.95) | Pass |
| Telugu | false | true (0.95) | Pass |
| Urdu | false | true (1.00) | Pass |

**Summary: 13 / 13 languages passed both cases.**

## Telugu evidence

| Caller text | Classifier result |
|---|---|
| `నేను స్టీల్ షాప్ నడుపుతాను.` | `requested: false`, `status: none` |
| `Woxza నా స్టీల్ షాప్‌కి ఎలా ఉపయోగపడుతుంది?` | `requested: true`, confidence `0.95`, evidence `Woxza నా స్టీల్ షాప్‌కి ఎలా ఉపయోగపడుతుంది?` |

## Runtime safeguards

A pitch can activate only when all of the following are true:

1. The dedicated value-intent classifier returns `requested: true`.
2. Confidence is at least `0.90`.
3. It supplies an exact evidence substring from a caller turn.
4. The backend verifies that evidence against stored caller history.
5. The caller profile contains a business plus a process, channel, pain point, or desired outcome before the state can become `ready_for_pitch`.

The business-fact extractor cannot activate a pitch. It runs separately and only supplies structured caller facts.
