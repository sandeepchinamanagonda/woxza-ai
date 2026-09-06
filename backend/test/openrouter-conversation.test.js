import test from "node:test"
import assert from "node:assert/strict"
import { buildWoxzaConversationPrompt } from "../src/demo/openrouter-conversation.js"

test("conversation contract makes questions optional and purpose-led", () => {
  const prompt = buildWoxzaConversationPrompt("en")
  assert.match(prompt, /The caller's immediate purpose comes first/u)
  assert.match(prompt, /Question gate: by default, end your turn without a question/u)
  assert.match(prompt, /Ask at most one, and only when/u)
  assert.match(prompt, /A direct answer is complete even when it ends without a question/u)
  assert.match(prompt, /Natural pause or close/u)
  assert.doesNotMatch(prompt, /one brief acknowledgement and one useful question/u)
})

test("conversation contract preserves direct answers, clarification, and grounded acknowledgement", () => {
  const prompt = buildWoxzaConversationPrompt("te")
  assert.match(prompt, /Direct answer: answer a direct question or request first/u)
  assert.match(prompt, /Clarification: when the meaning is genuinely unclear/u)
  assert.match(prompt, /acknowledge only a meaningful new effort, constraint, or pain point/u)
  assert.match(prompt, /never a recitation of their sentence/u)
  assert.match(prompt, /capability_context is the only source for product-specific claims/u)
  assert.match(prompt, /Never state that the caller's system is connected/u)
  assert.match(prompt, /never say "after hours" or "automatically updates the CRM"/u)
  assert.match(prompt, /completed background semantic assessment/u)
  assert.match(prompt, /not a phrase matcher/u)
  assert.match(prompt, /two or three compact, complete benefit sentences/u)
})
