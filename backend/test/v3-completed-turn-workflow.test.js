import test from "node:test"
import assert from "node:assert/strict"
import { createServer } from "node:http"
import { once } from "node:events"
import WebSocket from "ws"
import { attachDemoV3StreamingBridge } from "../src/demo/v3-streaming-bridge.js"

const waitFor = async (predicate, timeout=1_000) => {
  const started = Date.now()
  while (!predicate()) {
    if (Date.now() - started > timeout) throw new Error("Timed out waiting for workflow result")
    await new Promise(resolve => setTimeout(resolve, 5))
  }
}

async function runWorkflow({ completeAudio=true }={}) {
  const transcriptRows = [], completedRows = [], events = []
  let transcriptId = 0, sttHandlers
  const client = {
    async query(sql, values=[]) {
      if (/INSERT INTO call_conversation_turns/.test(sql)) {
        const row = { id:completedRows.length + 1, turn_id:values[0], turn_sequence:values[2], caller_text:values[3], agent_text:values[4], language:values[5], language_policy:JSON.parse(values[6]) }
        completedRows.push(row)
        return { rows:[row] }
      }
      return { rows:[] }
    },
    release() {}
  }
  const db = {
    async query(sql, values=[]) {
      if (/SELECT id,language FROM demo_calls/.test(sql)) return { rows:[{ id:values[0], language:"en" }] }
      if (/FROM call_conversation_turns/.test(sql)) return { rows:[...completedRows].sort((a, b) => b.turn_sequence - a.turn_sequence).slice(0, values[1]).reverse() }
      if (/INSERT INTO call_transcript_turns/.test(sql)) {
        const row = { id:++transcriptId, created_at:new Date() }
        transcriptRows.push({ speaker:values[1], text:values[2], ...row })
        return { rows:[row] }
      }
      if (/INSERT INTO call_events/.test(sql)) events.push({ eventType:values[4], payload:JSON.parse(values[6]) })
      return { rows:[] }
    },
    async connect() { return client }
  }
  const stt = { async open(handlers) { sttHandlers = handlers; return { push() {}, close() {} } } }
  const tts = {
    provider:"fake-tts", model:"fake-tts",
    async open({ onAudio, onComplete }) {
      let sent = ""
      return {
        provider:"fake-tts", model:"fake-tts", language:"en", speaker:"test", pace:1.15, temperature:.7,
        async send(text) { sent += text; return text },
        flush() {
          if (!sent) return
          onAudio({ audio:Buffer.from([1]), contentType:"audio/x-l16", sampleRate:16_000, requestId:"tts-1" })
          if (completeAudio) onComplete({})
        },
        close() {}
      }
    }
  }
  const brain = {
    provider:"fake-brain", model:"fake-brain",
    async *replyStream() { yield { text:"That sounds useful." }; yield { completion:{ usage:{ promptTokenCount:10, candidatesTokenCount:5 } } } }
  }
  const server = createServer()
  attachDemoV3StreamingBridge(server, { db, stt, tts, sarvamTts:tts, brain })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const port = server.address().port
  let socket
  const connect = async () => {
    sttHandlers = undefined
    socket = new WebSocket(`ws://127.0.0.1:${port}/telephony/plivo/v3/stream?demoCallId=bc5547c6-1840-40e2-b35a-329e54ee0786&lang=en`)
    await once(socket, "open")
    await waitFor(() => Boolean(sttHandlers))
    return socket
  }
  await connect()
  const finish = async () => {
    if (socket.readyState === socket.OPEN) {
      socket.close()
      await once(socket, "close")
    }
    await new Promise(resolve => server.close(resolve))
  }
  return { get sttHandlers() { return sttHandlers }, completedRows, transcriptRows, events, connect, get socket() { return socket }, finish }
}

