import { fileURLToPath } from "node:url"
import { readFileSync } from "node:fs"
import {
  adaptOpeningPermissionScenarioCatalog,
  createGeminiRouteEmbeddingAdapter,
  createSemanticRouteIndex
} from "./semantic-route-index.js"
import { createSemanticRouteDecisionEngine } from "./semantic-route-decision-engine.js"

const defaultCatalogPath = () => fileURLToPath(new URL("../../demo_prompts/opening-permission-scenarios.json", import.meta.url))
const defaultCachePath = () => fileURLToPath(new URL("../../.runtime/semantic-route-index/opening-permission.json", import.meta.url))

export function createOpeningPermissionSemanticIndexService({
  catalogPath=process.env.V3_OPENING_PERMISSION_CATALOG_PATH || defaultCatalogPath(),
  cachePath=process.env.V3_OPENING_PERMISSION_INDEX_PATH || defaultCachePath(),
  embedder=createGeminiRouteEmbeddingAdapter()
}={}) {
  let prepared
  const prepare = () => {
    if (prepared) return prepared
    try {
      if (!embedder) return prepared = { status:"embedding_unavailable", catalogPath, cachePath }
      const catalog = adaptOpeningPermissionScenarioCatalog(JSON.parse(readFileSync(catalogPath, "utf8")))
      return prepared = { status:"ready", catalogPath, cachePath, catalog, index:createSemanticRouteIndex({ catalog, cachePath, embedder }) }
    } catch (error) {
      return prepared = { status:"catalog_unavailable", catalogPath, cachePath, errors:[error.message] }
    }
  }
  return {
    status() {
      const current = prepare()
      return current.status === "ready" ? { ...current.index.status(), catalogPath } : current
    },
    async sync() {
      const current = prepare()
      return current.status === "ready" ? { ...(await current.index.sync()), catalogPath } : current
    },
    runtime() { return prepare() }
  }
}

// Never blocks or changes a caller turn. A stale index starts one background
// build; later calls use the persisted vectors to produce review telemetry.
export function createOpeningPermissionSemanticShadowService(options={}) {
  const service = createOpeningPermissionSemanticIndexService(options)
  let warming
  const warm = () => warming ||= service.sync().catch(() => null).finally(() => { warming = undefined })
  return {
    status() { return service.status() },
    async evaluate({ routeId, context }) {
      const runtime = service.runtime()
      if (runtime.status !== "ready") return { decision:"no_decision", reason:runtime.status }
      const indexStatus = runtime.index.status()
      if (indexStatus.status !== "ready") { void warm(); return { decision:"no_decision", reason:"index_warming" } }
      const route = runtime.catalog.routes.find(candidate => candidate.id === routeId)
      if (!route) return { decision:"no_decision", reason:"route_unavailable" }
      try { return await createSemanticRouteDecisionEngine({ index:runtime.index }).decide({ route, context }) }
      catch (error) { return { decision:"no_decision", reason:"evaluation_error", error:error.message } }
    }
  }
}
