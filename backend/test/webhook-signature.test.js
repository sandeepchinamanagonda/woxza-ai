import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { createServer } from "node:http"
import test, { after, before } from "node:test"
import { createApp } from "../src/app.js"

const twilioToken = "twilio-test-token"
const plivoToken = "plivo-test-token"
let baseUrl
let server
const demoService = {
  async createInboundTwilioCall() { return "inbound-call" },
  async twilioAnswer() { return "<Response/>" },
  async answer() { return "<Response/>" },
  async callback() {}
}

const signature = (algorithm, token, value) => createHmac(algorithm, token).update(value).digest("base64")
const twilioSignature = (url, params) => signature("sha1", twilioToken, url + Object.keys(params).sort().map(key => `${key}${params[key]}`).join(""))
const plivoSignature = (url, params, nonce) => signature("sha256", plivoToken, url + Object.keys(params).sort().map(key => `${key}${params[key]}`).join("") + nonce)

before(async () => {
  server = createServer(createApp({ db:{ query:async () => ({ rows:[] }) }, demoService, twilioAuthToken:twilioToken, plivoAuthToken:plivoToken }))
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})
after(async () => new Promise(resolve => server.close(resolve)))

async function post(path, params, headers = {}) {
  return fetch(`${baseUrl}${path}`, { method:"POST", headers:{ "content-type":"application/x-www-form-urlencoded", "x-forwarded-proto":"http", ...headers }, body:new URLSearchParams(params) })
}

test("accepts valid Twilio webhook signatures and rejects altered requests", async () => {
  const params = { CallSid:"CA123", From:"+15551234567" }
  const url = `${baseUrl}/webhooks/twilio/voice`
  assert.equal((await post("/webhooks/twilio/voice", params, { "x-twilio-signature":twilioSignature(url, params) })).status, 200)
  assert.equal((await post("/webhooks/twilio/voice", { ...params, From:"+15557654321" }, { "x-twilio-signature":twilioSignature(url, params) })).status, 403)
})

test("accepts valid Plivo V3 signatures and rejects altered nonce", async () => {
  const params = { CallUUID:"uuid-123" }
  const path = "/telephony/plivo/answer?demoCallId=call-1"
  const nonce = "nonce-123"
  const url = `${baseUrl}${path}`
  const headers = { "x-plivo-signature-v3":plivoSignature(url, params, nonce), "x-plivo-signature-v3-nonce":nonce }
  assert.equal((await post(path, params, headers)).status, 200)
  assert.equal((await post(path, params, { ...headers, "x-plivo-signature-v3-nonce":"other-nonce" })).status, 403)
})
