import assert from "node:assert/strict"
import test from "node:test"
import { buildDemoPrompt, FORMALITY_RULES, LANGUAGES, LOCALIZED_DEMO_NAMES, LOCALIZED_REDIRECT_TEMPLATES, LOCALIZED_SCOPE_BOUNDARIES, POST_COMPLETION_FEATURE_OFFERS, USE_CASE_CONFIG, USE_CASES, localizedPostCompletionOffer, localizedRedirect, localizedScopeBoundary } from "../src/demo/prompt.js"

const REPRESENTATIVE_LANGUAGES = ["en", "hi", "te"]

test("every scenario uses the single English rule-set in representative languages", async () => {
  for (const [useCase, scenario] of Object.entries(USE_CASE_CONFIG)) {
    for (const language of REPRESENTATIVE_LANGUAGES) {
      const prompt = await buildDemoPrompt({
        useCase,
        language,
        greeting:`GREETING-${useCase}-${language}`,
        ending:`ENDING-${language}`
      })
      assert.ok(USE_CASES.has(useCase))
      assert.match(prompt, new RegExp(`demonstrating ONLY the ${scenario.label}`))
      assert.match(prompt, new RegExp(`Conduct this entire call in ${LANGUAGES.get(language)}`))
      assert.match(prompt, /Romanized or English words mid-sentence/)
      assert.match(prompt, /keep responding in .* script/)
      assert.ok(prompt.includes(`GREETING-${useCase}-${language}`))
      assert.ok(prompt.includes(`ENDING-${language}`))
      assert.ok(prompt.includes(scenario.scope))
      assert.ok(prompt.includes(scenario.script))
      assert.match(prompt, /call handle_scope_redirect before speaking/)
      assert.match(prompt, /third consecutive unrelated request/)
      assert.match(prompt, /Do not recommend customer support/)
      assert.match(prompt, /No health, wellbeing, or medical commentary/)
      assert.match(prompt, /No disclaimers/)
      assert.match(prompt, /Strict 120-second call limit/)
      assert.match(prompt, /At 90 seconds/)
      assert.match(prompt, /At 105 seconds/)
    }
  }
})

test("appointment booking stays limited to salon, movie, or doctor", async () => {
  const prompt = await buildDemoPrompt({ useCase:"appointment_booking", language:"te" })
  assert.match(prompt, /book salon, movie, or doctor appointments only/)
  assert.match(prompt, /no other reservation types exist/)
  assert.match(prompt, /handle_scope_redirect/)
  assert.match(prompt, /update_booking_state/)
  assert.match(prompt, /speak the say_exactly value and nothing else/)
  assert.match(prompt, /affirmative, negative, or unclear/)
  assert.match(prompt, /Never say an appointment, reservation, or ticket was booked/)
  assert.doesNotMatch(prompt, /hotel|clinic booking/i)
})

test("unknown scenarios fall back to order taking without changing the selected language", async () => {
  const prompt = await buildDemoPrompt({ useCase:"unknown", language:"te" })
  assert.match(prompt, /demonstrating ONLY the Order taking flow/)
  assert.match(prompt, /Conduct this entire call in Telugu/)
})

