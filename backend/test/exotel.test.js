import assert from "node:assert/strict"
import test from "node:test"
import { createExotelClient } from "../src/demo/exotel.js"

test("Exotel adapter remains compatible with its configured voice flow", async () => {
  let request
  const client = createExotelClient({
    accountSid:"example-account", apiKey:"key", apiToken:"token", subdomain:"api.exotel.com",
    exophone:"01100000000", appId:"12345", publicUrl:"https://api.example.com",
    fetchImpl:async (url, options) => {
      request = { url, options }
      return { ok:true, json:async () => ({ Call:{ Sid:"provider-call-id" } }) }
    }
  })
  const result = await client.call({ callId:"demo-id", to:"+12025550123" })
  assert.equal(result.providerCallId,"provider-call-id")
  assert.equal(request.url,"https://api.exotel.com/v1/Accounts/example-account/Calls/connect.json")
  assert.equal(request.options.body.get("From"),"+12025550123")
  assert.equal(request.options.body.get("VoiceUrl"),"http://my.exotel.com/example-account/exoml/start_voice/12345")
  assert.equal(request.options.body.get("TimeLimit"),"90")
  assert.equal(request.options.body.get("StatusCallback"),"https://api.example.com/api/demo-call/demo-id/status-callback")
})
