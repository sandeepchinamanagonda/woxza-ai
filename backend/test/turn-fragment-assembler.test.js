import assert from "node:assert/strict"
import test from "node:test"
import { createTurnFragmentAssembler, isLikelyIncompleteCallerFragment } from "../src/demo/turn-fragment-assembler.js"

test("holds a Telugu possessive and joins it to the caller's resumed detail", () => {
  const committed = []
  let timer
  const assembler = createTurnFragmentAssembler({ holdMs:900, setTimer:fn => { timer = fn; return 1 }, clearTimer:() => { timer = null } })
  assert.equal(isLikelyIncompleteCallerFragment("మాది"), true)
  assert.deepEqual(assembler.enqueue({ text:"మాది", provider:"stt" }, value => committed.push(value)), { held:true, combined:false })
  assembler.resume()
  assert.deepEqual(assembler.enqueue({ text:"టైర్ షాప్", provider:"stt" }, value => committed.push(value)), { held:false, combined:true })
  assert.deepEqual(committed.map(value => value.text), ["మాది టైర్ షాప్"])
  assert.equal(timer, null)
})

test("flushes a fragment once after the bounded grace window", () => {
  const committed = []
  let timer
  const assembler = createTurnFragmentAssembler({ setTimer:fn => { timer = fn; return 1 }, clearTimer:() => {}, incomplete:() => true })
  assembler.enqueue({ text:"మాది" }, value => committed.push(value))
  timer()
  assert.deepEqual(committed.map(value => value.text), ["మాది"])
  assert.equal(assembler.hasPending(), false)
})
