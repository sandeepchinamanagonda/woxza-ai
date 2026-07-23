import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'

const sessionId = () => {
  let id = sessionStorage.getItem('woxza_engagement_session')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('woxza_engagement_session', id) }
  return id
}

export function useEngagementTracking() {
  const route = useRoute()
  let observer, timer, sampleTimer, started = 0, visible = new Map(), seconds = new Map(), send, visibility, sample

  const pause = (name, now = Date.now()) => {
    const since = visible.get(name)
    if (since) { seconds.set(name, (seconds.get(name) || 0) + (now - since) / 1000); visible.delete(name) }
  }

  const flush = () => {
    if (!started) return
    const now = Date.now()
    const snapshot = new Map(seconds)
    for (const [name, since] of visible.entries()) snapshot.set(name, (snapshot.get(name) || 0) + (now - since) / 1000)
    const payload = JSON.stringify({
      session_id: sessionId(), landing_page: location.pathname, referrer: document.referrer,
      total_seconds: Math.max(0, Math.round((now - started) / 1000)),
      sections: [...snapshot.entries()].map(([name, value]) => ({ name, seconds: Math.round(value) }))
    })
    const body = new Blob([payload], { type: 'application/json' })
    if (!navigator.sendBeacon?.('/api/track/engagement', body)) fetch('/api/track/engagement', { method: 'POST', body, keepalive: true }).catch(() => {})
  }

  const stop = () => {
    if (!started) return
    flush(); observer?.disconnect(); clearInterval(timer); clearInterval(sampleTimer); window.removeEventListener('scroll', sample)
    if (send) window.removeEventListener('pagehide', send)
    if (visibility) document.removeEventListener('visibilitychange', visibility)
    observer = timer = sampleTimer = send = visibility = sample = undefined; started = 0; visible = new Map(); seconds = new Map()
  }

  const start = async () => {
    stop()
    if (route.path.startsWith('/admin')) return
    await nextTick()
    started = Date.now()
    observer = new IntersectionObserver(entries => entries.forEach(entry => {
      const name = entry.target.dataset.analyticsSection
      if (!name) return
      if (entry.isIntersecting) visible.set(name, Date.now()); else pause(name)
    }), { threshold: .35 })
    document.querySelectorAll('[data-analytics-section]').forEach(node => observer.observe(node))
    sample = () => {
      const now = Date.now()
      document.querySelectorAll('[data-analytics-section]').forEach(node => {
        const rect = node.getBoundingClientRect()
        const inView = rect.top < window.innerHeight * .8 && rect.bottom > window.innerHeight * .2
        const name = node.dataset.analyticsSection
        if (inView) { if (!visible.has(name)) visible.set(name, now) } else pause(name, now)
      })
    }
    sample(); window.addEventListener('scroll', sample, { passive: true })
    send = flush; visibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', send); document.addEventListener('visibilitychange', visibility)
    sampleTimer = setInterval(sample, 1000); timer = setInterval(flush, 30000)
  }

  onMounted(start)
  watch(() => route.fullPath, start)
  onBeforeUnmount(stop)
}
