import assert from "node:assert/strict"
import test from "node:test"
import { buildDemoPrompt, LANGUAGES, localizedCompleteOpening, localizedDemoEnding, localizedDemoRoleHandoff, localizedOpeningDiscoveryQuestion, localizedPostOrderActionCapability, normalizeUseCase } from "../src/demo/prompt.js"

test("the live prompt makes the orchestrator the sole phase and role authority", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.match(prompt, /THE ORCHESTRATOR IS THE AUTHORITY/)
  assert.match(prompt, /submit_turn_interpretation exactly once/)
  assert.match(prompt, /If it returns no_op, say nothing/)
  assert.match(prompt, /never reintroduce Woxza|Hello, welcome to Woxza! Thanks for trying our demo/)
  assert.match(prompt, /never infer that an unclear shop is a medical shop/i)
})

test("carrier-owned opening never permits a second welcome", async () => {
  const prompt = await buildDemoPrompt({ language:"en", openingAlreadyHandled:true })
  assert.match(prompt, /carrier is playing the complete welcome and first business question/i)
  assert.match(prompt, /Never greet again/i)
  assert.doesNotMatch(prompt, /say exactly: ‘Hello, welcome to Woxza!/)
})

test("the prompt preserves the caller-as-customer demo contract and pitch safety", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.match(prompt, /caller is always the CUSTOMER/i)
  assert.match(prompt, /Do not become the customer/i)
  assert.match(prompt, /PITCH_CONTEXT contains only backend-approved, relevant and unused facts/)
  assert.match(prompt, /never add a metric unless it appears in approved metrics/i)
  assert.match(prompt, /Pitch-first: deliver pitch, ask whether they want a demo; if yes, run the demo, collect feedback, then ask only whether they need anything else/)
})

test("all configured languages retain a localized language instruction and safe shared contract", async () => {
  for (const [code, name] of LANGUAGES) {
    const prompt = await buildDemoPrompt({ language:code })
    assert.match(prompt, new RegExp(`Speak warmly and naturally in ${name}`))
    assert.match(prompt, /Never repeat an interrupted sentence/)
    assert.ok(localizedDemoEnding(code).includes("Woxza"))
    assert.ok(localizedPostOrderActionCapability(code).includes("Woxza") || code === "te")
  }
})

test("every configured language has a non-empty opening discovery bridge", () => {
  for (const language of LANGUAGES.keys()) {
    assert.ok(localizedOpeningDiscoveryQuestion(language).trim())
    assert.ok(localizedCompleteOpening(language).includes(localizedOpeningDiscoveryQuestion(language)))
  }
})

test("every configured language has a backend-owned role handoff", () => {
  for (const language of LANGUAGES.keys()) {
    const handoff = localizedDemoRoleHandoff(language, "Test Business")
    assert.ok(handoff.includes("Test Business"), language)
    assert.ok(handoff.length > "Test Business".length + 10, language)
  }
})

test("restaurant legacy routing uses the order workflow, not appointment booking", () => {
  assert.equal(normalizeUseCase("restaurant"), "order_taking")
})
