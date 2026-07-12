import assert from "node:assert/strict"
import test from "node:test"
import { DemoRateLimiter, MemoryRateLimitStore } from "../src/demo/rate-limiter.js"

test("limits a phone to three calls in a rolling 24-hour window", async () => {
  let timestamp = Date.UTC(2026, 6, 2, 12)
  const clock = () => timestamp
  const limiter = new DemoRateLimiter(new MemoryRateLimitStore(clock), { now:() => new Date(timestamp) })
  for (let index=0; index<3; index += 1) assert.equal((await limiter.consume({ phone:"+13125550100", ip:`1.1.1.${index}` })).allowed,true)
  assert.deepEqual(await limiter.consume({ phone:"+13125550100", ip:"1.1.1.9" }), { allowed:false, reason:"phone_limit" })
  timestamp += 24 * 60 * 60 * 1000 + 1
  assert.deepEqual(await limiter.consume({ phone:"+13125550100", ip:"1.1.1.2" }), { allowed:true })
})

test("limits an IP to five calls per hour and enforces the global cap", async () => {
  const timestamp = Date.UTC(2026, 6, 2, 12)
  const ipLimiter = new DemoRateLimiter(new MemoryRateLimitStore(() => timestamp), { now:() => new Date(timestamp) })
  for (let index=0; index<5; index += 1) assert.equal((await ipLimiter.consume({ phone:`+1312555010${index}`, ip:"2.2.2.2" })).allowed,true)
  assert.deepEqual(await ipLimiter.consume({ phone:"+13125550109", ip:"2.2.2.2" }), { allowed:false, reason:"ip_limit" })

  const globalLimiter = new DemoRateLimiter(new MemoryRateLimitStore(() => timestamp), { dailyCap:2, now:() => new Date(timestamp) })
  assert.equal((await globalLimiter.consume({ phone:"+14155550101", ip:"3.3.3.1" })).allowed,true)
  assert.equal((await globalLimiter.consume({ phone:"+14155550102", ip:"3.3.3.2" })).allowed,true)
  assert.deepEqual(await globalLimiter.consume({ phone:"+14155550103", ip:"3.3.3.3" }), { allowed:false, reason:"daily_cap" })
})
