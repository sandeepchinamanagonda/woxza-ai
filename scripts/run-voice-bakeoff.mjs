#!/usr/bin/env node
import { mkdir, readFile, writeFile, access } from "node:fs/promises"
import path from "node:path"

const API = "https://api.sarvam.ai"
const ROOT = process.cwd()
const OUTPUT = path.resolve(process.env.VOICE_BAKEOFF_OUTPUT_DIR || "artifacts/voice-bakeoff")
const SAMPLE_RATE = 16_000
const MODEL = "bulbul:v3"
const DICTIONARY_ID = process.env.SARVAM_TTS_PRONUNCIATION_DICT_ID || ""

const FEMALE = ["ritu", "priya", "neha", "pooja", "simran", "kavya", "ishita", "shreya", "roopa", "tanya", "shruti", "suhani", "kavitha", "rupali"]
const MALE = ["shubh", "aditya", "rahul", "rohan", "amit", "dev", "ratan", "varun", "manan", "sumit", "kabir", "aayan", "ashutosh", "advait", "anand", "tarun", "sunny", "mani", "gokul", "vijay", "mohit", "rehan", "soham"]
const VOICES = [...FEMALE.map(speaker => ({ speaker, gender:"female" })), ...MALE.map(speaker => ({ speaker, gender:"male" }))]

const LANGUAGES = {
  te: { code:"te-IN", label:"Telugu", text:"నమస్కారం! మీ WhatsApp enquiries రోజుకి 5 నుంచి 6 గంటలు తీసుకుంటున్నాయా? Woxza వాటిని సులభంగా చూసుకోవడంలో సహాయపడుతుంది." },
  hi: { code:"hi-IN", label:"Hindi", text:"नमस्ते! क्या आपके WhatsApp enquiries में रोज़ 5 से 6 घंटे लगते हैं? Woxza उन्हें आसानी से संभालने में मदद कर सकता है।" },
  ta: { code:"ta-IN", label:"Tamil", text:"வணக்கம்! உங்கள் WhatsApp enquiries-க்கு தினமும் 5 முதல் 6 மணி நேரம் செலவாகிறதா? Woxza அதை எளிதாக கையாள உதவும்." },
  en: { code:"en-IN", label:"English", text:"Hello! Do your WhatsApp enquiries take five to six hours each day? Woxza can help you handle them more easily." }
}

// Sarvam's published production recommendations. This is evidence for a
// shortlist, not a claim that a non-listed voice is inferior to human ears.
const RECOMMENDED = {
  te: { female:["neha", "priya"], male:["shubh", "ratan"] },
  hi: { female:["priya", "suhani"], male:["shubh", "ashutosh"] },
  ta: { female:["ishita", "ritu"], male:["ratan", "rohan"] },
  en: { female:["ishita"], male:["ratan"] }
}

const exists = async file => access(file).then(() => true).catch(() => false)
const wav = pcm => {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(SAMPLE_RATE, 24); header.writeUInt32LE(SAMPLE_RATE * 2, 28); header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}
const durationSeconds = bytes => Number((bytes / (SAMPLE_RATE * 2)).toFixed(2))
const recommendationScore = ({ language, speaker, gender }) => RECOMMENDED[language][gender].includes(speaker) ? 40 : 0
const technicalScore = result => result.ok ? Math.min(60, 40 + (result.durationSeconds >= 2 && result.durationSeconds <= 20 ? 20 : 0)) : 0

async function synthesize({ language, speaker }) {
  const config = LANGUAGES[language]
  const response = await fetch(`${API}/text-to-speech`, {
    method:"POST",
    headers:{ "api-subscription-key":process.env.SARVAM_API_KEY, "content-type":"application/json" },
    body:JSON.stringify({ text:config.text, language_code:config.code, model:MODEL, speaker, pace:1.15, temperature:0.72, speech_sample_rate:SAMPLE_RATE, output_audio_codec:"linear16", ...(DICTIONARY_ID ? { dict_id:DICTIONARY_ID } : {}) })
  })
  if (!response.ok) throw new Error(`Sarvam ${response.status}: ${(await response.text()).slice(0, 240)}`)
  const body = await response.json()
  const audio = body.audios?.[0]
  if (!audio) throw new Error("Sarvam returned no audio")
  return Buffer.from(audio, "base64")
}

