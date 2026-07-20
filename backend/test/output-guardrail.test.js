import assert from "node:assert/strict"
import test from "node:test"
import { createOutputSafetyGuard, createStreamingOutputSafetyGuard, findUnsafeOutput, OUTPUT_SAFETY_BLOCKLIST } from "../src/demo/output-guardrail.js"

test("blocklist covers all 13 supported languages", () => {
  assert.equal(Object.keys(OUTPUT_SAFETY_BLOCKLIST).length, 13)
})

test("detects English, Hindi, and Telugu health or disclaimer commentary", () => {
  assert.equal(findUnsafeOutput("As an AI, I suggest you consult a doctor.", "en"), "consult a doctor")
  assert.equal(findUnsafeOutput("आपकी सेहत हमारे लिए महत्वपूर्ण है।", "hi"), "आपकी सेहत")
  assert.equal(findUnsafeOutput("మీ ఆరోగ్యం మాకు చాలా ముఖ్యం.", "te"), "మీ ఆరోగ్యం")
  assert.equal(findUnsafeOutput("దయచేసి నిపుణులను సంప్రదించండి.", "te"), "నిపుణులను సంప్రదించ")
})

test("allows valid doctor booking and mixed-script scenario turns", () => {
  assert.equal(findUnsafeOutput("రేపు doctor appointment మధ్యాహ్నం రెండు గంటలకు బుక్ చేయాలా?", "te"), null)
  assert.equal(findUnsafeOutput("क्या आप movie booking कल शाम के लिए चाहते हैं?", "hi"), null)
})

test("discards a violation, regenerates once, then uses a safe fallback", () => {
  const events = []
  const guard = createOutputSafetyGuard({
    useCase:"appointment_booking",
    language:"te",
    callId:"call-1",
    safeFallback:"Would you like a salon, movie, or doctor's appointment?",
    onAllowed:turn => events.push(["allowed", turn.text]),
    onRegenerate:() => events.push(["regenerate"]),
    onFallback:event => events.push(["fallback", event.safeFallback]),
    onExhausted:() => events.push(["exhausted"]),
    onTrigger:event => events.push(["blocked", event.matchedPhrase])
  })

  guard.review({ text:"మీ ఆరోగ్యం ఎలా ఉంది?", audio:[Buffer.from("unsafe-1")] })
  guard.review({ text:"వైద్య సలహా కోసం నిపుణులను సంప్రదించండి.", audio:[Buffer.from("unsafe-2")] })
  assert.deepEqual(events, [
    ["blocked", "మీ ఆరోగ్యం"],
    ["regenerate"],
    ["blocked", "వైద్య సలహా"],
    ["fallback", "Would you like a salon, movie, or doctor's appointment?"]
  ])
  assert.ok(events.every(([kind]) => kind !== "allowed"))
})

test("a clean regenerated turn is released and resets recovery state", () => {
  const allowed = []
  let regenerations = 0
  const guard = createOutputSafetyGuard({
    useCase:"appointment_booking",
    language:"en",
    callId:"call-2",
    safeFallback:"Choose salon, movie, or doctor.",
    onAllowed:turn => allowed.push(turn),
    onRegenerate:() => { regenerations += 1 },
    onFallback:() => assert.fail("clean regeneration should not fall back")
  })

  guard.review({ text:"Consult a professional before booking.", audio:[Buffer.from("blocked")] })
  guard.review({ text:"Would you like a salon, movie, or doctor's appointment?", audio:[Buffer.from("clean")] })
  guard.review({ text:"Your health matters.", audio:[Buffer.from("blocked-again")] })

  assert.equal(regenerations, 2)
  assert.equal(allowed.length, 1)
  assert.equal(allowed[0].audio[0].toString(), "clean")
})

test("rolling guard releases clean audio before turn completion", () => {
  const released = []
  const completed = []
  const guard = createStreamingOutputSafetyGuard({
    useCase:"order_taking",
    language:"te",
    callId:"call-stream",
    holdMs:1_000,
    safeFallback:"Tell me your order.",
    onAudio:audio => released.push(audio),
    onAllowedTurn:text => completed.push(text),
    onRegenerate:() => assert.fail("clean audio should not regenerate"),
    onFallback:() => assert.fail("clean audio should not fall back")
  })
  const first600ms = Buffer.alloc(600 * 48, 1)
  const second600ms = Buffer.alloc(600 * 48, 2)

  guard.push({ text:"మీరు ఏమి", audio:[first600ms] })
  assert.equal(released.length, 0)
  guard.push({ text:"ఆర్డర్ చేయాలనుకుంటున్నారు?", audio:[second600ms] })
  assert.equal(released.length, 1)
  assert.strictEqual(released[0], first600ms)
  assert.equal(completed.length, 0)

  guard.push({ turnComplete:true })
  assert.equal(released.length, 2)
  assert.strictEqual(released[1], second600ms)
  assert.equal(completed.length, 1)
})

test("rolling guard clears released carrier audio and discards the unsafe remainder", () => {
  const events = []
  const guard = createStreamingOutputSafetyGuard({
    useCase:"appointment_booking",
    language:"te",
    callId:"call-blocked-stream",
    holdMs:1_000,
    safeFallback:"Choose salon, movie, or doctor.",
    onAudio:() => events.push("audio"),
    onAllowedTurn:() => events.push("allowed"),
    onClear:() => events.push("clear"),
    onRegenerate:() => events.push("regenerate"),
    onFallback:() => events.push("fallback")
  })

  guard.push({ text:"మీకు", audio:[Buffer.alloc(600 * 48)] })
  guard.push({ text:"సహాయం చేస్తాను", audio:[Buffer.alloc(600 * 48)] })
  guard.push({ text:"మీ ఆరోగ్యం ఎలా ఉంది?", audio:[Buffer.alloc(600 * 48)] })
  guard.push({ turnComplete:true })

  assert.deepEqual(events, ["audio", "clear", "regenerate"])
})
