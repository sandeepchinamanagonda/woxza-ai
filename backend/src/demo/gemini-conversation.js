import { buildWoxzaConversationPrompt } from "./openrouter-conversation.js"
import { voicePitchTokenLimit, voiceRepairTokenLimit, voiceResponseTokenLimit } from "./conversation-limits.js"

const GEMINI_API = "https://generativelanguage.googleapis.com/v1beta/models"
// Keep the new caller sentence as Gemini's actual user input. The structured
// ledger contains only earlier turns: this avoids duplicating the current
// input while preserving caller speech that arrives before an agent reply has
// completed delivery.
const requestContents = (_history, callerText) => callerText ? [{ role:"user", parts:[{ text:callerText }] }] : []
const repairInstruction = (draft, { pitch=false }={}) => pitch
  ? `Your previous tailored pitch was cut off. Replace it with two or three short, complete caller-facing sentences. Begin with a brief bridge that makes clear you are now explaining how Woxza could help based on what the caller shared. Use only the approved capability records in CALL_STATE_JSON; preserve their conditions. End with one short contextual question inviting the caller to try a clearly labelled fictional example. Do not add a greeting, price, schedule, automation mechanism, or unsupported claim. Do not mention token limits, drafts, or this instruction. Previous cut-off draft:\n${draft}`
  : `Your previous answer was cut off before it was useful on a phone call. Replace it with one concise, self-contained answer to the caller's latest question, followed by at most one natural next question. Do not mention token limits, drafts, or this instruction. Do not repeat the caller verbatim. Previous cut-off draft:\n${draft}`
const conversationBeforeCurrentInput = (history=[], callerText="") => {
  const turns = history.slice(-32).map(turn => ({ role:turn.role, content:String(turn.content || "") }))
  // The V3 bridge appends the current caller final before calling the brain.
  // It is already sent as Gemini's actual user input, so omit only that final
  // duplicate—not earlier caller finals that may be part of the same thought.
  if (turns.at(-1)?.role === "user" && turns.at(-1).content === callerText) turns.pop()
  return turns
}
const callStateForModel = (memory={}, history=[], callerText="") => {
  // `memory.turns` is the durable completed-pair snapshot. `history` is the
  // live ledger: it additionally retains caller speech whose pending response
  // was interrupted before it ever reached the phone. Send one ledger, not
  // both, so the model gets complete context without duplicate prompt tokens.
  const { turns:_completedTurns, ...controlState } = memory || {}
  return { ...controlState, conversation:conversationBeforeCurrentInput(history, callerText) }
}
const systemWithMemory = (language, memory={}, history=[], callerText="") => `${buildWoxzaConversationPrompt(language)}\n\nCALL_STATE_JSON (authoritative call-control state and prior conversation):\n${JSON.stringify(callStateForModel(memory, history, callerText))}\n\nCALL_STATE_JSON.conversation is an ordered ledger of prior caller messages and agent replies that were actually delivered. The caller's newest message is supplied separately as the current user input. Use both together. Never discard an earlier caller detail merely because the caller continued with another sentence before Woxza could reply.`

// Gemini is intentionally used as a text-only brain in V3. Phone audio stays
// with Sarvam STT/TTS, avoiding Gemini Live's continuous audio-token billing.
export function createGeminiConversation({ apiKey=process.env.GEMINI_API_KEY, model=process.env.V3_GEMINI_MODEL || "gemini-2.5-flash", fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    provider:"gemini",
    model,
    async *replyStream({ language, history, callerText, memory, signal }) {
      const isPitch = memory?.capability_context?.mode === "value_pitch"
      yield* stream({ language, history, callerText, memory, signal, maximumTokens:isPitch ? voicePitchTokenLimit(language) : voiceResponseTokenLimit(language) })
    },
    async *repairStream({ language, history, callerText, memory, draft, signal }) {
      const pitch = memory?.capability_context?.mode === "value_pitch"
      yield* stream({ language, history, callerText:repairInstruction(draft, { pitch }), memory, signal, maximumTokens:pitch ? voicePitchTokenLimit(language) : voiceRepairTokenLimit(language) })
    }
  }

  async function *stream({ language, history, callerText, memory, signal, maximumTokens }) {
      const url = `${GEMINI_API}/${encodeURIComponent(model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(apiKey)}`
      const response = await fetchImpl(url, {
        method:"POST", signal,
        headers:{ "content-type":"application/json" },
        body:JSON.stringify({
          systemInstruction:{ parts:[{ text:systemWithMemory(language, memory, history, callerText) }] },
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
