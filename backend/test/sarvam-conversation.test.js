import test from "node:test"
import assert from "node:assert/strict"
import { createSarvamConversation } from "../src/demo/sarvam-conversation.js"

test("Sarvam Conversations disables thinking for short phone replies", async () => {
  let request
  const client = createSarvamConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(JSON.stringify({ model:"sarvam-105b-conversations", choices:[{ message:{ content:"నమస్కారం." } }], usage:{} }), { status:200 })
  } })
  const reply = await client.reply({ language:"te", history:[], callerText:"హలో" })
  assert.equal(request.model, "sarvam-105b-conversations")
  assert.equal(request.reasoning_effort, null)
  assert.equal(request.stream, false)
  assert.equal(request.max_tokens, 64)
  assert.equal(reply.provider, "sarvam-conversations")
})

test("Sarvam Conversations accepts a language-specific response ceiling", async () => {
  let request
  const original = process.env.SARVAM_CHAT_MAX_TOKENS_TE
  process.env.SARVAM_CHAT_MAX_TOKENS_TE = "80"
  try {
    const client = createSarvamConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
      request = JSON.parse(options.body)
      return new Response(JSON.stringify({ choices:[{ message:{ content:"సరే." } }] }), { status:200 })
    } })
    await client.reply({ language:"te", history:[], callerText:"హలో" })
    assert.equal(request.max_tokens, 80)
  } finally {
    if (original === undefined) delete process.env.SARVAM_CHAT_MAX_TOKENS_TE
    else process.env.SARVAM_CHAT_MAX_TOKENS_TE = original
  }
})

test("Sarvam Conversations uses the selected call language for its system prompt", async () => {
  let request
  const client = createSarvamConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response("data: [DONE]\n\n", { status:200 })
  } })
  const stream = client.replyStream({ language:"te", history:[], callerText:"Let's discuss my business", memory:{} })
  for await (const _chunk of stream) { /* consume stream */ }
  assert.match(request.messages[0].content, /selected spoken language is Telugu/)
  assert.match(request.messages[0].content, /Always reply in that language/)
})
