import assert from "node:assert/strict"
import test from "node:test"
import { callerFirstPresencePrompt, configuredCallStartPolicy } from "../src/demo/call-start-policy.js"
import { agentFirstGreeting } from "../src/demo/call-start-messages.js"

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

test("caller-first timeout and acknowledgement reuse the agent-first greeting", () => {
  for (const language of ["en", "te", "hi", "ta", "kn", "as"]) {
    assert.equal(callerFirstPresencePrompt(language), agentFirstGreeting(language))
  }
})
