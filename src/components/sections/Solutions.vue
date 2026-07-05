<template>
  <section id="solutions" class="solutions">
    <div class="bg-grid"></div>
    <div class="glow glow-left"></div>
    <div class="glow glow-right"></div>

    <div class="container-custom">
      <div class="heading">
        <span>INDUSTRIES</span>
        <h2>AI built for<br>every industry.</h2>
        <p>
          Purpose-built intelligence designed to automate workflows,
          enhance customer experiences and accelerate business growth.
        </p>
      </div>

      <div
        class="carousel"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
        @mouseenter="pauseAutoPlay"
        @mouseleave="startAutoPlay"
      >
        <div class="carousel-stage">
          <article
            v-for="(item, index) in industries"
            :key="item.title"
            class="solution-card"
            :class="{ active: index === active }"
            :style="cardStyle(index)"
          >
            <div class="icon"><component :is="item.icon" /></div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
            <div class="bottom">
              <span>{{ item.tag }}</span>
              <div class="arrow">→</div>
            </div>
          </article>
        </div>

        <button class="carousel-arrow previous" type="button" aria-label="Previous industry" @click="previous">←</button>
        <button class="carousel-arrow next" type="button" aria-label="Next industry" @click="next">→</button>
      </div>

      <div class="dots" aria-label="Choose an industry">
        <button
          v-for="(item, index) in industries"
          :key="`${item.title}-dot`"
          type="button"
          :class="{ active: index === active }"
          :aria-label="`Show ${item.title}`"
          @click="goTo(index)"
        ></button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue"
import {
  HeartPulse,
  GraduationCap,
  Landmark,
  Building2,
  ShoppingBag,
  Factory,
  Plane,
  Briefcase
} from "lucide-vue-next"

const active = ref(0)
const pointerStart = ref(0)
let autoPlayTimer

const industries = [
  {
    title: "Healthcare",
    description: "Deliver always-on patient access with intelligent scheduling, triage and multilingual care coordination.",
    icon: HeartPulse,
    tag: "Patient access"
  },
  {
    title: "Education",
    description: "Guide every learner from first enquiry to enrollment with responsive, personalized support.",
    icon: GraduationCap,
    tag: "Student experience"
  },
  {
    title: "Finance",
    description: "Accelerate onboarding and service with secure intelligence designed for high-trust interactions.",
    icon: Landmark,
    tag: "Trusted operations"
  },
  {
    title: "Enterprise",
    description: "Unify teams, systems and decisions with AI that turns complex operations into effortless execution.",
    icon: Building2,
    tag: "Intelligent workflows"
  },
  {
    title: "Retail",
    description: "Create personal shopping journeys that understand intent, recommend precisely and convert naturally.",
    icon: ShoppingBag,
    tag: "Personalized commerce"
  },
  {
    title: "Manufacturing",
    description: "Turn operational signals into faster decisions, proactive maintenance and more resilient production.",
    icon: Factory,
    tag: "Operational intelligence"
  },
  {
    title: "Travel",
    description: "Orchestrate every journey with instant booking support, real-time changes and seamless multilingual service.",
    icon: Plane,
    tag: "Connected journeys"
  },
  {
    title: "Professional Services",
    description: "Elevate client delivery with AI that captures expertise, streamlines casework and protects billable focus.",
    icon: Briefcase,
    tag: "Client delivery"
  }
]

function normalizedOffset(index) {
  let offset = index - active.value
  if (offset > industries.length / 2) offset -= industries.length
  if (offset < -industries.length / 2) offset += industries.length
  return offset
}

function cardStyle(index) {
  const offset = normalizedOffset(index)
  const distance = Math.abs(offset)
  const x = offset * 365

  return {
    transform: `translate3d(${x}px, ${distance * 15}px, ${-distance * 190}px) rotateY(${-offset * 9}deg) scale(${Math.max(.72, 1 - distance * .09)})`,
    opacity: Math.max(.12, 1 - distance * .24),
    zIndex: 20 - distance,
    pointerEvents: distance > 1 ? "none" : "auto"
  }
}

function next() {
  active.value = (active.value + 1) % industries.length
}

function previous() {
  active.value = (active.value - 1 + industries.length) % industries.length
}

function goTo(index) {
  active.value = index
}

function onPointerDown(event) {
  pointerStart.value = event.clientX
}

function onPointerUp(event) {
  const distance = event.clientX - pointerStart.value
  if (Math.abs(distance) < 45) return
  distance > 0 ? previous() : next()
}

function pauseAutoPlay() {
  window.clearInterval(autoPlayTimer)
}

function startAutoPlay() {
  pauseAutoPlay()
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  autoPlayTimer = window.setInterval(next, 4200)
}

onMounted(startAutoPlay)
onUnmounted(pauseAutoPlay)
</script>

<style scoped>
.solutions {
  position: relative;
  padding: 150px 0 120px;
  background: var(--voxa-blue);
  overflow: hidden;
  isolation: isolate;
}

