import { createHash } from "node:crypto"

export function createAudioChunkDeduplicator({ now=Date.now, windowMs=2_500 }={}) {
  const recent = new Map()
  return {
    shouldForward(actionId, chunk) {
      const key = `${actionId || "unapproved"}:${createHash("sha1").update(chunk).digest("hex")}`
      const at = now()
      const previous = recent.get(key)
      for (const [entry, seenAt] of recent) if (at - seenAt > windowMs) recent.delete(entry)
      if (previous != null && at - previous <= windowMs) return false
      recent.set(key, at)
      return true
    },
    clear() { recent.clear() }
  }
}
