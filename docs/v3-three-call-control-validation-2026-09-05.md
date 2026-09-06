# V3 three-call control validation — 5 September 2026

## Scope and method

This is a no-phone, no-TTS/STT validation of the three latest conversation behaviours. It exercises the current V3 control state, the structured profile, semantic-pitch state, localized capability catalog selection, and the exact Gemini prompt contract.

I did **not** label generated prose as a real live-Gemini transcript. A direct live-Gemini runner was also attempted, but it stalled without returning an SSE response and was cancelled. The dialogue below therefore shows the caller inputs and the exact response behaviour the current code asks Gemini to produce. The automated control tests passed: **12 passed, 0 failed**.

| Test | Scenario | Result | What the system proves |
|---|---|---|---|
| 1 | Caller requests Woxza help, then supplies facts | Pass | Intent is prepared in the background; the pitch only becomes eligible after the required facts and approved capabilities are ready. |
| 2 | Discovery continues after several business facts | Pass, with live-model monitoring | The profile carries known facts forward and the prompt forbids asking the same underlying question again. A live model can still disobey wording instructions, so this remains a call-scorecard check. |
| 3 | Pitch is delivered, caller accepts the offered example | **Not implemented end-to-end** | The controller recognizes a short “yes”, but V3 does not yet have a grounded fictional-example response path. It also clears the selected capability context before that reply. |

## Test 1 — explicit request, discovery, tailored pitch

| Turn | Caller says | Control state after this turn | Required agent response shape |
|---|---|---|---|
| 1 | “నేను ఒక మెడికల్ షాప్ నడుపుతున్నాను. Woxza ఎలా ఉపయోగపడుతుంది?” | Verified `explore_woxza_value`; still collecting facts | Warm acknowledgement first; say the answer will be tailored; ask **one** missing detail, such as how customers contact the shop. No feature claims yet. |
| 2 | “కస్టమర్లు ఫోన్, వాట్సాప్ ద్వారా ఆర్డర్లు మరియు మందుల లభ్యత గురించి అడుగుతారు.” | Channel/workflow is known | Use this fact; ask a different missing dimension only, such as the workload or the most time-consuming problem. It must not ask phone/WhatsApp again. |
| 3 | “ఒక స్టాఫ్ మెంబర్ రోజంతా ఈ కాల్స్, మెసేజ్‌లకు సమాధానం ఇస్తూ ఉంటాడు.” | Business, channel/workflow and manual-effort pain are now known; next turn is pitch-ready | The current spoken reply remains responsive; the background path prepares approved catalog records for the next reply. |
| 4 | “ఇప్పుడు నా బిజినెస్‌కి Woxza ఎలా ఉపయోగపడుతుందో వివరించండి.” | `capability_context.mode = value_pitch` with only approved records | Start with a bridge equivalent to: “Based on what you shared, here is how Woxza could help your business.” Give a compact, grounded benefit pitch and end with one invitation to hear a **fictional** example. |

**Pass criteria met by the control path:** no catalog capability is available before the semantic state is ready; only selected approved records can form the pitch; the pitch-repair prompt also requires the transition bridge and fictional-example invitation.

## Test 2 — one extra discovery turn must be genuinely new

| Turn | Caller says | Known profile after background extraction | Agent must not ask again |
|---|---|---|---|
| 1 | “మాది డెంటల్ క్లినిక్.” | Dental clinic | Business type |
| 2 | “పేషెంట్లు ఫోన్, వాట్సాప్ ద్వారా అపాయింట్మెంట్ల కోసం సంప్రదిస్తారు.” | Appointment channel and workflow | How patients contact the clinic |
| 3 | “సాయంత్రం కాల్స్ మిస్ అవుతాయి, ఒక రిసెప్షనిస్ట్ అన్నీ హ్యాండిల్ చేస్తారు.” | Missed calls; staff workload | Whether calls are missed / who handles them |
| 4 | “కొన్నిసార్లు పేషెంట్లకు తిరిగి కాల్ చేయడానికి కూడా ఆలస్యం అవుతుంది.” | Follow-up delay | Any rephrasing of calls, WhatsApp, receptionist, or missed calls |

**Expected next response:** a brief acknowledgement of the follow-up delay, then either no question or one *new* missing detail. If the profile is sufficient and the caller has not requested a pitch, it should offer a neutral choice: hear how Woxza could help, or try a clearly labelled fictional customer-call example.

**Pass criteria met by the control path:** the structured profile stores all four facts; the current prompt explicitly tells Gemini to ask a different missing dimension rather than a rephrased version of an answered question.

**Residual risk:** this is a model-behaviour rule, not a hard deterministic gate. We should continue to score this against live calls; if Gemini repeats a question, that is a quality failure even though the control state is correct.

## Test 3 — pitch follow-up / fictional example

| Step | Caller says | Expected behaviour | Actual control result |
|---|---|---|---|
| 1–3 | Dental clinic, appointment calls, receptionist workload | Build profile only; no unsolicited product pitch | Pass |
| 4 | “అవును” after the neutral choice | Controller treats the short answer as meaningful, not noise | Pass |
| 5 | “Woxza మా క్లినిక్‌కి ఎలా ఉపయోగపడుతుందో వివరించండి.” | Deliver approved, tailored pitch with bridge and a fictional-example invitation | Pass |
| 6 | “అవును” after that invitation | Begin a compact, clearly labelled fictional example using the same approved capability records | **Not implemented** |

### Why step 6 is not implemented yet

Immediately after the pitch, the state intentionally changes to `delivered: true`, `status: "none"`, and `nextStepOffered: true`. The controller correctly recognizes the caller’s short “yes”, but `pitchReplySnapshot()` then returns:

```json
{ "mode": "inactive", "selected": [] }
```

The model prompt mentions a fictional example, but V3 has no completed end-to-end implementation for that feature. The controller receives the short “yes,” then the selected records disappear from the model state. That grounding gap means the feature cannot safely be treated as available; it may be weak, generic, or silent. It should not be marked complete yet.

## Recommended next change

Keep the already selected capability IDs available for **exactly the one immediate post-pitch caller turn**. Pass those records as a separate `fictional_example_context` while `post_pitch_next_step.awaiting_caller_choice` is true, then clear them after the reply. This preserves the existing truthfulness boundary, avoids re-running discovery, and gives the model the material required to make the promised example.

## Bottom line

The first two latest behaviours are structurally working: grounded pitch preparation, no early capability claims, and durable non-repeating discovery memory. The third has not been built end-to-end: although the controller can receive the post-pitch choice, it does not retain the approved context needed to produce the promised fictional example.