.container-custom { position: relative; z-index: 2; }

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, .04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, .04) 1px, transparent 1px);
  background-size: 46px 46px;
  opacity: .45;
}

.glow { display: none; }
.glow-left { width: 520px; height: 520px; left: -180px; top: -120px; background: rgba(var(--voxa-accent-rgb), .16); }
.glow-right { width: 600px; height: 600px; right: -220px; bottom: -180px; background: rgba(var(--voxa-accent-rgb), .08); }

.heading { max-width: 760px; margin: 0 auto 70px; text-align: center; }
.heading span {
  display: inline-flex;
  padding: 8px 16px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .08);
  color: var(--voxa-accent-soft);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .22em;
  margin-bottom: 24px;
}
.heading h2 { color: white; font-size: clamp(58px, 6vw, 82px); line-height: .95; letter-spacing: -.05em; margin-bottom: 24px; }
.heading p { max-width: 620px; margin: auto; color: #cbd5e1; font-size: 19px; line-height: 1.8; }

.carousel { position: relative; height: 570px; touch-action: pan-y; user-select: none; }
.carousel-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 2200px;
  transform-style: preserve-3d;
}

.solution-card {
  position: absolute;
  width: min(560px, calc(100vw - 48px));
  min-height: 470px;
  padding: 38px;
  border-radius: 30px;
  background: var(--voxa-blue-2);
  border: 1px solid rgba(255, 255, 255, .1);
  box-shadow: 0 30px 80px rgba(0, 0, 0, .26);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  backface-visibility: hidden;
  transition: transform .85s cubic-bezier(.22, 1, .36, 1), opacity .65s ease, border-color .4s, box-shadow .4s;
}
.solution-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(96, 165, 250, .85), transparent);
  opacity: 0;
  transition: opacity .4s ease;
}
.solution-card.active {
  border-color: rgba(var(--voxa-accent-rgb), .55);
  box-shadow: 0 45px 110px rgba(0, 0, 0, .35), 0 0 55px rgba(var(--voxa-accent-rgb), .12);
}
.solution-card.active::before { opacity: 1; }
.icon {
  width: 76px;
  height: 76px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 22px;
  background: linear-gradient(180deg, rgba(var(--voxa-accent-rgb), .14), rgba(var(--voxa-accent-rgb), .06));
  border: 1px solid rgba(var(--voxa-accent-rgb), .18);
  margin-bottom: 42px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08), 0 16px 35px rgba(var(--voxa-accent-rgb), .08);
}
.icon svg { width: 34px; height: 34px; stroke: var(--voxa-accent-2); stroke-width: 1.7; }
.solution-card h3 { color: white; font-size: 34px; font-weight: 700; letter-spacing: -.035em; margin-bottom: 18px; }
.solution-card p { max-width: 450px; color: #cbd5e1; font-size: 17px; line-height: 1.75; margin-bottom: auto; }
.bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 34px; padding-top: 22px; border-top: 1px solid rgba(255, 255, 255, .09); }
.bottom span { color: #dbeafe; font-size: 13px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; }
.arrow { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 50%; background: white; color: var(--voxa-blue); }

.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 40;
  width: 58px;
  height: 58px;
  border: 0;
  border-radius: 50%;
  background: white;
  color: var(--voxa-blue);
  box-shadow: 0 18px 40px rgba(0, 0, 0, .25);
  font-size: 21px;
  cursor: pointer;
  transform: translateY(-50%);
  transition: transform .3s, background .3s, color .3s;
}
.carousel-arrow:hover { background: var(--voxa-accent-2); color: white; transform: translateY(-50%) scale(1.08); }
.previous { left: 24px; }
.next { right: 24px; }

.dots { display: flex; justify-content: center; gap: 10px; margin-top: 14px; }
.dots button { width: 8px; height: 8px; padding: 0; border: 0; border-radius: 999px; background: rgba(255, 255, 255, .25); cursor: pointer; transition: width .3s, background .3s; }
.dots button.active { width: 30px; background: var(--voxa-accent-2); }

@media (max-width: 768px) {
  .solutions { padding: 105px 0 90px; }
  .heading { margin-bottom: 45px; }
  .heading h2 { font-size: 44px; }
  .heading p { font-size: 16px; }
  .carousel { height: 520px; }
  .solution-card { min-height: 430px; padding: 28px; }
  .solution-card h3 { font-size: 27px; }
  .solution-card p { font-size: 15px; }
  .carousel-arrow { top: auto; bottom: -2px; width: 50px; height: 50px; transform: none; }
  .carousel-arrow:hover { transform: scale(1.06); }
  .previous { left: calc(50% - 66px); }
  .next { right: calc(50% - 66px); }
  .dots { margin-top: 72px; }
}

@media (prefers-reduced-motion: reduce) {
  .solution-card { transition-duration: .01ms; }
}
</style>