function html(records) {
  const rows = records.map(record => `<tr><td>${record.languageLabel}</td><td>${record.gender}</td><td>${record.speaker}</td><td>${record.evidenceScore}</td><td>${record.durationSeconds ?? "—"}</td><td>${record.ok ? `<audio controls preload="none" src="${record.audioFile}"></audio>` : `<code>${record.error}</code>`}</td><td><select><option>Not rated</option><option>1 — robotic</option><option>2</option><option>3</option><option>4</option><option>5 — most natural</option></select></td></tr>`).join("\n")
  return `<!doctype html><html><head><meta charset="utf-8"><title>Woxza voice bake-off</title><style>body{font:15px system-ui;margin:28px;background:#0b1120;color:#e5e7eb}table{width:100%;border-collapse:collapse}th,td{padding:10px;border-bottom:1px solid #263244;text-align:left}audio{width:230px}select{background:#111827;color:white;padding:5px}code{color:#fca5a5}</style></head><body><h1>Woxza Voice Bake-off</h1><p>Evidence score = Sarvam language recommendation (40) + successful, duration-valid synthesis (60). It is not a human-naturalness score. Use the final column while listening.</p><table><thead><tr><th>Language</th><th>Gender</th><th>Voice</th><th>Evidence score</th><th>Seconds</th><th>Sample</th><th>Your rating</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
}

async function main() {
  if (!process.env.SARVAM_API_KEY) throw new Error("SARVAM_API_KEY is required")
  await mkdir(OUTPUT, { recursive:true })
  const manifestFile = path.join(OUTPUT, "manifest.json")
  const previous = await exists(manifestFile) ? JSON.parse(await readFile(manifestFile, "utf8")) : []
  const byId = new Map(previous.map(record => [record.id, record]))
  const jobs = Object.keys(LANGUAGES).flatMap(language => VOICES.map(voice => ({ language, ...voice })))
  for (const [index, job] of jobs.entries()) {
    const id = `${job.language}-${job.speaker}`
    const audioFile = `${id}.wav`, outputFile = path.join(OUTPUT, audioFile)
    if (byId.get(id)?.ok && await exists(outputFile)) { console.log(`[${index + 1}/${jobs.length}] cached ${id}`); continue }
    try {
      console.log(`[${index + 1}/${jobs.length}] synthesizing ${id}`)
      const pcm = await synthesize(job)
      await writeFile(outputFile, wav(pcm))
      const result = { id, language:job.language, languageLabel:LANGUAGES[job.language].label, speaker:job.speaker, gender:job.gender, ok:true, audioFile, durationSeconds:durationSeconds(pcm.length) }
      result.evidenceScore = recommendationScore(result) + technicalScore(result)
      byId.set(id, result)
    } catch (error) {
      byId.set(id, { id, language:job.language, languageLabel:LANGUAGES[job.language].label, speaker:job.speaker, gender:job.gender, ok:false, audioFile, error:error.message, evidenceScore:recommendationScore(job) })
    }
    await writeFile(manifestFile, JSON.stringify([...byId.values()], null, 2))
  }
  const records = [...byId.values()].sort((a, b) => a.language.localeCompare(b.language) || b.evidenceScore - a.evidenceScore || a.speaker.localeCompare(b.speaker))
  await writeFile(path.join(OUTPUT, "index.html"), html(records))
  const report = ["# Woxza voice bake-off", "", `Generated ${new Date().toISOString()}.`, "", "## Method", "", "Every Bulbul V3 voice was synthesized using the same short business script in Telugu, Hindi, Tamil, and English over the same 16 kHz Linear16 configuration used for telephone audio.", "", "The evidence score is not a claim of human-naturalness: it combines Sarvam's published per-language recommendation (40) and successful, duration-valid generation (60). Listen to `index.html` to make the final human ranking.", "", "## Results", "", "| Language | Voice | Gender | Evidence score | Duration (s) | Status |", "|---|---|---:|---:|---:|---|", ...records.map(r => `| ${r.languageLabel} | ${r.speaker} | ${r.gender} | ${r.evidenceScore} | ${r.durationSeconds ?? "—"} | ${r.ok ? "generated" : `failed: ${r.error}`} |`), ""].join("\n")
  await writeFile(path.join(OUTPUT, "REPORT.md"), report)
  console.log(JSON.stringify({ output:OUTPUT, total:records.length, generated:records.filter(r => r.ok).length, failed:records.filter(r => !r.ok).length }))
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
