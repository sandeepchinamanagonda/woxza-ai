import { readFile, readdir } from "node:fs/promises"
import path from "node:path"

const root = new URL("../src/", import.meta.url)
async function walk(directory, prefix="") {
  const entries = await readdir(directory, { withFileTypes:true })
  const nested = await Promise.all(entries.map(async entry => {
    const relative = path.join(prefix, entry.name)
    const target = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory)
    return entry.isDirectory() ? walk(target, relative) : (entry.name.endsWith(".js") ? [relative] : [])
  }))
  return nested.flat()
}
const files = await walk(root)
const sources = await Promise.all(files.map(async name => ({ name, text:await readFile(new URL(name, root), "utf8") })))
const bridge = sources.find(file => file.name === path.join("demo", "gemini-bridge.js"))?.text || ""

// Exhaustive structural carrier audit. This deliberately scans every demo
// source file, including future nested modules—not a hand-maintained list.
const carrierWrites = /(?:\.playAudio\(|event:\s*"media"|event:\s*'media'|event:\s*"playAudio"|event:\s*'playAudio')/g
for (const file of sources) {
  if (file.name !== path.join("demo", "gemini-bridge.js") && carrierWrites.test(file.text)) throw new Error(`Direct carrier audio write found outside the response-job carrier adapter: ${file.name}`)
  carrierWrites.lastIndex = 0
}
if (!bridge.includes("if (approvedTtsRendererEnabled) {\n          if (!rawLiveAudioDiscardNoted)")) {
  throw new Error("Approved-TTS mode must reject all raw Gemini Live audio before carrier delivery")
}
if (!bridge.includes("createResponseJobManager({")) throw new Error("Approved-TTS path must use response-job-manager")
if (!bridge.includes("ttsRenderer.renderJob({ job, manager:responseJobManager })")) throw new Error("Approved-TTS path must render through the job manager")
if ((bridge.match(/plivoStream\.playAudio\(/g) || []).length !== 1) throw new Error("Unexpected direct Plivo audio write; route it through the approved delivery adapter")
if (!bridge.includes('APPROVED_TTS_RENDERER_ENABLED === "true" && !responseJobId')) throw new Error("Carrier adapters must reject audio without a response-job capability in approved mode")
if ((bridge.match(/responseJobId=null/g) || []).length < 2) throw new Error("Both Plivo and Twilio carrier adapters must require a response-job id")
