import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createPcmSpeechDetector, createStreamingPcmResampler, resamplePcm, swapPcm16Endianness } from "../src/demo/audio-codec.js"
import { FORCE_CLOSING_MS, HARD_CUTOFF_MS, WRAP_UP_MODE_MS, advanceScopeRedirect, containsOrderConfirmation, createCallerSilenceMonitor, createDemoOrderState, createPacedMuLawWriter, createScopeRedirectState, describeGeminiLiveError, isConversationEndRequest, isOrderAffirmative, looksLikeOrderConfirmationQuestion, openGeminiSessionWithRetry } from "../src/demo/gemini-bridge.js"

test("converts PCM samples between little-endian and L16 network byte order", () => {
  const littleEndian = Buffer.from([0x34, 0x12, 0xfe, 0xff, 0x00, 0x80])
  const l16 = swapPcm16Endianness(littleEndian)

  assert.deepEqual(l16, Buffer.from([0x12, 0x34, 0xff, 0xfe, 0x80, 0x00]))
  assert.deepEqual(swapPcm16Endianness(l16), littleEndian)
})

test("resamples before endian conversion and preserves signed PCM sample order", () => {
  const pcm24kLittleEndian = Buffer.from([0x00, 0x00, 0x00, 0x40, 0x00, 0x80])
  const plivoL16 = swapPcm16Endianness(resamplePcm(pcm24kLittleEndian, 24000, 16000))

  assert.deepEqual(plivoL16, Buffer.from([0x00, 0x00, 0xe0, 0x00]))
  assert.deepEqual(swapPcm16Endianness(plivoL16), resamplePcm(pcm24kLittleEndian, 24000, 16000))
})

test("streaming resampling is continuous across arbitrary carrier chunks", () => {
  const samples = Buffer.alloc(240 * 2)
  for (let index = 0; index < 240; index += 1) samples.writeInt16LE(Math.round(Math.sin(index / 9) * 12000), index * 2)
  const whole = createStreamingPcmResampler(24000, 8000).push(samples)
  const chunkedResampler = createStreamingPcmResampler(24000, 8000)
  const chunked = Buffer.concat([
    chunkedResampler.push(samples.subarray(0, 74)),
    chunkedResampler.push(samples.subarray(74, 286)),
    chunkedResampler.push(samples.subarray(286))
  ])
  assert.deepEqual(chunked, whole)
})

test("caller energy detection reacts to speech but ignores carrier silence", () => {
  const detector = createPcmSpeechDetector({ threshold:500, consecutiveFrames:2 })
  assert.equal(detector.push(Buffer.alloc(320)), false)
  const speech = Buffer.alloc(320)
  for (let index = 0; index < 160; index += 1) speech.writeInt16LE(index % 2 ? 3000 : -3000, index * 2)
  assert.equal(detector.push(speech), false)
  assert.equal(detector.push(speech), true)
  assert.equal(detector.push(Buffer.alloc(320)), false)
})

test("caller silence starts after the agent's latest output activity", () => {
  let now = 0
  let nextId = 0
  const timers = new Map()
  const schedule = (callback, delay) => {
    const timer = { id:++nextId, due:now + delay, callback, unref() {} }
    timers.set(timer.id, timer)
    return timer
  }
  const cancel = timer => timers.delete(timer?.id)
  const advance = milliseconds => {
    const target = now + milliseconds
    while (true) {
      const timer = [...timers.values()].sort((left, right) => left.due - right.due)[0]
      if (!timer || timer.due > target) break
      timers.delete(timer.id)
      now = timer.due
      timer.callback()
    }
    now = target
  }
  const reprompts = []
  let timeouts = 0
  const monitor = createCallerSilenceMonitor({
    timeoutMs:12_000,
    schedule,
    cancel,
    now:() => now,
    onReprompt:event => { reprompts.push(event) },
    onTimeout:() => { timeouts += 1 }
  })

  monitor.start()
  advance(9_000)
  monitor.noteAgentActivity(3_000)
  advance(14_999)
  assert.equal(reprompts.length, 0)
  advance(1)
  assert.deepEqual(reprompts, [{ silenceDurationMs:12_000 }])

  monitor.noteCallerActivity()
  advance(12_000)
  assert.equal(reprompts.length, 2)
  advance(12_000)
  assert.equal(timeouts, 1)
})

