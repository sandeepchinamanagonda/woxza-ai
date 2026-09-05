import test from "node:test"
import assert from "node:assert/strict"
import { buildWoxzaConversationPrompt, createOpenRouterConversation } from "../src/demo/openrouter-conversation.js"

test("V3 conversation prompt keeps the behavioural Woxza contract", () => {
  const prompt = buildWoxzaConversationPrompt("en")
  assert.match(prompt, /Woxza Demo Guide/)
  assert.match(prompt, /Woxza's AI assistant/)
  assert.match(prompt, /at most one question/i)
  assert.match(prompt, /real conversation, not a discovery form/i)
  assert.match(prompt, /Never invent local facts/i)
  assert.match(prompt, /Instagram/i)
  assert.match(prompt, /Do not force a pitch, scenario, or completion path/i)
  assert.match(prompt, /pleasant, respectful, encouraging/i)
  assert.match(prompt, /do not praise, admire, or acknowledge every sentence/i)
  assert.match(prompt, /Never use empty generic praise/i)
  assert.match(prompt, /never end with an ellipsis or an unfinished phrase/i)
  assert.match(prompt, /Never say that you are English-only/i)
  assert.match(prompt, /CALL_STATE_JSON/)
  assert.match(prompt, /even if it was phrased differently/i)
})

test("V3 conversation prompt supports natural Telugu and English code-mixing", () => {
  const prompt = buildWoxzaConversationPrompt("te")
  assert.match(prompt, /active call language is Telugu/i)
  assert.match(prompt, /CALL_STATE_JSON\.language_policy is authoritative/i)
  assert.match(prompt, /Do not change the response language merely because a caller transcript or STT detection uses another language/i)
  assert.match(prompt, /Instagram, WhatsApp, leads, calls, DMs, or numbers/)
})

test("V3 conversation prompt prefers local speech over literal translated filler", () => {
  assert.match(buildWoxzaConversationPrompt("te"), /Prefer the natural phrase a Telugu speaker would actually say/i)
  assert.match(buildWoxzaConversationPrompt("te"), /Do not turn a natural local-language reply into English-shaped wording/i)
})

test("V2 disables model reasoning so private planning is never spoken", async () => {
  let request
  const client = createOpenRouterConversation({ apiKey:"test", fetchImpl:async (_url, options) => {
    request = JSON.parse(options.body)
    return new Response(JSON.stringify({ choices:[{ message:{ content:"Hello." } }], usage:{} }), { status:200 })
  } })
  await client.reply({ language:"en", history:[], callerText:"I run a shop." })
  assert.deepEqual(request.reasoning, { effort:"none", exclude:true })
  assert.equal(request.max_tokens, 56)
})

test("V2 retries its configured fallback model when the primary free route rejects", async () => {
  const requestedModels = []
  const client = createOpenRouterConversation({ apiKey:"test", model:"primary:free", fallbackModel:"fallback:free", fetchImpl:async (_url, options) => {
    requestedModels.push(JSON.parse(options.body).model)
    if (requestedModels.length === 1) return new Response("provider unavailable", { status:429 })
    return new Response(JSON.stringify({ choices:[{ message:{ content:"Hello." } }], usage:{} }), { status:200 })
  } })
  const reply = await client.reply({ language:"en", history:[], callerText:"I run a shop." })
  assert.deepEqual(requestedModels, ["primary:free", "fallback:free"])
  assert.equal(reply.model, "fallback:free")
})
