export function createExotelClient({ accountSid, apiKey, apiToken, subdomain, exophone, appId, publicUrl, fetchImpl = fetch }) {
  if (!accountSid || !apiKey || !apiToken || !subdomain || !exophone || !appId || !publicUrl) return null
  const host = subdomain.replace(/^https?:\/\//, "").replace(/\/$/, "")

  return {
    provider: "exotel",
    async call({ callId, to }) {
      const body = new URLSearchParams({
        From:to,
        CallerId:exophone,
        VoiceUrl:`http://my.exotel.com/${accountSid}/exoml/start_voice/${appId}`,
        TimeLimit:"90",
        TimeOut:"30",
        CallType:"trans",
        CustomField:callId,
        StatusCallback:`${publicUrl}/api/demo-call/${callId}/status-callback`,
        StatusCallbackContentType:"application/json"
      })
      const response = await fetchImpl(`https://${host}/v1/Accounts/${accountSid}/Calls/connect.json`, {
        method:"POST",
        headers:{
          authorization:`Basic ${Buffer.from(`${apiKey}:${apiToken}`).toString("base64")}`,
          "content-type":"application/x-www-form-urlencoded"
        },
        body
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        const detail = payload.RestException?.Message || payload.message || `HTTP ${response.status}`
        throw Object.assign(new Error(`Exotel rejected demo call: ${detail}`), { status:502 })
      }
      return { providerCallId:payload.Call?.Sid || payload.CallSid || payload.Sid || null, raw:payload }
    }
  }
}
