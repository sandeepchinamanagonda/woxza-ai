import test from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
  createGeminiRouteEmbeddingAdapter,
  createSemanticRouteIndex,
  adaptFullValueIntentCatalog,
  adaptOpeningPermissionScenarioCatalog,
  routeDocuments,
  validateSemanticRouteCatalog
} from "../src/demo/semantic-route-index.js"
import { loadSemanticIntentCatalog } from "../src/demo/semantic-intent-router.js"
import { createFullValueSemanticIndexService, createFullValueSemanticShadowService } from "../src/demo/full-value-semantic-index-service.js"
import { buildSemanticRouteContext } from "../src/demo/semantic-route-policy.js"

const catalog = () => ({
  schemaVersion:1,
  routes:[{
    id:"opening_permission", stage:"opening_permission_pending", enabled:true,
    outcomes:[
      { id:"accepted", action:"begin_discovery", examples:[{ text:"Sure, tell me.", language:"en" }] },
      { id:"declined", action:"polite_busy_close", examples:[{ text:"I am busy now.", language:"en" }] }
    ]
  }]
})

const fakeEmbedder = () => {
  const calls = { documents:0, queries:0 }
  const vector = text => /busy/i.test(text) ? [0, 1] : [1, 0]
  return { model:"fake-v1", calls, embedDocuments:async texts => { calls.documents += 1; return texts.map(vector) }, embedQueries:async texts => { calls.queries += 1; return texts.map(vector) } }
}

test("validates a reusable multi-route catalog", () => {
  assert.deepEqual(validateSemanticRouteCatalog(catalog()), { valid:true, errors:[] })
  const invalid = validateSemanticRouteCatalog({ schemaVersion:1, routes:[{ id:"x", outcomes:[{ id:"yes", action:"", examples:[] }] }] })
  assert.equal(invalid.valid, false)
  assert.ok(invalid.errors.some(error => error.includes("action is required")))
})

test("creates stable route documents with contextual envelopes", () => {
  const documents = routeDocuments(catalog())
  assert.equal(documents.length, 2)
  assert.match(documents[0].text, /Conversation stage: opening_permission_pending/)
  assert.match(documents[0].text, /Caller statement:/)
  assert.doesNotMatch(documents[0].text, /Outcome:|Action:/)
})

test("adapts the existing full-value catalog without modifying its source contract", () => {
  const source = loadSemanticIntentCatalog(new URL("../demo_prompts/full-value-explanation-intents.json", import.meta.url)).catalog
  const adapted = adaptFullValueIntentCatalog(source)
  assert.deepEqual(validateSemanticRouteCatalog(adapted), { valid:true, errors:[] })
  const [route] = adapted.routes
  assert.equal(route.id, "full_value_explanation")
  assert.deepEqual(route.eligibility, source.requiredContext)
  assert.equal(route.outcomes[0].action, "give_full_value_explanation")
  assert.equal(route.outcomes[1].action, "normal_response")
  assert.equal(routeDocuments(adapted).length, source.languages.reduce((total, language) => total + (language.positiveExamples.length + language.negativeExamples.length) * 2, 0))
})

test("adapts the reviewed Woxza opening scenarios into shadow-safe routes", () => {
  const source = JSON.parse(readFileSync(new URL("../demo_prompts/opening-permission-scenarios.json", import.meta.url), "utf8"))
  const adapted = adaptOpeningPermissionScenarioCatalog(source)
  assert.deepEqual(validateSemanticRouteCatalog(adapted), { valid:true, errors:[] })
  assert.deepEqual(adapted.routes.map(route => route.id), ["opening_first_reply", "opening_permission"])
  assert.equal(routeDocuments(adapted).length, 1_200)
  assert.deepEqual(adapted.routes[1].outcomes.map(outcome => [outcome.id, outcome.examples.length]), [
    ["grant_permission", 216], ["close_declined", 204], ["reassure_permission", 180]
  ])
})

test("persists vectors and only re-embeds changed catalog examples", async () => {
  const directory = mkdtempSync(join(tmpdir(), "semantic-route-index-"))
  const cachePath = join(directory, "index.json")
  const firstEmbedder = fakeEmbedder()
  const first = createSemanticRouteIndex({ catalog:catalog(), cachePath, embedder:firstEmbedder })
  const firstSync = await first.sync()
  assert.equal(firstSync.status, "ready"); assert.equal(firstSync.documentCount, 2); assert.equal(firstSync.embeddedDocumentCount, 2); assert.equal(firstSync.reusedDocumentCount, 0); assert.equal(firstSync.cachePath, cachePath); assert.match(firstSync.catalogHash, /^[a-f0-9]{64}$/); assert.equal(firstSync.schemaVersion, 1); assert.ok(firstSync.updatedAt)
  assert.equal(firstEmbedder.calls.documents, 1)
  const secondEmbedder = fakeEmbedder()
  const second = createSemanticRouteIndex({ catalog:catalog(), cachePath, embedder:secondEmbedder })
  const secondSync = await second.sync()
  assert.equal(secondSync.embeddedDocumentCount, 0); assert.equal(secondSync.reusedDocumentCount, 2); assert.equal(secondSync.catalogHash, firstSync.catalogHash)
  const changed = catalog(); changed.routes[0].outcomes[0].examples[0].text = "Yes, go ahead."
  const thirdEmbedder = fakeEmbedder()
  const third = createSemanticRouteIndex({ catalog:changed, cachePath, embedder:thirdEmbedder })
  const thirdSync = await third.sync()
  assert.equal(thirdSync.embeddedDocumentCount, 1); assert.equal(thirdSync.reusedDocumentCount, 1); assert.notEqual(thirdSync.catalogHash, firstSync.catalogHash)
  assert.equal(Object.keys(JSON.parse(readFileSync(cachePath, "utf8")).entries).length, 2)
})

