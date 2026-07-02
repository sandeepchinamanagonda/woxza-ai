import { onMounted, onUnmounted } from "vue"

export function useMagnetic(selector = ".hero .btn-primary") {
  let target

  const move = (event) => {
    if (!target) return

    const rect = target.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)

    target.style.transform = `translate3d(${x * 0.08}px, ${y * 0.08}px, 0)`
  }

  const leave = () => {
    if (!target) return

    target.removeEventListener("mousemove", move)
    target.removeEventListener("mouseleave", leave)
    target.style.transform = "translate3d(0, 0, 0)"
    target.style.willChange = ""
    target = null
  }

  const enter = (event) => {
    if (target) leave()

    target = event.currentTarget
    target.style.willChange = "transform"
    target.addEventListener("mousemove", move, { passive: true })
    target.addEventListener("mouseleave", leave, { once: true })
  }

  onMounted(() => {
    const element = document.querySelector(selector)
    element?.addEventListener("mouseenter", enter, { passive: true })
  })

  onUnmounted(() => {
    const element = document.querySelector(selector)
    element?.removeEventListener("mouseenter", enter)
    leave()
  })
}
