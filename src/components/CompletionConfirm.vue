<template>
  <div
    class="completion-confirm"
    :class="{ ready, reduced: reducedMotion }"
    role="status"
    aria-live="polite"
  >
    <span class="completion-ring" aria-hidden="true">
      <svg viewBox="0 0 44 44">
        <circle class="ring-track" cx="22" cy="22" r="18" />
        <circle class="ring-progress" cx="22" cy="22" r="18" />
      </svg>
      <svg class="checkmark" viewBox="0 0 44 44">
        <path d="M14.5 22.5 19.5 27.5 29.5 17" />
      </svg>
    </span>

    <span class="completion-copy">
      <strong>{{ label }}</strong>
      <small>{{ durationLabel }}</small>
    </span>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

const props = defineProps({
  label: { type: String, default: "Payment plan recorded" },
  duration: { type: Number, default: 2000 },
  onComplete: { type: Function, default: undefined }
})

const ready = ref(false)
const reducedMotion = ref(false)
const durationLabel = computed(() => `${(props.duration / 1000).toFixed(1)}s to complete`)

let firstFrame
let secondFrame
let completeTimer

onMounted(() => {
  reducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (reducedMotion.value) {
    ready.value = true
    completeTimer = window.setTimeout(() => props.onComplete?.(), 0)
    return
  }

  firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(() => { ready.value = true })
  })
  completeTimer = window.setTimeout(() => props.onComplete?.(), 1450)
})

onBeforeUnmount(() => {
  window.cancelAnimationFrame(firstFrame)
  window.cancelAnimationFrame(secondFrame)
  window.clearTimeout(completeTimer)
})
</script>

<style scoped>
.completion-confirm {
  --completion-color: var(--scenario, #14264d);
  min-height: 70px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 3px 0 11px;
  padding: 12px 16px;
  border: 1px solid color-mix(in srgb, var(--completion-color) 14%, white);
  border-radius: 16px;
  background: color-mix(in srgb, var(--completion-color) 10%, white);
  box-shadow: inset 4px 0 0 var(--completion-color), 0 10px 24px color-mix(in srgb, var(--completion-color) 10%, transparent);
}

.completion-ring {
  position: relative;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
}

.completion-ring svg {
  position: absolute;
  inset: 0;
  width: 44px;
  height: 44px;
  overflow: visible;
}

.completion-ring circle {
  fill: none;
  stroke-width: 4;
}

.ring-track { stroke: color-mix(in srgb, var(--completion-color) 12%, white); }

.ring-progress {
  stroke: var(--completion-color);
  stroke-linecap: round;
  stroke-dasharray: 113.097;
  stroke-dashoffset: 113.097;
  transform: rotate(-90deg);
  transform-origin: 22px 22px;
  transition: stroke-dashoffset 900ms linear;
}

.ready .ring-progress { stroke-dashoffset: 0; }

.checkmark {
  opacity: 0;
  transform: scale(0);
  transform-origin: center;
  transition: opacity 250ms ease-out 900ms, transform 250ms ease-out 900ms;
}

.checkmark path {
  fill: none;
  stroke: var(--completion-color);
  stroke-width: 3.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ready .checkmark {
  opacity: 1;
  transform: scale(1);
}

.completion-copy {
  display: grid;
  gap: 3px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 300ms ease-out 1150ms, transform 300ms ease-out 1150ms;
}

.ready .completion-copy {
  opacity: 1;
  transform: translateY(0);
}

.completion-copy strong {
  color: #3d4660;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.25;
}

.completion-copy small {
  color: #9aa3b2;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.25;
}

.reduced .ring-progress { stroke-dashoffset: 0; transition: none; }
.reduced .checkmark { opacity: 1; transform: scale(1); transition: none; }
.reduced .completion-copy { opacity: 1; transform: none; transition: none; }

@media (max-height: 820px) and (min-width: 861px) {
  .completion-confirm { min-height: 58px; padding: 8px 13px; }
  .completion-ring,
  .completion-ring svg { width: 38px; height: 38px; }
  .completion-ring { flex-basis: 38px; }
  .completion-copy strong { font-size: 13px; }
  .completion-copy small { font-size: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .ring-progress,
  .checkmark,
  .completion-copy { transition: none !important; }
}
</style>
