import test from "node:test"
import assert from "node:assert/strict"
import { createGeminiConversation } from "../src/demo/gemini-conversation.js"

test("V3 Gemini is a text-only stream with thinking disabled and final usage telemetry", async () => {
  let request
  const sse = [
    'data: {"candidates":[{"content":{"parts":[{"text":"Hello there."}]}}]}',
    'data: {"candidates":[{"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":100,"candidatesTokenCount":8,"totalTokenCount":108}}'
  ].join("\n\n")
  const client = createGeminiConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(sse, { status:200 })
  } })
  const events = []
  for await (const event of client.replyStream({ language:"en", history:[{ role:"assistant", content:"Welcome." }], callerText:"I run a shop.", memory:{ opening_delivered:true, turns:[] } })) events.push(event)
  assert.equal(request.generationConfig.thinkingConfig.thinkingBudget, 0)
  assert.equal(request.generationConfig.maxOutputTokens, 56)
  assert.equal(request.contents.length, 1)
  assert.deepEqual(request.contents.at(-1), { role:"user", parts:[{ text:"I run a shop." }] })
  assert.equal(events[0].text, "Hello there.")
  assert.deepEqual(events.at(-1).completion, { usage:{ promptTokenCount:100, candidatesTokenCount:8, totalTokenCount:108 }, stopReason:"STOP" })
})

test("repair stream asks for a self-contained replacement using its own small budget", async () => {
  let request
  const sse = 'data: {"candidates":[{"content":{"parts":[{"text":"A complete replacement."}]},"finishReason":"STOP"}]}'
  const client = createGeminiConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(sse, { status:200 })
  } })
  const events = []
  for await (const event of client.repairStream({ language:"te", history:[{ role:"user", content:"How can you help?" }], callerText:"How can you help?", memory:{}, draft:"An unfinished answer", signal:undefined })) events.push(event)
  assert.equal(request.generationConfig.maxOutputTokens, 112)
  assert.match(request.contents.at(-1).parts[0].text, /self-contained answer/u)
  assert.equal(events[0].text, "A complete replacement.")
})
