import assert from "node:assert/strict"
import test from "node:test"
import { normalizeTurnInterpretation } from "../src/demo/turn-normalizer.js"

test("normalizes a non-standard demo intent into the canonical choice transition", () => {
  const result = normalizeTurnInterpretation({ intent:"demo", clarity:"clear", details:{} }, { phase:"experience_choice", callerText:"demo ga chuddam" })
  assert.equal(result.interpretation.intent, "change_choice")
  assert.equal(result.interpretation.details.choice, "demo")
  assert.equal(result.changed, true)
})

test("understands indirect feature and demo requests across colloquial language", () => {
  const pitch = normalizeTurnInterpretation({ intent:"ask_more", clarity:"clear", details:{} }, { phase:"experience_choice", callerText:"ప్రయోజనాలు చెప్పండి" })
  assert.deepEqual(pitch.interpretation.details.choice, "pitch")
  assert.equal(pitch.interpretation.intent, "change_choice")
  const demo = normalizeTurnInterpretation({ intent:"show", clarity:"clear", details:{} }, { phase:"experience_choice", callerText:"दिखाइए" })
  assert.equal(demo.interpretation.intent, "change_choice")
  assert.equal(demo.interpretation.details.choice, "demo")

  const naturalEnglishPitch = normalizeTurnInterpretation({ intent:"ask_more", clarity:"clear", details:{} }, { phase:"experience_choice", callerText:"Tell me how Woxza helps my business" })
  assert.equal(naturalEnglishPitch.interpretation.intent, "change_choice")
  assert.equal(naturalEnglishPitch.interpretation.details.choice, "pitch")
})

test("normalizes a spelled product and quantity entity without changing the workflow intent", () => {
  const result = normalizeTurnInterpretation({ intent:"customer_request", clarity:"clear", details:{ request:"D O L O six fifty", quantity:"two strips" } }, { phase:"customer_request" })
  assert.equal(result.interpretation.intent, "customer_request")
  assert.equal(result.interpretation.details.request, "Dolo 650")
  assert.equal(result.interpretation.details.quantity, "2 strips")
})

test("keeps an uncertain caller business phrase instead of accepting an invented vertical", () => {
  const result = normalizeTurnInterpretation({
    intent:"provide_detail", clarity:"clear",
    details:{ business:"bangle shop", business_label:"bangle retailer", business_category:"retail_general", workflow_tags:["inventory_orders"] }
  }, { phase:"business_discovery", callerText:"Madhe bhandar shop" })
  assert.equal(result.interpretation.details.business, "Madhe bhandar shop")
  assert.equal(result.interpretation.details.business_label, undefined)
  assert.equal(result.interpretation.details.business_category, undefined)
  assert.equal(result.interpretation.details.workflow_tags, undefined)
})
