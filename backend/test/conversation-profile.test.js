import test from "node:test"
import assert from "node:assert/strict"
import { deriveConversationObjective, emptyConversationProfile, mergeConversationProfile, profileCoverage } from "../src/demo/conversation-profile.js"

test("merges caller-stated discovery facts without replacing earlier facts", () => {
  let profile = mergeConversationProfile(emptyConversationProfile(), {
    business_type:"steel shop", customer_interaction_channels:["Instagram", "phone"], pain_points:["missed enquiries"]
  })
  profile = mergeConversationProfile(profile, {
    customer_interaction_channels:["WhatsApp"], operating_detail:"two people spend two hours daily", current_workflow:"customer order updates"
  })
  assert.equal(profile.business, "steel shop")
  assert.deepEqual(profile.channels, ["Instagram", "phone", "WhatsApp"])
  assert.deepEqual(profile.painPoints, ["missed enquiries"])
  assert.equal(profile.manualEffort, "two people spend two hours daily")
})

test("moves from focused discovery to tailored explanation once enough facts exist", () => {
  const profile = mergeConversationProfile(emptyConversationProfile(), {
    business_type:"steel shop", customer_interaction_channels:["phone", "WhatsApp"], pain_points:["tracking enquiries"], operating_detail:"two people spend two hours daily"
  })
  assert.equal(deriveConversationObjective({ profile, discoveryQuestions:2 }), "tailored_explanation")
  assert.equal(deriveConversationObjective({ profile, explanationDelivered:true }), "continue_naturally")
})

test("caps discovery at four questions even when the caller has shared limited detail", () => {
  assert.equal(deriveConversationObjective({ profile:emptyConversationProfile(), discoveryQuestions:4 }), "tailored_explanation")
})

test("does not treat a request for help as enough context for a tailored pitch", () => {
  const profile = mergeConversationProfile(emptyConversationProfile(), {
    business_type:"steel shop", customer_interaction_channels:["phone"], desired_outcome:"understand how Woxza can help"
  })
  assert.equal(profileCoverage(profile).readyForTailoredPitch, false)
  const withPain = mergeConversationProfile(profile, { pain_points:["missed customer calls"] })
  assert.equal(profileCoverage(withPain).readyForTailoredPitch, true)
})
