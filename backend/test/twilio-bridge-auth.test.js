import assert from "node:assert/strict"
import { createServer } from "node:http"
import test from "node:test"
import WebSocket from "ws"
import { attachDemoGeminiBridge } from "../src/demo/gemini-bridge.js"

async function connectWithQuery({ nodeEnv }) {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = nodeEnv
  let lookups = 0
  const db = { async query() { lookups += 1; return { rows:[] } } }
  const server = createServer()
  attachDemoGeminiBridge(server, { db })
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  const url = `ws://127.0.0.1:${server.address().port}/ws/twilio?demoCallId=query-only&lang=en`
  try {
    await new Promise((resolve, reject) => {
      const socket = new WebSocket(url)
      socket.once("open", () => socket.send(JSON.stringify({ event:"start", start:{ streamSid:"stream-1", customParameters:{} } })))
      socket.once("close", resolve)
      socket.once("error", reject)
    })
    return lookups
  } finally {
    await new Promise(resolve => server.close(resolve))
    process.env.NODE_ENV = previous
  }
}

test("production Twilio bridge ignores query-string demoCallId", async () => {
  assert.equal(await connectWithQuery({ nodeEnv:"production" }), 0)
})

test("non-production Twilio bridge retains query-string diagnostic fallback", async () => {
  assert.equal(await connectWithQuery({ nodeEnv:"test" }), 1)
})
