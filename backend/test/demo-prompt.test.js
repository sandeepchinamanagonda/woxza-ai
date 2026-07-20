import assert from "node:assert/strict"
import test from "node:test"
import { buildDemoPrompt, LANGUAGES, USE_CASES, localizedIdentityOpening, localizedPostOrderActionCapability } from "../src/demo/prompt.js"

test("an unset entry hint starts a pure discover conversation", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.ok(USE_CASES.has("discover"))
  assert.match(prompt, /ENTRY HINT: none/)
  assert.match(prompt, /discover, explain, or demonstrate/)
  assert.match(prompt, /never redirect or penalize them/)
  assert.match(prompt, /Do not call a tool for hello, small talk, clarification/)
  assert.match(prompt, /Call offer_demo immediately before one gentle proactive demo offer/)
  assert.match(prompt, /Hello, I'm Woxza/)
})

test("an optional entry hint primes but never locks the conversation", async () => {
  const prompt = await buildDemoPrompt({ language:"te", entryHint:"order_taking" })
  assert.match(prompt, /ENTRY HINT: The website optionally suggested order taking/)
  assert.match(prompt, /only a soft signal/)
  assert.match(prompt, /do not.*force it/i)
  assert.match(prompt, /నమస్కారం, నేను Woxza/)
})

test("action requests preserve the active workflow and distinguish real Woxza from the demo", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.match(prompt, /action question is an interrupt, not a new mode/)
  assert.match(prompt, /resolve_action_capability/)
  assert.match(prompt, /public demo cannot perform them/)
  assert.match(prompt, /Never claim an action.*cost saving.*connection occurred/)
})

test("FAQ claims remain in the feature catalog rather than bloating the live system prompt", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.doesNotMatch(prompt, /without code.*launch in minutes/)
  assert.doesNotMatch(prompt, /DPDP Act in mind/)
  assert.match(prompt, /Never claim an action.*cost saving.*connection occurred/)
})

test("identity opening and callback explanation are localized for Telugu", () => {
  assert.match(localizedIdentityOpening("te"), /కస్టమర్ కాల్స్‌ను ఎలా నిర్వహిస్తుందో/)
  assert.match(localizedPostOrderActionCapability("te"), /లైవ్ ధరను చెక్ చేయలేను/)
  for (const language of LANGUAGES.keys()) assert.ok(localizedPostOrderActionCapability(language).includes("Woxza") || language === "te")
})
