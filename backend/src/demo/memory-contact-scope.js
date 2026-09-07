import { createHmac } from "node:crypto"

export function normalizeCallerPhone(value="", defaultCountryCode=process.env.MEMORY_DEFAULT_COUNTRY_CODE || "91") {
  let phone = String(value).trim().replace(/[\s().-]/gu, "")
  if (phone.startsWith("00")) phone = `+${phone.slice(2)}`
  if (!phone.startsWith("+")) {
    if (/^0\d{10}$/u.test(phone)) phone = `${defaultCountryCode}${phone.slice(1)}`
    if (/^\d{10}$/u.test(phone)) phone = `${defaultCountryCode}${phone}`
    phone = `+${phone}`
  }
  if (!/^\+[1-9]\d{7,14}$/u.test(phone)) return null
  return phone
}

export function contactScopeHash({ tenantId, phone, secret=process.env.MEMORY_CONTACT_HASH_SECRET }={}) {
  if (!tenantId) throw new Error("tenantId is required for contact scope")
  if (!secret) throw new Error("MEMORY_CONTACT_HASH_SECRET is required for contact scope")
  const normalized = normalizeCallerPhone(phone)
  if (!normalized) return null
  return createHmac("sha256", secret).update(`${tenantId}:${normalized}`).digest("hex")
}
