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

export function swapPcm16Endianness(input) {
  const output = Buffer.from(input)
  return swapBytes16(output)
}

export function swapBytes16(buffer) {
  for (let index = 0; index + 1 < buffer.length; index += 2) [buffer[index], buffer[index + 1]] = [buffer[index + 1], buffer[index]]
  return buffer
}