test("V3 workflow persists one pair only after TTS completes", async () => {
  const previous = { speakFirst:process.env.SPEAK_FIRST, turnControl:process.env.V3_TURN_CONTROL }
  process.env.SPEAK_FIRST = "false"
  process.env.V3_TURN_CONTROL = "hybrid"
  const workflow = await runWorkflow()
  try {
    workflow.sttHandlers.onFinal({ text:"I run a pharmacy.", languageCode:"en-IN", requestId:"stt-1", metrics:{} })
    await waitFor(() => workflow.completedRows.length === 1)
    assert.deepEqual({
      id:workflow.completedRows[0].id,
      turn_id:workflow.completedRows[0].turn_id,
      turn_sequence:workflow.completedRows[0].turn_sequence,
      caller_text:workflow.completedRows[0].caller_text,
      agent_text:workflow.completedRows[0].agent_text
    }, {
      id:1, turn_id:workflow.completedRows[0].turn_id, turn_sequence:1,
      caller_text:"I run a pharmacy.", agent_text:"That sounds useful."
    })
    assert.deepEqual(workflow.transcriptRows.map(row => row.speaker), ["caller", "agent"])
    assert.ok(workflow.events.some(event => event.eventType === "conversation_turn_persisted"))
  } finally {
    await workflow.finish()
    if (previous.speakFirst === undefined) delete process.env.SPEAK_FIRST; else process.env.SPEAK_FIRST = previous.speakFirst
    if (previous.turnControl === undefined) delete process.env.V3_TURN_CONTROL; else process.env.V3_TURN_CONTROL = previous.turnControl
  }
})

test("V3 workflow never persists an agent reply whose audio was interrupted", async () => {
  const previous = { speakFirst:process.env.SPEAK_FIRST, turnControl:process.env.V3_TURN_CONTROL }
  process.env.SPEAK_FIRST = "false"
  process.env.V3_TURN_CONTROL = "hybrid"
  const workflow = await runWorkflow({ completeAudio:false })
  try {
    workflow.sttHandlers.onFinal({ text:"I run a pharmacy.", languageCode:"en-IN", requestId:"stt-1", metrics:{} })
    await waitFor(() => workflow.transcriptRows.some(row => row.speaker === "agent"))
    // A second meaningful caller final performs the same barge-in cancellation
    // the real bridge uses; the first reply has audio but no TTS completion.
    workflow.sttHandlers.onFinal({ text:"Actually we use WhatsApp too.", languageCode:"en-IN", requestId:"stt-2", metrics:{} })
    await new Promise(resolve => setTimeout(resolve, 40))
    assert.equal(workflow.completedRows.length, 0)
    assert.ok(workflow.events.some(event => event.eventType === "conversation_turn_not_persisted"))
  } finally {
    await workflow.finish()
    if (previous.speakFirst === undefined) delete process.env.SPEAK_FIRST; else process.env.SPEAK_FIRST = previous.speakFirst
    if (previous.turnControl === undefined) delete process.env.V3_TURN_CONTROL; else process.env.V3_TURN_CONTROL = previous.turnControl
  }
})

test("V3 reconnect restores durable completed turns without replaying the greeting", async () => {
  const previous = { speakFirst:process.env.SPEAK_FIRST, turnControl:process.env.V3_TURN_CONTROL, resume:process.env.V3_STREAM_RESUME_ENABLED }
  process.env.SPEAK_FIRST = "true"
  process.env.V3_TURN_CONTROL = "hybrid"
  process.env.V3_STREAM_RESUME_ENABLED = "true"
  const workflow = await runWorkflow()
  try {
    // Initial greeting plus one completed exchange.
    await waitFor(() => workflow.events.some(event => event.eventType === "tts_usage"))
    workflow.sttHandlers.onFinal({ text:"I run a pharmacy.", languageCode:"en-IN", requestId:"stt-1", metrics:{} })
    await waitFor(() => workflow.completedRows.length === 1)
    workflow.socket.close()
    await once(workflow.socket, "close")

    await workflow.connect()
    // Resume is silent: the original opening must not be synthesized again.
    const welcomeUses = workflow.events.filter(event => event.eventType === "tts_usage" && event.payload.source === "agent_first_welcome")
    assert.equal(welcomeUses.length, 1)
    assert.ok(workflow.events.some(event => event.eventType === "stream_resumed" && event.payload.restored_turns === 1))

    workflow.sttHandlers.onFinal({ text:"We also use WhatsApp.", languageCode:"en-IN", requestId:"stt-2", metrics:{} })
    await waitFor(() => workflow.completedRows.length === 2)
    assert.equal(workflow.completedRows[1].turn_sequence, 2)
    assert.equal(workflow.completedRows[1].caller_text, "We also use WhatsApp.")
  } finally {
    await workflow.finish()
    if (previous.speakFirst === undefined) delete process.env.SPEAK_FIRST; else process.env.SPEAK_FIRST = previous.speakFirst
    if (previous.turnControl === undefined) delete process.env.V3_TURN_CONTROL; else process.env.V3_TURN_CONTROL = previous.turnControl
    if (previous.resume === undefined) delete process.env.V3_STREAM_RESUME_ENABLED; else process.env.V3_STREAM_RESUME_ENABLED = previous.resume
  }
})
