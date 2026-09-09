import { createHash } from "node:crypto"
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"

export const SEMANTIC_ROUTE_CATALOG_SCHEMA_VERSION = 1
export const SEMANTIC_ROUTE_INDEX_SCHEMA_VERSION = 1

const asText = value => String(value || "").trim()
const hash = value => createHash("sha256").update(value).digest("hex")
const stableJson = value => JSON.stringify(value, (_key, nested) => {
  if (!nested || Array.isArray(nested) || typeof nested !== "object") return nested
  return Object.fromEntries(Object.entries(nested).sort(([left], [right]) => left.localeCompare(right)))
})
const validExample = example => example && typeof example === "object" && asText(example.text)
const validVector = vector => Array.isArray(vector) && vector.length > 0 && vector.every(value => Number.isFinite(value))

export function validateSemanticRouteCatalog(value) {
  const errors = []
  if (!value || typeof value !== "object") return { valid:false, errors:["catalog must be an object"] }
  if (value.schemaVersion !== SEMANTIC_ROUTE_CATALOG_SCHEMA_VERSION) errors.push(`schemaVersion must be ${SEMANTIC_ROUTE_CATALOG_SCHEMA_VERSION}`)
  if (!Array.isArray(value.routes) || value.routes.length === 0) errors.push("routes must be a non-empty array")
  const routeIds = new Set()
  for (const route of value.routes || []) {
    const routeId = asText(route?.id)
    if (!routeId) errors.push("route id is required")
    else if (routeIds.has(routeId)) errors.push(`duplicate route id: ${routeId}`)
    else routeIds.add(routeId)
    if (route?.enabled !== undefined && typeof route.enabled !== "boolean") errors.push(`${routeId || "route"}: enabled must be boolean`)
    if (!Array.isArray(route?.outcomes) || route.outcomes.length === 0) errors.push(`${routeId || "route"}: outcomes must be a non-empty array`)
    const outcomeIds = new Set()
    for (const outcome of route?.outcomes || []) {
      const outcomeId = asText(outcome?.id)
      if (!outcomeId) errors.push(`${routeId || "route"}: outcome id is required`)
      else if (outcomeIds.has(outcomeId)) errors.push(`${routeId || "route"}: duplicate outcome id: ${outcomeId}`)
      else outcomeIds.add(outcomeId)
      if (!asText(outcome?.action)) errors.push(`${routeId || "route"}.${outcomeId || "outcome"}: action is required`)
      if (!Array.isArray(outcome?.examples) || outcome.examples.length === 0) errors.push(`${routeId || "route"}.${outcomeId || "outcome"}: examples must be a non-empty array`)
      for (const example of outcome?.examples || []) {
        if (!validExample(example)) errors.push(`${routeId || "route"}.${outcomeId || "outcome"}: example requires text`)
        if (example?.language !== undefined && !asText(example.language)) errors.push(`${routeId || "route"}.${outcomeId || "outcome"}: example language must be text`)
      }
    }
    if (route?.decision !== undefined) {
      const decision = route.decision
      if (!decision || typeof decision !== "object") errors.push(`${routeId || "route"}: decision must be an object`)
      else {
        const outcomeIds = new Set((route.outcomes || []).map(outcome => asText(outcome?.id)))
        if (!Array.isArray(decision.actionOutcomeIds) || decision.actionOutcomeIds.length === 0) errors.push(`${routeId || "route"}: decision.actionOutcomeIds must be a non-empty array`)
        for (const outcomeId of decision.actionOutcomeIds || []) if (!outcomeIds.has(asText(outcomeId))) errors.push(`${routeId || "route"}: decision references unknown outcome: ${asText(outcomeId) || "(missing)"}`)
        for (const field of ["minimumScore", "minimumNegativeMargin", "minimumCompetingMargin"]) {
          if (decision[field] !== undefined && (!Number.isFinite(decision[field]) || decision[field] < -1 || decision[field] > 1)) errors.push(`${routeId || "route"}: decision.${field} must be between -1 and 1`)
        }
        if (decision.aggregateTopK !== undefined && (!Number.isInteger(decision.aggregateTopK) || decision.aggregateTopK < 1 || decision.aggregateTopK > 10)) errors.push(`${routeId || "route"}: decision.aggregateTopK must be an integer from 1 to 10`)
      }
    }
  }
  return { valid:errors.length === 0, errors }
}

