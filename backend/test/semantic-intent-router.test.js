import test from "node:test"
import assert from "node:assert/strict"
import {
  FULL_VALUE_EXPLANATION_INTENT,
  SUPPORTED_SEMANTIC_INTENT_LANGUAGES,
  configuredSemanticIntentMode,
  createSemanticIntentMatcher,
  semanticIntentRoutingContext,
  validateSemanticIntentCatalog
} from "../src/demo/semantic-intent-router.js"

const language = code => ({
  languageCode:code,
  positiveExamples:[{ text:`positive ${code}` }],
  negativeExamples:[{ text:`negative ${code}` }]
})

test("validates a complete multilingual semantic intent catalog", () => {
  const catalog = {
    schemaVersion:1,
    intent:FULL_VALUE_EXPLANATION_INTENT,
    languages:SUPPORTED_SEMANTIC_INTENT_LANGUAGES.map(language)
  }
  assert.deepEqual(validateSemanticIntentCatalog(catalog), { valid:true, errors:[] })
})

test("rejects a catalog that silently misses supported languages", () => {
  const result = validateSemanticIntentCatalog({
    schemaVersion:1,
    intent:FULL_VALUE_EXPLANATION_INTENT,
    languages:[language("en")]
  })
  assert.equal(result.valid, false)
  assert.ok(result.errors.includes("missing language: te"))
})

test("builds paired-turn context for a short multilingual follow-up", () => {
  assert.deepEqual(semanticIntentRoutingContext({
    language:"te",
    callerText:"అవునా ఎలా?",
    memory:{ turns:[
      { turn:1, caller:"రోజూ కాల్స్ ఎక్కువగా వస్తాయి", agent:"Woxza ఆ రిపీట్ కాల్స్‌లో సహాయం చేయగలదు." }
    ] }
  }), {
    intent:FULL_VALUE_EXPLANATION_INTENT,
    language:"te",
    caller_text:"అవునా ఎలా?",
    previous_caller_text:"రోజూ కాల్స్ ఎక్కువగా వస్తాయి",
    previous_agent_text:"Woxza ఆ రిపీట్ కాల్స్‌లో సహాయం చేయగలదు.",
    recent_turns:[{ caller:"రోజూ కాల్స్ ఎక్కువగా వస్తాయి", agent:"Woxza ఆ రిపీట్ కాల్స్‌లో సహాయం చేయగలదు." }]
  })
})

test("defaults the semantic router to safe shadow mode", () => {
  assert.equal(configuredSemanticIntentMode({}), "shadow")
  assert.equal(configuredSemanticIntentMode({ V3_SEMANTIC_INTENT_ROUTER:"active" }), "active")
  assert.equal(configuredSemanticIntentMode({ V3_SEMANTIC_INTENT_ROUTER:"unknown" }), "shadow")
})

test("semantic matcher requires paired Woxza context before accepting a short follow-up", async () => {
  const catalog = { schemaVersion:1, intent:FULL_VALUE_EXPLANATION_INTENT, languages:SUPPORTED_SEMANTIC_INTENT_LANGUAGES.map(language) }
  const vectors = text => text.startsWith("How?") || text.includes("positive") ? [1, 0] : [0, 1]
  const matcher = createSemanticIntentMatcher({ catalog, embed:async texts => texts.map(vectors), threshold:0.7, margin:0.1 })
  assert.equal((await matcher.evaluate({ caller_text:"How?" })).decision, "ineligible")
  assert.equal((await matcher.evaluate({ caller_text:"How?", previous_agent_text:"Woxza can handle those calls.", previous_caller_text:"Calls take all day." })).decision, FULL_VALUE_EXPLANATION_INTENT)
})
