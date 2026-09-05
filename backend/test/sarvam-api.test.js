import test from "node:test"
import assert from "node:assert/strict"
import { createSarvamApi, resolveTtsSpeaker, woxzaLanguageFromSarvamCode } from "../src/demo/sarvam-api.js"

test("Sarvam language detection maps a detected Telugu turn back to Woxza Telugu", () => {
  assert.equal(woxzaLanguageFromSarvamCode("te-IN"), "te")
  assert.equal(woxzaLanguageFromSarvamCode("hi-IN"), "hi")
  assert.equal(woxzaLanguageFromSarvamCode("as-IN"), "as")
  assert.equal(woxzaLanguageFromSarvamCode("ur-IN"), "ur")
})

test("Sarvam STT uses automatic language detection for a multilingual call", async () => {
  let languageCode
  const client = createSarvamApi({ apiKey:"test", fetchImpl:async (_url, options) => {
    languageCode = options.body.get("language_code")
    return new Response(JSON.stringify({ transcript:"నమస్కారం", language_code:"te-IN", request_id:"stt-test" }), { status:200 })
  } })
  const result = await client.transcribePcm16(Buffer.alloc(320), { language:"unknown" })
  assert.equal(languageCode, "unknown")
  assert.equal(result.languageCode, "te-IN")
})

test("Sarvam TTS requests high-quality Linear16 telephony audio by default", async () => {
  let request
  const client = createSarvamApi({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(JSON.stringify({ audios:[Buffer.from([1, 2, 3]).toString("base64")], request_id:"tts-test" }), { status:200 })
  } })
  const result = await client.synthesizeTelephonyAudio("Hello", { language:"en" })
  assert.equal(request.output_audio_codec, "linear16")
  assert.equal(request.speech_sample_rate, 16000)
  assert.equal(request.speaker, "ritu")
  assert.equal(request.pace, 1.15)
  assert.equal(request.temperature, 0.7)
  assert.equal(result.contentType, "audio/x-l16")
  assert.equal(result.sampleRate, 16000)
})

test("Sarvam TTS can use a language-specific voice and pace from environment", async () => {
  const previous = { order:process.env.SARVAM_TTS_SPEAKER_ORDER_TE, speaker:process.env.SARVAM_TTS_SPEAKER_TE, pace:process.env.SARVAM_TTS_PACE_TE, temperature:process.env.SARVAM_TTS_TEMPERATURE_TE }
  process.env.SARVAM_TTS_SPEAKER_ORDER_TE = "priya, ritu, shubh"
  process.env.SARVAM_TTS_SPEAKER_TE = "ritu"
  process.env.SARVAM_TTS_PACE_TE = "1.15"
  process.env.SARVAM_TTS_TEMPERATURE_TE = "0.72"
  let request
  const client = createSarvamApi({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(JSON.stringify({ audios:[Buffer.from([1]).toString("base64")] }), { status:200 })
  } })
  try {
    await client.synthesizeTelephonyAudio("నమస్కారం", { language:"te" })
    assert.equal(request.speaker, "ritu")
    assert.equal(request.pace, 1.15)
    assert.equal(request.temperature, 0.72)
  } finally {
    for (const [key, value] of Object.entries({ SARVAM_TTS_SPEAKER_ORDER_TE:previous.order, SARVAM_TTS_SPEAKER_TE:previous.speaker, SARVAM_TTS_PACE_TE:previous.pace, SARVAM_TTS_TEMPERATURE_TE:previous.temperature })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test("Sarvam REST TTS passes the language dictionary and rendered local range", async () => {
  const previous = process.env.SARVAM_TTS_PRONUNCIATION_DICT_ID_TE
  process.env.SARVAM_TTS_PRONUNCIATION_DICT_ID_TE = "p_woxza_test"
  let request
  const client = createSarvamApi({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(JSON.stringify({ audios:[Buffer.from([1]).toString("base64")] }), { status:200 })
  } })
  try {
    const result = await client.synthesizeTelephonyAudio("రోజుకి 5-6 గంటలు పడుతుంది", { language:"te" })
    assert.equal(request.dict_id, "p_woxza_test")
    assert.equal(request.text, "రోజుకి 5 నుంచి 6 గంటలు పడుతుంది")
    assert.equal(result.dictionaryId, "p_woxza_test")
  } finally {
    if (previous === undefined) delete process.env.SARVAM_TTS_PRONUNCIATION_DICT_ID_TE
    else process.env.SARVAM_TTS_PRONUNCIATION_DICT_ID_TE = previous
  }
})

test("Sarvam TTS keeps a ranked language voice policy stable on its first choice", () => {
  const previous = process.env.SARVAM_TTS_SPEAKER_ORDER_GU
  process.env.SARVAM_TTS_SPEAKER_ORDER_GU = "priya, ritu, ratan"
  try {
    assert.equal(resolveTtsSpeaker("gu"), "priya")
  } finally {
    if (previous === undefined) delete process.env.SARVAM_TTS_SPEAKER_ORDER_GU
    else process.env.SARVAM_TTS_SPEAKER_ORDER_GU = previous
  }
})

test("an explicit language voice selection overrides the scored fallback order", () => {
  const previous = { order:process.env.SARVAM_TTS_SPEAKER_ORDER_TE, speaker:process.env.SARVAM_TTS_SPEAKER_TE }
  process.env.SARVAM_TTS_SPEAKER_ORDER_TE = "priya, ritu, shubh"
  process.env.SARVAM_TTS_SPEAKER_TE = "ritu"
  try {
    assert.equal(resolveTtsSpeaker("te"), "ritu")
  } finally {
    for (const [key, value] of Object.entries({ SARVAM_TTS_SPEAKER_ORDER_TE:previous.order, SARVAM_TTS_SPEAKER_TE:previous.speaker })) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})
