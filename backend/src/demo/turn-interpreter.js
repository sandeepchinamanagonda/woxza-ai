import { GoogleGenAI } from "@google/genai"
import { BUSINESS_CATEGORIES, DEMO_SCENARIOS, TURN_INTENTS, WORKFLOW_TAGS } from "./orchestrator.js"

const schema = {
  type:"OBJECT",
  properties:{
    intent:{ type:"STRING", enum:[...TURN_INTENTS] },
    clarity:{ type:"STRING", enum:["complete", "incomplete", "unclear"] },
    details:{ type:"OBJECT", properties:{
      business:{ type:"STRING" }, business_label:{ type:"STRING" },
      business_type:{ type:"STRING" }, business_name:{ type:"STRING" },
      customer_interaction_channels:{ type:"ARRAY", items:{ type:"STRING" } },
      current_workflow:{ type:"STRING" }, pain_points:{ type:"ARRAY", items:{ type:"STRING" } },
      business_impact:{ type:"STRING" }, scale_context:{ type:"STRING" }, desired_outcome:{ type:"STRING" },
      vertical:{ type:"STRING", enum:BUSINESS_CATEGORIES }, pain_tags:{ type:"ARRAY", items:{ type:"STRING" } },
      business_category:{ type:"STRING", enum:BUSINESS_CATEGORIES },
      workflow_tags:{ type:"ARRAY", items:{ type:"STRING", enum:WORKFLOW_TAGS } },
      current_process:{ type:"STRING" }, primary_pain:{ type:"STRING" }, operating_detail:{ type:"STRING" },
      request:{ type:"STRING" }, quantity:{ type:"STRING" }, measurement:{ type:"STRING" },
      choice:{ type:"STRING", enum:["demo", "pitch"] }, scenario:{ type:"STRING", enum:DEMO_SCENARIOS }, feedback:{ type:"STRING" }
    } }
  },
  required:["intent", "clarity", "details"]
}

const valueIntentSchema = {
  type:"OBJECT",
  properties:{
    requested:{ type:"BOOLEAN" }, confidence:{ type:"NUMBER" }, evidence:{ type:"STRING" },
    status:{ type:"STRING", enum:["none", "collecting_context", "ready_for_pitch"] },
    missing_facts:{ type:"ARRAY", items:{ type:"STRING" } },
    candidate_capability_ids:{ type:"ARRAY", items:{ type:"STRING" } }
  },
  required:["requested", "confidence", "evidence", "status", "missing_facts", "candidate_capability_ids"]
}

export function createTurnInterpreter({ apiKey=process.env.GEMINI_API_KEY, model=process.env.GEMINI_TURN_INTERPRETER_MODEL || "gemini-2.5-flash" }={}) {
  if (!apiKey) throw new Error("Gemini is not configured")
  const ai = new GoogleGenAI({ apiKey })
  return {
    model,
    async interpret({ turn, phase, businessProfile={}, language="en" }) {
      const prompt = [
        "You are a one-shot, structured phone-call turn interpreter.",
        "Interpret only the immutable caller transcript supplied below. Do not infer facts, names, quantities, or prior state that are not plainly stated. Extract every supported discovery fact from the single turn: business_type, optional business_name, interaction channels, workflow, pain_points, impact, scale, desired outcome, vertical, workflow_tags, and pain_tags. Arrays preserve distinct caller-stated facts; never collapse multiple pains into one invented summary. business_name is a proper name only, never a business type.",
        "First judge semantic completeness in the caller's actual language, including code-switched speech. Use clarity=complete only for a complete thought in this workflow context; short complete answers such as 'pharmacy', 'yes', or 'మెడికల్ షాప్' are complete. Use clarity=incomplete for a likely continuation, such as a trailing possessive, dangling conjunction, or fragment. With clarity=incomplete, return intent=needs_clarification and details={} exactly: never guess, translate, or fill a field. Use clarity=unclear only when the caller may be finished but the audio/text meaning is insufficient.",
        "Return JSON that matches the schema. You cannot speak, select a workflow action, or ask a question.",
        `Workflow phase: ${phase}. Configured language: ${language}.`,
        `Confirmed business profile (read-only context): ${JSON.stringify(businessProfile)}.`,
        `<canonical_caller_transcript>${turn.authoritative_text}</canonical_caller_transcript>`
      ].join("\n")
      const response = await ai.models.generateContent({
        model,
        contents:prompt,
        config:{ responseMimeType:"application/json", responseSchema:schema, temperature:0 }
      })
      const text = String(response.text || "").trim()
      if (!text) throw new Error("Turn interpreter returned no structured result")
      return { raw:JSON.parse(text), model, version:model, usage:response.usageMetadata || {} }
    },
    async interpretValueIntent({ callerText, businessProfile={}, language="en", recentHistory=[], isAlreadyActive=false, capabilityIndex=[] }) {
      const prompt = [
        "You are a strict, structured classifier for an opt-in Woxza product-value pitch. You cannot speak or ask a question.",
        "Return requested=true only when a caller explicitly asks to understand what Woxza can do, whether/how it can help their business, or whether it supports a Woxza workflow or integration. Interpret the caller's meaning across languages, dialects, code-switching, and transcription variations; do not depend on fixed phrases.",
        "A caller merely stating their business, customer channels, current process, pain point, scale, or desired outcome is never a request. Neither is a vague phrase such as 'may I know?' unless its actual conversational meaning clearly asks about Woxza. Do not activate a pitch because enough business information is available.",
        "Set requested=true only when your confidence is at least 0.90. If requested=true, evidence must be an exact, unmodified substring from one caller message in the supplied conversation that itself expresses the request. If requested=false, evidence must be an empty string, status must be none, and both arrays must be empty.",
        "If a valid request is active from an earlier caller message, isAlreadyActive is true. In that case requested may remain false, but choose relevant approved capability IDs and status from the known facts. Set ready_for_pitch only when the known facts include a business, a real customer channel or workflow, and a caller-stated operating pain, impact, or manual-effort detail. A request to hear how Woxza can help is not itself an operating need. Choose no more than five IDs from the approved capability index; never invent a capability or outcome.",
        `Configured language: ${language}. isAlreadyActive: ${isAlreadyActive}.`,
        `Confirmed business profile: ${JSON.stringify(businessProfile)}.`,
        `Ordered recent conversation: ${JSON.stringify(recentHistory.slice(-16))}.`,
        `Approved capability index: ${JSON.stringify(capabilityIndex)}.`,
        `<latest_caller_transcript>${callerText}</latest_caller_transcript>`
      ].join("\n")
      const response = await ai.models.generateContent({
        model,
        contents:prompt,
        config:{ responseMimeType:"application/json", responseSchema:valueIntentSchema, temperature:0 }
      })
      const text = String(response.text || "").trim()
      if (!text) throw new Error("Value intent interpreter returned no structured result")
      return { raw:JSON.parse(text), model, version:model, usage:response.usageMetadata || {} }
    }
  }
}
