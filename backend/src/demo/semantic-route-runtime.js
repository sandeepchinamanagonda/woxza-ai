import { createFullValueSemanticIndexService } from "./full-value-semantic-index-service.js"
import { createOpeningPermissionSemanticIndexService } from "./opening-permission-semantic-index-service.js"

const publicStatus = status => ({
  status:status?.status || "unavailable",
  documentCount:Number(status?.documentCount || 0),
  catalogHash:status?.catalogHash || null,
  indexVersion:status?.schemaVersion || null,
  updatedAt:status?.updatedAt || null,
  errors:Array.isArray(status?.errors) ? status.errors : []
})

// One process-level owner for durable semantic indexes. It makes startup
// warming and readiness observable without exposing catalog or cache paths.
export function createSemanticRouteRuntime({
  openingPermission=createOpeningPermissionSemanticIndexService(),
  fullValue=createFullValueSemanticIndexService()
}={}) {
  const services = { opening_permission:openingPermission, full_value_explanation:fullValue }
  return {
    status() {
      return Object.fromEntries(Object.entries(services).map(([routeId, service]) => [routeId, publicStatus(service.status())]))
    },
    async warm() {
      const results = await Promise.allSettled(Object.entries(services).map(async ([routeId, service]) => [routeId, publicStatus(await service.sync())]))
      return Object.fromEntries(results.map((result, index) => {
        const routeId = Object.keys(services)[index]
        return result.status === "fulfilled" ? result.value : [routeId, { status:"sync_failed", documentCount:0, catalogHash:null, indexVersion:null, updatedAt:null, errors:[result.reason?.message || "Unknown sync failure"] }]
      }))
    }
  }
}
