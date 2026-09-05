import { buildWoxzaConversationPrompt } from "./openrouter-conversation.js"
import { voiceResponseTokenLimit } from "./conversation-limits.js"

const SARVAM_API = "https://api.sarvam.ai"
const safeHistory = history => history.slice(-4).map(item => ({ role:item.role, content:item.content }))
const systemWithMemory = (language, memory={}) => `${buildWoxzaConversationPrompt(language)}\n\nCALL_STATE_JSON (authoritative facts and already-covered topics from this call):\n${JSON.stringify(memory)}`

function keepPhoneLength(text, maxWords=28) {
  const words = String(text || "").split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return words.join(" ")
  return `${words.slice(0, maxWords).join(" ").replace(/[,:;\-–—]+$/, "")}…`
}

// Sarvam's conversations variant is designed for code-mixed Indic dialogue.
// Reasoning is explicitly disabled because a phone turn needs its answer now,
// not hidden planning tokens first.
export function createSarvamConversation({ apiKey=process.env.SARVAM_API_KEY, model=process.env.SARVAM_CHAT_MODEL || "sarvam-105b-conversations", fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    async *replyStream({ language, history, callerText, memory, signal }) {
      const response = await fetchImpl(`${SARVAM_API}/v1/chat/completions`, { method:"POST", signal, headers:{ "api-subscription-key":apiKey, "content-type":"application/json" }, body:JSON.stringify({ model, messages:[{ role:"system", content:systemWithMemory(language, memory) }, ...safeHistory(history)], reasoning_effort:null, temperature:0.55, max_tokens:voiceResponseTokenLimit(language), stream:true }) })
      if (!response.ok) throw new Error(`Sarvam Conversations stream failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
      const reader = response.body?.getReader(); if (!reader) throw new Error("Sarvam Conversations returned no stream")
      const decoder = new TextDecoder(); let buffered = ""; let usage = {}
      const consume = line => {
        if (!line.startsWith("data:")) return []
        const data = line.slice(5).trim(); if (!data || data === "[DONE]") return []
        const event = JSON.parse(data); usage = event.usage || usage
        const text = event.choices?.[0]?.delta?.content || ""
        return text ? [{ text, usage }] : []
      }
      while (true) {
        const { done, value } = await reader.read(); buffered += decoder.decode(value || new Uint8Array(), { stream:!done })
        const lines = buffered.split(/\r?\n/); buffered = lines.pop() || ""
        for (const line of lines) for (const event of consume(line)) yield event
        if (done) break
      }
      if (buffered.trim()) for (const event of consume(buffered)) yield event
      return { model, usage }
    },
    async reply({ language, history, callerText, memory, signal }) {
      const response = await fetchImpl(`${SARVAM_API}/v1/chat/completions`, {
        method:"POST", signal,
        headers:{ "api-subscription-key":apiKey, "content-type":"application/json" },
        body:JSON.stringify({
          model,
          messages:[{ role:"system", content:systemWithMemory(language, memory) }, ...safeHistory(history)],
          reasoning_effort:null,
          temperature:0.55,
          // Indic scripts can consume several model tokens per written word.
          // The prompt constrains audible length; this configurable ceiling
          // prevents an otherwise short sentence from being cut mid-question.
          max_tokens:voiceResponseTokenLimit(language),
          stream:false
        })
      })
      if (!response.ok) throw new Error(`Sarvam Conversations failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
      const body = await response.json()
      const text = keepPhoneLength(body.choices?.[0]?.message?.content, language === "te" ? 18 : 28)
      if (!text) throw new Error("Sarvam Conversations returned an empty response")
      return { text, model:body.model || model, usage:body.usage || {}, provider:"sarvam-conversations" }
    }
  }
}