export function loadSemanticRouteCatalog(path) {
  try {
    const catalog = JSON.parse(readFileSync(path, "utf8"))
    const validation = validateSemanticRouteCatalog(catalog)
    return validation.valid ? { status:"ready", catalog, ...validation } : { status:"invalid", catalog:null, ...validation }
  } catch (error) {
    return { status:error?.code === "ENOENT" ? "missing" : "unreadable", catalog:null, valid:false, errors:[error.message] }
  }
}

// The existing full-value catalog is the source of truth for that route. This
// adapter keeps it intact while allowing the multi-route index to consume its
// multilingual positive and negative examples.
export function adaptFullValueIntentCatalog(catalog) {
  if (!catalog || catalog.intent !== "full_value_explanation" || !Array.isArray(catalog.languages)) {
    throw new Error("Expected a full_value_explanation intent catalog")
  }
  const examplesFor = type => catalog.languages.flatMap(language => (language[`${type}Examples`] || []).flatMap(example => {
    const languageCode = asText(language.languageCode)
    return [example.text, example.romanized_text].filter(value => asText(value)).map(text => ({ text:asText(text), language:languageCode }))
  }))
  return {
    schemaVersion:SEMANTIC_ROUTE_CATALOG_SCHEMA_VERSION,
    routes:[{
      id:"full_value_explanation",
      stage:"full_value_explanation_candidate",
      enabled:true,
      eligibility:catalog.requiredContext || {},
      decision:{ actionOutcomeIds:["matched"], minimumScore:0.75, minimumNegativeMargin:0.10, minimumCompetingMargin:0.05, aggregateTopK:3 },
      outcomes:[
        { id:"matched", action:"give_full_value_explanation", examples:examplesFor("positive") },
        { id:"no_match", action:"normal_response", examples:examplesFor("negative") }
      ]
    }]
  }
}

// Gemini-generated opening scenarios are stored in their review-friendly
// format. This adapter makes them consumable by the reusable index without
// mixing control-only cases (identity, repeat, privacy, etc.) into a route
// that could ever grant permission.
export function adaptOpeningPermissionScenarioCatalog(catalog) {
  const requiredLanguages = ["en", "te", "hi", "ta", "kn", "ml", "mr", "gu", "bn", "as", "pa", "ur"]
  if (!catalog || catalog.schemaVersion !== 1 || catalog.product !== "Woxza" || !Array.isArray(catalog.languages) || !Array.isArray(catalog.stages)) {
    throw new Error("Expected a Woxza opening permission scenario catalog")
  }
  if (JSON.stringify([...catalog.languages].sort()) !== JSON.stringify([...requiredLanguages].sort())) throw new Error("Opening permission catalog must contain exactly the supported languages")
  const expected = new Map([
    ["first_reply_after_greeting", new Map([["ask_permission", 42], ["close_declined", 8]])],
    ["permission_pending", new Map([["grant_permission", 18], ["close_declined", 17], ["reassure_permission", 15]])]
  ])
  const routes = []
  for (const stage of catalog.stages) {
    const outcomeCounts = expected.get(stage?.stage)
    if (!outcomeCounts || !Array.isArray(stage.scenarios) || stage.scenarios.length !== 50) throw new Error(`Invalid opening permission stage: ${asText(stage?.stage) || "missing"}`)
    const scenariosByAction = new Map()
    for (const scenario of stage.scenarios) {
      if (!asText(scenario?.id) || !outcomeCounts.has(scenario?.expectedAction) || !scenario?.utterances || typeof scenario.utterances !== "object") throw new Error(`Invalid opening permission scenario in ${stage.stage}`)
      const languageKeys = Object.keys(scenario.utterances).sort()
      if (JSON.stringify(languageKeys) !== JSON.stringify([...requiredLanguages].sort())) throw new Error(`Scenario ${scenario.id} must include every supported language`)
      for (const language of requiredLanguages) if (!asText(scenario.utterances[language])) throw new Error(`Scenario ${scenario.id} has an empty ${language} utterance`)
      scenariosByAction.set(scenario.expectedAction, [...(scenariosByAction.get(scenario.expectedAction) || []), scenario])
    }
    for (const [action, count] of outcomeCounts) if ((scenariosByAction.get(action) || []).length !== count) throw new Error(`${stage.stage}.${action} must contain ${count} scenarios`)
    const outcomes = [...outcomeCounts.keys()].map(action => ({
      id:action,
      action,
      examples:(scenariosByAction.get(action) || []).flatMap(scenario => requiredLanguages.map(language => ({ text:asText(scenario.utterances[language]), language })))
    }))
    routes.push({
      id:stage.stage === "permission_pending" ? "opening_permission" : "opening_first_reply",
      stage:stage.stage,
      enabled:true,
      // The index is shadow-only at this stage. Decision thresholds will be
      // calibrated from labelled calls before any route can influence speech.
      decision:{ actionOutcomeIds:stage.stage === "permission_pending" ? ["grant_permission", "close_declined", "reassure_permission"] : ["ask_permission", "close_declined"], minimumScore:0.75, minimumNegativeMargin:0.10, minimumCompetingMargin:0.05, aggregateTopK:3 },
      outcomes
    })
  }
  if (routes.length !== 2) throw new Error("Opening permission catalog must contain exactly two stages")
  return { schemaVersion:SEMANTIC_ROUTE_CATALOG_SCHEMA_VERSION, routes }
}

