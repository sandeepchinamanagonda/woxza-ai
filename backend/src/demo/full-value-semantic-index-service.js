import { fileURLToPath } from "node:url"
import {
  adaptFullValueIntentCatalog,
  createGeminiRouteEmbeddingAdapter,
  createSemanticRouteIndex
} from "./semantic-route-index.js"
import { loadSemanticIntentCatalog } from "./semantic-intent-router.js"
import { createSemanticRouteDecisionEngine } from "./semantic-route-decision-engine.js"

const defaultCatalogPath = () => fileURLToPath(new URL("../../demo_prompts/full-value-explanation-intents.json", import.meta.url))
const defaultCachePath = () => fileURLToPath(new URL("../../.runtime/semantic-route-index/full-value-explanation.json", import.meta.url))

// This service is intentionally not wired into the live bridge yet. Operators
// can build or refresh the durable index before Phase 3 shadow routing uses it.
export function createFullValueSemanticIndexService({
  catalogPath=process.env.V3_SEMANTIC_ROUTE_CATALOG_PATH || defaultCatalogPath(),
  cachePath=process.env.V3_SEMANTIC_ROUTE_INDEX_PATH || defaultCachePath(),
  embedder=createGeminiRouteEmbeddingAdapter()
}={}) {
  let prepared
  const prepare = () => {
    if (prepared) return prepared
    const loaded = loadSemanticIntentCatalog(catalogPath)
    if (!loaded.valid) {
      prepared = { status:"catalog_unavailable", catalogPath, cachePath, errors:loaded.errors }
      return prepared
    }
    if (!embedder) {
      prepared = { status:"embedding_unavailable", catalogPath, cachePath, errors:["GEMINI_API_KEY is not configured"] }
      return prepared
    }
    const catalog = adaptFullValueIntentCatalog(loaded.catalog)
    prepared = {
      status:"ready",
      catalog,
      route:catalog.routes[0],
      index:createSemanticRouteIndex({ catalog, cachePath, embedder })
    }
    return prepared
  }
  return {
    status() {
      const prepared = prepare()
      if (prepared.status !== "ready") return prepared
      return { ...prepared.index.status(), catalogPath }
    },
    async sync() {
      const prepared = prepare()
      if (prepared.status !== "ready") return prepared
      return { ...(await prepared.index.sync()), catalogPath }
    },
    // A runtime consumer can use the already-persisted index without knowing
    // how the legacy full-value catalog is stored or adapted.
    runtime() {
      const current = prepare()
      if (current.status !== "ready") return current
      return { status:"ready", catalogPath, cachePath, route:current.route, index:current.index }
    }
  }
}

// Phase 3 deliberately returns only telemetry-safe decisions. If the index is
// absent or stale, it starts a background refresh and reports `index_warming`;
// it never makes a live caller turn wait for 390 catalog embeddings.
export function createFullValueSemanticShadowService(options={}) {
  const indexService = createFullValueSemanticIndexService(options)
  let warming
  const warmInBackground = () => {
    warming ||= indexService.sync().catch(() => null).finally(() => { warming = undefined })
    return warming
  }
  return {
    status() { return indexService.status() },
    warm() { return warmInBackground() },
    async evaluate(context) {
      const runtime = indexService.runtime()
      if (runtime.status !== "ready") return { decision:"no_decision", reason:runtime.status, catalog_status:runtime.status }
      const indexStatus = runtime.index.status()
      if (indexStatus.status !== "ready") {
        void warmInBackground()
        return { decision:"no_decision", reason:"index_warming", catalog_status:"ready", index_status:indexStatus.status }
      }
      try {
        const result = await createSemanticRouteDecisionEngine({ index:runtime.index }).decide({ route:runtime.route, context })
        return { ...result, catalog_status:"ready", index_status:"ready" }
      } catch (error) {
        return { decision:"no_decision", reason:"evaluation_error", catalog_status:"ready", index_status:"ready", error:error.message }
      }
    }
  }
}
