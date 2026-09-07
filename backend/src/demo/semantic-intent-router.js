import { readFileSync } from "node:fs"

// Phase 1 deliberately separates the intent data contract from the voice
// pipeline. A later semantic-search adapter can use this exact catalog with a
// multilingual embedding provider without changing call orchestration.
export const FULL_VALUE_EXPLANATION_INTENT = "full_value_explanation"
export const SUPPORTED_SEMANTIC_INTENT_LANGUAGES = ["en", "es", "as", "bn", "gu", "hi", "kn", "ml", "mr", "pa", "ta", "te", "ur"]

const asText = value => String(value || "").trim()
const validExample = value => value && typeof value === "object" && asText(value.text)

export function validateSemanticIntentCatalog(value) {
  const errors = []
  if (!value || typeof value !== "object") return { valid:false, errors:["catalog must be an object"] }
  if (value.schemaVersion !== 1) errors.push("schemaVersion must be 1")
  if (value.intent !== FULL_VALUE_EXPLANATION_INTENT) errors.push(`intent must be ${FULL_VALUE_EXPLANATION_INTENT}`)
  if (!Array.isArray(value.languages)) errors.push("languages must be an array")
  const byCode = new Map()
  for (const language of Array.isArray(value.languages) ? value.languages : []) {
    const code = asText(language?.languageCode)
    if (!SUPPORTED_SEMANTIC_INTENT_LANGUAGES.includes(code)) errors.push(`unsupported language code: ${code || "(missing)"}`)
    if (byCode.has(code)) errors.push(`duplicate language code: ${code}`)
    byCode.set(code, language)
    if (!Array.isArray(language?.positiveExamples) || language.positiveExamples.length === 0) errors.push(`${code}: positiveExamples must not be empty`)
    if (!Array.isArray(language?.negativeExamples) || language.negativeExamples.length === 0) errors.push(`${code}: negativeExamples must not be empty`)
    for (const example of language?.positiveExamples || []) if (!validExample(example)) errors.push(`${code}: positive example requires text`)
    for (const example of language?.negativeExamples || []) if (!validExample(example)) errors.push(`${code}: negative example requires text`)
  }
  for (const code of SUPPORTED_SEMANTIC_INTENT_LANGUAGES) if (!byCode.has(code)) errors.push(`missing language: ${code}`)
  return { valid:errors.length === 0, errors }
}

export function loadSemanticIntentCatalog(path) {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"))
    const validation = validateSemanticIntentCatalog(parsed)
    return validation.valid
      ? { status:"ready", catalog:parsed, ...validation }
      : { status:"invalid", catalog:null, ...validation }
  } catch (error) {
    return { status:error?.code === "ENOENT" ? "missing" : "unreadable", catalog:null, valid:false, errors:[error.message] }
  }
}

export function semanticIntentRoutingContext({ language, callerText, memory={} }={}) {
  const turns = Array.isArray(memory.turns) ? memory.turns : []
  const previous = turns.at(-1) || {}
  return {
    intent:FULL_VALUE_EXPLANATION_INTENT,
    language:SUPPORTED_SEMANTIC_INTENT_LANGUAGES.includes(language) ? language : "en",
    caller_text:asText(callerText),
    // The prior paired turn is the essential context for interpreting a short
    // follow-up such as “అవునా ఎలా?” without pretending it is meaningful alone.
    previous_caller_text:asText(previous.caller),
    previous_agent_text:asText(previous.agent),
    recent_turns:turns.slice(-3).map(turn => ({ caller:asText(turn.caller), agent:asText(turn.agent) }))
  }
}

export function configuredSemanticIntentMode(env=process.env) {
  const value = asText(env.V3_SEMANTIC_INTENT_ROUTER || "shadow").toLowerCase()
  return ["off", "shadow", "active"].includes(value) ? value : "shadow"
}