// Stored examples and later live-turn payloads use the same conversation
// fields. Outcome/action are metadata only: putting an unknown outcome in a
// live query would bias the very decision we are trying to make.
export function semanticRouteExampleEnvelope({ route, example }) {
  return [
    "Semantic routing example.",
    `Route: ${route.id}`,
    `Conversation stage: ${asText(route.stage) || "unspecified"}`,
    example.language ? `Language: ${asText(example.language)}` : null,
    "Caller statement:",
    asText(example.text)
  ].filter(Boolean).join("\n")
}

export function routeDocuments(catalog) {
  const validation = validateSemanticRouteCatalog(catalog)
  if (!validation.valid) throw new Error(`Invalid semantic route catalog: ${validation.errors.join("; ")}`)
  return catalog.routes.filter(route => route.enabled !== false).flatMap(route => route.outcomes.flatMap(outcome => outcome.examples.map((example, ordinal) => {
    const text = semanticRouteExampleEnvelope({ route, example })
    const documentId = `${route.id}:${outcome.id}:${ordinal}`
    return {
      documentId,
      routeId:route.id,
      outcomeId:outcome.id,
      action:outcome.action,
      language:asText(example.language) || null,
      text,
      contentHash:hash(stableJson({ documentId, text }))
    }
  })))
}

export const cosineSimilarity = (left, right) => {
  if (!validVector(left) || !validVector(right) || left.length !== right.length) return -1
  let dot = 0, leftMagnitude = 0, rightMagnitude = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftMagnitude += left[index] ** 2
    rightMagnitude += right[index] ** 2
  }
  return leftMagnitude && rightMagnitude ? dot / Math.sqrt(leftMagnitude * rightMagnitude) : -1
}

