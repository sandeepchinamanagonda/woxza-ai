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
      return { raw:JSON.parse(text), model, version:model }
    }
  }
}
