import test from "node:test"
import assert from "node:assert/strict"
import { buildWoxzaConversationPrompt, createOpenRouterConversation } from "../src/demo/openrouter-conversation.js"

test("V3 conversation prompt keeps the behavioural Woxza contract", () => {
  const prompt = buildWoxzaConversationPrompt("en")
  assert.match(prompt, /Woxza Demo Guide/)
  assert.match(prompt, /You are Woxza, an AI assistant/)
  assert.match(prompt, /at most one question/i)
  assert.match(prompt, /real conversation, not a discovery form/i)
  assert.match(prompt, /Never invent local facts/i)
  assert.match(prompt, /Instagram/i)
  assert.match(prompt, /Do not force a pitch, scenario, or completion path/i)
  assert.match(prompt, /pleasant, respectful, encouraging/i)
  assert.match(prompt, /Plain operational facts such as hours, counts, durations, schedules, or names are things you quietly note and use/i)
  assert.match(prompt, /Never use empty generic praise/i)
  assert.match(prompt, /never end with an ellipsis or an unfinished phrase/i)
  assert.match(prompt, /Questions are optional, not a requirement for every turn/i)
  assert.match(prompt, /never the caller's task and never a checklist to complete/i)
  assert.match(prompt, /Do not move through business type, location, channels, team, pain, or goals in a fixed order/i)
  assert.match(prompt, /Reacting Like a Person, Not a Form/i)
  assert.match(prompt, /A human never opens a reply by handing someone's own sentence back to them/i)
  assert.match(prompt, /These seven are illustrations of a pattern, not a script to reuse verbatim/i)
  assert.match(prompt, /never repeats the fact itself/i)
  assert.match(prompt, /Never say that you are English-only/i)
  assert.match(prompt, /CALL_STATE_JSON/)
  assert.match(prompt, /do not fold the fact itself back in, even partially/i)
  assert.match(prompt, /most facts don't need a spoken reaction at all/i)
  assert.match(prompt, /Giving the Full Picture/i)
  assert.match(prompt, /six to seven short, concrete sentences/i)
  assert.match(prompt, /Not Repeating Yourself Either/i)
  assert.match(prompt, /Do not open replies with "అవును," "yes," "sure,"/i)
  assert.match(prompt, /Before You Reply, Check/i)
  assert.match(prompt, /Does it repeat back a list of items the caller just gave/i)
  assert.match(prompt, /Handling Unclear or Incomplete Input/i)
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

test("V3 discovery avoids a fixed interview while retaining facts silently", () => {
  const prompt = buildWoxzaConversationPrompt("te")
  assert.match(prompt, /Questions are optional, not a requirement for every turn/i)
  assert.match(prompt, /Do not move through business type, location, channels, team, pain, or goals in a fixed order/i)
  assert.match(prompt, /If the caller says "I already told you" or asks why you are asking, address that concern first/i)
  assert.match(prompt, /remember it silently/i)
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
