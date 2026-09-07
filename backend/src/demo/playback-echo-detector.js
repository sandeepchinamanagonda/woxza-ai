const rms = samples => {
  if (!samples.length) return 0
  let sum = 0
  for (const sample of samples) sum += sample * sample
  return Math.sqrt(sum / samples.length)
}

const correlation = (left, right) => {
  if (left.length !== right.length || !left.length) return 0
  let dot = 0, leftEnergy = 0, rightEnergy = 0
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftEnergy += left[index] * left[index]
    rightEnergy += right[index] * right[index]
  }
  return leftEnergy && rightEnergy ? dot / Math.sqrt(leftEnergy * rightEnergy) : 0
}

// A bidirectional phone stream can feed Woxza's own playback back into its
// inbound track. Text alone cannot identify this reliably across Indic scripts,
// so compare the PCM waveform against a short rolling window of sent audio.
export function createPlaybackEchoDetector({ sampleRate=16_000, frameSamples=320, historyMs=3_500, correlationThreshold=0.82, minimumRms=120 }={}) {
  const history = []
  let pendingOutgoing = Buffer.alloc(0)
  const maximumFrames = Math.max(1, Math.ceil(historyMs / ((frameSamples / sampleRate) * 1_000)))
  const trim = () => { while (history.length > maximumFrames) history.shift() }
  return {
    noteOutgoing(pcm, outputSampleRate=sampleRate) {
      if (!pcm?.length || Number(outputSampleRate) !== sampleRate) return
      const source = Buffer.concat([pendingOutgoing, Buffer.from(pcm)])
      const frameBytes = frameSamples * 2
      let offset = 0
      for (; offset + frameBytes <= source.length; offset += frameBytes) {
        history.push(Buffer.from(source.subarray(offset, offset + frameBytes)))
      }
      pendingOutgoing = Buffer.from(source.subarray(offset))
      trim()
    },
    assessIncoming(pcm) {
      const input = Buffer.from(pcm || [])
      if (input.length !== frameSamples * 2 || !history.length) return { likelyEcho:false, correlation:0 }
      const incoming = new Int16Array(input.buffer, input.byteOffset, frameSamples)
      if (rms(incoming) < minimumRms) return { likelyEcho:false, correlation:0 }
      let best = 0
      for (const candidate of history) {
        const value = correlation(incoming, new Int16Array(candidate.buffer, candidate.byteOffset, frameSamples))
        if (value > best) best = value
      }
      return { likelyEcho:best >= correlationThreshold, correlation:Number(best.toFixed(4)) }
    },
    reset() { history.length = 0; pendingOutgoing = Buffer.alloc(0) },
    snapshot() { return { frames:history.length, maximumFrames } }
  }
}
