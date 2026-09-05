import { createTurnInterpreter } from "../src/demo/turn-interpreter.js"
import { createResponseTextBuilder } from "../src/demo/response-text-builder.js"
import { createTtsRenderer } from "../src/demo/tts-renderer.js"
import { createResponseJobManager } from "../src/demo/response-job-manager.js"

const now = () => performance.now()
const round = value => Math.round(value)

async function probe({ name, action, context, language="te" }) {
  const started = now()
  const interpreter = createTurnInterpreter()
  const canonicalTurn = { authoritative_text:"మాది స్టీల్ కొట్టు" }
  const interpreted = await interpreter.interpret({ turn:canonicalTurn, phase:"business_discovery", businessProfile:{}, language })
  const interpretedAt = now()
  const builder = createResponseTextBuilder()
  const text = await builder.build({ action, context, language })
  const textReadyAt = now()
  let firstTtsAt = null
  let firstCarrierAt = null
  const manager = createResponseJobManager({
    demoCallId:"00000000-0000-0000-0000-000000000099",
    onAudio:() => { firstCarrierAt ||= now() }
  })
  const renderer = createTtsRenderer()
  const job = await manager.create({ action, responseText:text.response_text, language, textSource:text.text_source, ttsModel:renderer.model })
  const originalDeliver = manager.deliver.bind(manager)
  manager.deliver = async packet => { firstTtsAt ||= now(); return originalDeliver(packet) }
  await renderer.renderJob({ job, manager })
  return {
    name,
    text_source:text.text_source,
    response_text:text.response_text,
    caller_endpoint_to_interpretation_done_ms:round(interpretedAt - started),
    interpretation_to_response_text_ready_ms:round(textReadyAt - interpretedAt),
    response_text_ready_to_first_tts_chunk_ms:firstTtsAt ? round(firstTtsAt - textReadyAt) : null,
    first_tts_chunk_to_first_carrier_frame_ms:firstCarrierAt && firstTtsAt ? round(firstCarrierAt - firstTtsAt) : null,
    caller_endpoint_to_first_carrier_frame_ms:firstCarrierAt ? round(firstCarrierAt - started) : null,
    interpretation:interpreted.raw
  }
}

const results = []
results.push(await probe({
  name:"templated_confirmation",
  action:"confirm_memory_fact",
  context:{ confirm_text:"నిర్ధారించడానికి అడుగుతున్నాను అండి, మీది స్టీల్ కొట్టు వ్యాపారమా?" }
}))
results.push(await probe({
  name:"dynamic_pitch",
  action:"deliver_pitch",
  context:{ business_profile:{ business:"steel shop", business_label:"స్టీల్ కొట్టు", current_process:"phone calls", primary_pain:"missed calls" }, pitch:[{ title:"Call coverage", description:"Handle routine calls consistently." }] }
}))
console.log(JSON.stringify(results, null, 2))
