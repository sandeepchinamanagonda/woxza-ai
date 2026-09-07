import test from "node:test"
import assert from "node:assert/strict"
import { buildWoxzaLanguagePolicy } from "../src/demo/language-policy.js"
import { buildWoxzaConversationPrompt } from "../src/demo/openrouter-conversation.js"

test("Telugu policy prioritises local spoken register without a translation rewrite", () => {
  const policy = buildWoxzaLanguagePolicy("te")
  assert.match(policy, /everyday Telugu/)
  assert.match(policy, /Do not translate every English word/)
  assert.match(policy, /numbers in the form the caller uses/)
})

test("every V3 brain receives the shared local-language policy in its prompt", () => {
  const prompt = buildWoxzaConversationPrompt("hi")
  assert.match(prompt, /Local-language policy/)
  assert.match(prompt, /everyday Hindi/)
  assert.match(prompt, /Do not translate every English word/)
})
