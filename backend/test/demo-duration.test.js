import assert from "node:assert/strict"
import test from "node:test"
import { readFile } from "node:fs/promises"
test("Plivo demo calls have no provider-enforced 120-second limit", async () => {
  const source = await readFile(new URL("../src/demo/plivo.js", import.meta.url), "utf8")
  assert.doesNotMatch(source, /time_limit/)
})
