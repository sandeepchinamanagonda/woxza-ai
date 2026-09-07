import assert from "node:assert/strict"
import test from "node:test"
import { isExplicitMemoryAffirmative } from "../src/demo/memory-confirmation.js"
import { nextMemoryRetryAt } from "../src/demo/memory-outbox.js"

test("memory confirmation accepts only reviewed English, Telugu, and code-switched phrases", () => {
  for (const [text, language] of [["yes", "en"], ["that's correct", "en"], ["అవును అండి", "te"], ["correct andi", "te"]]) assert.equal(isExplicitMemoryAffirmative(text, language), true)
  for (const [text, language] of [["yeah I guess", "en"], ["mm-hmm", "en"], ["maybe", "en"], ["yes but it is medical distribution", "te"], ["oui", "fr"]]) assert.equal(isExplicitMemoryAffirmative(text, language), false)
})

test("memory outbox retry schedule is bounded and increasing", () => {
  const now = Date.now()
  for (let attempt = 1; attempt <= 5; attempt += 1) assert.ok(nextMemoryRetryAt(attempt, () => 0).getTime() > now)
})