test("order confirmation state has a stable reference and recognizes multilingual confirmation", () => {
  const state = createDemoOrderState("5699c653-05a1-4f48-a0c2-b7944cf4f334")
  assert.equal(state.status, "collecting")
  assert.equal(state.reference, "WX-5699C6")
  assert.ok(isOrderAffirmative("Confirm చేయండి"))
  assert.ok(isOrderAffirmative("हाँ जी, कन्फर्म कीजिए"))
  assert.ok(looksLikeOrderConfirmationQuestion("నేను ఆర్డర్ కన్ఫర్మ్ చేయనా అండి?"))
  assert.ok(containsOrderConfirmation("మీ ఆర్డర్ కన్ఫర్మ్ అయింది అండి. రిఫరెన్స్ W X 5699 C 6.", state.reference))
})

test("detects explicit caller farewells without treating a simple thank-you as a hangup", () => {
  for (const farewell of ["Bye", "Goodbye, that's all", "Please end the call", "No thanks, I'm done", "Adiós", "వీడ్కోలు", "बस इतना", "விடைபெறுகிறேன்"]) {
    assert.equal(isConversationEndRequest(farewell), true, farewell)
  }
  for (const continuing of ["Thanks, can you tell me more?", "Can you disconnect the feature from my account?", "I need nothing more than an appointment tomorrow"]) {
    assert.equal(isConversationEndRequest(continuing), false, continuing)
  }
})

test("scope redirects progress from a localized boundary to choices and then closing", () => {
  for (const language of ["en", "hi", "te", "ta", "kn", "ml", "mr", "gu", "bn", "pa", "as", "ur", "es"]) {
    const state = createScopeRedirectState()
    const first = advanceScopeRedirect(state, { language, currentUseCase:"order_taking", category:"general", ending:`ENDING-${language}` })
    const second = advanceScopeRedirect(state, { language, currentUseCase:"order_taking", category:"general", ending:`ENDING-${language}` })
    const third = advanceScopeRedirect(state, { language, currentUseCase:"order_taking", category:"general", ending:`ENDING-${language}` })
    assert.equal(first.action, "set_boundary")
    assert.equal(second.action, "offer_choices")
    assert.deepEqual(third, { count:3, action:"close", sayExactly:`ENDING-${language}` })
    assert.notEqual(first.sayExactly, second.sayExactly)
    assert.doesNotMatch(first.sayExactly, /customer support/i)
  }
})

test("scope redirect names another demo only for an explicit supported workflow", () => {
  const state = createScopeRedirectState()
  const redirect = advanceScopeRedirect(state, {
    language:"te",
    currentUseCase:"order_taking",
    category:"supported_demo",
    targetUseCase:"appointment_booking",
    ending:"ముగింపు"
  })
  assert.equal(redirect.action, "redirect_demo")
  assert.match(redirect.sayExactly, /అపాయింట్/)
})

test("conversation timing reserves room for closing before the carrier cutoff", () => {
  assert.equal(WRAP_UP_MODE_MS, 90_000)
  assert.equal(FORCE_CLOSING_MS, 105_000)
  assert.equal(HARD_CUTOFF_MS, 120_000)
})

test("paces irregular Gemini output into short carrier-safe frames", () => {
  let now = 0
  let nextId = 0
  const timers = new Map()
  const schedule = (callback, delay) => {
    const timer = { id:++nextId, due:now + delay, callback, unref() {} }
    timers.set(timer.id, timer)
    return timer
  }
  const cancel = timer => timers.delete(timer?.id)
  const advance = milliseconds => {
    const target = now + milliseconds
    while (true) {
      const timer = [...timers.values()].sort((left, right) => left.due - right.due)[0]
      if (!timer || timer.due > target) break
      timers.delete(timer.id)
      now = timer.due
      timer.callback()
    }
    now = target
  }
  const frames = []
  const writer = createPacedMuLawWriter({ onFrame:frame => frames.push({ at:now, frame:Buffer.from(frame) }), schedule, cancel })
  writer.push(Buffer.alloc(100, 1))
  writer.push(Buffer.alloc(380, 2))
  assert.equal(frames.length, 1)
  advance(40)
  assert.equal(frames.length, 3)
  assert.deepEqual(frames.map(entry => entry.at), [0, 20, 40])
  assert.ok(frames.every(entry => entry.frame.length === 160))
  writer.push(Buffer.alloc(81, 3))
  writer.flush()
  advance(20)
  assert.equal(frames.at(-1).frame.length, 160)
  writer.clear()
})

