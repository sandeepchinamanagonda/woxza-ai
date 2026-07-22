import { createCallSession } from "./orchestrator.js"

const local = new Map()
const keyFor = ({ tenantId="woxza", callId }) => `woxza:${tenantId}:call:${callId}:session`
const artifactKeyFor = ({ tenantId="woxza", callId, artifact }) => `woxza:${tenantId}:call:${callId}:${artifact}`

export function createOrchestratorStore({ redis=null, tenantId="woxza" }={}) {
  return {
    async load(callId, language="en") {
      const key = keyFor({ tenantId, callId })
      const raw = redis ? await redis.get(key) : local.get(key)
      return raw ? JSON.parse(raw) : createCallSession({ callId, tenantId, language })
    },
    async save(session) {
      const key = keyFor({ tenantId, callId:session.call_id })
      const raw = JSON.stringify(session)
      if (redis) await redis.set(key, raw, "EX", 60 * 30)
      else local.set(key, raw)
      return session
    },
    async saveArtifact(callId, artifact, value) {
      if (!["pitch", "demo"].includes(artifact)) throw new Error("Unsupported orchestrator artifact")
      const key = artifactKeyFor({ tenantId, callId, artifact })
      const raw = JSON.stringify(value)
      if (redis) await redis.set(key, raw, "EX", 60 * 30)
      else local.set(key, raw)
      return value
    },
    async loadArtifact(callId, artifact) {
      if (!["pitch", "demo"].includes(artifact)) return null
      const key = artifactKeyFor({ tenantId, callId, artifact })
      const raw = redis ? await redis.get(key) : local.get(key)
      return raw ? JSON.parse(raw) : null
    },
    async remove(callId) {
      const key = keyFor({ tenantId, callId })
      if (redis) await redis.del(key)
      else local.delete(key)
    }
  }
}
