import { buildWoxzaConversationPrompt } from "./openrouter-conversation.js"

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages"

const safeHistory = history => history.slice(-4).map(item => ({ role:item.role, content:item.content }))
const tokenLimitFor = language => {
  const configured = language === "te" ? process.env.SARVAM_CHAT_MAX_TOKENS_TE : null
  const value = Number(configured || process.env.SARVAM_CHAT_MAX_TOKENS || (language === "te" ? 64 : 56))
  return Number.isFinite(value) ? Math.max(16, Math.min(256, Math.floor(value))) : (language === "te" ? 64 : 56)
}
const systemWithMemory = (language, memory={}) => `${buildWoxzaConversationPrompt(language)}\n\nCALL_STATE_JSON (authoritative facts and already-covered topics from this call):\n${JSON.stringify(memory)}`

// Direct Anthropic adapter for an apples-to-apples V3 brain benchmark. Audio
// remains on Sarvam; only the text-generation hop is replaced.
export function createAnthropicConversation({ apiKey=process.env.ANTHROPIC_API_KEY, model=process.env.V3_ANTHROPIC_MODEL || "claude-sonnet-4-6", fetchImpl=globalThis.fetch }={}) {
  if (!apiKey) return null
  return {
    provider:"anthropic",
    model,
    async *replyStream({ language, history, callerText, memory, signal }) {
      const response = await fetchImpl(ANTHROPIC_API, {
        method:"POST", signal,
        headers:{ "x-api-key":apiKey, "anthropic-version":"2023-06-01", "content-type":"application/json" },
        body:JSON.stringify({
          model,
          system:systemWithMemory(language, memory),
          messages:[...safeHistory(history), { role:"user", content:callerText }],
          temperature:0.55,
          max_tokens:tokenLimitFor(language),
          stream:true
        })
      })
      if (!response.ok) throw new Error(`Anthropic ${model} stream failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
      const reader = response.body?.getReader(); if (!reader) throw new Error("Anthropic returned no stream")
      const decoder = new TextDecoder(); let buffered = ""
      const consume = eventBlock => {
        const data = eventBlock.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n")
        if (!data) return []
        const event = JSON.parse(data)
        const text = event.type === "content_block_delta" ? event.delta?.text || "" : ""
        return text ? [{ text, usage:event.usage || {} }] : []
      }
      while (true) {
        const { done, value } = await reader.read(); buffered += decoder.decode(value || new Uint8Array(), { stream:!done })
        const blocks = buffered.split(/\r?\n\r?\n/); buffered = blocks.pop() || ""
        for (const block of blocks) for (const event of consume(block)) yield event
        if (done) break
      }
      if (buffered.trim()) for (const event of consume(buffered)) yield event
    }
  }
}