const parseCache = path => {
  try { return JSON.parse(readFileSync(path, "utf8")) } catch (error) { return error?.code === "ENOENT" ? null : null }
}
const validCache = cache => cache?.schemaVersion === SEMANTIC_ROUTE_INDEX_SCHEMA_VERSION && typeof cache?.embeddingModel === "string" && cache?.entries && typeof cache.entries === "object"
const atomicWrite = (path, value) => {
  mkdirSync(dirname(path), { recursive:true })
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`
  writeFileSync(temporaryPath, `${JSON.stringify(value)}\n`, "utf8")
  renameSync(temporaryPath, path)
}

export function createSemanticRouteIndex({ catalog, cachePath, embedder }={}) {
  if (!cachePath) throw new Error("cachePath is required")
  if (!embedder || typeof embedder.embedDocuments !== "function" || typeof embedder.embedQueries !== "function") throw new Error("embedder with embedDocuments and embedQueries is required")
  const documents = routeDocuments(catalog)
  const catalogHash = hash(stableJson(documents.map(document => ({ documentId:document.documentId, contentHash:document.contentHash }))))
  let entries = null
  const load = () => {
    if (entries) return entries
    const cached = parseCache(cachePath)
    if (!validCache(cached) || cached.embeddingModel !== embedder.model) return null
    const byId = new Map(Object.entries(cached.entries))
    const loaded = documents.map(document => {
      const cachedEntry = byId.get(document.documentId)
      if (!cachedEntry || cachedEntry.contentHash !== document.contentHash || !validVector(cachedEntry.vector)) return null
      return { ...document, vector:cachedEntry.vector }
    })
    if (loaded.some(entry => !entry)) return null
    entries = loaded
    return entries
  }
  const sync = async () => {
    const cached = parseCache(cachePath)
    const reusable = validCache(cached) && cached.embeddingModel === embedder.model ? cached.entries : {}
    const changed = documents.filter(document => {
      const prior = reusable[document.documentId]
      return !prior || prior.contentHash !== document.contentHash || !validVector(prior.vector)
    })
    const vectors = changed.length ? await embedder.embedDocuments(changed.map(document => document.text)) : []
    if (vectors.length !== changed.length || vectors.some(vector => !validVector(vector))) throw new Error("Embedding provider returned invalid document vectors")
    const changedVectors = new Map(changed.map((document, index) => [document.documentId, vectors[index]]))
    entries = documents.map(document => ({ ...document, vector:changedVectors.get(document.documentId) || reusable[document.documentId].vector }))
    const payload = {
      schemaVersion:SEMANTIC_ROUTE_INDEX_SCHEMA_VERSION,
      embeddingModel:embedder.model,
      catalogHash,
      createdAt:new Date().toISOString(),
      entries:Object.fromEntries(entries.map(entry => [entry.documentId, { contentHash:entry.contentHash, vector:entry.vector }]))
    }
    atomicWrite(cachePath, payload)
    return { status:"ready", documentCount:documents.length, embeddedDocumentCount:changed.length, reusedDocumentCount:documents.length - changed.length, catalogHash, schemaVersion:SEMANTIC_ROUTE_INDEX_SCHEMA_VERSION, updatedAt:payload.createdAt, cachePath }
  }
  return {
    async sync() { return sync() },
    status() {
      const cached = parseCache(cachePath)
      const ready = Boolean(load())
      return {
        status:ready ? "ready" : "missing_or_stale",
        documentCount:documents.length,
        catalogHash:ready ? cached?.catalogHash || catalogHash : catalogHash,
        schemaVersion:ready ? cached?.schemaVersion || null : null,
        updatedAt:ready ? cached?.createdAt || null : null,
        cachePath,
        embeddingModel:embedder.model
      }
    },
    async search(query, { topK=5 }={}) {
      const activeEntries = load() || (await sync(), entries)
      const vectors = await embedder.embedQueries([asText(query)])
      if (vectors.length !== 1 || !validVector(vectors[0])) throw new Error("Embedding provider returned invalid query vector")
      return activeEntries.map(entry => ({ ...entry, score:cosineSimilarity(vectors[0], entry.vector) })).sort((left, right) => right.score - left.score || left.documentId.localeCompare(right.documentId)).slice(0, Math.max(0, topK))
    }
  }
}

export function createGeminiRouteEmbeddingAdapter({ apiKey=process.env.GEMINI_API_KEY, fetchImpl=globalThis.fetch, batchSize=50, timeoutMs=5_000 }={}) {
  if (!apiKey) return null
  const embed = async (texts, { signal }={}) => {
    const vectors = []
    for (let start = 0; start < texts.length; start += batchSize) {
      const batch = texts.slice(start, start + batchSize)
      const timeout = AbortSignal.timeout(timeoutMs)
      const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
      const response = await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents", {
        method:"POST", signal:requestSignal,
        headers:{ "content-type":"application/json", "x-goog-api-key":apiKey },
        body:JSON.stringify({ requests:batch.map(text => ({ model:"models/gemini-embedding-001", taskType:"SEMANTIC_SIMILARITY", content:{ parts:[{ text }] } })) })
      })
      if (!response.ok) throw new Error(`Gemini embedding failed (${response.status}): ${(await response.text()).slice(0, 180)}`)
      const body = await response.json()
      const batchVectors = (body.embeddings || []).map(value => value.values || value.embedding?.values)
      if (batchVectors.length !== batch.length || batchVectors.some(vector => !validVector(vector))) throw new Error("Gemini embedding returned incomplete vectors")
      vectors.push(...batchVectors)
    }
    return vectors
  }
  return { model:"gemini-embedding-001", embedDocuments:texts => embed(texts), embedQueries:texts => embed(texts) }
}
