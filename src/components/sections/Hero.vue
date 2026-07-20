<template>
  <section id="hero" class="hero landing-section">
    <div class="hero-glow" />

    <div class="hero-container">
      <div class="hero-content">
        <span class="hero-badge">{{ t("AI voice agent platform") }}</span>

        <div ref="headlineStage" class="headline-stage" aria-live="polite" @mouseenter="pauseHeadlines" @mouseleave="resumeHeadlines" @focusin="pauseHeadlines" @focusout="resumeHeadlines">
          <h1
            class="display-heading"
            v-for="(headline, index) in headlines"
            :key="headline.id"
            :class="{ active: index === headlineIndex }"
            :aria-hidden="index !== headlineIndex"
          >
            <span v-for="(line, lineIndex) in headline.lines" :key="lineIndex" class="headline-line">
              <template v-for="segment in line" :key="segment.text">
                <em v-if="segment.accent" :class="{ underlined: segment.underline }">{{ t(segment.text) }}</em>
                <template v-else>{{ t(segment.text) }}</template>
              </template>
            </span>
          </h1>
        </div>

        <p :key="headlineIndex" class="headline-description" aria-live="polite">
          {{ t(headlines[headlineIndex].description) }}
        </p>

        <div class="caption-controls" :aria-label="`Headline ${headlineIndex + 1} of ${headlines.length}`">
          <button
            v-for="(_, index) in headlines"
            :key="index"
            :class="{ active: index === headlineIndex }"
            :aria-label="`Show headline ${index + 1}`"
            @click="selectHeadline(index)"
          />
          <button
            class="caption-play-toggle"
            type="button"
            :aria-label="isHeadlinePaused ? 'Resume headline rotation' : 'Pause headline rotation'"
            :aria-pressed="isHeadlinePaused"
            @click="toggleHeadlineRotation"
          >
            <span aria-hidden="true">{{ isHeadlinePaused ? '▶' : 'Ⅱ' }}</span>
          </button>
        </div>

        <div class="hero-proof-grid" aria-label="Woxza capabilities">
          <div v-for="capability in capabilities" :key="capability.title" class="proof-item">
            <span class="proof-icon" :style="{ '--icon-color': capability.color, '--icon-soft': capability.soft }"><component :is="capability.icon" /></span>
            <div><strong>{{ t(capability.title) }}</strong><small>{{ t(capability.description) }}</small></div>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <ChatOverlay />
      </div>
    </div>

  </section>
</template>

<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { BrainCircuit, Languages, PhoneCall, Workflow } from "lucide-vue-next"
import ChatOverlay from "@/components/three/ChatOverlay.vue"
import { useI18n } from "@/composables/useI18n"

const { language, t } = useI18n()

const headlines = [
  {
    id: "voice-agents",
    lines: [
      [{ text: "AI voice agents that" }],
      [{ text: "answer calls, understand" }],
      [{ text: "customers and " }, { text: "get", accent: true }],
      [{ text: "work done", accent: true, underline: true }]
    ],
    description: "Woxza answers every call, understands intent, and takes action so your team can focus on what matters."
  },
  {
    id: "every-call",
    lines: [
      [{ text: "Every call answered" }],
      [{ text: "Every customer" }],
      [{ text: "understood. Every" }],
      [{ text: "step handled", accent: true, underline: true }]
    ],
    description: "From the first hello to the finished task, Woxza keeps every customer conversation moving forward."
  },
  {
    id: "one-platform",
    lines: [
      [{ text: "One platform for" }],
      [{ text: "every conversation" }],
      [{ text: "your business needs" }],
      [{ text: "completed", accent: true, underline: true }]
    ],
    description: "Many conversations move your business. Woxza connects them, understands them, and completes the work behind them."
  }
]

const capabilities = [
  { title: "Never miss a call", description: "24/7 AI availability", icon: PhoneCall, color: "#2563eb", soft: "#edf4ff" },
  { title: "Understand intent", description: "Human-like conversations", icon: BrainCircuit, color: "#15966a", soft: "#eafaf3" },
  { title: "Take action", description: "Book, update, notify & more", icon: Workflow, color: "#7c3aed", soft: "#f4edff" },
  { title: "Speak every language", description: "Multilingual by default", icon: Languages, color: "#087ea4", soft: "#e8f8fc" }
]

const headlineIndex = ref(0)
const isHeadlinePaused = ref(false)
let headlineTimer
const headlineStage = ref(null)

const fitHeadlineStage = async () => {
  await nextTick()
  const stage = headlineStage.value
  const active = stage?.querySelector("h1.active")
  if (!stage || !active) return
  // The heading is visually stacked for the animation; measure its natural
  // content height so a longer locale can never collide with copy below.
  stage.style.setProperty("--headline-height", `${Math.ceil(active.scrollHeight)}px`)
}

