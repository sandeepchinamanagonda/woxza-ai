import test from "node:test"
import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createPcmSpeechDetector, createStreamingPcmResampler, resamplePcm, swapPcm16Endianness } from "../src/demo/audio-codec.js"
import { advanceScopeRedirect, containsOrderConfirmation, createCallerSilenceMonitor, createDemoOrderState, createPacedMuLawWriter, createScopeRedirectState, decodePlivoInboundAudio, describeGeminiLiveError, geminiCapacityRetryDelay, isConversationEndRequest, isGeminiCapacityClose, isOrderAffirmative, isOrderCorrection, isPostOrderActionQuestion, isSimpleGreeting, looksLikeOrderConfirmationQuestion, openGeminiSessionWithRetry } from "../src/demo/gemini-bridge.js"

test("converts PCM samples between little-endian and L16 network byte order", () => {
  const littleEndian = Buffer.from([0x34, 0x12, 0xfe, 0xff, 0x00, 0x80])
  const l16 = swapPcm16Endianness(littleEndian)

  assert.deepEqual(l16, Buffer.from([0x12, 0x34, 0xff, 0xfe, 0x80, 0x00]))
  assert.deepEqual(swapPcm16Endianness(l16), littleEndian)
})

test("decodes Plivo L16 input with its configured byte order to the PCM Gemini requires", () => {
  const l16NetworkOrder = Buffer.from([0x12, 0x34, 0xff, 0xfe]).toString("base64")
  assert.deepEqual(decodePlivoInboundAudio(l16NetworkOrder, "audio/x-l16;rate=16000", "big"), Buffer.from([0x34, 0x12, 0xfe, 0xff]))
  assert.deepEqual(decodePlivoInboundAudio(l16NetworkOrder, "audio/x-l16;rate=16000", "little"), Buffer.from([0x12, 0x34, 0xff, 0xfe]))
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

test("starts the caller-first welcome only after a short standalone greeting", () => {
  assert.equal(isSimpleGreeting("Hello."), true)
  assert.equal(isSimpleGreeting("నమస్కారం"), true)
  assert.equal(isSimpleGreeting("Hello, I run a saree shop"), false)
  assert.equal(isSimpleGreeting("హలో, మా షాపులో స్టాక్ ఉందా అని అడుగుతారు"), false)
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

test("recognizes explicit English and Telugu order corrections without treating a follow-up question as a correction", () => {
  for (const text of ["That is wrong", "tappu tappu", "తప్పు", "गलत है"]) assert.equal(isOrderCorrection(text), true, text)
  assert.equal(isOrderCorrection("Please confirm the order"), false)
  assert.equal(isOrderCorrection("కాదు మీరు ధర తెలుసుకున్నాక నాకు ఫోన్ చేయగలరా?"), false)
})

test("recognizes callback and price follow-up questions after a confirmed order", () => {
  for (const text of ["Can you call me back after checking the price?", "మీరు ధర తెలుసుకున్నాక నాకు ఫోన్ చేయగలరా?"]) {
    assert.equal(isPostOrderActionQuestion(text), true, text)
  }
  assert.equal(isPostOrderActionQuestion("Please confirm the order"), false)
})

test("detects explicit caller farewells without treating a simple thank-you as a hangup", () => {
  for (const farewell of ["Bye", "Goodbye, that's all", "Please end the call", "No thanks, I'm done", "Adiós", "వీడ్కోలు", "बस इतना", "விடைபெறுகிறேன்"]) {
    assert.equal(isConversationEndRequest(farewell), true, farewell)
  }
  for (const continuing of ["Thanks, can you tell me more?", "Can you disconnect the feature from my account?", "I need nothing more than an appointment tomorrow"]) {
    assert.equal(isConversationEndRequest(continuing), false, continuing)
  }
})

test("legacy scope helper remains isolated from the conversational prompt", async () => {
  const state = createScopeRedirectState()
  const result = advanceScopeRedirect(state, { language:"en", currentUseCase:"order_taking", category:"general", ending:"ENDING" })
  assert.equal(result.action, "set_boundary")
  const source = await readFile(new URL("../src/demo/prompt.js", import.meta.url), "utf8")
  assert.doesNotMatch(source, /OUT-OF-SCOPE HANDLING/)
  assert.match(source, /never redirect or penalize them/)
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
  assert.match(source, /isAppointmentBooking\(\) && appointmentToolRequired/)
  assert.match(source, /name:"start_workflow"/)
  assert.match(source, /name:"resolve_action_capability"/)
  assert.match(source, /speech before the required backend appointment transition/)
  assert.match(source, /timeoutMs=25_000/)
  assert.match(source, /startOfSpeechSensitivity:"START_SENSITIVITY_HIGH"/)
  assert.match(source, /endOfSpeechSensitivity:"END_SENSITIVITY_LOW"/)
  assert.match(source, /silenceDurationMs:600/)
  assert.doesNotMatch(source, /exactSpeech\.synthesize\(callMessages\.greeting\)/)
  assert.match(source, /resamplePcm\(pcm24, 24000, 8000\)/)
  assert.match(source, /decodePlivoInboundAudio\(event\.media\.payload, streamContentType, l16ByteOrder\)/)
  assert.match(source, /first_plivo_media_received/)
  assert.match(source, /voice-call-media-summary/)
  assert.match(source, /onAgentActivity\?\.\(pcm24\.length \/ 48\)/)
  assert.match(source, /streamingGuard\.push/)
  assert.match(source, /caller_transcription_received/)
  assert.match(source, /first_model_audio_received/)
  assert.match(source, /onClosingComplete\?\.\(\{ playbackDelayMs:completedAudioDurationMs \+ 150 \}\)/)
  assert.match(source, /acceptingCallerAudio = false/)
  assert.match(source, /Do not cut an active workflow short/)
  assert.doesNotMatch(source, /105-second deadline|hard_cutoff/)
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

test("backs off with jitter only for Gemini capacity closures", () => {
  assert.equal(isGeminiCapacityClose({ code:1011, reason:"Resource has been exhausted (e.g. check quota)." }), true)
  assert.equal(isGeminiCapacityClose({ code:1011, reason:"normal websocket shutdown" }), false)
  assert.equal(isGeminiCapacityClose({ code:1000, reason:"Resource has been exhausted" }), false)
  assert.equal(geminiCapacityRetryDelay(0, () => 0.5), 1_500)
  assert.equal(geminiCapacityRetryDelay(2, () => 0.5), 4_500)
  assert.equal(geminiCapacityRetryDelay(8, () => 1), 16_000)
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
