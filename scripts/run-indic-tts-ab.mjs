#!/usr/bin/env node
/**
 * Produce a small, repeatable Telugu A/B fixture pack.
 *
 * It deliberately measures signal characteristics only. A human listener must
 * judge warmth, diction, prosody, and conversational naturalness.
 *
 * Usage:
 *   SARVAM_API_KEY=... node scripts/run-indic-tts-ab.mjs
 *
 * Output is gitignored under artifacts/indic-tts-ab/ by default.
 */
import { mkdir, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import path from "node:path"

// The local demo keeps credentials in .env. Read only the two values this
// opt-in benchmark needs; never print either value in its report or console.
const localEnv = (() => {
  try {
    return Object.fromEntries(readFileSync(".env", "utf8").split(/\r?\n/).flatMap(line => {
      const match = line.match(/^\s*([A-Z0-9_]+)=(.*)$/)
      if (!match) return []
      return [[match[1], match[2].trim().replace(/^['"]|['"]$/g, "")]]
    }))
  } catch { return {} }
})()
const outputDirectory = path.resolve(process.env.INDIC_TTS_AB_OUTPUT_DIR || "artifacts/indic-tts-ab")
const indicUrl = String(process.env.INDIC_TTS_URL || localEnv.INDIC_TTS_URL || "http://127.0.0.1:5050").replace(/host\.docker\.internal/, "127.0.0.1").replace(/\/$/, "")
const sarvamKey = process.env.SARVAM_API_KEY || localEnv.SARVAM_API_KEY
const sarvamApi = "https://api.sarvam.ai/text-to-speech"
const rate = 16_000
const fixtures = [
  { id:"greeting", text:"నమస్కారం అండి. వోక్జా డెమోకు స్వాగతం. మీ వ్యాపారం గురించి కొంచెం తెలుసుకోవాలనుకుంటున్నాను." },
  { id:"mixed-words", text:"మీ WhatsApp enquiries రోజుకు 5 నుంచి 6 గంటలు తీసుకుంటున్నాయా? 500 మంది customers కి త్వరగా reply ఇవ్వడం కష్టమవుతుందా?" },
  { id:"business-question", text:"మీరు ఇప్పుడు customers నుంచి వచ్చే calls, messages, మరియు follow-up ను ఎలా నిర్వహిస్తున్నారు?" }
]

function wav(pcm, sampleRate) {
  const header = Buffer.alloc(44)
  header.write("RIFF", 0); header.writeUInt32LE(36 + pcm.length, 4); header.write("WAVEfmt ", 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28); header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34); header.write("data", 36); header.writeUInt32LE(pcm.length, 40)
  return Buffer.concat([header, pcm])
}

function measure(pcm, sampleRate) {
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2))
  let energy = 0, peak = 0, clipped = 0, voiced = 0
  const frameSize = Math.max(1, Math.floor(sampleRate * 0.02))
  let quietFrames = 0, longestQuiet = 0
  for (let offset = 0; offset < samples.length; offset += frameSize) {
    const frame = samples.subarray(offset, Math.min(samples.length, offset + frameSize))
    let frameEnergy = 0
    for (const sample of frame) {
      const magnitude = Math.abs(sample)
      energy += sample * sample; frameEnergy += sample * sample
      peak = Math.max(peak, magnitude)
      if (magnitude >= 32_700) clipped += 1
    }
    const rms = Math.sqrt(frameEnergy / Math.max(1, frame.length))
    if (rms >= 300) { voiced += 1; quietFrames = 0 } else { quietFrames += 1; longestQuiet = Math.max(longestQuiet, quietFrames) }
  }
  const frameCount = Math.ceil(samples.length / frameSize)
  return {
    durationSeconds:Number((samples.length / sampleRate).toFixed(3)),
    rms:Number(Math.sqrt(energy / Math.max(1, samples.length)).toFixed(1)),
    peak,
    clippedPercent:Number((100 * clipped / Math.max(1, samples.length)).toFixed(4)),
    voicedPercent:Number((100 * voiced / Math.max(1, frameCount)).toFixed(1)),
    longestQuietMs:longestQuiet * 20
  }
}

async function responseAudio(response, label) {
  if (!response.ok) throw new Error(`${label} failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
  const audio = Buffer.from(await response.arrayBuffer())
  const contentType = response.headers.get("content-type") || ""
  const sampleRate = Number(contentType.match(/rate=(\d+)/i)?.[1] || response.headers.get("x-audio-sample-rate") || rate)
  return { audio, sampleRate, synthesisMs:Number(response.headers.get("x-synthesis-ms") || 0), requestId:response.headers.get("x-request-id") || null }
}

async function indic(text, sampleRate) {
  const response = await fetch(`${indicUrl}/v1/synthesize`, {
    method:"POST", headers:{ "content-type":"application/json" },
    body:JSON.stringify({ text, language:"te", speaker:"female", sample_rate:sampleRate })
  })
  return responseAudio(response, "AI4Bharat")
}

async function sarvam(text) {
  if (!sarvamKey) return null
  const response = await fetch(sarvamApi, {
    method:"POST", headers:{ "api-subscription-key":sarvamKey, "content-type":"application/json" },
    body:JSON.stringify({ text, language_code:"te-IN", model:"bulbul:v3", speaker:"ritu", pace:1.15, temperature:0.70, speech_sample_rate:rate, output_audio_codec:"linear16" })
  })
  if (!response.ok) throw new Error(`Sarvam failed (${response.status}): ${(await response.text()).slice(0, 300)}`)
  const body = await response.json()
  if (!body.audios?.[0]) throw new Error("Sarvam returned no audio")
  return { audio:Buffer.from(body.audios[0], "base64"), sampleRate:rate, synthesisMs:null, requestId:body.request_id || null }
}

async function saveAudio(id, provider, value) {
  const file = `${id}-${provider}.wav`
  await writeFile(path.join(outputDirectory, file), wav(value.audio, value.sampleRate))
  return { file, ...measure(value.audio, value.sampleRate), synthesisMs:value.synthesisMs, requestId:value.requestId }
}

function report(records) {
  const rows = records.flatMap(record => record.outputs.map(output => `| ${record.id} | ${output.provider} | ${output.sampleRate} Hz | ${output.durationSeconds}s | ${output.rms} | ${output.clippedPercent}% | ${output.longestQuietMs}ms | ${output.synthesisMs ?? "provider not returned"} | [audio](${output.file}) |`))
  return [
    "# AI4Bharat Telugu A/B audio audit", "",
    "This pack compares raw AI4Bharat native audio, AI4Bharat after the same 16 kHz conversion sent to Plivo, and Sarvam Bulbul at 16 kHz. Metrics identify clipping, unexpected silence, and latency; they do not score naturalness.", "",
    "| Fixture | Provider/output | Rate | Duration | RMS | Clipped | Longest quiet run | Synthesis | Audio |",
    "|---|---|---:|---:|---:|---:|---:|---:|---|", ...rows, "",
    "## Listening checklist", "",
    "- Is AI4Bharat already robotic in `indic-native`? If yes, model/prosody is the primary issue.",
    "- Does `indic-16k` materially worsen diction, harshness, or word gaps versus `indic-native`? If yes, conversion is contributing.",
    "- Does `sarvam-16k` remain better at the same telephone rate? If yes, the phone carrier is not the root cause.",
    "- Record human scores separately for naturalness, Telugu diction, number/English-word pronunciation, and sentence completeness.", ""
  ].join("\n")
}

await mkdir(outputDirectory, { recursive:true })
const records = []
for (const fixture of fixtures) {
  console.log(`Rendering ${fixture.id}`)
  const [native, telephony, sarvamOutput] = await Promise.all([indic(fixture.text, "native"), indic(fixture.text, rate), sarvam(fixture.text)])
  const outputs = [
    { provider:"indic-native", sampleRate:native.sampleRate, ...(await saveAudio(fixture.id, "indic-native", native)) },
    { provider:"indic-16k", sampleRate:telephony.sampleRate, ...(await saveAudio(fixture.id, "indic-16k", telephony)) }
  ]
  if (sarvamOutput) outputs.push({ provider:"sarvam-16k", sampleRate:sarvamOutput.sampleRate, ...(await saveAudio(fixture.id, "sarvam-16k", sarvamOutput)) })
  records.push({ ...fixture, outputs })
}
await writeFile(path.join(outputDirectory, "report.json"), JSON.stringify({ generatedAt:new Date().toISOString(), indicUrl, fixtures:records }, null, 2))
await writeFile(path.join(outputDirectory, "REPORT.md"), report(records))
console.log(`Wrote fixture pack to ${outputDirectory}`)
