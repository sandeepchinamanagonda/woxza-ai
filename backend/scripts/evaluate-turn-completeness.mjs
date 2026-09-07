import { createTurnInterpreter } from "../src/demo/turn-interpreter.js"
import { TURN_COMPLETENESS_CORPUS } from "../test/turn-completeness-corpus.js"

const interpreter = createTurnInterpreter()
const results = []
for (const sample of TURN_COMPLETENESS_CORPUS) {
  const result = await interpreter.interpret({ turn:{ authoritative_text:sample.text }, phase:"business_discovery", language:sample.language, businessProfile:{} })
  const actual = result.raw.clarity
  results.push({ ...sample, actual_clarity:actual, pass:actual === sample.expected_clarity, fields:Object.keys(result.raw.details || {}) })
}
const summary = results.reduce((all, row) => {
  const key=`${row.language}:${row.kind}`
  all[key] ||= { total:0, pass:0 }
  all[key].total += 1; all[key].pass += Number(row.pass)
  return all
}, {})
console.log(JSON.stringify({ summary, failures:results.filter(row => !row.pass || (row.actual_clarity === "incomplete" && row.fields.length)) }, null, 2))
if (results.some(row => !row.pass || (row.actual_clarity === "incomplete" && row.fields.length))) process.exitCode = 1
