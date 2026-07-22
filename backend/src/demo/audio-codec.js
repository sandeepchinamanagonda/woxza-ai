export function resamplePcm(input, sourceRate, targetRate) {
  if (sourceRate === targetRate) return Buffer.from(input)
  const source = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
  const sampleCount = Math.max(0, Math.floor(source.length * targetRate / sourceRate))
  const output = Buffer.alloc(sampleCount * 2)
  for (let index = 0; index < sampleCount; index += 1) {
    const position = index * sourceRate / targetRate
    const leftIndex = Math.floor(position)
    const left = source[leftIndex] || 0
    const right = source[Math.min(leftIndex + 1, source.length - 1)] || left
    output.writeInt16LE(Math.round(left + (right - left) * (position - leftIndex)), index * 2)
  }
  return output
}

export function createStreamingPcmResampler(sourceRate, targetRate) {
  if (!(sourceRate > 0) || !(targetRate > 0)) throw new Error("Positive sample rates are required")
  const step = sourceRate / targetRate
  let samples = []
  let position = 0
  return {
    push(input) {
      const incoming = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
      if (sourceRate === targetRate) return Buffer.from(input)
      for (const sample of incoming) samples.push(sample)
      const output = []
      while (position + 1 < samples.length) {
        const leftIndex = Math.floor(position)
        const fraction = position - leftIndex
        const left = samples[leftIndex]
        const right = samples[leftIndex + 1]
        output.push(Math.round(left + (right - left) * fraction))
        position += step
      }
      // Retain the final source sample and any fractional/whole-sample phase
      // needed to interpolate correctly when the next carrier chunk arrives.
      const consumed = Math.min(Math.floor(position), Math.max(0, samples.length - 1))
      if (consumed > 0) {
        samples = samples.slice(consumed)
        position -= consumed
      }
      const result = Buffer.alloc(output.length * 2)
      output.forEach((sample, index) => result.writeInt16LE(sample, index * 2))
      return result
    },
    reset() {
      samples = []
      position = 0
    }
  }
}

export function createPcmSpeechDetector({ threshold=650, consecutiveFrames=2 } = {}) {
  let consecutive = 0
  return {
    push(input) {
      const samples = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
      if (!samples.length) return false
      let energy = 0
      for (const sample of samples) energy += sample * sample
      const rms = Math.sqrt(energy / samples.length)
      consecutive = rms >= threshold ? consecutive + 1 : 0
      return consecutive >= consecutiveFrames
    },
    reset() { consecutive = 0 }
  }
}

export function isPcmAudible(input, { threshold=180 } = {}) {
  const samples = new Int16Array(input.buffer, input.byteOffset, Math.floor(input.length / 2))
  if (!samples.length) return false
  let energy = 0
  for (const sample of samples) energy += sample * sample
  return Math.sqrt(energy / samples.length) >= threshold
}

// Keeps only caller speech with enough surrounding audio for reliable STT.
// It deliberately drops long quiet stretches accumulated while the welcome is
// playing, which otherwise turn into a delayed 20+ second replay.
export function createSpeechSegmentBuffer({ preRollFrames=15, postRollFrames=30, threshold=650 } = {}) {
  let preRoll = []
  let active = null
  let quietFrames = 0
  const completed = []
  const audible = input => isPcmAudible(input, { threshold })
  const finish = () => {
    if (active?.length) completed.push(active)
    active = null
    quietFrames = 0
  }
  return {
    push(frame) {
      const value = Buffer.from(frame)
      if (!active) {
        if (!audible(value)) {
          preRoll.push(value)
          if (preRoll.length > preRollFrames) preRoll.shift()
          return
        }
        active = [...preRoll, value]
        preRoll = []
        quietFrames = 0
        return
      }
      active.push(value)
      if (audible(value)) quietFrames = 0
      else if (++quietFrames >= postRollFrames) finish()
    },
    drain() {
      finish()
      const value = completed.splice(0)
      return value
    },
    get frameCount() { return completed.reduce((count, segment) => count + segment.length, 0) + (active?.length || 0) }
  }
}

export function swapPcm16Endianness(input) {
  const output = Buffer.from(input)
  return swapBytes16(output)
}

export function swapBytes16(buffer) {
  for (let index = 0; index + 1 < buffer.length; index += 2) [buffer[index], buffer[index + 1]] = [buffer[index + 1], buffer[index]]
  return buffer
}
