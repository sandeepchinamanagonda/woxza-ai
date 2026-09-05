const brevoUrl = "https://api.brevo.com/v3/smtp/email"

/** Sends through Brevo without allowing provider failures to interrupt the caller. */
export async function sendEmail({ toEmail, toName, subject, htmlContent, emailType, fetchImpl = fetch }) {
  const apiKey = process.env.EMAIL_API_KEY
  const senderEmail = process.env.EMAIL_FROM_ADDRESS
  const senderName = process.env.EMAIL_FROM_NAME || "Woxza"
  if (process.env.EMAIL_PROVIDER !== "brevo" || !apiKey || !senderEmail || !toEmail) {
    console.warn("Email not sent: Brevo is not configured", { recipient:toEmail, emailType })
    return { ok:false, reason:"not_configured" }
  }
  try {
    const response = await fetchImpl(brevoUrl, {
      method:"POST",
      headers:{ "api-key":apiKey, "content-type":"application/json", accept:"application/json" },
      body:JSON.stringify({ sender:{ email:senderEmail, name:senderName }, to:[{ email:toEmail, name:toName || undefined }], subject, htmlContent })
    })
    if (!response.ok) {
      // TODO: add durable retry/rate-limit handling when email volume approaches Brevo's 300/day free-tier cap.
      console.warn("Brevo email send failed", { recipient:toEmail, emailType, status:response.status, rateLimited:response.status === 429 })
      return { ok:false, reason:response.status === 429 ? "rate_limited" : "provider_error", status:response.status }
    }
    return { ok:true }
  } catch (error) {
    console.warn("Brevo email send failed", { recipient:toEmail, emailType, error:error.message })
    return { ok:false, reason:"network_error" }
  }
}
