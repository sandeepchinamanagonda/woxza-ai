import assert from "node:assert/strict"
import test from "node:test"
import { agentFirstGreeting } from "../src/demo/call-start-messages.js"
import { callerFirstPresencePrompt, configuredCallStartPolicy } from "../src/demo/call-start-policy.js"

test("defaults the website demo to agent-first", () => {
  assert.deepEqual(configuredCallStartPolicy({}), { speakFirst:true, timeoutEnabled:false, timeoutSeconds:6 })
})

test("enables one caller-first timeout only when agent-first is off", () => {
  assert.deepEqual(configuredCallStartPolicy({ SPEAK_FIRST:"false" }), { speakFirst:false, timeoutEnabled:true, timeoutSeconds:6 })
  assert.deepEqual(configuredCallStartPolicy({ SPEAK_FIRST:"false", SPEAK_FIRST_TIMEOUT_ENABLED:"false", SPEAK_FIRST_TIMEOUT_SECONDS:"9" }), { speakFirst:false, timeoutEnabled:false, timeoutSeconds:9 })
})

test("bounds unsafe caller-first timeout values", () => {
  assert.equal(configuredCallStartPolicy({ SPEAK_FIRST:"false", SPEAK_FIRST_TIMEOUT_SECONDS:"0" }).timeoutSeconds, 1)
  assert.equal(configuredCallStartPolicy({ SPEAK_FIRST:"false", SPEAK_FIRST_TIMEOUT_SECONDS:"600" }).timeoutSeconds, 60)
})

test("uses the same localized business-first greeting for both call-start paths", () => {
  for (const language of ["en", "as", "bn", "gu", "hi", "kn", "ml", "mr", "pa", "ta", "te", "ur"]) {
    assert.equal(callerFirstPresencePrompt(language), agentFirstGreeting(language))
    assert.match(agentFirstGreeting(language), /Woxza/)
  }
  assert.equal(agentFirstGreeting("unknown"), agentFirstGreeting("en"))
})
