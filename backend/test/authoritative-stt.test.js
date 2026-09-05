import assert from "node:assert/strict"
import { generateKeyPairSync } from "node:crypto"
import { EventEmitter } from "node:events"
import test from "node:test"
import { createGoogleCloudSttTranscriber, createGoogleCloudStreamingTranscriber, createServiceAccountJwt, sttLanguageConfig, transcribeCallerTurn } from "../src/demo/authoritative-stt.js"

class FakeRecognitionStream extends EventEmitter {
  constructor() { super(); this.frames = [] }
  write(frame) { this.frames.push(Buffer.from(frame)) }
  end() { this.ended = true }
}

test("selects Telugu as primary and English plus nearby Indic languages as alternatives", () => {
  assert.deepEqual(sttLanguageConfig("te"), { primary:"te-IN", alternatives:["en-IN", "hi-IN", "ta-IN"] })
})

test("has a bounded deadline so a transcription outage cannot strand a live call", async () => {
  const transcriber = { transcribePcm16:() => new Promise(() => {}) }
  await assert.rejects(
    transcribeCallerTurn(transcriber, Buffer.from([1, 2]), { language:"te", timeoutMs:10 }),
    /timed out after 10ms/
  )
})

test("uses a service-account OAuth token when no public STT API key is configured", async () => {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength:2048 })
  const credentials = { client_email:"voice-stt@example.iam.gserviceaccount.com", private_key:privateKey.export({ type:"pkcs8", format:"pem" }) }
  const requests = []
  const transcriber = createGoogleCloudSttTranscriber({
    credentialsPath:"/run/secrets/google-stt.json",
    readFileImpl:async () => JSON.stringify(credentials),
    fetchImpl:async (url, options) => {
      requests.push({ url, options })
      if (url === "https://oauth2.googleapis.com/token") return new Response(JSON.stringify({ access_token:"token-value", expires_in:3600 }), { status:200 })
      return new Response(JSON.stringify({ results:[{ alternatives:[{ transcript:"డెమో చూపించండి", confidence:0.91 }] }] }), { status:200 })
    }
  })
  const result = await transcriber.transcribePcm16(Buffer.from([1, 2, 3, 4]), { language:"te" })

  assert.equal(result.text, "డెమో చూపించండి")
  assert.equal(requests.length, 2)
  assert.equal(requests[0].url, "https://oauth2.googleapis.com/token")
  assert.match(requests[0].options.body, /grant_type=/)
  assert.equal(requests[1].options.headers.authorization, "Bearer token-value")
  assert.doesNotThrow(() => createServiceAccountJwt(credentials))
})

test("uses one streaming STT request and commits its final native-script result without a REST turn request", async () => {
  const stream = new FakeRecognitionStream()
  let request
  const transcriber = createGoogleCloudStreamingTranscriber({
    credentialsPath:"/run/secrets/google-stt.json",
    clientFactory:() => ({ streamingRecognize:value => { request = value; return stream } })
  })
  const call = transcriber.start({ language:"te" })
  call.startTurn(7)
  call.push(Buffer.from([1, 2, 3, 4]))
  const finalizing = call.finalizeTurn(7, { timeoutMs:100 })
  stream.emit("data", { results:[{ isFinal:true, alternatives:[{ transcript:"డెమో చూపించండి", confidence:0.94 }] }] })
  stream.emit("end")
  const result = await finalizing

  assert.equal(result.text, "డెమో చూపించండి")
  assert.equal(result.isFinal, true)
  assert.equal(result.provider, "google-cloud-stt-streaming")
  assert.equal(stream.frames.length, 1)
  assert.equal(request.interimResults, true)
  assert.equal(request.config.languageCode, "te-IN")
})

test("does not commit an early final fragment before the carrier endpoint flushes the complete code-switched turn", async () => {
  const stream = new FakeRecognitionStream()
  const transcriber = createGoogleCloudStreamingTranscriber({
    credentialsPath:"/run/secrets/google-stt.json",
    clientFactory:() => ({ streamingRecognize:() => stream })
  })
  const call = transcriber.start({ language:"te" })
  call.startTurn(3)
  // Cloud may mark the first short phrase final while the caller continues.
  stream.emit("data", { results:[{ isFinal:true, alternatives:[{ transcript:"ఇది మాది", confidence:0.9 }] }] })
  call.push(Buffer.from([1, 2, 3, 4]))
  const finalizing = call.finalizeTurn(3, { timeoutMs:100 })
  stream.emit("data", { results:[{ isFinal:true, alternatives:[{ transcript:"tyre shop", confidence:0.95 }] }] })
  stream.emit("end")

  const result = await finalizing
  assert.equal(result.text, "ఇది మాది tyre shop")
  assert.equal(result.isFinal, true)
})

test("does not open a recognition stream until caller speech starts, and closes it at the caller endpoint", async () => {
  const streams = []
  const transcriber = createGoogleCloudStreamingTranscriber({
    credentialsPath:"/run/secrets/google-stt.json",
    clientFactory:() => ({ streamingRecognize:() => {
      const stream = new FakeRecognitionStream()
      streams.push(stream)
      return stream
    } })
  })
  const call = transcriber.start({ language:"te" })
  assert.equal(streams.length, 0)
  call.startTurn(1)
  assert.equal(streams.length, 1)
  const finalizing = call.finalizeTurn(1, { timeoutMs:10 })
  assert.equal(streams[0].ended, true)
  await finalizing
})

test("keeps the STT provider's original script instead of translating or normalizing it", async () => {
  let request
  const transcriber = createGoogleCloudSttTranscriber({
    apiKey:"test-key",
    fetchImpl:async (url, options) => {
      request = { url, options }
      return new Response(JSON.stringify({
        results:[{ alternatives:[{ transcript:"మాది medical distribution", confidence:0.93 }] }],
        languageCode:"te-IN"
      }), { status:200, headers:{ "content-type":"application/json" } })
    }
  })
  const result = await transcriber.transcribePcm16(Buffer.from([1, 2, 3, 4]), { language:"te" })

  assert.equal(result.text, "మాది medical distribution")
  assert.equal(result.provider, "google-cloud-stt")
  assert.equal(result.languageCode, "te-IN")
  assert.match(request.url, /speech:recognize\?key=test-key$/)
  const body = JSON.parse(request.options.body)
  assert.deepEqual(body.config.alternativeLanguageCodes, ["en-IN", "hi-IN", "ta-IN"])
  assert.equal(body.config.encoding, "LINEAR16")
})
