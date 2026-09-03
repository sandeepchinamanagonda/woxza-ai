#!/usr/bin/env node
/**
 * Replays the same multilingual business conversations through each configured
 * text brain. It deliberately does not call a phone number: STT/TTS/carrier
 * variability would hide the model comparison. Every record preserves the raw
 * text for a native-language reviewer and reports streaming latency metrics.
 *
 * Usage:
 *   node backend/scripts/benchmark-voice-brains.mjs
 *   node backend/scripts/benchmark-voice-brains.mjs --runs=3 --providers=sarvam,gemini,anthropic
 *   node backend/scripts/benchmark-voice-brains.mjs --runs=1 --languages=te --turns=1  # smoke test
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { buildWoxzaConversationPrompt } from "../src/demo/openrouter-conversation.js"

const root = resolve(import.meta.dirname, "../..")
const parseArgs = () => Object.fromEntries(process.argv.slice(2).map(arg => {
  const [key, value="true"] = arg.replace(/^--/, "").split("=")
  return [key, value]
}))
const args = parseArgs()

// Node does not load .env by default. This small parser is intentionally
// limited to KEY=value pairs and never prints values.
const envFile = await readFile(resolve(root, ".env"), "utf8").catch(() => "")
for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/)
  if (!match || process.env[match[1]] !== undefined) continue
  process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "")
}

const languageScenarios = {
  en:[
    "Hello, I want to understand how Woxza can help my business.",
    "I run a medical distribution business supplying retail medical shops.",
    "We use both calls and WhatsApp for follow-up.",
    "Yes.",
    "About 400 customers need follow-up, and my team handles reminders and order follow-up.",
    "Please explain simply how Woxza would help us."
  ],
  te:[
    "హలో, నా business కి Woxza ఎలా ఉపయోగపడుతుందో తెలుసుకోవాలి.",
    "మాది retail medical shops కి supply చేసే medical distribution business.",
    "follow-up కి calls, WhatsApp రెండూ వాడతాం.",
    "అవును.",
    "సుమారుగా 400 customers కి follow-up చేయాలి. మా team reminders, orders follow-up చేస్తుంది.",
    "Woxza మాకు ఎలా ఉపయోగపడుతుందో సింపుల్‌గా చెప్పండి."
  ],
  hi:[
    "नमस्ते, मैं जानना चाहता हूँ कि Woxza मेरे business में कैसे मदद कर सकता है।",
    "मेरा medical distribution business है और हम retail medical shops को supply करते हैं।",
    "follow-up के लिए calls और WhatsApp दोनों इस्तेमाल करते हैं।",
    "हाँ।",
    "लगभग 400 customers को follow-up करना होता है। हमारी team reminders और orders follow-up करती है।",
    "कृपया सरल तरीके से बताइए कि Woxza हमारी कैसे मदद करेगा।"
  ],
  ta:[
    "வணக்கம், என் business-க்கு Woxza எப்படி உதவும் என்று தெரிந்துகொள்ள விரும்புகிறேன்.",
    "எங்களுடையது retail medical shops-க்கு supply செய்யும் medical distribution business.",
    "follow-up-க்கு calls மற்றும் WhatsApp இரண்டையும் பயன்படுத்துகிறோம்.",
    "ஆமாம்.",
    "சுமார் 400 customers-ஐ follow-up செய்ய வேண்டும். எங்கள் team reminders மற்றும் orders follow-up செய்கிறது.",
    "Woxza எங்களுக்கு எப்படி உதவும் என்பதை எளிமையாகச் சொல்லுங்கள்."
  ]
}

const providers = {
  sarvam:{ key:"SARVAM_API_KEY", model:process.env.SARVAM_CHAT_MODEL || "sarvam-105b-conversations" },
  anthropic:{ key:"ANTHROPIC_API_KEY", model:process.env.V3_ANTHROPIC_MODEL || "claude-sonnet-4-6" },
  gemini:{ key:"GEMINI_API_KEY", model:process.env.BENCHMARK_GEMINI_MODEL || "gemini-2.5-flash" },
  gemini_lite:{ key:"GEMINI_API_KEY", model:process.env.BENCHMARK_GEMINI_LITE_MODEL || "gemini-2.5-flash-lite" },
  openai:{ key:"OPENAI_API_KEY", model:process.env.V3_OPENAI_MODEL || "gpt-4.1-mini" },
  mistral:{ key:"MISTRAL_API_KEY", model:process.env.BENCHMARK_MISTRAL_MODEL || "mistral-medium-latest" }
}
const selectedProviders = (args.providers || Object.keys(providers).join(",")).split(",").filter(name => providers[name])
const runs = Math.max(1, Math.min(10, Number(args.runs || "3")))
const selectedLanguages = (args.languages || Object.keys(languageScenarios).join(",")).split(",").filter(language => languageScenarios[language])
const turnsPerConversation = Math.max(1, Math.min(languageScenarios.en.length, Number(args.turns || languageScenarios.en.length)))
const maxTokens = Math.max(32, Math.min(256, Number(process.env.VOICE_RESPONSE_MAX_TOKENS_TE || "120")))
const requestTimeoutMs = Math.max(5_000, Math.min(120_000, Number(args.timeout_ms || process.env.BENCHMARK_REQUEST_TIMEOUT_MS || "45000")))
const scriptFor = language => ({ en:/[A-Za-z]/u, te:/[\u0C00-\u0C7F]/u, hi:/[\u0900-\u097F]/u, ta:/[\u0B80-\u0BFF]/u }[language])
const terminal = text => /[.!?…。！？]$/u.test(String(text || "").trim())
const now = () => performance.now()
const system = (language, facts) => `${buildWoxzaConversationPrompt(language)}\n\nCALL_STATE_JSON (authoritative facts and already-covered topics):\n${JSON.stringify({ opening_delivered:true, turns:facts })}`
const timedFetch = (url, options) => fetch(url, { ...options, signal:AbortSignal.timeout(requestTimeoutMs) })

async function readSse(response, onEvent) {
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`)
  const reader = response.body?.getReader(); if (!reader) throw new Error("Provider returned no stream")
  const decoder = new TextDecoder(); let buffer = ""
  while (true) {
    const { done, value } = await reader.read()
    buffer += decoder.decode(value || new Uint8Array(), { stream:!done })
    const blocks = buffer.split(/\r?\n\r?\n/); buffer = blocks.pop() || ""
    for (const block of blocks) {
      const data = block.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n")
      if (data && data !== "[DONE]") onEvent(JSON.parse(data))
    }
    if (done) break
  }
  if (buffer.trim()) {
    const data = buffer.split(/\r?\n/).filter(line => line.startsWith("data:")).map(line => line.slice(5).trim()).join("\n")
    if (data && data !== "[DONE]") onEvent(JSON.parse(data))
  }
}

async function streamedReply(providerName, language, history, facts) {
  const provider = providers[providerName], started = now(); let firstTokenMs = null, text = "", stopReason = null, usage = {}
  const noteText = value => { if (value) { if (firstTokenMs === null) firstTokenMs = Math.round(now() - started); text += value } }
  if (providerName === "sarvam") {
    const response = await timedFetch("https://api.sarvam.ai/v1/chat/completions", { method:"POST", headers:{ "api-subscription-key":process.env[provider.key], "content-type":"application/json" }, body:JSON.stringify({ model:provider.model, messages:[{ role:"system", content:system(language, facts) }, ...history], reasoning_effort:null, temperature:0.2, max_tokens:maxTokens, stream:true }) })
    await readSse(response, event => { usage = event.usage || usage; noteText(event.choices?.[0]?.delta?.content); stopReason ||= event.choices?.[0]?.finish_reason || null })
  } else if (providerName === "anthropic") {
    const response = await timedFetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{ "x-api-key":process.env[provider.key], "anthropic-version":"2023-06-01", "content-type":"application/json" }, body:JSON.stringify({ model:provider.model, system:system(language, facts), messages:history, temperature:0.2, max_tokens:maxTokens, stream:true }) })
    await readSse(response, event => { noteText(event.type === "content_block_delta" ? event.delta?.text : ""); if (event.type === "message_delta") { stopReason = event.delta?.stop_reason || null; usage = event.usage || usage } })
  } else if (providerName === "gemini" || providerName === "gemini_lite") {
    const contents = history.map(message => ({ role:message.role === "assistant" ? "model" : "user", parts:[{ text:message.content }] }))
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(provider.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(process.env[provider.key])}`
    const response = await timedFetch(url, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ systemInstruction:{ parts:[{ text:system(language, facts) }] }, contents, generationConfig:{ temperature:0.2, maxOutputTokens:maxTokens } }) })
    await readSse(response, event => { noteText(event.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("")); stopReason ||= event.candidates?.[0]?.finishReason || null; usage = event.usageMetadata || usage })
  } else {
    const endpoint = providerName === "openai" ? "https://api.openai.com/v1/chat/completions" : "https://api.mistral.ai/v1/chat/completions"
    const response = await timedFetch(endpoint, { method:"POST", headers:{ authorization:`Bearer ${process.env[provider.key]}`, "content-type":"application/json" }, body:JSON.stringify({ model:provider.model, messages:[{ role:"system", content:system(language, facts) }, ...history], temperature:0.2, max_tokens:maxTokens, stream:true }) })
    await readSse(response, event => { noteText(event.choices?.[0]?.delta?.content); stopReason ||= event.choices?.[0]?.finish_reason || null; usage = event.usage || usage })
  }
  if (!text.trim()) throw new Error("Provider completed without caller-facing text")
  return { text:text.trim(), first_token_ms:firstTokenMs, full_response_ms:Math.round(now() - started), stop_reason:stopReason, usage, terminal_punctuation:terminal(text), target_script_present:scriptFor(language).test(text) }
}

const mean = values => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
const percentile = (values, p) => values.length ? values.slice().sort((a, b) => a - b)[Math.min(values.length - 1, Math.ceil(values.length * p) - 1)] : null
const records = []
for (const providerName of selectedProviders) {
  const provider = providers[providerName]
  if (!process.env[provider.key]) { console.error(`[benchmark] skip ${providerName}: ${provider.key} is not configured`); records.push({ provider:providerName, model:provider.model, skipped:true, reason:`${provider.key} is not configured` }); continue }
  console.error(`[benchmark] provider=${providerName} model=${provider.model}`)
  for (const language of selectedLanguages) for (let run = 1; run <= runs; run += 1) {
    const callerTurns = languageScenarios[language].slice(0, turnsPerConversation)
    console.error(`[benchmark] ${providerName} ${language} run ${run}/${runs}`)
    const history = [], facts = []
    for (const caller of callerTurns) {
      history.push({ role:"user", content:caller })
      try {
        const reply = await streamedReply(providerName, language, history, facts)
        history.push({ role:"assistant", content:reply.text }); facts.push({ turn:facts.length + 1, caller, agent:reply.text })
        records.push({ provider:providerName, model:provider.model, language, run, caller, ...reply })
      } catch (error) { console.error(`[benchmark] error ${providerName} ${language} run ${run}: ${error.message}`); records.push({ provider:providerName, model:provider.model, language, run, caller, error:error.message }); break }
    }
  }
}

const summary = Object.values(records.filter(row => !row.skipped && !row.error).reduce((groups, row) => {
  const key = `${row.provider}:${row.language}`; (groups[key] ||= { provider:row.provider, model:row.model, language:row.language, rows:[] }).rows.push(row); return groups
}, {})).map(group => {
  const rows = group.rows, first = rows.map(row => row.first_token_ms).filter(Number.isFinite), full = rows.map(row => row.full_response_ms)
  return { provider:group.provider, model:group.model, language:group.language, responses:rows.length, first_token_ms:{ mean:mean(first), p50:percentile(first, .5), p95:percentile(first, .95) }, full_response_ms:{ mean:mean(full), p50:percentile(full, .5), p95:percentile(full, .95) }, terminal_completion_rate:Number((rows.filter(row => row.terminal_punctuation).length / rows.length).toFixed(3)), target_script_rate:Number((rows.filter(row => row.target_script_present).length / rows.length).toFixed(3)), errors:records.filter(row => row.provider === group.provider && row.language === group.language && row.error).map(row => row.error) }
})

const report = { generated_at:new Date().toISOString(), scope:{ runs_per_language:runs, languages:selectedLanguages, turns_per_conversation:turnsPerConversation, max_tokens:maxTokens, request_timeout_ms:requestTimeoutMs, providers:selectedProviders }, historical_live_reference:{ sarvam_v3_best_first_audio_ms:2510, sarvam_v3_endpoint_tuned_first_audio_ms:2650, claude_sonnet_latest_first_audio_ms:3284, note:"Historical live numbers include STT, TTS, and carrier playback; this report measures text-brain streaming only." }, summary, skipped:records.filter(row => row.skipped), records }
const outputDir = resolve(root, "backend/data/benchmarks"); await mkdir(outputDir, { recursive:true })
const output = resolve(outputDir, `voice-brain-benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}.json`)
await writeFile(output, JSON.stringify(report, null, 2))
console.log(JSON.stringify({ output, summary, skipped:report.skipped, responses:records.filter(row => row.text).length }, null, 2))
