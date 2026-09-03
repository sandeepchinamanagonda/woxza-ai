import test from "node:test"
import assert from "node:assert/strict"
import { createOpenAiConversation } from "../src/demo/openai-conversation.js"

test("OpenAI V3 adapter streams caller-facing text with compact call memory", async () => {
  let request
  const client = createOpenAiConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response('data: {"choices":[{"delta":{"content":"నమస్కారం, "}}]}\n\ndata: {"choices":[{"delta":{"content":"ఎలా సహాయం చేయగలను?"}}]}\n\ndata: [DONE]\n\n', { status:200 })
  } })
  const chunks = []
  for await (const chunk of client.replyStream({ language:"te", history:[], callerText:"హలో", memory:{ turns:[] } })) chunks.push(chunk.text)
  assert.equal(request.model, "gpt-4.1-mini")
  assert.equal(request.stream, true)
  assert.equal(request.max_tokens, 64)
  assert.match(request.messages[0].content, /CALL_STATE_JSON/)
  assert.deepEqual(chunks, ["నమస్కారం, ", "ఎలా సహాయం చేయగలను?"])
})
