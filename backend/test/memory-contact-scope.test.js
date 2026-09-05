import assert from "node:assert/strict"
import test from "node:test"
import { contactScopeHash, normalizeCallerPhone } from "../src/demo/memory-contact-scope.js"

test("normalizes equivalent Indian caller formats to one tenant-scoped hash", () => {
  const options = { tenantId:"tenant-a", secret:"test-secret" }
  const a = contactScopeHash({ ...options, phone:"+91 98765-43210" })
  const b = contactScopeHash({ ...options, phone:"0091 (98765) 43210" })
  const c = contactScopeHash({ ...options, phone:"9876543210" })
  assert.equal(normalizeCallerPhone("+91 98765-43210"), "+919876543210")
  assert.equal(a, b)
  assert.equal(a, c)
  assert.notEqual(a, contactScopeHash({ ...options, tenantId:"tenant-b", phone:"9876543210" }))
})

test("rejects malformed phone identifiers", () => {
  assert.equal(normalizeCallerPhone("not-a-phone"), null)
  assert.equal(contactScopeHash({ tenantId:"tenant-a", secret:"test", phone:"123" }), null)
})