const startHeadlineTimer = () => {
  window.clearInterval(headlineTimer)
  headlineTimer = window.setInterval(() => {
    headlineIndex.value = (headlineIndex.value + 1) % headlines.length
  }, 8000)
}

const pauseHeadlines = () => window.clearInterval(headlineTimer)
const resumeHeadlines = () => {
  if (!isHeadlinePaused.value) startHeadlineTimer()
}
const selectHeadline = (index) => {
  headlineIndex.value = index
  fitHeadlineStage()
  if (!isHeadlinePaused.value) startHeadlineTimer()
}
const toggleHeadlineRotation = () => {
  isHeadlinePaused.value = !isHeadlinePaused.value
  if (isHeadlinePaused.value) pauseHeadlines()
  else startHeadlineTimer()
}

watch([headlineIndex, language], fitHeadlineStage, { flush: "post" })
onMounted(() => {
  startHeadlineTimer()
  fitHeadlineStage()
  window.addEventListener("resize", fitHeadlineStage)
  document.fonts?.ready.then(fitHeadlineStage)
})
onUnmounted(() => {
  window.clearInterval(headlineTimer)
  window.removeEventListener("resize", fitHeadlineStage)
})
</script>

<style scoped>
.hero {
  --hero-blue: #14264d;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: visible;
  isolation: isolate;
  background:
    radial-gradient(circle at 76% 34%, rgba(15, 23, 42, .2), transparent 31%),
    linear-gradient(128deg, #ffffff 0%, #f8f9fb 43%, #edf0f5 100%);
}

.hero-glow {
  position: absolute;
  width: 920px;
  height: 920px;
  right: -180px;
  top: -160px;
  border-radius: 50%;
  background: conic-gradient(from 210deg, rgba(20,38,77,.06), rgba(20,38,77,.32), rgba(20,38,77,.12), rgba(20,38,77,.06));
  filter: blur(54px);
  opacity: .78;
  pointer-events: none;
  animation: ambient-drift 13s ease-in-out infinite alternate;
}

.hero-glow::before,
.hero-glow::after {
  content: "";
  position: absolute;
  border-radius: 50%;
  filter: blur(24px);
}

.hero-glow::before { width: 300px; height: 300px; left: 12%; top: 17%; background: rgba(20,38,77,.16); }
.hero-glow::after { width: 360px; height: 360px; right: 11%; bottom: 12%; background: rgba(15, 23, 42, .14); }

.hero-container {
  position: relative;
  z-index: 2;
  width: min(1480px, calc(100% - 64px));
  min-height: calc(100vh - 170px);
  margin: auto;
  display: grid;
  grid-template-columns: minmax(0, .96fr) minmax(0, 1.04fr);
  align-items: center;
  gap: 24px;
}

.hero-content { width: 100%; max-width: 760px; padding: 24px 0 28px 8px; }

.hero-badge { display: inline-flex; margin-bottom: 22px; padding: 9px 15px; border: 1px solid rgba(20,38,77,.14); border-radius: 999px; color: var(--hero-blue); background: rgba(20,38,77,.06); font-size: 12px; font-weight: 850; letter-spacing: .15em; text-transform: uppercase; }

.headline-stage { position: relative; min-height: clamp(300px, 24vw, 365px); height: auto; }

.headline-stage h1 {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  margin: 0;
  color: #11152b;
  font-size: clamp(48px, 3.75vw, 66px);
  font-weight: 780;
  line-height: .96;
  letter-spacing: -.062em;
  opacity: 0;
  filter: blur(9px);
  transform: translateY(25px);
  transition: opacity .65s ease, filter .65s ease, transform .65s cubic-bezier(.2,.8,.2,1);
  pointer-events: none;
}

.headline-stage h1.active { position:relative; inset:auto; opacity:1; filter:blur(0); transform:translateY(0); }
.headline-stage .headline-line { display: block; width: 100%; color: var(--hero-blue); }
.headline-stage .headline-line em { position: relative; display: inline-block; color: #2563eb; font-style: normal; }
.headline-stage .headline-line em.underlined::after { content: ""; position: absolute; left: 2%; right: -4%; bottom: -9px; height: 13px; border-top: 4px solid #2563eb; border-radius: 50%; transform: rotate(-2deg); opacity: .92; }

.hero-content > p { max-width: 700px; margin: 17px 0 0; color: #66708a; font-size: 21px; line-height: 1.55; }
.headline-description { min-height: 68px; animation: description-in .55s cubic-bezier(.2,.8,.2,1) both; }

.caption-controls { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
.caption-controls button { width: 10px; height: 10px; padding: 0; border: 0; border-radius: 10px; background: #c7cde0; cursor: pointer; transition: width .25s ease, background .25s ease; }
.caption-controls button.active { width: 42px; background: var(--hero-blue); }
.caption-controls .caption-play-toggle { display: grid; width: 32px; height: 32px; margin-left: 4px; place-items: center; border: 1px solid rgba(20,38,77,.2); border-radius: 50%; color: var(--hero-blue); background: rgba(255,255,255,.8); font-size: 13px; line-height: 1; transition: background .2s ease, border-color .2s ease, transform .2s ease; }
.caption-controls .caption-play-toggle:hover, .caption-controls .caption-play-toggle:focus-visible { border-color: var(--hero-blue); background: #fff; transform: scale(1.06); outline: none; }

.hero-proof-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-top: 18px; border: 1px solid rgba(20,38,77,.11); border-radius: 22px; background: rgba(255,255,255,.68); box-shadow: 0 18px 48px rgba(20,38,77,.08); backdrop-filter: blur(16px); overflow: hidden; }
.proof-item { display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 14px; min-width: 0; padding: 22px 20px; }
.proof-item:nth-child(even) { border-left: 1px solid rgba(20,38,77,.09); }
.proof-item:nth-child(n + 3) { border-top: 1px solid rgba(20,38,77,.09); }
.proof-item > div { display: grid; gap: 5px; min-width: 0; }
.proof-item strong { color: var(--hero-blue); font-size: 18px; line-height: 1.18; }
.proof-item small { color: #7b879d; font-family: inherit; font-size: 16px; line-height: 1.35; }
.proof-icon { display: grid; width: 64px; height: 64px; flex: 0 0 auto; place-items: center; border: 1px solid color-mix(in srgb, var(--icon-color) 20%, white); border-radius: 18px; color: var(--icon-color); background: var(--icon-soft); box-shadow: 0 7px 20px color-mix(in srgb, var(--icon-color) 13%, transparent); }
.proof-icon svg { width: 30px; height: 30px; stroke-width: 2; }

.hero-visual { position: relative; width: 100%; height: clamp(560px, calc(100vh - 170px), 710px); min-height: 0; }

@keyframes signal { 50% { opacity: .45; transform: scale(.82); } }
@keyframes ambient-drift { to { transform: translate3d(-45px, 32px, 0) rotate(8deg) scale(1.04); } }
@keyframes description-in { from { opacity: 0; transform: translateY(8px); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }

@media (max-width: 1120px) {
  .hero-container { grid-template-columns: minmax(0, .94fr) minmax(0, 1.06fr); gap: 0; }
  .headline-stage h1 { font-size: clamp(45px, 4.7vw, 60px); }
}

@media (max-height: 820px) and (min-width: 861px) {
  .hero-container { min-height: calc(100vh - 120px); }
  .hero-content { padding: 10px 0 16px 8px; }
  .hero-badge { margin-bottom: 10px; }
  .headline-stage { min-height: clamp(220px, 32vh, 255px); height:auto; }
  .headline-stage h1 { font-size: clamp(40px, 3.55vw, 51px); }
  .hero-content > p { margin-top: 10px; font-size: 19px; line-height: 1.5; }
  .headline-description { min-height: 56px; }
  .caption-controls { margin-top: 10px; }
  .hero-proof-grid { margin-top: 10px; }
  .proof-item { grid-template-columns: 54px 1fr; gap:10px; padding: 13px 10px; }
  .proof-icon { width: 54px; height: 54px; }
  .proof-icon svg { width: 25px; height: 25px; }
  .proof-item strong { font-size: 15px; }
  .proof-item small { font-size: 13px; }
  .hero-visual { height: calc(100vh - 120px); min-height: 500px; max-height: 620px; }
}

@media (max-width: 860px) {
  .hero,
  .hero-container,
  .hero-content,
  .headline-stage {
    touch-action: pan-y;
  }
  .hero-container { width: calc(100% - 32px); grid-template-columns: 1fr; }
  .hero-content { max-width: 720px; padding: 58px 12px 0; }
  .headline-stage { min-height: 350px; height:auto; }
  .headline-stage h1 { font-size: clamp(48px, 8.8vw, 68px); }
  .hero-visual { height: 730px; margin-top: 12px; }
}

@media (max-width: 540px) {
  .hero-content { padding-top: 50px; }
  .eyebrow { font-size: 9px; }
  .headline-stage { min-height: 285px; height:auto; }
  .headline-stage h1 { font-size: clamp(38px, 10.4vw, 51px); line-height: .98; }
  .hero-content > p { margin-top: 8px; font-size: 18px; line-height: 1.58; }
  .hero-proof-grid { grid-template-columns: repeat(2, 1fr); }
  .proof-item { grid-template-columns: 54px 1fr; gap:10px; padding:16px 12px; }
  .proof-icon { width:54px; height:54px; border-radius:16px; }
  .proof-icon svg { width:25px; height:25px; }
  .proof-item strong { font-size: 16px; }
  .proof-item small { font-size: 14px; }
  .hero-visual { height: 700px; min-height: 700px; margin-left: -16px; width: calc(100% + 32px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero *, .hero *::before, .hero *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
}
</style>
