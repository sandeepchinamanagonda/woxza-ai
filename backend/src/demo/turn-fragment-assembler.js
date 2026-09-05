// A final STT result is not necessarily a complete caller thought. This
// bounded holder protects obvious fragments (for example Telugu "మాది" —
// "mine/ours") from being interpreted as facts while the caller continues.
import { isIncompleteBusinessDescription } from "./turn-normalizer.js"

export function isLikelyIncompleteCallerFragment(text="") {
  const value = String(text).replace(/\s+/g, " ").trim()
  if (!value) return false
  return isIncompleteBusinessDescription(value)
    || /(?:\b(?:and|or|but|because|so|my|our|the)\b|మరి|అంటే|మాది|మా|కానీ|और|लेकिन|तो)$/iu.test(value)
}

export function createTurnFragmentAssembler({ holdMs=900, setTimer=setTimeout, clearTimer=clearTimeout, incomplete=isLikelyIncompleteCallerFragment }={}) {
  let pending = null
  let timer = null

  const clear = () => {
    if (timer) clearTimer(timer)
    timer = null
  }
  const flush = reason => {
    if (!pending) return false
    const item = pending
    pending = null
    clear()
    item.commit(item.transcript, { reason, held:true })
    return true
  }

  return {
    enqueue(transcript, commit) {
      const prior = pending?.transcript
      const combined = prior
        ? { ...transcript, text:`${prior.text} ${transcript.text}`.replace(/\s+/g, " ").trim(), confidence:Math.min(prior.confidence ?? 1, transcript.confidence ?? 1) }
        : transcript
      clear()
      pending = null
      if (!incomplete(combined.text)) {
        commit(combined, { reason:prior ? "caller_resumed" : "complete", held:Boolean(prior) })
        return { held:false, combined:Boolean(prior) }
      }
      pending = { transcript:combined, commit }
      timer = setTimer(() => flush("grace_expired"), holdMs)
      timer.unref?.()
      return { held:true, combined:Boolean(prior) }
    },
    // Called on caller activity start only to cancel the expiry timer. The
    // pending text remains and will be prepended to the next final result.
    resume() { if (pending) clear() },
    flush,
    hasPending() { return Boolean(pending) },
    reset() { pending = null; clear() }
  }
}