test("searches a persisted index using a single query embedding", async () => {
  const directory = mkdtempSync(join(tmpdir(), "semantic-route-search-"))
  const embedder = fakeEmbedder()
  const index = createSemanticRouteIndex({ catalog:catalog(), cachePath:join(directory, "index.json"), embedder })
  await index.sync()
  const [match] = await index.search("I am busy, call later", { topK:1 })
  assert.equal(match.outcomeId, "declined")
  assert.equal(embedder.calls.queries, 1)
})

test("Gemini adapter batches and rejects incomplete responses", async () => {
  const requests = []
  const adapter = createGeminiRouteEmbeddingAdapter({ apiKey:"key", batchSize:2, fetchImpl:async (_url, init) => {
    const body = JSON.parse(init.body); requests.push(body.requests)
    return { ok:true, json:async () => ({ embeddings:body.requests.map((_request, index) => ({ values:[index + 1, 0] })) }) }
  } })
  assert.deepEqual(await adapter.embedDocuments(["one", "two", "three"]), [[1, 0], [2, 0], [1, 0]])
  assert.equal(requests.length, 2)
  const incomplete = createGeminiRouteEmbeddingAdapter({ apiKey:"key", fetchImpl:async () => ({ ok:true, json:async () => ({ embeddings:[] }) }) })
  await assert.rejects(() => incomplete.embedQueries(["one"]), /incomplete vectors/)
})

test("full-value index service syncs the existing catalog and reuses it on later runs", async () => {
  const directory = mkdtempSync(join(tmpdir(), "full-value-index-service-"))
  const catalogPath = new URL("../demo_prompts/full-value-explanation-intents.json", import.meta.url)
  const firstEmbedder = fakeEmbedder()
  const first = createFullValueSemanticIndexService({ catalogPath, cachePath:join(directory, "index.json"), embedder:firstEmbedder })
  const firstResult = await first.sync()
  assert.equal(firstResult.status, "ready")
  assert.ok(firstResult.embeddedDocumentCount > 0)
  const secondEmbedder = fakeEmbedder()
  const second = createFullValueSemanticIndexService({ catalogPath, cachePath:join(directory, "index.json"), embedder:secondEmbedder })
  const secondResult = await second.sync()
  assert.equal(secondResult.embeddedDocumentCount, 0)
  assert.equal(secondResult.reusedDocumentCount, firstResult.documentCount)
  assert.equal(secondEmbedder.calls.documents, 0)
})

test("full-value index service fails safely when its catalog or provider is unavailable", async () => {
  const missingCatalog = createFullValueSemanticIndexService({ catalogPath:"/not-a-real-catalog.json", cachePath:"/tmp/not-used.json", embedder:fakeEmbedder() })
  assert.equal((await missingCatalog.sync()).status, "catalog_unavailable")
  const missingProvider = createFullValueSemanticIndexService({ catalogPath:new URL("../demo_prompts/full-value-explanation-intents.json", import.meta.url), cachePath:"/tmp/not-used.json", embedder:null })
  assert.equal((await missingProvider.sync()).status, "embedding_unavailable")
})

test("shadow service warms a missing index without blocking a caller decision", async () => {
  const directory = mkdtempSync(join(tmpdir(), "full-value-shadow-service-"))
  const embedder = fakeEmbedder()
  const shadow = createFullValueSemanticShadowService({
    catalogPath:new URL("../demo_prompts/full-value-explanation-intents.json", import.meta.url),
    cachePath:join(directory, "index.json"),
    embedder
  })
  const context = buildSemanticRouteContext({
    callStage:"full_value_explanation_candidate",
    language:"te",
    callerText:"అవునా, ఎలా?",
    previousCallerText:"రోజూ కాల్స్ ఎక్కువగా వస్తాయి",
    previousAgentText:"Woxza ఆ పనిలో సహాయం చేయగలదు.",
    routeState:{ hasKnownBusinessPainPoint:true, recentAgentMentionedWoxzaHelp:true }
  })
  assert.deepEqual(await shadow.evaluate(context), {
    decision:"no_decision", reason:"index_warming", catalog_status:"ready", index_status:"missing_or_stale"
  })
  await shadow.warm()
  const decision = await shadow.evaluate(context)
  assert.equal(decision.catalog_status, "ready")
  assert.equal(decision.index_status, "ready")
  assert.equal(decision.decision, "no_decision")
  assert.ok(embedder.calls.documents >= 1)
})
