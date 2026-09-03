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
