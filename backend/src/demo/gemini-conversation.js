import { buildWoxzaConversationPrompt } from "./openrouter-conversation.js"
import { voiceRepairTokenLimit, voiceResponseTokenLimit } from "./conversation-limits.js"

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models"
// V3 uses CALL_STATE_JSON.turns as the single structured history source.
// Keep the new caller sentence as Gemini's actual user input, but do not send
// a second overlapping chat-history representation on every request.
const requestContents = (_history, callerText) => callerText ? [{ role:"user", parts:[{ text:callerText }] }] : []
const repairInstruction = draft => `Your previous answer was cut off before it was useful on a phone call. Replace it with one concise, self-contained answer to the caller's latest question, followed by at most one natural next question. Do not mention token limits, drafts, or this instruction. Do not repeat the caller verbatim. Previous cut-off draft:\n${draft}`
const systemWithMemory = (language, memory={}) => `${buildWoxzaConversationPrompt(language)}\n\nCALL_STATE_JSON (authoritative facts and already-covered topics from this call):\n${JSON.stringify(memory)}`
const isFullValueExplanation = memory => ["four_examples", "four_more_examples"].includes(memory?.full_value_explanation?.mode)

// Gemini is intentionally used as a text-only brain in V3. Phone audio stays
// with Sarvam STT/TTS, avoiding Gemini Live's continuous audio-token billing.
export function createGeminiConversation({ apiKey=process.env.GEMINI_API_KEY, model=process.env.V3_GEMINI_MODEL || "gemini-2.5-flash", fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    provider:"gemini",
    model,
    async *replyStream({ language, history, callerText, memory, signal }) {
      yield* stream({ language, history, callerText, memory, signal, maximumTokens:voiceResponseTokenLimit(language, { extended:isFullValueExplanation(memory) }) })
    },
    async *repairStream({ language, history, callerText, memory, draft, signal }) {
      yield* stream({ language, history, callerText:repairInstruction(draft), memory, signal, maximumTokens:voiceRepairTokenLimit(language) })
    }
  }

  async function *stream({ language, history, callerText, memory, signal, maximumTokens }) {
      const url = `${GEMINI_API}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
      const response = await fetchImpl(url, {
        method:"POST", signal,
        headers:{ "content-type":"application/json" },
        body:JSON.stringify({
          systemInstruction:{ parts:[{ text:systemWithMemory(language, memory) }] },
          contents:requestContents(history, callerText),
          generationConfig:{
            temperature:0.55,
            maxOutputTokens:maximumTokens,
            // A phone turn needs the answer immediately. With the short voice
            // budget, hidden reasoning can otherwise consume nearly every token.
            thinkingConfig:{ thinkingBudget:0 }
          }
        })
      })
      if (!response.ok) throw new Error(`Gemini ${model} stream failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
      const reader = response.body?.getReader(); if (!reader) throw new Error("Gemini returned no stream")
      const decoder = new TextDecoder(); let buffered = ""; let finalUsage = {}; let finalFinishReason = null
      const consume = eventBlock => {
        const data = eventBlock.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n")
        if (!data || data === "[DONE]") return []
        const event = JSON.parse(data)
        const candidate = event.candidates?.[0]
        const text = candidate?.content?.parts?.map(part => part.text || "").join("") || ""
        if (event.usageMetadata) finalUsage = event.usageMetadata
        if (candidate?.finishReason) finalFinishReason = candidate.finishReason
        return text ? [{ text }] : []
      }
      while (true) {
        const { done, value } = await reader.read(); buffered += decoder.decode(value || new Uint8Array(), { stream:!done })
        const blocks = buffered.split(/\r?\n\r?\n/); buffered = blocks.pop() || ""
        for (const block of blocks) for (const event of consume(block)) yield event
        if (done) break
      }
      if (buffered.trim()) for (const event of consume(buffered)) yield event
      yield { completion:{ usage:finalUsage, stopReason:finalFinishReason } }
  }
}
