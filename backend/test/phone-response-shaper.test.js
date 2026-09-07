import test from "node:test"
import assert from "node:assert/strict"
import { shapePhoneResponse, stripLeadingAcknowledgement } from "../src/demo/phone-response-shaper.js"

test("removes a leading acknowledgement before TTS when useful content follows", () => {
  assert.equal(stripLeadingAcknowledgement("అవును, ఒకేసారి చాలా కాల్స్ వస్తే కష్టమే.", "te"), "ఒకేసారి చాలా కాల్స్ వస్తే కష్టమే.")
  assert.equal(stripLeadingAcknowledgement("Yes, that would save time.", "en"), "that would save time.")
})

test("does not strip a standalone affirmative answer", () => {
  assert.equal(stripLeadingAcknowledgement("అవును", "te"), "అవును")
  assert.equal(stripLeadingAcknowledgement("Yes", "en"), "Yes")
})

test("allows only a multi-sentence full picture to use the larger phone budget", () => {
  const fullPicture = "First concrete capability helps. Second concrete capability helps. Third concrete capability helps. Fourth concrete capability helps. Fifth concrete capability helps. Sixth concrete capability helps."
  const shaped = shapePhoneResponse(fullPicture, { language:"en", maximumCharacters:80, fullPictureMaximumCharacters:300 })
  assert.equal(shaped.text, fullPicture)
  assert.equal(shaped.reason, "complete")

  const ordinary = shapePhoneResponse("First normal response is concise. Second normal response is still concise.", { language:"en", maximumCharacters:40, fullPictureMaximumCharacters:300 })
  assert.ok([...ordinary.text].length <= 40)
})

test("controller-confirmed full picture gets its larger budget before sentence counting", () => {
  const answer = "First useful example is detailed. Second useful example is detailed. Third useful example is detailed."
  const shaped = shapePhoneResponse(answer, { language:"en", maximumCharacters:40, fullPictureMaximumCharacters:300, forceExtended:true })
  assert.equal(shaped.text, answer)
})

test("keeps only complete sentences when a model reaches its token ceiling", () => {
  const shaped = shapePhoneResponse("మీ షాపులో ఫోన్ ఆర్డర్‌లు వస్తాయని అర్థమైంది. ఉదాహరణకు,", { language:"te", maximumCharacters:180, stopReason:"MAX_TOKENS" })
  assert.equal(shaped.text, "మీ షాపులో ఫోన్ ఆర్డర్‌లు వస్తాయని అర్థమైంది.")
  assert.equal(shaped.reason, "model_cutoff_trimmed")
})

test("never sends a raw incomplete model fragment to TTS", () => {
  const shaped = shapePhoneResponse("మీరు చెప్పినదాని ప్రకారం మీకు", { language:"te", stopReason:"MAX_TOKENS" })
  assert.equal(shaped.reason, "incomplete_recovery")
  assert.match(shaped.text, /అర్థమైంది/)
  assert.ok(/[?？]$/.test(shaped.text))
})

test("keeps a complete short phone answer unchanged", () => {
  const source = "That makes sense. Which step takes the most time?"
  assert.deepEqual(shapePhoneResponse(source, { language:"en", maximumCharacters:180 }), {
    text:source, reason:"complete", rawCharacters:source.length, spokenCharacters:source.length
  })
})

test("preserves a later complete next question instead of stopping after an acknowledgement", () => {
  const source = "మీరు ఫోన్ కాల్స్, WhatsApp ద్వారా ఆర్డర్లు తీసుకుంటారని అర్థమైంది. మూడు వేల రకాల మందులు ఉండటం వల్ల ప్రతి enquiry ని వెంటనే చూసుకోవడం కష్టమవుతుంది. ప్రస్తుతం ఆర్డర్ తీసుకున్న తర్వాత delivery update ఎలా ఇస్తున్నారు?"
  const shaped = shapePhoneResponse(source, { language:"te", maximumCharacters:180 })
  assert.equal(shaped.reason, "phone_length_preserved_question")
  assert.match(shaped.text, /delivery update ఎలా ఇస్తున్నారు\?$/u)
  assert.ok([...shaped.text].length <= 180)
})
