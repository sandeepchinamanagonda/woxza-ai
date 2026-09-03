import test from "node:test"
import assert from "node:assert/strict"
import { createAnthropicConversation } from "../src/demo/anthropic-conversation.js"

test("Anthropic V3 adapter streams caller-facing text with compact call memory", async () => {
  let request
  const client = createAnthropicConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response('event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"నమస్కారం, "}}\n\nevent: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"ఎలా సహాయం చేయగలను?"}}\n\n', { status:200 })
  } })
  const chunks = []
  for await (const chunk of client.replyStream({ language:"te", history:[], callerText:"హలో", memory:{ turns:[] } })) chunks.push(chunk.text)
  assert.equal(request.model, "claude-sonnet-4-6")
  assert.equal(request.stream, true)
  assert.equal(request.max_tokens, 64)
  assert.match(request.system, /CALL_STATE_JSON/)
  assert.deepEqual(chunks, ["నమస్కారం, ", "ఎలా సహాయం చేయగలను?"])
})
