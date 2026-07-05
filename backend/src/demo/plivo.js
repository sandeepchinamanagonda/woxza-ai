export function createPlivoClient({ authId, authToken, fromNumber, publicUrl, fetchImpl = fetch }) {
  if (!authId || !authToken || !fromNumber || !publicUrl) return null
  return {
    provider: "plivo",
    async call({ callId, to }) {
      const body = new URLSearchParams({
        from:fromNumber, to,
        answer_url:`${publicUrl}/api/demo-call/${callId}/answer`, answer_method:"GET",
        hangup_url:`${publicUrl}/api/demo-call/${callId}/status-callback`, hangup_method:"POST",
        ring_url:`${publicUrl}/api/demo-call/${callId}/status-callback`, ring_method:"POST",
        time_limit:"90"
      })
      const response = await fetchImpl(`https://api.plivo.com/v1/Account/${authId}/Call/`, {
        method:"POST", headers:{ authorization:`Basic ${Buffer.from(`${authId}:${authToken}`).toString("base64")}`, "content-type":"application/x-www-form-urlencoded" }, body
      })
      if (!response.ok) throw new Error(`Plivo rejected demo call (${response.status})`)
      const payload = await response.json()
      return { providerCallId:payload.request_uuid || payload.message_uuid || null, raw:payload }
    }
  }
}
