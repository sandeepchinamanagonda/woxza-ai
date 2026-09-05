import { buildWoxzaConversationPrompt } from "./openrouter-conversation.js"
import { voiceResponseTokenLimit } from "./conversation-limits.js"

const OPENAI_API = "https://api.openai.com/v1/chat/completions"

const safeHistory = history => history.slice(-4).map(item => ({ role:item.role, content:item.content }))
const systemWithMemory = (language, memory={}) => `${buildWoxzaConversationPrompt(language)}\n\nCALL_STATE_JSON (authoritative facts and already-covered topics from this call):\n${JSON.stringify(memory)}`

// Direct OpenAI adapter for an apples-to-apples V3 brain benchmark.  Audio
// remains on Sarvam; only the text-generation hop is replaced.
export function createOpenAiConversation({ apiKey=process.env.OPENAI_API_KEY, model=process.env.V3_OPENAI_MODEL || "gpt-4.1-mini", fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    async *replyStream({ language, history, callerText, memory, signal }) {
      const response = await fetchImpl(OPENAI_API, {
        method:"POST", signal,
        headers:{ authorization:`Bearer ${apiKey}`, "content-type":"application/json" },
        body:JSON.stringify({
          model,
          messages:[{ role:"system", content:systemWithMemory(language, memory) }, ...safeHistory(history)],
          temperature:0.55,
          max_tokens:voiceResponseTokenLimit(language),
          stream:true
        })
      })
      if (!response.ok) throw new Error(`OpenAI ${model} stream failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
      const reader = response.body?.getReader(); if (!reader) throw new Error("OpenAI returned no stream")
      const decoder = new TextDecoder(); let buffered = ""
      const consume = line => {
        if (!line.startsWith("data:")) return []
        const data = line.slice(5).trim(); if (!data || data === "[DONE]") return []
        const event = JSON.parse(data)
        const text = event.choices?.[0]?.delta?.content || ""
        return text ? [{ text, usage:event.usage || {} }] : []
      }
      while (true) {
        const { done, value } = await reader.read(); buffered += decoder.decode(value || new Uint8Array(), { stream:!done })
        const lines = buffered.split(/\r?\n/); buffered = lines.pop() || ""
        for (const line of lines) for (const event of consume(line)) yield event
        if (done) break
      }
      if (buffered.trim()) for (const event of consume(buffered)) yield event
    }
  }
}
