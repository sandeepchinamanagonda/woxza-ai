import { useScrollParallax } from "@/composables/useMotion"

export function useParallax(selector = "[data-parallax]") {
  useScrollParallax(selector)
}
