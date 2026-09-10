import { normalizeTurnValidationResult } from "./turn-validation-contract.js"

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models"
const responseSchema = {
  type:"object",
  properties:{
    decision:{ type:"string", enum:["complete", "incomplete", "unclear"] },
    confidence:{ type:"number" },
    reason_code:{ type:"string" },
    candidate_text:{ type:"string" }
  },
  required:["decision", "confidence", "reason_code", "candidate_text"],
  additionalProperties:false
}

const instruction = [
  "You are a turn-validation service for a phone conversation.",
  "Classify candidate_text as complete, incomplete, or unclear using the supplied language, transcript evidence, and conversation state.",
  "complete: a usable finished answer, question, confirmation, correction, or statement in context.",
  "incomplete: meaningful words that are likely a continuing thought, fragment, trailing connector, or unfinished answer.",
  "unclear: the text is too garbled, low-confidence, or ambiguous to safely understand.",
  "Do not infer facts. Do not write a caller-facing reply. Return only the required JSON and echo candidate_text exactly."
].join(" ")

const modelPath = model => `${GEMINI_API}/${encodeURIComponent(model)}:generateContent`
const responseText = body => body?.candidates?.[0]?.content?.parts?.map(part => part?.text || "").join("").trim()

// A raw REST adapter keeps cancellation and deadline control explicit. The
// normalizer is the final authority on the provider response shape.
export function createGeminiTurnValidator({
  apiKey=process.env.GEMINI_API_KEY,
  model=process.env.GEMINI_TURN_VALIDATOR_MODEL || "gemini-2.5-flash",
  fetchImpl=globalThis.fetch,
  timeoutMs=Number(process.env.V3_TURN_VALIDATION_TIMEOUT_MS || "5000")
}={}) {
  if (!apiKey) return null
  return {
    provider:"gemini",
    model,
    async validate(request, { signal, priorUnclearAttempts=0, clarificationAfterAttempts=2 }={}) {
      const timeout = AbortSignal.timeout(Math.max(500, Math.min(5_000, Number(timeoutMs) || 5_000)))
      const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout
      const response = await fetchImpl(`${modelPath(model)}?key=${encodeURIComponent(apiKey)}`, {
        method:"POST",
        signal:requestSignal,
        headers:{ "content-type":"application/json" },
        body:JSON.stringify({
          systemInstruction:{ parts:[{ text:instruction }] },
          contents:[{ role:"user", parts:[{ text:JSON.stringify(request) }] }],
          generationConfig:{ temperature:0, responseMimeType:"application/json", responseJsonSchema:responseSchema }
        })
      })
      if (!response.ok) throw new Error(`Gemini turn validator failed (${response.status}): ${(await response.text()).slice(0, 180)}`)
      const text = responseText(await response.json())
      if (!text) throw new Error("Gemini turn validator returned no structured result")
      let raw
      try { raw = JSON.parse(text) } catch { throw new Error("Gemini turn validator returned invalid JSON") }
      return normalizeTurnValidationResult(raw, {
        candidateText:request?.candidate_text,
        priorUnclearAttempts,
        clarificationAfterAttempts
      })
    }
  }
}
