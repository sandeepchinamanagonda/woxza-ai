import assert from "node:assert/strict"
import test from "node:test"
import { createResponseTextBuilder, templateResponse } from "../src/demo/response-text-builder.js"

test("templates a complete natural Telugu discovery response from frozen business context", async () => {
  const builder = createResponseTextBuilder({ generate:async () => { throw new Error("template should not call model") } })
  const result = await builder.build({ action:"ask_missing_business_detail", language:"te", context:{ profile:{ business:"steel shop", business_label:"స్టీల్ కొట్టు" }, missing:"current_process" } })
  assert.equal(result.text_source, "template")
  assert.equal(result.response_text, "స్టీల్ కొట్టు, చాలా బాగుంది! మీరు కస్టమర్ ఆర్డర్‌లను ఎలా తీసుకుంటారు — ఫోన్ కాల్స్ ద్వారా లేదా మెసేజ్‌ల ద్వారా?")
})

test("dynamic response text is text-only JSON before a job exists", async () => {
  let input
  const builder = createResponseTextBuilder({ generate:async value => { input = value; return { response_text:"మీ వ్యాపారానికి ఇది ఉపయోగపడుతుంది అండి." } } })
  const result = await builder.build({ action:"deliver_pitch", language:"te", context:{ business_profile:{ business:"steel shop" } } })
  assert.equal(result.text_source, "text_renderer")
  assert.equal(result.response_text, "మీ వ్యాపారానికి ఇది ఉపయోగపడుతుంది అండి.")
  assert.match(input.prompt, /text-only response phrasing component/)
  assert.match(input.prompt, /deliver_pitch/)
})

test("fixed response actions cannot fall through to open-ended rendering", () => {
  assert.equal(templateResponse({ action:"close", language:"en" }).length > 0, true)
})

test("planner acknowledgement never speaks internal vertical or tag labels", () => {
  const text = templateResponse({ action:"ask_missing_business_detail", language:"en", context:{
    next_goal:"understand_interaction_and_workflow",
    acknowledge_fact_ids:["business_type"],
    profile:{ business_type:"medical shop", vertical:"pharma_wholesale", pain_tags:["high_call_volume"] }
  } })
  assert.match(text, /medical shop/i)
  assert.doesNotMatch(text, /pharma_wholesale|high_call_volume/i)
})
