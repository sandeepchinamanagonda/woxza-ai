import { readFile } from "node:fs/promises"

const source = new URL("../../demo_prompts/capability-catalog.json", import.meta.url)
const intentSource = new URL("../../demo_prompts/capability-pitch-intents.json", import.meta.url)
const localeDirectory = new URL("../../demo_prompts/capability-catalog.locales/", import.meta.url)
let cachedCanonicalCatalog
let cachedConversationIntents
const localizedCatalogs = new Map()
const array = value => Array.isArray(value) ? value : []
const text = value => String(value || "").trim()

export function normalizeCapabilityCatalog(value={}) {
  return array(value.capabilities).map(item => ({
    id:text(item.id), title:text(item.title), callerSafeClaim:text(item.callerSafeClaim), callerImpact:text(item.callerImpact),
    availability:text(item.availability), requirements:array(item.requirements).map(text).filter(Boolean),
    demoMode:text(item.demoMode), matches:item.matches || {}, sourceIds:array(item.sourceIds).map(text).filter(Boolean),
    reviewStatus:text(item.reviewStatus)
  })).filter(item => item.id && item.callerSafeClaim && item.reviewStatus === "approved" && ["live", "configurable"].includes(item.availability))
}

// Indian callers naturally code-switch. A Telugu pack must add Telugu terms,
// not remove useful English terms such as "CRM", "restaurant", "order", or
// "WhatsApp" from the canonical matching vocabulary.
const localizedTerms = (record, field, fallback) => [...new Set([
  ...array(fallback).map(text).filter(Boolean),
  ...array(record?.matchTerms?.[field]).map(text).filter(Boolean)
])]

async function canonicalCatalog() {
  if (!cachedCanonicalCatalog) cachedCanonicalCatalog = readFile(source, "utf8").then(JSON.parse).then(normalizeCapabilityCatalog)
  return cachedCanonicalCatalog
}

export async function getConversationIntentCatalog() {
  if (!cachedConversationIntents) cachedConversationIntents = readFile(intentSource, "utf8").then(JSON.parse).then(value => array(value?.intents).map(item => ({
    id:text(item.id), meaning:text(item.meaning), requiredContext:array(item.requiredContext).map(text).filter(Boolean),
    maximumFollowUpQuestions:Math.max(0, Number(item.maximumFollowUpQuestions) || 0), nextBehavior:text(item.nextBehavior), reviewStatus:text(item.reviewStatus)
  })).filter(item => item.id && item.meaning && item.reviewStatus === "approved"))
  return cachedConversationIntents
}

async function localeCatalog(language) {
  const code = text(language).toLowerCase() || "en"
  if (!localizedCatalogs.has(code)) {
    const localeSource = new URL(`${code}.json`, localeDirectory)
    localizedCatalogs.set(code, readFile(localeSource, "utf8").then(JSON.parse).catch(error => {
      if (code !== "en") return localeCatalog("en")
      throw error
    }))
  }
  return localizedCatalogs.get(code)
}

export async function getCapabilityCatalog(language="en") {
  const [canonical, locale] = await Promise.all([canonicalCatalog(), localeCatalog(language)])
  const records = locale?.records || {}
  return canonical.map(capability => {
    const translated = records[capability.id] || {}
    return {
      ...capability,
      title:text(translated.title) || capability.title,
      callerSafeClaim:text(translated.claim) || capability.callerSafeClaim,
      matches:{
        businessTerms:localizedTerms(translated, "business", array(capability.matches.businessTerms)),
        workflowTerms:localizedTerms(translated, "workflow", array(capability.matches.workflowTerms)),
        painTerms:localizedTerms(translated, "pain", array(capability.matches.painTerms))
      }
    }
  })
}
