import test from "node:test"
import assert from "node:assert/strict"
import { classifyFullValueOfferReply, isFullValueFollowUp, isFullValueOffer } from "../src/demo/full-value-offer-controller.js"

test("recognizes Woxza's Telugu full-value invitation", () => {
  assert.equal(isFullValueOffer("Woxza AI అసిస్టెంట్ ఇలాంటి పనులలో మీకు ఎలా సహాయపడుతుందో చెప్పమంటారా?"), true)
  assert.equal(isFullValueOffer("Woxza మీ డెంటల్ క్లినిక్‌కి ఎలా సహాయపడుతుందో చెప్తాను."), false)
})

test("recognizes a naturally translated Hindi full-value invitation", () => {
  assert.equal(isFullValueOffer("क्या आप चाहते हैं कि मैं आपको बताऊँ कि Woxza ऐसे कामों में कैसे मदद कर सकता है?"), true)
  assert.equal(isFullValueOffer("Woxza आपके लिए चार तरीके से मदद कर सकता है।"), false)
})

test("recognizes a semantic request for four more examples", () => {
  assert.equal(isFullValueFollowUp("ఇంకా"), true)
  assert.equal(isFullValueFollowUp("what else can it do?"), true)
  assert.equal(isFullValueFollowUp("okay, thank you"), false)
})

test("treats a natural response to Woxza's offer as acceptance", () => {
  assert.deepEqual(classifyFullValueOfferReply("అందరికి కలుపుకొని"), { decision:"accept", reason:"contextual_offer_acceptance" })
  assert.deepEqual(classifyFullValueOfferReply("చెప్పండి ఎలా"), { decision:"accept", reason:"direct_full_value_request" })
})

test("keeps a decline and a specific question out of full-pitch mode", () => {
  assert.equal(classifyFullValueOfferReply("వద్దు, తర్వాత చూద్దాం").decision, "decline")
  assert.equal(classifyFullValueOfferReply("దీని ధర ఎంత?").decision, "new_question")
})
