import { createHmac, timingSafeEqual } from "node:crypto"

const expectedSignature = ({ url, params, nonce, authToken }) => {
  const values = Object.keys(params || {}).sort().map(key => `${key}${params[key]}`).join("")
  return createHmac("sha256", authToken).update(`${url}${values}${nonce}`).digest("base64")
}

export function validatePlivoSignature({ url, params, nonce, signature, authToken }) {
  if (!authToken || !nonce || !signature) return false
  const expected = Buffer.from(expectedSignature({ url, params, nonce, authToken }))
  return String(signature).split(",").some(candidate => {
    const actual = Buffer.from(candidate.trim())
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}
