const INDIC_SCRIPT = /[\u0900-\u0D7F]/u

export function mergeLiveTranscriptFragments(fragments=[]) {
  let merged = ""
  for (const raw of fragments) {
    const fragment = String(raw || "").trim()
    if (!fragment) continue
    if (!merged) {
      merged = fragment
      continue
    }
    // Gemini can emit a word one Indic-script syllable at a time. Do not
    // insert artificial spaces inside that stream; use normal spacing for
    // Latin-script chunks such as "tile" + "shop".
    const previous = merged.at(-1) || ""
    const next = fragment.at(0) || ""
    merged += INDIC_SCRIPT.test(previous) && INDIC_SCRIPT.test(next) ? fragment : ` ${fragment}`
  }
  return merged.trim()
}

export function createLiveTranscriptTurnBuffer({ delayMs=700, onTurn, schedule=setTimeout, cancel=clearTimeout }={}) {
  let fragments = []
  let timer
  const flush = () => {
    cancel(timer)
    timer = undefined
    const text = mergeLiveTranscriptFragments(fragments)
    fragments = []
    if (text) onTurn?.(text)
    return text
  }
  return {
    push(fragment) {
      if (!String(fragment || "").trim()) return
      fragments.push(fragment)
      cancel(timer)
      timer = schedule(flush, delayMs)
      timer?.unref?.()
    },
    flush,
    stop() {
      cancel(timer)
      timer = undefined
      fragments = []
    }
  }
}