const cosineSimilarity = (left, right) => {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length || !left.length) return -1
  let dot = 0, leftMagnitude = 0, rightMagnitude = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftMagnitude += left[index] ** 2
    rightMagnitude += right[index] ** 2
  }
  return leftMagnitude && rightMagnitude ? dot / Math.sqrt(leftMagnitude * rightMagnitude) : -1
}

const examplesFor = (catalog, type) => catalog.languages.flatMap(language =>
  language[`${type}Examples`].flatMap(example => [example.text, example.romanized_text].filter(Boolean).map(text => ({ text, language:language.languageCode }))))

// The matcher is deliberately provider-agnostic. Production supplies a
// multilingual embed(texts) adapter; tests supply deterministic vectors.
export function createSemanticIntentMatcher({ catalog, embed, threshold=0.72, margin=0.08 }={}) {
  if (!catalog || typeof embed !== "function") throw new Error("catalog and embed are required")
  const positive = examplesFor(catalog, "positive")
  const negative = examplesFor(catalog, "negative")
  let indexPromise
  const index = async () => {
    indexPromise ||= embed([...positive, ...negative].map(example => example.text)).then(vectors => ({
      positive:positive.map((example, index) => ({ ...example, vector:vectors[index] })),
      negative:negative.map((example, index) => ({ ...example, vector:vectors[index + positive.length] }))
    }))
    return indexPromise
  }
  return {
    warm:async () => { await index() },
    async evaluate(context) {
      const previousAgent = asText(context.previous_agent_text)
      const priorCaller = asText(context.previous_caller_text)
      if (!previousAgent || !/woxza/i.test(previousAgent) || !priorCaller) return { decision:"ineligible", reason:"missing_woxza_or_prior_context" }
      const query = context.caller_text.length < 28
        ? `${context.caller_text}\nPrevious Woxza statement: ${previousAgent}\nCaller problem: ${priorCaller}`
        : context.caller_text
      const [queryVector, vectors] = await Promise.all([embed([query]).then(result => result[0]), index()])
      const best = items => items.map(item => ({ ...item, score:cosineSimilarity(queryVector, item.vector) })).sort((a, b) => b.score - a.score)[0]
      const positiveHit = best(vectors.positive), negativeHit = best(vectors.negative)
      const accepted = positiveHit.score >= threshold && positiveHit.score - negativeHit.score >= margin
      return {
        decision:accepted ? FULL_VALUE_EXPLANATION_INTENT : "no_match",
        positive_score:Number(positiveHit.score.toFixed(4)),
        negative_score:Number(negativeHit.score.toFixed(4)),
        score_margin:Number((positiveHit.score - negativeHit.score).toFixed(4)),
        matched_language:positiveHit.language,
        matched_example:positiveHit.text
      }
    }
  }
}

export function createGeminiEmbeddingAdapter({ apiKey=process.env.GEMINI_API_KEY, fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return async texts => {
    const vectors = []
    // The catalog has hundreds of examples. Gemini accepts a batch request,
    // but keeps its request count bounded; chunking avoids the 400 seen when
    // all multilingual examples were submitted as one oversized batch.
    for (let start = 0; start < texts.length; start += 50) {
      const batch = texts.slice(start, start + 50)
      const response = await fetchImpl("https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents", {
        method:"POST", headers:{ "content-type":"application/json", "x-goog-api-key":apiKey },
        body:JSON.stringify({ requests:batch.map(text => ({ model:"models/gemini-embedding-001", taskType:"SEMANTIC_SIMILARITY", content:{ parts:[{ text }] } })) })
      })
      if (!response.ok) throw new Error(`Gemini embedding failed (${response.status}): ${(await response.text()).slice(0, 180)}`)
      const body = await response.json()
      const batchVectors = (body.embeddings || []).map(value => value.values || value.embedding?.values)
      if (batchVectors.length !== batch.length || batchVectors.some(vector => !Array.isArray(vector))) throw new Error("Gemini embedding returned incomplete vectors")
      vectors.push(...batchVectors)
    }
    return vectors
  }
}
