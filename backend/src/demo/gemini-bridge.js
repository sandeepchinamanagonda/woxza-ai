import { GoogleGenAI, Modality } from "@google/genai"
import { WebSocketServer } from "ws"
import { buildDemoPrompt, LANGUAGES } from "./prompt.js"

const EXPIRY_MINUTES = 10

function resamplePcm(input, sourceRate, targetRate) {
  if (sourceRate === targetRate) return Buffer.from(input)
  const source = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
  const sampleCount = Math.max(0, Math.floor(source.length * targetRate / sourceRate))
  const output = Buffer.alloc(sampleCount * 2)
  for (let index = 0; index < sampleCount; index += 1) {
    const position = index * sourceRate / targetRate
    const leftIndex = Math.floor(position)
    const left = source[leftIndex] || 0
    const right = source[Math.min(leftIndex + 1, source.length - 1)] || left
    output.writeInt16LE(Math.round(left + (right - left) * (position - leftIndex)), index * 2)
  }
  return output
}

// Twilio Media Streams use G.711 μ-law at 8 kHz. Keep this conversion at the
// provider boundary; Gemini always receives and emits signed 16-bit PCM here.
function muLawToPcm(input) {
  const output = Buffer.alloc(input.length * 2)
  for (let index = 0; index < input.length; index += 1) {
    const value = (~input[index]) & 0xff
    let sample = ((value & 0x0f) << 3) + 0x84
    sample <<= (value & 0x70) >> 4
    output.writeInt16LE((value & 0x80) ? 0x84 - sample : sample - 0x84, index * 2)
  }
  return output
}

function pcmToMuLaw(input) {
  const samples = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
  const output = Buffer.alloc(samples.length)
  for (let index = 0; index < samples.length; index += 1) {
    let sample = samples[index]
    const sign = sample < 0 ? 0x80 : 0
    if (sample < 0) sample = -sample
    sample = Math.min(32635, sample) + 0x84
    let exponent = 7
    for (let mask = 0x4000; exponent > 0 && !(sample & mask); mask >>= 1) exponent -= 1
    output[index] = (~(sign | (exponent << 4) | ((sample >> (exponent + 3)) & 0x0f))) & 0xff
  }
  return output
}

async function findDemoCall(db, demoCallId) {
  const result = await db.query(
    `SELECT id,use_case,name,language FROM demo_calls
     WHERE id=$1 AND created_at >= NOW() - INTERVAL '${EXPIRY_MINUTES} minutes' AND status IN ('ringing','connected')`,
    [demoCallId]
  )
  return result.rows[0] || null
}

function openGeminiSession({ socket, call, language, demoCallId, onAudio, onInterrupted }) {
  if (!process.env.GEMINI_API_KEY) throw new Error("Gemini is not configured")
  return buildDemoPrompt({ name:call.name, useCase:call.use_case, language }).then(async prompt => {
    const ai = new GoogleGenAI({ apiKey:process.env.GEMINI_API_KEY })
    return ai.live.connect({
      model:process.env.GEMINI_LIVE_MODEL || "gemini-3.1-flash-live-preview",
      config:{
        responseModalities:[Modality.AUDIO],
        systemInstruction:{ parts:[{ text:prompt }] },
        speechConfig:{ voiceConfig:{ prebuiltVoiceConfig:{ voiceName:process.env.GEMINI_DEMO_VOICE || "Kore" } } },
        inputAudioTranscription:{}, outputAudioTranscription:{}
      },
      callbacks:{
        onmessage(message) {
          const content = message.serverContent
          if (content?.interrupted) onInterrupted()
          for (const part of content?.modelTurn?.parts || []) {
            if (part.inlineData?.data && socket.readyState === 1) onAudio(Buffer.from(part.inlineData.data, "base64"))
          }
        },
        onerror(error) { console.error("Gemini Live demo bridge error", { demoCallId, error:error?.message || String(error) }) },
        onclose() { if (socket.readyState === 1) socket.close(1011, "Gemini Live closed") }
      }
    })
  })
}

