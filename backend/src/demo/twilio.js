export function createTwilioClient({ accountSid, apiKeySid, apiKeySecret, authToken, fromNumber, publicUrl, fetchImpl = fetch }) {
  if (!accountSid || !fromNumber || !publicUrl || !(authToken || (apiKeySid && apiKeySecret))) return null
  // Either an API key pair or the account auth token can authenticate the Calls API.
  // Both values are supplied only through environment variables by the runtime.
  const credentialUser = apiKeySid || accountSid
  const credentialSecret = apiKeySecret || authToken
  const auth = `Basic ${Buffer.from(`${credentialUser}:${credentialSecret}`).toString("base64")}`
  return {
    provider:"twilio",
    async call({ callId, to }) {
      const body = new URLSearchParams({
        To:to, From:fromNumber,
        Url:`${publicUrl}/webhooks/twilio/voice?demoCallId=${encodeURIComponent(callId)}`,
        Method:"POST", TimeLimit:"95"
      })
      const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, { method:"POST", headers:{ authorization:auth, "content-type":"application/x-www-form-urlencoded" }, body })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw Object.assign(new Error(`Twilio rejected demo call: ${payload.message || response.status}`), { status:502 })
      return { providerCallId:payload.sid, raw:payload }
    },
    async hangup(callSid) {
      if (!callSid) return
      const body = new URLSearchParams({ Status:"completed" })
      const response = await fetchImpl(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${encodeURIComponent(callSid)}.json`, { method:"POST", headers:{ authorization:auth, "content-type":"application/x-www-form-urlencoded" }, body })
      if (!response.ok) throw new Error(`Twilio hangup failed (${response.status})`)
    }
  }
}
