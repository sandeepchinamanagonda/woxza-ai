import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
import { DEMO_CUTOFF_MS, DEMO_CUTOFF_SECONDS, DEMO_WARNING_MS } from "../src/demo/service.js"

test("demo warns near 105 seconds and hard-stops at 120 seconds", () => {
  assert.ok(DEMO_WARNING_MS >= 100_000 && DEMO_WARNING_MS <= 105_000)
  assert.equal(DEMO_CUTOFF_MS, 120_000)
  assert.equal(DEMO_CUTOFF_SECONDS, 120)
})

test("Plivo receives the same 120-second hard limit", async () => {
  const source = await readFile(new URL("../src/demo/plivo.js", import.meta.url), "utf8")
  assert.match(source, /time_limit:"120"/)
  assert.doesNotMatch(source, /time_limit:"95"/)
})