test("production bridge delegates playback buffering to Plivo and preserves lifecycle guards", async () => {
  const source = await readFile(new URL("../src/demo/gemini-bridge.js", import.meta.url), "utf8")
  assert.match(source, /createStreamingOutputSafetyGuard/)
  assert.match(source, /holdMs:120/)
  assert.equal((source.match(/createPacedMuLawWriter/g) || []).length, 1)
  assert.match(source, /push\(value\)[\s\S]*plivoStream\.playAudio\(value\)/)
  assert.match(source, /audioWriter\.push\(muLaw8k\)/)
  assert.match(source, /name:"update_booking_state"/)
  assert.match(source, /name:"handle_scope_redirect"/)
  assert.match(source, /\[POST-ORDER CHOICE:/)
  assert.doesNotMatch(source, /\[ORDER CLOSING TURN:/)
  assert.match(source, /isAppointmentBooking && appointmentToolRequired/)
  assert.match(source, /speech before the required backend appointment transition/)
  assert.match(source, /timeoutMs=25_000/)
  assert.match(source, /startOfSpeechSensitivity:"START_SENSITIVITY_HIGH"/)
  assert.match(source, /endOfSpeechSensitivity:"END_SENSITIVITY_LOW"/)
  assert.match(source, /silenceDurationMs:600/)
  assert.doesNotMatch(source, /exactSpeech\.synthesize\(callMessages\.greeting\)/)
  assert.match(source, /resamplePcm\(pcm24, 24000, 8000\)/)
  assert.match(source, /resamplePcm\(pcm8k, 8000, 16000\)/)
  assert.match(source, /onAgentActivity\?\.\(pcm24\.length \/ 48\)/)
  assert.match(source, /streamingGuard\.push/)
  assert.match(source, /caller_transcription_received/)
  assert.match(source, /first_model_audio_received/)
  assert.match(source, /onClosingComplete\?\.\(\{ playbackDelayMs:completedAudioDurationMs \+ 150 \}\)/)
  assert.match(source, /acceptingCallerAudio = false/)
  assert.match(source, /if \(wrapUpMode\) closeAfterNextAgentTurn = true/)
  assert.match(source, /dispatchClosing\("105-second deadline"\)/)
  assert.match(source, /onConversationEndRequested:\(\) => closingDispatched \? close\("caller_requested_end"\) : dispatchClosing\("caller requested to end conversation"\)/)
  assert.match(source, /callerFarewellTimer = setTimeout\(\(\) => close\("caller_requested_end"\), 10_000\)/)
  assert.match(source, /caller_requested_end/)
  assert.match(source, /turnCompleteTimer = setTimeout\(\(\) => finishAgentTurn\(\), 150\)/)
  assert.match(source, /orderState\.status === "collecting" && !isOrderAffirmative/)
  assert.doesNotMatch(source, /!interrupted && orderState\.awaitingConfirmationTurn/)
})

test("extracts the nested SDK ErrorEvent transport details", () => {
  assert.deepEqual(
    describeGeminiLiveError({ type:"error", error:Object.assign(new Error("socket handshake failed"), { code:"ECONNRESET" }) }),
    { message:"socket handshake failed", name:"Error", code:"ECONNRESET", type:"error" }
  )
})

test("retries a Gemini session that closes before becoming ready", async () => {
  let attempts = 0
  let terminalCloses = 0
  const failedAttempts = []
  let activeCallbacks
  const expectedSession = { close() {} }
  const session = await openGeminiSessionWithRetry(
    { demoCallId:"call-retry", onClosed:() => { terminalCloses += 1 } },
    {
      timeoutMs:100,
      retryDelayMs:0,
      openSession:callbacks => {
        attempts += 1
        activeCallbacks = callbacks
        if (attempts === 1) {
          queueMicrotask(() => callbacks.onClosed())
          return new Promise(() => {})
        }
        return Promise.resolve(expectedSession)
      },
      onAttemptFailure:event => failedAttempts.push(event)
    }
  )

  assert.strictEqual(session, expectedSession)
  assert.equal(attempts, 2)
  assert.equal(failedAttempts.length, 1)
  assert.equal(terminalCloses, 0)
  activeCallbacks.onClosed()
  assert.equal(terminalCloses, 1)
})
