#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import corpus from "../backend/demo_assets/pronunciation-audit-corpus.json" with { type:"json" }
import { normalizeTtsText } from "../backend/src/demo/tts-text-normalizer.js"
import { resolveTtsSpeaker, sarvamLanguageCode } from "../backend/src/demo/sarvam-api.js"

const api = "https://api.sarvam.ai"
const sampleRate = 16_000
const output = path.resolve(process.env.PRONUNCIATION_AUDIT_OUTPUT_DIR || "artifacts/pronunciation-audit")
const dictionaryId = process.env.SARVAM_TTS_PRONUNCIATION_DICT_ID || ""
const dryRun = process.argv.includes("--dry-run")

const wav = pcm => {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

async function synthesize({ language, text }) {
  const rendered = normalizeTtsText(text, { language, dictionaryEnabled:Boolean(dictionaryId) })
  const response = await fetch(`${api}/text-to-speech`, {
    method:"POST",
    headers:{ "api-subscription-key":process.env.SARVAM_API_KEY, "content-type":"application/json" },
    body:JSON.stringify({
      text:rendered, language_code:sarvamLanguageCode(language), model:process.env.SARVAM_TTS_MODEL || "bulbul:v3",
      speaker:resolveTtsSpeaker(language), pace:Number(process.env[`SARVAM_TTS_PACE_${language.toUpperCase()}`] || process.env.SARVAM_TTS_PACE || "1.15"),
      temperature:Number(process.env[`SARVAM_TTS_TEMPERATURE_${language.toUpperCase()}`] || process.env.SARVAM_TTS_TEMPERATURE || "0.70"),
      speech_sample_rate:sampleRate, output_audio_codec:"linear16", ...(dictionaryId ? { dict_id:dictionaryId } : {})
    })
  })
  if (!response.ok) throw new Error(`Sarvam ${response.status}: ${(await response.text()).slice(0, 200)}`)
  const body = await response.json(); const audio = body.audios?.[0]
  if (!audio) throw new Error("Sarvam returned no audio")
  return { rendered, pcm:Buffer.from(audio, "base64") }
}

async function main() {
  const cases = Object.entries(corpus).flatMap(([language, texts]) => texts.map((text, index) => ({ id:`${language}-${index + 1}`, language, text })))
  const preview = cases.map(item => ({ ...item, rendered:normalizeTtsText(item.text, { language:item.language, dictionaryEnabled:Boolean(dictionaryId) }) }))
  if (dryRun) return console.log(JSON.stringify({ dictionaryEnabled:Boolean(dictionaryId), cases:preview }, null, 2))
  if (!process.env.SARVAM_API_KEY) throw new Error("SARVAM_API_KEY is required; use --dry-run for a no-cost preview")
  await mkdir(output, { recursive:true })
  const records = []
  for (const item of preview) {
    console.log(`Synthesizing ${item.id}`)
    const { rendered, pcm } = await synthesize(item)
    const audioFile = `${item.id}.wav`
    await writeFile(path.join(output, audioFile), wav(pcm))
    records.push({ ...item, rendered, audioFile, seconds:Number((pcm.length / (sampleRate * 2)).toFixed(2)) })
  }
  await writeFile(path.join(output, "manifest.json"), JSON.stringify({ generatedAt:new Date().toISOString(), dictionaryEnabled:Boolean(dictionaryId), records }, null, 2))
  await writeFile(path.join(output, "index.html"), `<!doctype html><meta charset="utf-8"><title>Woxza pronunciation audit</title><style>body{font:16px system-ui;margin:2rem}article{margin:1.5rem 0}audio{display:block;margin-top:.5rem}</style><h1>Woxza pronunciation audit</h1>${records.map(r => `<article><strong>${r.id}</strong><p>${r.rendered}</p><audio controls src="${r.audioFile}"></audio></article>`).join("\n")}`)
  console.log(JSON.stringify({ output, samples:records.length, dictionaryEnabled:Boolean(dictionaryId) }))
}

main().catch(error => { console.error(error.message); process.exitCode = 1 })
