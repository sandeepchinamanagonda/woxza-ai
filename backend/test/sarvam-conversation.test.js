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
  assert.match(request.messages[0].content, /complete, useful first clause/)
  assert.equal(reply.provider, "sarvam-conversations")
})

test("Sarvam Conversations accepts a language-specific response ceiling", async () => {
  let request
  const original = process.env.VOICE_RESPONSE_MAX_TOKENS_TE
  process.env.VOICE_RESPONSE_MAX_TOKENS_TE = "80"
  try {
    const client = createSarvamConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
      request = JSON.parse(options.body)
      return new Response(JSON.stringify({ choices:[{ message:{ content:"సరే." } }] }), { status:200 })
    } })
    await client.reply({ language:"te", history:[], callerText:"హలో" })
    assert.equal(request.max_tokens, 80)
  } finally {
    if (original === undefined) delete process.env.VOICE_RESPONSE_MAX_TOKENS_TE
    else process.env.VOICE_RESPONSE_MAX_TOKENS_TE = original
  }
})
