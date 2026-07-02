import { useScrollReveal } from "@/composables/useMotion"

export function useReveal(selector = "[data-reveal], main section") {
  useScrollReveal(selector)
}
