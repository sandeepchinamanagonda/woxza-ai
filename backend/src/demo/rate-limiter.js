const WINDOW_SECONDS = { phone: 30 * 60, ip: 24 * 60 * 60 }

const utcSecondsUntilMidnight = (now = new Date()) => {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000))
}

export class DemoRateLimiter {
  constructor(store, { dailyCap = 50, now = () => new Date() } = {}) {
    this.store = store
    this.dailyCap = dailyCap
    this.now = now
  }

  async consume({ phone, ip }) {
    const day = this.now().toISOString().slice(0, 10)
    const limits = [
      { key:`demo:phone:${phone}`, maximum:1, ttl:WINDOW_SECONDS.phone, reason:"phone_limit" },
      { key:`demo:ip:${ip}`, maximum:3, ttl:WINDOW_SECONDS.ip, reason:"ip_limit" },
      { key:`demo:global:${day}`, maximum:this.dailyCap, ttl:utcSecondsUntilMidnight(this.now()), reason:"daily_cap" }
    ]
    return this.store.consumeMany(limits)
  }
}

export class RedisRateLimitStore {
  constructor(redis) { this.redis = redis }
  async consumeMany(limits) {
    const script = `
      for i=1,#KEYS do
        local count=tonumber(redis.call('GET',KEYS[i]) or '0')
        local maximum=tonumber(ARGV[(i-1)*3+1])
        if count >= maximum then return ARGV[(i-1)*3+3] end
      end
      for i=1,#KEYS do
        local count=redis.call('INCR',KEYS[i])
        if count == 1 then redis.call('EXPIRE',KEYS[i],tonumber(ARGV[(i-1)*3+2])) end
      end
      return 'ok'`
    const args = limits.flatMap(limit => [limit.maximum, limit.ttl, limit.reason])
    const result = await this.redis.eval(script, limits.length, ...limits.map(limit => limit.key), ...args)
    return result === "ok" ? { allowed:true } : { allowed:false, reason:result }
  }
}

export class MemoryRateLimitStore {
  constructor(now = () => Date.now()) { this.values = new Map(); this.now = now }
  async consumeMany(limits) {
    const timestamp = this.now()
    for (const limit of limits) {
      const current = this.values.get(limit.key)
      if (current && current.expiresAt > timestamp && current.count >= limit.maximum) return { allowed:false, reason:limit.reason }
    }
    for (const limit of limits) {
      const current = this.values.get(limit.key)
      this.values.set(limit.key, current && current.expiresAt > timestamp
        ? { ...current, count:current.count + 1 }
        : { count:1, expiresAt:timestamp + limit.ttl * 1000 })
    }
    return { allowed:true }
  }
}
