import test from "node:test"
import assert from "node:assert/strict"
import { normalizeTtsText } from "../src/demo/tts-text-normalizer.js"

test("canonicalizes common product names before TTS", () => {
  assert.equal(normalizeTtsText("whats app and insta gram use cheyandi", { dictionaryEnabled:true }), "WhatsApp and Instagram use cheyandi")
  assert.equal(normalizeTtsText("Woxza lo GOOGLE and youtube", { dictionaryEnabled:true }), "Woxza lo Google and YouTube")
})

test("uses a compact local-script fallback when no Sarvam dictionary is configured", () => {
  assert.equal(normalizeTtsText("Woxza and WhatsApp use cheyandi", { language:"te" }), "వోక్సా and వాట్సాప్ use cheyandi")
  assert.equal(normalizeTtsText("Woxza aur CRM", { language:"hi" }), "वोक्सा aur सी आर एम")
  assert.equal(normalizeTtsText("Woxza and OTP", { language:"ta" }), "வோக்ஸா and ஓ டி பி")
})

test("uses complete brand and website pronunciation entries in every supported call language", () => {
  const expected = {
    as:"ৱক্সা এ আই ৱেবছাইট", bn:"ওক্সা এ আই ওয়েবসাইট", en:"Wok-sa A I website",
    gu:"વોક્સા એ આઈ વેબસાઇટ", hi:"वोक्सा ए आई वेबसाइट", kn:"ವೋಕ್ಸಾ ಎ ಐ ವೆಬ್‌ಸೈಟ್",
    ml:"വോക്സാ എ ഐ വെബ്സൈറ്റ്", mr:"वोक्सा ए आय वेबसाईट", or:"ୱୋକ୍ସା ଏ ଆଇ ୱେବସାଇଟ୍",
    pa:"ਵੋਕਸਾ ਏ ਆਈ ਵੈੱਬਸਾਈਟ", ta:"வோக்ஸா ஏ ஐ வெப்சைட்", te:"వోక్సా ఏ ఐ వెబ్‌సైట్",
    ur:"ووکسَا اے آئی ویب سائٹ"
  }
  for (const [language, pronunciation] of Object.entries(expected)) {
    assert.equal(normalizeTtsText("Woxza AI website", { language }), pronunciation, language)
  }
})

test("keeps dictionary keys intact when Sarvam pronunciation dictionary is active", () => {
  assert.equal(normalizeTtsText("Woxza and WhatsApp", { language:"te", dictionaryEnabled:true }), "Woxza and WhatsApp")
})

test("formats only long ungrouped numbers for Indian-number speech", () => {
  assert.equal(normalizeTtsText("500 calls and 10000 customers"), "500 calls and 10,000 customers")
})

test("turns numeric ranges into speakable connectors", () => {
  assert.equal(normalizeTtsText("రోజుకి 5-6 గంటలు పడుతుంది", { language:"te" }), "రోజుకి 5 నుంచి 6 గంటలు పడుతుంది")
  assert.equal(normalizeTtsText("यह 5-6 घंटे लेता है", { language:"hi" }), "यह 5 से 6 घंटे लेता है")
  assert.equal(normalizeTtsText("It takes 5-6 hours", { language:"en" }), "It takes 5 to 6 hours")
})
