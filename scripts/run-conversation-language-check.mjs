#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createGeminiConversation } from "../backend/src/demo/gemini-conversation.js"

const OUTPUT = path.resolve(process.env.VOICE_BAKEOFF_OUTPUT_DIR || "artifacts/voice-bakeoff")
const client = createGeminiConversation()
if (!client) throw new Error("GEMINI_API_KEY is required")

const scenarios = {
  te: [
    "హలో, నా రోజు బాగానే జరుగుతోంది. నా business గురించి మాట్లాడాలి.",
    "మా WhatsApp enquiries కి రోజుకి 5-6 గంటలు పడుతోంది."
  ],
  hi: [
    "नमस्ते, मेरा दिन ठीक चल रहा है। मुझे अपने business के बारे में बात करनी है।",
    "हमारे WhatsApp enquiries में रोज़ 5-6 घंटे लगते हैं।"
  ],
  ta: [
    "வணக்கம், என் நாள் நன்றாக போகிறது. என் business பற்றி பேச வேண்டும்.",
    "எங்கள் WhatsApp enquiries-க்கு தினமும் 5-6 மணி நேரம் ஆகிறது."
  ],
  en: [
    "Hello, my day is going well. I want to talk about my business.",
    "Our WhatsApp enquiries take five to six hours every day."
  ]
}

const localScript = { te:/[\u0C00-\u0C7F]/u, hi:/[\u0900-\u097F]/u, ta:/[\u0B80-\u0BFF]/u, en:/[A-Za-z]/ }
const literalFiller = /^(great|wonderful|that's great|చాలా బాగుంది|వినడానికి సంతోషంగా ఉంది|बहुत बढ़िया|बहुत अच्छा|மிகவும் நல்லது)/iu
const questionCount = text => (text.match(/[?？]/g) || []).length
const score = (language, text) => {
  const terminal = /[.!?।॥…！？]$/u.test(text)
  const brief = [...text].length <= 260
  const oneQuestion = questionCount(text) <= 1
  const local = localScript[language].test(text)
  const noLiteralFiller = !literalFiller.test(text.trim())
  return (terminal ? 25 : 0) + (brief ? 20 : 0) + (oneQuestion ? 20 : 0) + (local ? 15 : 0) + (noLiteralFiller ? 20 : 0)
}

const replies = []
for (const [language, inputs] of Object.entries(scenarios)) {
  const history = []
  for (const callerText of inputs) {
    let text = "", completion = {}
    const requestHistory = [...history, { role:"user", content:callerText }]
    for await (const event of client.replyStream({ language, history:requestHistory, memory:{ opening_delivered:true, turns:[] }, callerText })) {
      if (event.text) text += event.text
      if (event.completion) completion = event.completion
    }
    text = text.trim()
    replies.push({ language, callerText, reply:text, score:score(language, text), characters:[...text].length, questions:questionCount(text), stopReason:completion.stopReason || null })
    history.push({ role:"user", content:callerText }, { role:"assistant", content:text })
  }
}

await mkdir(OUTPUT, { recursive:true })
await writeFile(path.join(OUTPUT, "conversation-language-check.json"), JSON.stringify(replies, null, 2))
const lines = ["# Woxza Conversation Language Check", "", "Structural score: complete ending (25), concise reply (20), one-question discipline (20), expected local script (15), and no literal opening filler (20). This does not replace a native-speaker judgement.", "", "| Language | Caller input | Agent reply | Score |", "|---|---|---|---:|", ...replies.map(r => `| ${r.language} | ${r.callerText.replaceAll("|", "\\|")} | ${r.reply.replaceAll("|", "\\|")} | ${r.score} |`), ""]
await writeFile(path.join(OUTPUT, "CONVERSATION_REPORT.md"), lines.join("\n"))
console.log(JSON.stringify({ output:OUTPUT, checks:replies.length, averageScore:Number((replies.reduce((sum, r) => sum + r.score, 0) / replies.length).toFixed(2)) }))
