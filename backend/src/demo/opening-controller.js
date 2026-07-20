// The carrier can start streaming before the caller or the assistant speaks.
// This controller owns only that first 200 ms decision; it does not know about
// Gemini, workflows, or call content.
export function createOpeningController({
  callerFirstWindowMs=200,
  onCallerFirst,
  onWoxzaFirst,
  schedule=setTimeout,
  cancel=clearTimeout
} = {}) {
  let started = false
  let decided = false
  let timer

  const decide = callback => {
    if (decided) return false
    decided = true
    cancel(timer)
    timer = undefined
    callback?.()
    return true
  }

  return {
    start() {
      if (started) return
      started = true
      timer = schedule(() => decide(onWoxzaFirst), callerFirstWindowMs)
      timer?.unref?.()
    },
    noteCallerSpeech() {
      if (!started) return false
      return decide(onCallerFirst)
    },
    stop() {
      cancel(timer)
      timer = undefined
      decided = true
    },
    get decided() { return decided }
  }
}
