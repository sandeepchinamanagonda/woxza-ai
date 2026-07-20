export function createPlivoClient({ authId, authToken, fromNumber, publicUrl, fetchImpl = fetch }) {
  if (!authId || !authToken || !fromNumber || !publicUrl) return null
  return {
    provider: "plivo",
    async call({ callId, to }) {
      const body = new URLSearchParams({
        from:fromNumber, to,
        answer_url:`${publicUrl}/telephony/plivo/answer?demoCallId=${encodeURIComponent(callId)}`, answer_method:"POST",
        hangup_url:`${publicUrl}/api/demo-call/${callId}/status-callback`, hangup_method:"POST",
        ring_url:`${publicUrl}/api/demo-call/${callId}/status-callback`, ring_method:"POST"
      })
      const response = await fetchImpl(`https://api.plivo.com/v1/Account/${authId}/Call/`, {
        method:"POST", headers:{ authorization:`Basic ${Buffer.from(`${authId}:${authToken}`).toString("base64")}`, "content-type":"application/x-www-form-urlencoded" }, body
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const detail = payload.error || payload.message || payload.api_id || `HTTP ${response.status}`
        throw Object.assign(new Error(`Plivo rejected demo call: ${detail}`), { status:502 })
      }
      const payload = await response.json()
      return { providerCallId:payload.request_uuid || payload.message_uuid || null, raw:payload }
    },
    async hangup(callUuid) {
      if (!callUuid) return false
      const response = await fetchImpl(`https://api.plivo.com/v1/Account/${authId}/Call/${encodeURIComponent(callUuid)}/`, {
        method:"DELETE", headers:{ authorization:`Basic ${Buffer.from(`${authId}:${authToken}`).toString("base64")}` }
      })
      if (!response.ok && response.status !== 404) throw new Error(`Plivo hangup rejected (${response.status})`)
      return true
    }
  }
}