export function attachDemoGeminiBridge(server, { db }) {
  const plivoWss = new WebSocketServer({ noServer:true })
  const twilioWss = new WebSocketServer({ noServer:true })
  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url, "http://localhost")
    const wss = url.pathname === "/telephony/plivo/stream" ? plivoWss : url.pathname === "/ws/twilio" ? twilioWss : null
    if (!wss) return
    wss.handleUpgrade(request, socket, head, ws => wss.emit("connection", ws, url))
  })

  plivoWss.on("connection", async (socket, url) => {
    const demoCallId = url.searchParams.get("demoCallId")
    const language = url.searchParams.get("lang") || "en"
    if (!demoCallId || !LANGUAGES.has(language)) return socket.close(1008, "Unknown demo call or language")
    let call
    try { call = await findDemoCall(db, demoCallId) } catch (error) { console.error("Plivo demo bridge lookup failed", error) }
    if (!call) return socket.close(1008, "Demo call not found or expired")
    let closed = false
    let session
    const close = () => { if (!closed) { closed=true; try { session?.close() } catch {}; try { socket.close() } catch {} } }
    try {
      session = await openGeminiSession({
        socket, call, language, demoCallId,
        onAudio:pcm24 => socket.send(JSON.stringify({ event:"playAudio", media:{ contentType:"audio/x-l16", sampleRate:16000, payload:resamplePcm(pcm24, 24000, 16000).toString("base64") } })),
        onInterrupted:() => socket.send(JSON.stringify({ event:"clearAudio" }))
      })
      socket.on("message", raw => {
        try {
          const event = JSON.parse(raw.toString())
          if (event.event === "stop") return close()
          if (event.event === "media" && event.media?.payload) session.sendRealtimeInput({ audio:{ data:event.media.payload, mimeType:"audio/pcm;rate=16000" } })
        } catch (error) { console.warn("Invalid Plivo demo stream event", { demoCallId, error:error.message }) }
      })
      socket.on("close", close)
      setTimeout(() => session?.sendRealtimeInput({ text:"The 90-second Voxa demo is ending. If the caller is speaking, let them finish their thought, then clearly say this demo is ending now and give a brief warm goodbye." }), 85_000).unref()
      console.info("Gemini Live Plivo demo bridge connected", { demoCallId, language })
    } catch (error) { console.error("Gemini Live Plivo bridge setup failed", { demoCallId, error:error.message }); close() }
  })

  twilioWss.on("connection", async (socket, url) => {
    // Twilio sends custom TwiML <Parameter> values in the `start` event, not
    // in the WebSocket URL. The query fallback supports local diagnostics.
    let demoCallId = url.searchParams.get("demoCallId")
    let language = url.searchParams.get("lang") || "en"
    let call
    let closed = false
    let streamSid = null
    let session
    let starting = false
    const queuedAudio = []
    const close = () => { if (!closed) { closed=true; try { session?.close() } catch {}; try { socket.close() } catch {} } }
    const forwardAudio = payload => {
      if (!session) return queuedAudio.length < 25 && queuedAudio.push(payload)
      const pcm16k = resamplePcm(muLawToPcm(Buffer.from(payload, "base64")), 8000, 16000)
      session.sendRealtimeInput({ audio:{ data:pcm16k.toString("base64"), mimeType:"audio/pcm;rate=16000" } })
    }
    const begin = async event => {
      if (starting || session) return
      starting = true
      streamSid = event.start?.streamSid || event.streamSid || null
      const parameters = event.start?.customParameters || {}
      demoCallId = parameters.demoCallId || demoCallId
      language = parameters.lang || language
      if (!demoCallId || !LANGUAGES.has(language)) return close()
      try { call = await findDemoCall(db, demoCallId) } catch (error) { console.error("Twilio demo bridge lookup failed", error) }
      if (!call) return close()
      try {
        session = await openGeminiSession({
          socket, call, language, demoCallId,
          onAudio:pcm24 => {
            if (!streamSid || socket.readyState !== 1) return
            const mulaw = pcmToMuLaw(resamplePcm(pcm24, 24000, 8000))
            socket.send(JSON.stringify({ event:"media", streamSid, media:{ payload:mulaw.toString("base64") } }))
          },
          onInterrupted:() => { if (streamSid) socket.send(JSON.stringify({ event:"clear", streamSid })) }
        })
        for (const payload of queuedAudio.splice(0)) forwardAudio(payload)
        setTimeout(() => session?.sendRealtimeInput({ text:"The 90-second Voxa demo is ending. If the caller is speaking, let them finish their thought, then clearly say this demo is ending now and give a brief warm goodbye." }), 85_000).unref()
        console.info("Gemini Live Twilio demo bridge connected", { demoCallId, language })
      } catch (error) { console.error("Gemini Live Twilio bridge setup failed", { demoCallId, error:error.message }); close() }
    }
    const startTimeout = setTimeout(() => close(), 10_000)
    socket.on("message", raw => {
      try {
        const event = JSON.parse(raw.toString())
        if (event.event === "start") { clearTimeout(startTimeout); void begin(event); return }
        if (event.event === "stop") return close()
        if (event.event === "media" && event.media?.payload) forwardAudio(event.media.payload)
      } catch (error) { console.warn("Invalid Twilio demo stream event", { demoCallId, error:error.message }) }
    })
    socket.on("close", () => { clearTimeout(startTimeout); close() })
  })
  return { plivoWss, twilioWss }
}
