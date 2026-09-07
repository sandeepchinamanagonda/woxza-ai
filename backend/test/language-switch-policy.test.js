import assert from "node:assert/strict"
import test from "node:test"
import { configuredLanguageSwitchPolicy, createLanguageSwitchController, isSubstantiveLanguageChange } from "../src/demo/language-switch-policy.js"

test("the switch policy stays locked unless confirm mode is explicitly enabled", () => {
  assert.equal(configuredLanguageSwitchPolicy({}), "locked")
  assert.equal(configuredLanguageSwitchPolicy({ V3_LANGUAGE_SWITCH_POLICY:"confirm" }), "confirm")
  assert.equal(configuredLanguageSwitchPolicy({ V3_LANGUAGE_SWITCH_POLICY:"automatic" }), "locked")
})

test("an isolated English business word is code-mixing, not a switch request", () => {
  const controller = createLanguageSwitchController({ selectedLanguage:"hi", mode:"confirm" })
  const decision = controller.observeTurn({ text:"Business", detectedLanguage:"en" })
  assert.equal(decision.action, "none")
  assert.equal(decision.activeLanguage, "hi")
  assert.equal(decision.languagePolicy.switch_offer, null)
})

test("three substantial English-only turns offer rather than automatically changing Hindi", () => {
  const controller = createLanguageSwitchController({ selectedLanguage:"hi", mode:"confirm" })
  assert.equal(controller.observeTurn({ text:"I receive most orders through phone calls.", detectedLanguage:"en" }).action, "none")
  assert.equal(controller.observeTurn({ text:"My team also uses WhatsApp for customer updates.", detectedLanguage:"en" }).action, "none")
  const offer = controller.observeTurn({ text:"Representatives visit local shops to collect their orders.", detectedLanguage:"en" })
  assert.equal(offer.action, "offer")
  assert.equal(offer.activeLanguage, "hi")
  assert.deepEqual(offer.languagePolicy.switch_offer, { candidate_language:"en" })
  const confirmed = controller.observeTurn({ text:"Yes", detectedLanguage:"en" })
  assert.equal(confirmed.action, "switched")
  assert.equal(confirmed.activeLanguage, "en")
  assert.equal(confirmed.forceReply, true)
})

test("transliterated local speech cannot create an English offer", () => {
  const controller = createLanguageSwitchController({ selectedLanguage:"te", mode:"confirm" })
  const decision = controller.observeTurn({ text:"Madi mandu shop", detectedLanguage:"en" })
  assert.equal(decision.action, "none")
  assert.equal(decision.activeLanguage, "te")
})

test("a second foreign-language sentence is not consent to an offered switch", () => {
  const controller = createLanguageSwitchController({ selectedLanguage:"te", mode:"confirm" })
  controller.observeTurn({ text:"I receive orders from pharmacies through phone calls.", detectedLanguage:"en" })
  controller.observeTurn({ text:"My staff sends updates through WhatsApp every day.", detectedLanguage:"en" })
  const offer = controller.observeTurn({ text:"We visit retail shops and collect new customer orders.", detectedLanguage:"en" })
  assert.equal(offer.action, "offer")
  const stillTelugu = controller.observeTurn({ text:"We also use WhatsApp to share order details.", detectedLanguage:"en" })
  assert.equal(stillTelugu.action, "none")
  assert.equal(stillTelugu.activeLanguage, "te")
})

test("explicit language requests switch immediately", () => {
  const controller = createLanguageSwitchController({ selectedLanguage:"te", mode:"confirm" })
  const decision = controller.observeTurn({ text:"Let us continue in English please", detectedLanguage:"en" })
  assert.equal(decision.action, "switched")
  assert.equal(decision.activeLanguage, "en")
})

test("Indic-script code mixing never becomes an English language offer", () => {
  assert.equal(isSubstantiveLanguageChange({ text:"మేము WhatsApp ద్వారా orders తీసుకుంటాం", detectedLanguage:"en", activeLanguage:"te" }), false)
})
