// The carrier can start streaming before the caller or the assistant speaks.
// This controller owns only the caller-first decision; it does not know about
// Gemini, workflows, or call content.
export function createOpeningController({
  // This is only a dead-man fallback. Normal release is driven by the exact
  // carrier playback duration reported after the complete welcome is made.
  atomicGreetingMs=30_000,
  onCallerFirst,
  onWoxzaFirst,
  onGreetingComplete,
  schedule=setTimeout,
  cancel=clearTimeout
} = {}) {
  let started = false
  let decided = false
  let callerSpeechSeen = false
  let timer

  const decide = (callback, source) => {
    if (decided) return false
    decided = true
    cancel(timer)
    timer = undefined
    callback?.({ source })
    return true
  }

  return {
    start() {
      if (started) return
      started = true
      // The first line is deliberately atomic: caller speech is captured by
      // the carrier, but routing waits until this short greeting has finished.
      onWoxzaFirst?.()
    },
    markGreetingAudioStarted() {
      if (!started || decided || timer) return false
      timer = schedule(() => decide(onGreetingComplete, "fallback_timeout"), atomicGreetingMs)
      timer?.unref?.()
      return true
    },
    completeGreeting() {
      return decide(onGreetingComplete, "carrier_playback_complete")
    },
    noteCallerSpeech() {
      // This signal is only meaningful while the carrier-owned greeting is
      // still atomic.  Reporting it after release made normal caller speech
      // look like an opening interruption in diagnostics.
      if (!started || decided || callerSpeechSeen) return false
      callerSpeechSeen = true
      onCallerFirst?.()
      return true
    },
    stop() {
      cancel(timer)
      timer = undefined
      decided = true
    },
    get decided() { return decided }
  }
}
