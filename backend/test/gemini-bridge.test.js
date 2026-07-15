import test from "node:test"
import assert from "node:assert/strict"
import { resamplePcm, swapPcm16Endianness } from "../src/demo/audio-codec.js"

test("converts PCM samples between little-endian and L16 network byte order", () => {
  const littleEndian = Buffer.from([0x34, 0x12, 0xfe, 0xff, 0x00, 0x80])
  const l16 = swapPcm16Endianness(littleEndian)

  assert.deepEqual(l16, Buffer.from([0x12, 0x34, 0xff, 0xfe, 0x80, 0x00]))
  assert.deepEqual(swapPcm16Endianness(l16), littleEndian)
})

test("resamples before endian conversion and preserves signed PCM sample order", () => {
  const pcm24kLittleEndian = Buffer.from([0x00, 0x00, 0x00, 0x40, 0x00, 0x80])
  const plivoL16 = swapPcm16Endianness(resamplePcm(pcm24kLittleEndian, 24000, 16000))

  assert.deepEqual(plivoL16, Buffer.from([0x00, 0x00, 0xe0, 0x00]))
  assert.deepEqual(swapPcm16Endianness(plivoL16), resamplePcm(pcm24kLittleEndian, 24000, 16000))
})
