<template>
  <div class="voice-ribbon" :class="`is-${state}`" aria-hidden="true">
    <svg ref="svg" viewBox="0 0 1200 400" role="img">
      <defs>
        <linearGradient id="voxa-ribbon-main" x1="0" x2="1">
          <stop offset="0%" stop-color="var(--voxa-accent, #2563EB)" />
          <stop offset="48%" stop-color="var(--voxa-accent-2, #3B82F6)" />
          <stop offset="100%" stop-color="var(--voxa-accent-soft, #DBEAFE)" />
        </linearGradient>
        <linearGradient id="voxa-ribbon-depth" x1="1" x2="0">
          <stop offset="0%" stop-color="var(--voxa-accent-soft, #DBEAFE)" />
          <stop offset="55%" stop-color="var(--voxa-accent-2, #3B82F6)" />
          <stop offset="100%" stop-color="var(--voxa-accent, #2563EB)" />
        </linearGradient>
      </defs>
      <g class="glow-layer"><path class="main-path" :d="mainPath" /></g>
      <g class="depth-layer"><path class="depth-path" :d="depthPath" /></g>
      <g class="sharp-layer"><path class="main-path" :d="mainPath" /></g>
    </svg>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue"

const props = defineProps({
  state: { type: String, default: "idle", validator: value => ["idle", "calling", "connected"].includes(value) }
})

const mainPath = ref("")
const depthPath = ref("")
const reducedMotion = ref(false)
let frame = 0
let startedAt = 0
let amplitude = 44
let targetAmplitude = 44

const ribbonPath = (time, amp, phase, thickness) => {
  const top = []
  const bottom = []
  const points = 18
  for (let i = 0; i <= points; i += 1) {
    const x = (1200 / points) * i
    const envelope = Math.sin((i / points) * Math.PI)
    const wave = Math.sin(i * .76 + time + phase) + .36 * Math.sin(i * 1.37 - time * .72)
    const y = 200 + wave * amp * envelope
    const width = thickness * (.55 + envelope * .45)
    top.push(`${x.toFixed(1)},${(y - width).toFixed(1)}`)
    bottom.unshift(`${x.toFixed(1)},${(y + width).toFixed(1)}`)
  }
  return `M${top.join(" L")} L${bottom.join(" L")} Z`
}

const draw = timestamp => {
  if (!startedAt) startedAt = timestamp
  amplitude += (targetAmplitude - amplitude) * .045
  const speed = props.state === "connected" ? .00135 : props.state === "calling" ? .0009 : .00055
  const time = (timestamp - startedAt) * speed
  mainPath.value = ribbonPath(time, amplitude, 0, 19)
  depthPath.value = ribbonPath(time * 1.7, amplitude * .72, 1.8, 12)
  if (!reducedMotion.value) frame = requestAnimationFrame(draw)
}

watch(() => props.state, value => {
  targetAmplitude = value === "connected" ? 76 : value === "calling" ? 56 : 44
})

onMounted(() => {
  reducedMotion.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  targetAmplitude = props.state === "connected" ? 76 : props.state === "calling" ? 56 : 44
  draw(performance.now())
})

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<style scoped>
.voice-ribbon { width:100%; contain:layout paint; transform:translateZ(0); }
svg { display:block; width:100%; overflow:visible; }
.glow-layer { filter:blur(24px); opacity:.56; transform:translateZ(0); will-change:transform,filter; }
.sharp-layer { filter:blur(1.5px); opacity:.86; transform:translateZ(0); }
.depth-layer { filter:blur(8px); opacity:.4; transform:translate3d(0,22px,0); animation:ribbon-drift 4.8s ease-in-out infinite alternate; }
.main-path { fill:url(#voxa-ribbon-main); }
.depth-path { fill:url(#voxa-ribbon-depth); }
stop { animation:gradient-cycle 8s ease-in-out infinite alternate; }
stop:nth-child(2) { animation-delay:-2.6s; }
stop:nth-child(3) { animation-delay:-5.2s; }
.is-connected svg { transform:scaleY(1.04) translateZ(0); }
@keyframes gradient-cycle { 0% { stop-opacity:.72; } 50% { stop-opacity:1; } 100% { stop-opacity:.78; } }
@keyframes ribbon-drift { to { transform:translate3d(16px,8px,0) scaleX(1.02); } }
@media (prefers-reduced-motion:reduce) { stop,.depth-layer { animation:none; } }
</style>