test("an externally rendered opening is never repeated by the Live model", async () => {
  const prompt = await buildDemoPrompt({
    useCase:"lead_qualification",
    language:"te",
    greeting:"DETERMINISTIC-GREETING",
    openingAlreadyHandled:true
  })
  assert.match(prompt, /already played this complete greeting/)
  assert.match(prompt, /Do not speak, repeat, paraphrase, or restart this greeting/)
  assert.match(prompt, /first spoken response must answer the caller's next turn/)
  assert.ok(prompt.includes("DETERMINISTIC-GREETING"))
  assert.doesNotMatch(prompt, /Your first spoken response must be exactly this greeting/)
})

test("order taking offers business features after confirmation before any closing", async () => {
  const prompt = await buildDemoPrompt({ useCase:"order_taking", language:"te" })
  assert.match(prompt, /COMPLETE order state/)
  assert.match(prompt, /action set_pending/)
  assert.match(prompt, /action confirm/)
  assert.match(prompt, /order reference/)
  assert.match(prompt, /choice between hearing how Woxza can help their business and concluding/)
  assert.match(prompt, /follow the WOXZA FEATURE-CAPABILITY FLOW/)
  assert.match(prompt, /distinct spoken turns/)
  assert.match(prompt, /Never summarize only the last item/)
})

test("post-completion feature choice is localized for every supported language", () => {
  assert.deepEqual(Object.keys(POST_COMPLETION_FEATURE_OFFERS).sort(), [...LANGUAGES.keys()].sort())
  for (const language of LANGUAGES.keys()) {
    const offer = localizedPostCompletionOffer(language)
    assert.ok(offer.includes("Woxza"))
    assert.ok(offer.length > 20)
  }
})

test("non-order scenarios do not receive the order-state protocol", async () => {
  const prompt = await buildDemoPrompt({ useCase:"appointment_booking", language:"te" })
  assert.doesNotMatch(prompt, /ORDER CONFIRMATION PROTOCOL|update_order_state/)
})

test("feature questions use the business-first recommendation flow and support unseen follow-ups", async () => {
  const prompt = await buildDemoPrompt({
    useCase:"customer_support",
    language:"en",
    featurePrompts:{ feature_tags:["pharmacy", "restaurant", "general"], feature_response_policy:"Use verified feature records only." }
  })
  assert.match(prompt, /explicit exception to the scenario scope/)
  assert.match(prompt, /ask what kind of business the caller runs/)
  assert.match(prompt, /intent "recommend"/)
  assert.match(prompt, /intent "more_features"/)
  assert.match(prompt, /never repeat features already discussed/)
  assert.match(prompt, /pharmacy, restaurant, general/)
  assert.match(prompt, /Use verified feature records only/)
})

test("Woxza best-feature questions are allowed and answered without a personal opinion", async () => {
  const prompt = await buildDemoPrompt({ useCase:"customer_support", language:"te" })
  assert.match(prompt, /best, most useful, or your "favorite" is ALWAYS allowed/)
  assert.match(prompt, /intent "highlight_feature"/)
  assert.match(prompt, /do not claim a personal preference/)
  assert.match(prompt, /Do not ask for the caller's business before answering/)
  assert.match(prompt, /Every spoken response must be a complete thought/)
})

test("formality rules require natural professional particles instead of mechanical repetition", () => {
  assert.match(FORMALITY_RULES.te, /no more than once in a short turn/)
  assert.match(FORMALITY_RULES.te, /అండి/)
  assert.match(FORMALITY_RULES.te, /Never say ఓకే/)
  assert.match(FORMALITY_RULES.hi, /do not repeat जी after every clause/)
  assert.match(FORMALITY_RULES.ta, /final clause/)
  assert.match(FORMALITY_RULES.kn, /final clause/)
})

test("out-of-scope boundaries are localized for all 13 languages and never route general knowledge to support", async () => {
  assert.deepEqual(Object.keys(LOCALIZED_REDIRECT_TEMPLATES).sort(), [...LANGUAGES.keys()].sort())
  assert.deepEqual(Object.keys(LOCALIZED_SCOPE_BOUNDARIES).sort(), [...LANGUAGES.keys()].sort())
  for (const language of LANGUAGES.keys()) {
    const currentDemo = LOCALIZED_DEMO_NAMES[language].order_taking
    const otherDemo = LOCALIZED_DEMO_NAMES[language].customer_support
    const redirect = localizedRedirect(language, currentDemo, otherDemo)
    const first = localizedScopeBoundary(language, "first", currentDemo)
    const second = localizedScopeBoundary(language, "second", currentDemo)
    const prompt = await buildDemoPrompt({ useCase:"order_taking", language })
    assert.ok(redirect.includes(currentDemo))
    assert.ok(redirect.includes(otherDemo))
    assert.ok(first.includes(currentDemo))
    assert.ok(second.includes(currentDemo))
    assert.match(prompt, /category general for news, sport scores, weather, politics/)
    assert.doesNotMatch(redirect, /no worries/i)
  }
  assert.doesNotMatch(localizedRedirect("te", "ఆర్డర్", "సపోర్ట్"), /\b(?:this|demo is|would you|no worries)\b/i)
})
