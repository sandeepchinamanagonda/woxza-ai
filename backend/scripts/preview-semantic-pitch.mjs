import { createGeminiConversation } from "../src/demo/gemini-conversation.js"
import { getCapabilityCatalog } from "../src/demo/capability-catalog.js"
import { approvedCapabilities } from "../src/demo/capability-retriever.js"

const languages = process.argv.slice(2).length ? process.argv.slice(2) : ["en", "es", "as", "bn", "gu", "hi", "kn", "ml", "mr", "pa", "ta", "te", "ur"]
const callerText = "We run a dental clinic. We miss evening appointment calls and manually enter call details into our CRM. How can Woxza help us?"
const brain = createGeminiConversation()
if (!brain) throw new Error("GEMINI_API_KEY is required for this preview")

for (const language of languages) {
  const catalog = await getCapabilityCatalog(language)
  const selected = approvedCapabilities({ catalog, candidateIds:["appointment_enquiries", "connected_system_workflows"] })
  const memory = {
    opening_delivered:true,
    conversation_profile:{ business:"dental clinic", channels:["phone"], workflows:["appointment enquiries", "CRM entry"], painPoints:["missed evening appointment calls", "manual CRM entry"], impact:"", manualEffort:"", desiredOutcomes:["clear patient next steps"] },
    conversation_objective:"tailored_explanation",
    pitch_intent:{ id:"explore_woxza_value", status:"ready_for_pitch", missingFacts:[], followUpQuestions:0, maximumFollowUpQuestions:2, delivered:false },
    capability_context:{ mode:"value_pitch", selected }
  }
  let text = ""
  let completion = {}
  for await (const event of brain.replyStream({ language, history:[], callerText, memory })) {
    text += event.text || ""
    if (event.completion) completion = event.completion
  }
  // Mirror V3's production recovery: never evaluate a provider-cut-off pitch
  // as though it were a finished caller experience.
  if (completion.stopReason === "MAX_TOKENS") {
    let repaired = ""
    let repairCompletion = {}
    for await (const event of brain.repairStream({ language, history:[], callerText, memory, draft:text })) {
      repaired += event.text || ""
      if (event.completion) repairCompletion = event.completion
    }
    text = repaired
    completion = { ...repairCompletion, repairedFromMaxTokens:true }
  }
  console.log(JSON.stringify({ language, pitch:text, completion }))
}
