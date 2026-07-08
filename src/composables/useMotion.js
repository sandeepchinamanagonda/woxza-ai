import { onMounted, onUnmounted } from "vue"
import { useMagnetic } from "@/composables/useMagnetic"

const scrollSubscribers = new Set()

let frame = 0
let listening = false

const readScrollState = (now = performance.now()) => ({
  now,
  scrollY: window.scrollY || 0,
  viewportHeight: window.innerHeight || 0
})

const flushScroll = (now) => {
  frame = 0
  const state = readScrollState(now)

  scrollSubscribers.forEach((subscriber) => {
    subscriber(state)
  })
}

const requestScrollFrame = () => {
  if (frame) return

  frame = requestAnimationFrame(flushScroll)
}

const addScrollListeners = () => {
  if (listening || typeof window === "undefined") return

  window.addEventListener("scroll", requestScrollFrame, { passive: true })
  window.addEventListener("resize", requestScrollFrame, { passive: true })
  listening = true
}

const removeScrollListeners = () => {
  if (!listening || scrollSubscribers.size) return

  window.removeEventListener("scroll", requestScrollFrame)
  window.removeEventListener("resize", requestScrollFrame)

  if (frame) {
    cancelAnimationFrame(frame)
    frame = 0
  }

  listening = false
}

export function useMotionFrame(callback) {
  let unsubscribe

  onMounted(() => {
    unsubscribe = subscribeMotionFrame(callback)
  })

  onUnmounted(() => {
    unsubscribe?.()
  })
}

export function subscribeMotionFrame(callback) {
  scrollSubscribers.add(callback)
  addScrollListeners()
  requestScrollFrame()

  return () => {
    scrollSubscribers.delete(callback)
    removeScrollListeners()
  }
}

export function useScrollReveal(
  selector = "[data-reveal], main section",
  {
    rootMargin = "0px 0px -12% 0px",
    threshold = 0.08,
    readyClass = "reveal-ready",
    revealedClass = "is-revealed"
  } = {}
) {
  let observer

  onMounted(() => {
    const elements = [...document.querySelectorAll(selector)]

    if (!elements.length) return

    elements.forEach((element) => {
      element.classList.add(readyClass)
    })

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          entry.target.classList.add(revealedClass)
          observer.unobserve(entry.target)
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    elements.forEach((element) => {
      observer.observe(element)
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}

export function useSectionActivity(
  selector = "main section",
  {
    activeClass = "motion-active",
    rootMargin = "20% 0px 20% 0px",
    threshold = 0.01
  } = {}
) {
  let observer

  onMounted(() => {
    const elements = [...document.querySelectorAll(selector)]

    if (!elements.length) return

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle(activeClass, entry.isIntersecting)
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    elements.forEach((element) => {
      observer.observe(element)
    })
  })

  onUnmounted(() => {
    observer?.disconnect()
  })
}

export function useScrollParallax(selector = "[data-parallax]") {
  let elements = []
  let clearWillChangeTimer
  let unsubscribe

  const clearWillChange = () => {
    elements.forEach(({ element }) => {
      element.style.willChange = ""
    })
  }

  const markActive = () => {
    clearTimeout(clearWillChangeTimer)

    elements.forEach(({ element }) => {
      element.style.willChange = "transform"
    })

    clearWillChangeTimer = setTimeout(clearWillChange, 160)
  }

  const update = ({ scrollY }) => {
    if (!elements.length) return

    markActive()

    elements.forEach(({ element, speed }) => {
      element.style.transform = `translate3d(0, ${scrollY * speed}px, 0)`
    })
  }

  onMounted(() => {
    elements = [...document.querySelectorAll(selector)].map((element) => ({
      element,
      speed: Number(element.dataset.parallax || 0.04)
    }))

    if (elements.length) {
      unsubscribe = subscribeMotionFrame(update)
    }
  })

  onUnmounted(() => {
    unsubscribe?.()
    clearTimeout(clearWillChangeTimer)

    elements.forEach(({ element }) => {
      element.style.transform = ""
      element.style.willChange = ""
    })

    elements = []
  })
}

export function useMotion() {
  useScrollReveal()
  useSectionActivity()
  useScrollParallax()
  useMagnetic()
}
