<template>
  <section id="hero" class="hero">
    <div class="hero-grid-bg" />
    <div class="hero-glow" />

    <div class="hero-container">
      <div class="hero-content">
        <span class="hero-badge">AI voice agent platform</span>

        <div class="headline-stage" aria-live="polite">
          <h1
            v-for="(headline, index) in headlines"
            :key="headline.accent"
            :class="{ active: index === headlineIndex }"
            :aria-hidden="index !== headlineIndex"
          >
            <span class="headline-line">{{ headline.top }}</span>
            <span class="headline-line">{{ headline.bottom }} <em>{{ headline.accent }}</em></span>
          </h1>
        </div>

        <p :key="headlineIndex" class="headline-description" aria-live="polite">
          {{ headlines[headlineIndex].description }}
        </p>

        <div class="caption-controls" :aria-label="`Headline ${headlineIndex + 1} of ${headlines.length}`">
          <button
            v-for="(_, index) in headlines"
            :key="index"
            :class="{ active: index === headlineIndex }"
            :aria-label="`Show headline ${index + 1}`"
            @click="headlineIndex = index"
          />
        </div>

        <div class="hero-proof-grid">
          <div class="proof-item"><span class="proof-icon proof-wave"><i /><i /><i /><i /><i /></span><div><strong>Always on</strong><small>From first ring to follow-through.</small></div></div>
          <div class="proof-item"><span class="proof-icon">✦</span><div><strong>Understands</strong><small>Captures intent with precision.</small></div></div>
          <div class="proof-item"><span class="proof-icon">✓</span><div><strong>Takes action</strong><small>Books, updates, notifies. Done.</small></div></div>
        </div>
      </div>

      <div class="hero-visual">
        <ChatOverlay />
      </div>
    </div>

  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue"
import ChatOverlay from "@/components/three/ChatOverlay.vue"

defineEmits(["open-demo"])

const headlines = [
  {
    top: "Where business",
    bottom: "finds its",
    accent: "voice.",
    description: "Your business has something to say. Voxa helps it speak to everyone."
  },
  {
    top: "One platform.",
    bottom: "Every business",
    accent: "conversation.",
    description: "Many conversations move your business. Voxa keeps them working as one."
  },
  {
    top: "Every call answered.",
    bottom: "Every next step",
    accent: "handled.",
    description: "Every call holds possibility. Voxa turns it into something real."
  }
]

const headlineIndex = ref(0)
let headlineTimer

onMounted(() => {
  headlineTimer = window.setInterval(() => {
    headlineIndex.value = (headlineIndex.value + 1) % headlines.length
  }, 4300)
})

onUnmounted(() => window.clearInterval(headlineTimer))
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
  overflow: hidden;
  padding: 124px 0 46px;
  isolation: isolate;
  background:
    radial-gradient(circle at 76% 34%, rgba(15, 23, 42, .2), transparent 31%),
    linear-gradient(128deg, #ffffff 0%, #f8f9fb 43%, #edf0f5 100%);
}

