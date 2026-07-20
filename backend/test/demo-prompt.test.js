import assert from "node:assert/strict"
import test from "node:test"
import { buildDemoPrompt, LANGUAGES, USE_CASES, localizedDemoEnding, localizedIdentityHandshake, localizedIdentityOpening, localizedPostCompletionOffer, localizedPostOrderActionCapability } from "../src/demo/prompt.js"

test("an unset entry hint starts a pure discover conversation", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.ok(USE_CASES.has("discover"))
  assert.match(prompt, /ENTRY HINT: none/)
  assert.match(prompt, /discover, explain, or demonstrate/)
  assert.match(prompt, /never redirect or penalize them/)
  assert.match(prompt, /Do not call a tool for hello, small talk, clarification/)
  assert.match(prompt, /Call offer_demo immediately before one gentle proactive contextual-demo offer/)
  assert.match(prompt, /FEATURE LIBRARY/)
  assert.match(prompt, /Do not always fall back to/)
  assert.match(prompt, /Would you like to try a demo/)
})

test("an optional entry hint primes but never locks the conversation", async () => {
  const prompt = await buildDemoPrompt({ language:"te", entryHint:"order_taking" })
  assert.match(prompt, /ENTRY HINT: The website optionally suggested order taking/)
  assert.match(prompt, /only a soft signal/)
  assert.match(prompt, /do not.*force it/i)
  assert.match(prompt, /మీరు ఒక డెమో ప్రయత్నించాలనుకుంటున్నారా/)
})

test("action requests preserve the active workflow while contextual demos may use sample outcomes", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.match(prompt, /action question is an interrupt, not a new mode/)
  assert.match(prompt, /resolve_action_capability/)
  assert.match(prompt, /contextual customer-call simulation, you may give believable sample results/)
  assert.match(prompt, /Outside that simulation, never claim an action.*cost saving.*connection occurred/)
})

test("FAQ claims remain in the feature catalog rather than bloating the live system prompt", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.doesNotMatch(prompt, /without code.*launch in minutes/)
  assert.doesNotMatch(prompt, /DPDP Act in mind/)
  assert.match(prompt, /Outside that simulation, never claim an action.*cost saving.*connection occurred/)
})

test("identity opening and callback explanation are localized for Telugu", () => {
  assert.match(localizedIdentityOpening("te"), /మీరు ఒక డెమో ప్రయత్నించాలనుకుంటున్నారా/)
  assert.equal(localizedIdentityHandshake("te"), "నమస్కారం. Woxzaకి స్వాగతం.")
  assert.match(localizedPostCompletionOffer("te"), /ఈ డెమో మీకు ఎలా అనిపించింది/)
  assert.match(localizedDemoEnding("te"), /Join the waitlist/)
  assert.match(localizedPostOrderActionCapability("te"), /లైవ్ ధరను చెక్ చేయలేను/)
  for (const language of LANGUAGES.keys()) assert.ok(localizedPostOrderActionCapability(language).includes("Woxza") || language === "te")
})

test("the opening uses a short handshake before the full welcome", async () => {
  const prompt = await buildDemoPrompt({ language:"en" })
  assert.match(prompt, /Hello, welcome to Woxza\./)
  assert.match(prompt, /When the caller next says anything, give exactly this full welcome/)
  assert.match(prompt, /ORDER-TAKING STRATEGY/)
  assert.match(prompt, /OPENING CHOICE ROUTING/)
  assert.match(prompt, /Understand the caller's reply naturally/)
  assert.match(prompt, /word "too" does not mean "two"/)
  assert.match(prompt, /non-technical 60-year-old business owner/)
  assert.match(prompt, /WORKFLOW STRATEGIES/)
  assert.match(prompt, /start_contextual_demo/)
  assert.match(prompt, /tile shop can demonstrate/)
  assert.match(prompt, /This is a short showcase, not a real order form/)
  assert.match(prompt, /immediately create sensible sample business data for any missing facts/)
  assert.match(prompt, /Do not repeat a claim or a near-paraphrase already used earlier in the call/)
  for (const workflow of ["customer support", "lead qualification", "appointment booking", "event RSVP", "feedback survey", "recruiting screening"]) assert.match(prompt, new RegExp(`- ${workflow}:`))
  assert.doesNotMatch(localizedIdentityOpening("en"), /I'm Woxza/)
})
