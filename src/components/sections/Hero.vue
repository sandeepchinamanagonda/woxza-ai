<template>
  <section id="hero" class="hero">

    <div class="hero-grid-bg"></div>
    <div class="hero-glow"></div>
    <div class="hero-orbit orbit-large"></div>
    <div class="hero-orbit orbit-small"></div>
    <div class="signal-thread"></div>

    <div class="hero-container">

      <!-- LEFT -->
      <div class="hero-content">

        <span class="hero-badge">
          AI voice agent platform
        </span>

        <div class="headline-stage" aria-live="polite">

          <h1
            v-for="(headline, index) in headlines"
            :key="headline.accent"
            :class="{ active: index === headlineIndex }"
            :aria-hidden="index !== headlineIndex"
          >

            <span class="headline-line">
              {{ headline.top }}
            </span>

            <span class="headline-line">
              {{ headline.bottom }}
              <em>{{ headline.accent }}</em>
            </span>

          </h1>

        </div>

        <p
          :key="headlineIndex"
          class="headline-description"
          aria-live="polite"
        >
          {{ headlines[headlineIndex].description }}
        </p>

        <!-- BUTTONS -->

        <div class="hero-actions">

  <button
    class="primary-btn"
    @click="$emit('open-demo')"
  >
    Join Early Access
  </button>

</div>

        <!-- DOTS -->

        <div
          class="caption-controls"
          :aria-label="`Headline ${headlineIndex + 1} of ${headlines.length}`"
        >

          <button
            v-for="(_, index) in headlines"
            :key="index"
            :class="{ active: index === headlineIndex }"
            :aria-label="`Show headline ${index + 1}`"
            @click="headlineIndex = index"
          />

        </div>

        <!-- EARLY ACCESS -->

        <div class="early-access">

          <p class="access-title">
            EARLY ACCESS AVAILABLE FOR
          </p>

          <div class="industry-list">

            <span>Healthcare</span>
            <span>Education</span>
            <span>Retail</span>
            <span>Hospitality</span>
            <span>Real Estate</span>
            <span>Restaurants</span>

          </div>

        </div>

      </div>

      <!-- RIGHT -->

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
    radial-gradient(circle at 72% 46%, rgba(20,38,77,.20), transparent 27%),
    radial-gradient(circle at 88% 18%, rgba(20,38,77,.10), transparent 24%),
    linear-gradient(105deg, #ffffff 0%, #fbfcff 48%, #e9edf5 100%);
}

.hero-grid-bg {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(15, 23, 42, .06) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, .06) 1px, transparent 1px);
  background-size: 66px 66px;
  mask-image: linear-gradient(90deg, rgba(0,0,0,.55) 0%, #000 34%, #000 100%);
  pointer-events: none;
}

.hero-glow {
  position: absolute;
  width: 980px;
  height: 980px;
  right: -190px;
  top: -120px;
  border-radius: 50%;
  background: conic-gradient(from 210deg, rgba(20,38,77,.06), rgba(20,38,77,.32), rgba(20,38,77,.12), rgba(20,38,77,.06));
  filter: blur(64px);
  opacity: .62;
  pointer-events: none;
  animation: ambient-drift 13s ease-in-out infinite alternate;
}

.hero-orbit{
  position:absolute;
  right:9%;
  top:50%;
  transform:translateY(-50%);
  border-radius:50%;
  pointer-events:none;
  z-index:1;
}

.orbit-large{
  width:min(680px,48vw);
  height:min(680px,48vw);
  border:1px solid rgba(20,38,77,.12);
  box-shadow:
    inset 0 0 0 92px rgba(20,38,77,.08),
    0 34px 110px rgba(20,38,77,.16);
}

.orbit-small{
  width:min(470px,34vw);
  height:min(470px,34vw);
  border:1px solid rgba(20,38,77,.08);
  background:rgba(20,38,77,.05);
}

.signal-thread{
  position:absolute;
  right:7%;
  top:51%;
  width:50vw;
  height:130px;
  z-index:1;
  pointer-events:none;
  opacity:.52;
  background:
    linear-gradient(100deg, transparent 0 8%, rgba(20,38,77,.30) 8% 10%, transparent 10% 16%, rgba(20,38,77,.22) 16% 18%, transparent 18%) 0 44%/120px 2px repeat-x,
    linear-gradient(170deg, transparent 0 44%, rgba(20,38,77,.18) 44% 46%, transparent 46%);
  mask-image:linear-gradient(90deg,transparent,#000 16%,#000 84%,transparent);
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
  gap: 70px;
}

.hero-content { width: 100%; max-width: 820px; padding: 24px 0 28px 8px; }

.hero-badge { display: inline-flex; margin-bottom: 22px; padding: 8px 16px; border: 1px solid rgba(20,38,77,.14); border-radius: 999px; color: var(--hero-blue); background: rgba(20,38,77,.06); font-size: 10px; font-weight: 850; letter-spacing: .15em; text-transform: uppercase; }

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
font-size: clamp(58px, 5vw, 88px);
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

.hero-content > p{

max-width:620px;

margin:26px 0 0;

color:#667085;

font-size:19px;

line-height:1.75;

}

.headline-description{

min-height:58px;

animation:description-in .55s cubic-bezier(.2,.8,.2,1) both;

}

/* ===========================
HERO BUTTONS
=========================== */

.hero-actions{

display:flex;

margin-top:30px;

}

.primary-btn{

min-width:220px;

}

.primary-btn{

padding:15px 28px;

background:#14264d;

color:white;

border:none;

border-radius:999px;

font-weight:600;

cursor:pointer;

transition:.3s;

}

.primary-btn:hover{

transform:translateY(-2px);

}

.secondary-btn{

padding:15px 28px;

background:white;

border:1px solid rgba(20,38,77,.12);

border-radius:999px;

font-weight:600;

cursor:pointer;

transition:.3s;

}

.secondary-btn:hover{

background:#F8FAFD;

}
.caption-controls { display: flex; gap: 8px; margin-top: 28px; }
.caption-controls button { width: 7px; height: 7px; padding: 0; border: 0; border-radius: 10px; background: #c7cde0; cursor: pointer; transition: width .25s ease, background .25s ease; }
.caption-controls button.active { width: 32px; background: var(--hero-blue); }

.early-access{

margin-top:38px;

}

.access-title{

font-size:11px;

font-weight:700;

letter-spacing:.18em;

color:#94A3B8;

margin-bottom:18px;

}

.industry-list{

display:flex;

flex-wrap:wrap;

gap:12px;

}

.industry-list span{

padding:12px 18px;

border-radius:999px;

background:#fff;

border:1px solid rgba(20,38,77,.08);

font-size:13px;

font-weight:600;

color:#475467;

transition:.3s;

}

.industry-list span:hover{

background:#F5F9FF;

border-color:#3B82F6;

transform:translateY(-2px);

}

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
.early-access{

margin-top:18px;

}  .hero-visual { height: calc(100vh - 120px); min-height: 500px; max-height: 620px; }
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
.industry-list{

justify-content:center;

}  .hero-visual { height: 700px; min-height: 700px; margin-left: -16px; width: calc(100% + 32px); }
}

@media (prefers-reduced-motion: reduce) {
  .hero *, .hero *::before, .hero *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; }
}

</style>