.hero-grid-bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(15, 23, 42, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, .06) 1px, transparent 1px);
  background-size: 66px 66px;
  mask-image: linear-gradient(90deg, rgba(0,0,0,.35) 0%, #000 34%, #000 100%);
  pointer-events: none;
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

.hero-badge { display: inline-flex; margin-bottom: 22px; padding: 7px 13px; border: 1px solid rgba(20,38,77,.14); border-radius: 999px; color: var(--hero-blue); background: rgba(20,38,77,.06); font-size: 9px; font-weight: 850; letter-spacing: .15em; text-transform: uppercase; }

.headline-stage { position: relative; height: clamp(205px, 19vw, 270px); }

.headline-stage h1 {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0;
  color: #11152b;
  font-size: clamp(54px, 4.45vw, 78px);
  font-weight: 780;
  line-height: .92;
  letter-spacing: -.074em;
  opacity: 0;
  filter: blur(9px);
  transform: translateY(25px);
  transition: opacity .65s ease, filter .65s ease, transform .65s cubic-bezier(.2,.8,.2,1);
  pointer-events: none;
}

.headline-stage h1.active { opacity: 1; filter: blur(0); transform: translateY(0); }
.headline-stage .headline-line { display: block; width: 100%; color: var(--hero-blue); }
.headline-stage .headline-line em { color: var(--hero-blue); font-style: normal; }

.hero-content > p { max-width: 610px; margin: 20px 0 0; color: #66708a; font-size: 18px; line-height: 1.62; }
.headline-description { min-height: 58px; animation: description-in .55s cubic-bezier(.2,.8,.2,1) both; }

.caption-controls { display: flex; gap: 8px; margin-top: 28px; }
.caption-controls button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 10px; background: #c7cde0; cursor: pointer; transition: width .25s ease, background .25s ease; }
.caption-controls button.active { width: 32px; background: var(--hero-blue); }

.hero-proof-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-top: 30px; }
.proof-item { display: flex; align-items: center; gap: 10px; min-width: 0; }
.proof-item > div { display: grid; gap: 3px; }.proof-item strong { color: var(--hero-blue); font-size: 10px; }.proof-item small { color: #7b879d; font-family: inherit; font-size: 9px; line-height: 1.35; }
.proof-icon { display: grid; width: 39px; height: 39px; flex: 0 0 auto; place-items: center; border: 1px solid rgba(20,38,77,.13); border-radius: 50%; color: var(--hero-blue); background: rgba(255,255,255,.82); box-shadow: 0 8px 22px rgba(20,38,77,.09); font-size: 15px; }
.proof-wave { display: flex; align-items: center; justify-content: center; gap: 2px; }.proof-wave i { width: 2px; height: 6px; border-radius: 3px; background: var(--hero-blue); }.proof-wave i:nth-child(2), .proof-wave i:nth-child(4) { height: 13px; }.proof-wave i:nth-child(3) { height: 20px; }

.hero-visual { position: relative; width: 100%; height: clamp(560px, calc(100vh - 170px), 710px); min-height: 0; }

@keyframes signal { 50% { opacity: .45; transform: scale(.82); } }
@keyframes ambient-drift { to { transform: translate3d(-45px, 32px, 0) rotate(8deg) scale(1.04); } }
@keyframes description-in { from { opacity: 0; transform: translateY(8px); filter: blur(3px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }

@media (max-width: 1120px) {
  .hero-container { grid-template-columns: minmax(0, .94fr) minmax(0, 1.06fr); gap: 0; }
  .headline-stage h1 { font-size: clamp(54px, 5.7vw, 72px); }
}

@media (max-height: 820px) and (min-width: 861px) {
  .hero { padding: 96px 0 24px; }
  .hero-container { min-height: calc(100vh - 120px); }
  .hero-content { padding: 10px 0 16px 8px; }
  .hero-badge { margin-bottom: 10px; }
  .headline-stage { height: clamp(170px, 23vh, 205px); }
  .headline-stage h1 { font-size: clamp(48px, 4.1vw, 66px); }
  .hero-content > p { margin-top: 10px; font-size: 16px; line-height: 1.5; }
  .headline-description { min-height: 48px; }
  .caption-controls { margin-top: 14px; }
  .hero-proof-grid { margin-top: 18px; }
  .hero-visual { height: calc(100vh - 120px); min-height: 500px; max-height: 620px; }
}

@media (max-width: 860px) {
  .hero { padding-top: 112px; }
  .hero-container { width: calc(100% - 32px); grid-template-columns: 1fr; }
  .hero-content { max-width: 720px; padding: 58px 12px 0; }
  .headline-stage { height: 280px; }
  .headline-stage h1 { font-size: clamp(58px, 11.4vw, 86px); }
  .hero-visual { height: 730px; margin-top: 12px; }
}

@media (max-width: 540px) {
  .hero { padding-top: 92px; }
  .hero-content { padding-top: 50px; }
  .eyebrow { font-size: 9px; }
  .headline-stage { height: 265px; }
  .headline-stage h1 { font-size: clamp(45px, 13vw, 58px); line-height: .94; }
  .hero-content > p { margin-top: 8px; font-size: 16px; line-height: 1.58; }
  .hero-proof-grid { grid-template-columns: 1fr; }.proof-item small { font-size: 10px; }
  .hero-visual { height: 700px; min-height: 700px; margin-left: -16px; width: calc(100% + 32px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero *, .hero *::before, .hero *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
}
</style>
