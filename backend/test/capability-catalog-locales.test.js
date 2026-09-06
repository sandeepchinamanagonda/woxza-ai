import test from "node:test"
import assert from "node:assert/strict"
import { readdir, readFile } from "node:fs/promises"
import { getCapabilityCatalog, getConversationIntentCatalog } from "../src/demo/capability-catalog.js"

const directory = new URL("../demo_prompts/capability-catalog.locales/", import.meta.url)
const supported = ["en", "es", "as", "bn", "gu", "hi", "kn", "ml", "mr", "pa", "ta", "te", "ur"]

test("ships one complete static capability locale for every supported call language", async () => {
  const files = (await readdir(directory)).filter(name => name.endsWith(".json")).sort()
  assert.deepEqual(files, supported.map(code => `${code}.json`).sort())
  const english = await getCapabilityCatalog("en")
  const expectedIds = english.map(record => record.id).sort()
  for (const code of supported) {
    const payload = JSON.parse(await readFile(new URL(`${code}.json`, directory), "utf8"))
    assert.equal(payload.language, code)
    assert.deepEqual(Object.keys(payload.records).sort(), expectedIds)
  }
})

test("keeps capability truth canonical while localizing caller-facing claims and match terms", async () => {
  const [english, telugu] = await Promise.all([getCapabilityCatalog("en"), getCapabilityCatalog("te")])
  const enOrders = english.find(record => record.id === "stock_aware_orders")
  const teOrders = telugu.find(record => record.id === "stock_aware_orders")
  assert.equal(teOrders.availability, enOrders.availability)
  assert.deepEqual(teOrders.requirements, enOrders.requirements)
  assert.ok(enOrders.callerImpact.includes("Customers"))
  assert.notEqual(teOrders.callerSafeClaim, enOrders.callerSafeClaim)
  assert.ok(teOrders.matches.workflowTerms.includes("ఆర్డర్"))
  assert.ok(teOrders.matches.workflowTerms.includes("order"))
})

test("ships one semantic intent definition independent of caller language", async () => {
  const intents = await getConversationIntentCatalog()
  assert.deepEqual(intents.map(item => item.id), ["explore_woxza_value"])
  assert.equal(intents[0].maximumFollowUpQuestions, 2)
})
