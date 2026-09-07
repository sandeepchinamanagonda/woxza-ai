// Text tokens are not safe to speak individually.  Hold them until the model
// has completed a sentence (or a long natural clause), then hand that phrase
// to TTS while the model continues producing the rest of its reply.
export function createPhraseBuffer({ minimumCharacters=18 }={}) {
  let pending = ""
  const takeReady = () => {
    const match = pending.match(/^([\s\S]*?[.!?।॥…](?:\s|$))/)
    if (!match || match[1].trim().length < minimumCharacters) return ""
    pending = pending.slice(match[1].length)
    return match[1].trim()
  }
  return {
    push(delta) { pending += String(delta || ""); return takeReady() },
    flush() { const value = pending.trim(); pending = ""; return value }
  }
}

// Sarvam streaming TTS requires at least 30 characters. Unlike the sentence
// buffer above, this one does not wait for punctuation: it releases as soon as
// the model has written enough text to end at a word/clause boundary. This is
// what lets audio begin while the rest of a long answer is still being written.
export function createWordBoundaryBuffer({ minimumCharacters=30 }={}) {
  let pending = ""
  const takeReady = () => {
    if (pending.trim().length < minimumCharacters) return ""
    const boundary = /[\s,;:!?।॥…]/g
    let match
    while ((match = boundary.exec(pending))) {
      if (match.index + match[0].length < minimumCharacters) continue
      const value = pending.slice(0, match.index + match[0].length).trim()
      pending = pending.slice(match.index + match[0].length)
      return value
    }
    return ""
  }
  return {
    push(delta) {
      pending += String(delta || "")
      const chunks = []
      for (let next = takeReady(); next; next = takeReady()) chunks.push(next)
      return chunks
    },
    flush() { const value = pending.trim(); pending = ""; return value }
  }
}

// Text deltas are transport fragments, not speaking instructions. For a phone
// voice, hold them until a complete thought is available so the TTS model can
// preserve one natural intonation contour. This deliberately does not use
// overlap: repeated text would be repeated aloud to the caller.
export function createProsodyPhraseBuffer({ minimumCharacters=60, maximumCharacters=140, maxWaitMs=400, now=() => Date.now() }={}) {
  const minimum = Math.max(1, Number(minimumCharacters) || 60)
  const maximum = Math.max(minimum, Number(maximumCharacters) || 140)
  const maxWait = Math.max(0, Number(maxWaitMs) || 0)
  let pending = ""
  let pendingSince = null

  const resetPendingSince = () => { pendingSince = pending ? now() : null }
  const take = (end, releaseReason) => {
    const text = pending.slice(0, end).trim()
    pending = pending.slice(end)
    resetPendingSince()
    return text ? { text, releaseReason } : null
  }
  const firstBoundaryAtOrAfter = pattern => {
    let match
    pattern.lastIndex = 0
    while ((match = pattern.exec(pending))) {
      const end = match.index + match[0].length
      if (end >= minimum) return end
    }
    return -1
  }
  const lastSafeWordBoundary = () => {
    const searchEnd = Math.min(pending.length, maximum)
    const segment = pending.slice(0, searchEnd)
    const matches = [...segment.matchAll(/\s+/g)]
    if (matches.length) return matches.at(-1).index + matches.at(-1)[0].length
    // Do not split a word. If a single word is longer than the maximum, wait
    // for its next whitespace boundary rather than corrupting what TTS hears.
    const afterMaximum = pending.slice(maximum).match(/\s+/)
    return afterMaximum ? maximum + afterMaximum.index + afterMaximum[0].length : -1
  }
  const takeReady = () => {
    if (pending.trim().length < minimum) return null
    const sentenceEnd = firstBoundaryAtOrAfter(/[.!?。！？]|[।॥]/gu)
    if (sentenceEnd >= 0) return take(sentenceEnd, "sentence_end")
    // A semicolon can end a full spoken clause. Commas and colons are omitted
    // on purpose: splitting there resets prosody in the middle of a thought.
    const strongClauseEnd = firstBoundaryAtOrAfter(/[;；]/gu)
    if (strongClauseEnd >= 0) return take(strongClauseEnd, "strong_clause_end")
    if (pending.trim().length >= maximum) {
      const boundary = lastSafeWordBoundary()
      if (boundary >= minimum) return take(boundary, "max_length_fallback")
    }
    return null
  }
  const drainReady = () => {
    const phrases = []
    for (let phrase = takeReady(); phrase; phrase = takeReady()) phrases.push(phrase)
    return phrases
  }
  return {
    push(delta) {
      const value = String(delta || "")
      if (!value) return []
      if (!pending) pendingSince = now()
      pending += value
      return drainReady()
    },
    releaseTimedOut() {
      if (!pending || pending.trim().length < minimum || !maxWait || pendingSince === null || now() - pendingSince < maxWait) return null
      const phrase = takeReady()
      if (phrase) return phrase
      const boundary = lastSafeWordBoundary()
      return boundary >= minimum ? take(boundary, "max_wait_fallback") : null
    },
    millisecondsUntilTimeout() {
      if (!pending || pending.trim().length < minimum || !maxWait || pendingSince === null) return null
      return Math.max(0, maxWait - (now() - pendingSince))
    },
    flush() {
      const text = pending.trim()
      pending = ""
      pendingSince = null
      return text ? { text, releaseReason:"final_flush" } : null
    }
  }
}
