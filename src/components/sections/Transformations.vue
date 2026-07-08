<template>
  <section
    id="approach"
    class="transformations"
    :class="{ 'is-paused': paused }"
    @mouseenter="stopAuto"
    @mouseleave="startAuto"
    @focusin="stopAuto"
    @focusout="startAuto"
  >
    <div class="grid-bg"></div>
    <div class="ambient ambient-left"></div>
    <div class="ambient ambient-right"></div>

    <div class="container-custom">
      <header class="heading">
        <span>TRANSFORMATION, DELIVERED</span>
        <h2>From daily friction to a business that moves.</h2>
        <p>
          See what changes when Voxa joins the workflow, then follow the clear
          process that takes each idea from conversation to measurable result.
        </p>
      </header>

      <div class="case-tabs" aria-label="Choose a transformation story">
        <button
          v-for="(slide, index) in slides"
          :key="slide.tab"
          type="button"
          :class="{ active: activeSlide === index }"
          :aria-pressed="activeSlide === index"
          @click="selectSlide(index)"
        >
          <component :is="slide.icon" />
          {{ slide.tab }}
        </button>
      </div>

      <div class="story-stage">
        <article
          v-show="activeSlide < stories.length"
          class="transformation-story"
          :class="activeSlide === 0 ? 'story-conversations' : 'story-operations'"
        >
          <header class="story-heading">
            <div>
              <span>{{ currentStory.kicker }}</span>
              <h3>{{ currentStory.panelTitle }}</h3>
            </div>
            <p>{{ currentStory.panelDescription }}</p>
          </header>

          <div class="transformation-grid">
            <div class="state-card before-card">
              <span class="state-label">BEFORE VOXA</span>
              <h3>{{ currentStory.beforeTitle }}</h3>
              <ul>
                <li v-for="item in currentStory.before" :key="item">{{ item }}</li>
              </ul>
            </div>

            <div class="transformation-core">
              <span class="signal-dot"></span>
              <div class="core-icon"><component :is="currentStory.icon" /></div>
              <small>VOXA IN ACTION</small>
              <strong>{{ currentStory.solution }}</strong>
              <p>{{ currentStory.bridge }}</p>
              <span class="signal-arrow">→</span>
            </div>

            <div class="state-card after-card">
              <span class="state-label">WITH VOXA</span>
              <h3>{{ currentStory.afterTitle }}</h3>
              <ul>
                <li v-for="item in currentStory.after" :key="item">{{ item }}</li>
              </ul>
              <div class="result-badge">
                <CheckCircle2 />
                <span>{{ currentStory.result }}</span>
              </div>
            </div>
          </div>
        </article>

        <div v-show="activeSlide === stories.length" class="process-panel">
          <header class="process-heading">
            <div>
              <span>HOW WE GET THERE</span>
              <h3>A clear path from first conversation to lasting value.</h3>
            </div>
            <p>No mystery. No giant launch. Each step proves the next one is worth taking.</p>
          </header>

          <ol class="process-grid">
            <li v-for="(step, index) in process" :key="step.title">
              <div class="step-topline">
                <span>STEP {{ String(index + 1).padStart(2, '0') }}</span>
                <component :is="step.icon" />
              </div>
              <h4>{{ step.title }}</h4>
              <p>{{ step.description }}</p>
            </li>
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue"
import {
  CheckCircle2,
  Headphones,
  Network,
  Route,
  Search,
  ShieldCheck,
  TrendingUp,
  Wrench
} from "lucide-vue-next"

const activeSlide = ref(0)
const paused = ref(false)
let storyTimer

const stories = [
  {
    tab: "Customer conversations",
    icon: Headphones,
    kicker: "CUSTOMER CONVERSATIONS",
    panelTitle: "Every call answered. Every next step handled.",
    panelDescription: "Voxa turns the moment a customer reaches out into a clear, completed outcome.",
    beforeTitle: "Every ring depends on one person.",
    before: [
      "Appointments wait for a callback",
      "After-hours calls go unanswered",
      "Customers repeat the same details",
      "Follow-up slips when the day gets busy"
    ],
    solution: "Voxa AI Receptionist",
    bridge: "Listens, answers, books and follows through in the same conversation.",
    afterTitle: "Every customer leaves with a next step.",
    after: [
      "Calls are answered at any hour",
      "Appointments are booked instantly",
      "Staff receive the full context",
      "Customers get immediate confirmation"
    ],
    result: "Available whenever customers call"
  },
  {
    tab: "Business operations",
    icon: Network,
    kicker: "BUSINESS OPERATIONS",
    panelTitle: "Routine work moves without being chased.",
    panelDescription: "Voxa connects the systems, decisions and updates that keep the business moving.",
    beforeTitle: "People spend the day moving information.",
    before: [
      "Teams copy data between systems",
      "Routine updates require a handoff",
      "Reports arrive after decisions are made",
      "Small errors create hours of rework"
    ],
    solution: "Connected Automation",
    bridge: "Moves information, updates tools and keeps every team in sync.",
    afterTitle: "Work moves without being chased.",
    after: [
      "Applications update each other",
      "Routine work completes automatically",
      "Results stay visible in real time",
      "People focus on exceptions and decisions"
    ],
    result: "Hours returned to the team each week"
  }
]

const slides = [
  { tab: "Customer conversations", icon: Headphones },
  { tab: "Business operations", icon: Network },
  { tab: "How we get there", icon: Route }
]

const process = [
  { title: "Listen", description: "Understand the conversations, friction and outcomes that matter most.", icon: Search },
  { title: "Design", description: "Shape the experience, actions, integrations and human handoffs.", icon: Network },
  { title: "Build", description: "Create the voice, agents and automations around your real workflow.", icon: Wrench },
  { title: "Prove", description: "Test real scenarios with your team before customers ever depend on it.", icon: ShieldCheck },
  { title: "Grow", description: "Measure results, improve what works and expand with confidence.", icon: TrendingUp }
]

const currentStory = computed(() => stories[activeSlide.value] || stories[0])

function selectSlide(index) {
  activeSlide.value = index
}

function stopAuto() {
  paused.value = true
  window.clearInterval(storyTimer)
}

function startAuto() {
  window.clearInterval(storyTimer)
  paused.value = false
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  storyTimer = window.setInterval(() => {
    activeSlide.value = (activeSlide.value + 1) % slides.length
  }, 5200)
}

onMounted(startAuto)
onUnmounted(() => window.clearInterval(storyTimer))
</script>

<style scoped>
.transformations {
  position: relative;
  padding: 150px 0;
  overflow: hidden;
  isolation: isolate;
  background: var(--voxa-blue);
}

.grid-bg {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, .04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, .04) 1px, transparent 1px);
  background-size: 46px 46px;
  opacity: .45;
  pointer-events: none;
}

.ambient { display: none; }
.ambient-left { left: -300px; top: 120px; background: rgba(52, 120, 246, .16); }
.ambient-right { right: -320px; bottom: 80px; background: rgba(67, 133, 255, .1); }

.container-custom { position: relative; z-index: 2; }

.heading { max-width: 940px; margin: 0 auto 70px; text-align: center; }
.heading > span { display: inline-block; margin-bottom: 22px; color: #8eb4ff; font-size: 11px; font-weight: 800; letter-spacing: .28em; }
.heading h2 { margin: 0 0 28px; color: #fff; font-size: clamp(58px, 6vw, 88px); line-height: .96; letter-spacing: -.055em; text-wrap: balance; }
.heading p { max-width: 700px; margin: auto; color: #aeb9cc; font-size: 18px; line-height: 1.8; text-wrap: pretty; }

.case-tabs { display: flex; justify-content: center; gap: 10px; margin-bottom: 34px; }
.case-tabs button { position: relative; overflow: hidden; display: flex; align-items: center; gap: 9px; padding: 12px 18px; border: 1px solid rgba(255, 255, 255, .13); border-radius: 999px; background: rgba(255, 255, 255, .055); color: #aeb9cc; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; transition: color .3s, background .3s, border-color .3s, box-shadow .3s; }
.case-tabs button svg { width: 17px; height: 17px; }
.case-tabs button.active { border-color: #4385ff; background: #3478f6; color: white; box-shadow: 0 12px 32px rgba(52, 120, 246, .3); }
.case-tabs button.active::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 2px; background: rgba(255, 255, 255, .82); transform-origin: left; animation: story-progress 5.2s linear both; }
.transformations.is-paused .case-tabs button.active::after { animation-play-state: paused; }
.case-tabs button:focus-visible { outline: 2px solid #3478f6; outline-offset: 3px; }

.story-stage { min-height: 760px; }

.transformation-story,
.process-panel {
  padding: 58px;
  border: 1px solid rgba(255, 255, 255, .08);
  border-radius: 38px;
  background:
    linear-gradient(rgba(255, 255, 255, .025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, .025) 1px, transparent 1px),
    var(--voxa-blue-2);
  background-size: 44px 44px, 44px 44px, auto;
  box-shadow: 0 45px 110px rgba(0, 0, 0, .22);
}

.transformation-story { transition: transform .48s cubic-bezier(.22, 1, .36, 1); }
.story-conversations { transform: translateX(-6px); }
.story-operations { transform: translateX(6px); }

.story-heading,
.process-heading { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(260px, .7fr); gap: 60px; align-items: end; margin-bottom: 48px; }
.story-heading span,
.process-heading span { display: block; margin-bottom: 14px; color: #8eb4ff; font-size: 10px; font-weight: 850; letter-spacing: .26em; }
.story-heading h3,
.process-heading h3 { max-width: 700px; margin: 0; color: white; font-size: clamp(38px, 4vw, 58px); line-height: 1.02; letter-spacing: -.045em; text-wrap: balance; }
.story-heading > p,
.process-heading > p { margin: 0; color: #aeb9cc; font-size: 15px; line-height: 1.75; }

.transformation-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 240px minmax(0, 1fr);
  gap: 34px;
  align-items: stretch;
}

.state-card {
  min-height: 440px;
  padding: 42px;
  border: 1px solid rgba(255, 255, 255, .1);
  border-radius: 30px;
  background: linear-gradient(180deg, rgba(255, 255, 255, .07), rgba(255, 255, 255, .035));
  box-shadow: 0 26px 70px rgba(0, 0, 0, .2);
  backdrop-filter: blur(16px);
}
.state-label { display: block; margin-bottom: 24px; font-size: 10px; font-weight: 850; letter-spacing: .24em; }
.before-card .state-label { color: #e56b6f; }
.after-card .state-label { color: #129b6a; }
.state-card h3 { max-width: 430px; margin: 0 0 30px; color: white; font-size: 30px; line-height: 1.15; letter-spacing: -.035em; }
.state-card ul { list-style: none; display: grid; gap: 18px; margin: 0; padding: 0; }
.state-card li { position: relative; padding-left: 25px; color: #c2cad8; font-size: 15px; line-height: 1.55; }
.state-card li::before { position: absolute; left: 0; top: 0; font-weight: 850; }
.before-card li::before { content: "×"; color: #e56b6f; }
.after-card li::before { content: "✓"; color: #129b6a; }

.transformation-core { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 12px; text-align: center; }
.transformation-core::before { content: ""; position: absolute; left: 50%; top: 22px; bottom: 22px; width: 1px; background: linear-gradient(180deg, transparent, rgba(52, 120, 246, .5), transparent); }
.signal-dot { position: absolute; left: 50%; top: 27px; width: 8px; height: 8px; border-radius: 50%; background: #3478f6; box-shadow: 0 0 18px rgba(52, 120, 246, .7); transform: translateX(-50%); }
.core-icon { position: relative; width: 62px; height: 62px; display: grid; place-items: center; margin-bottom: 18px; border-radius: 18px; background: rgba(67, 133, 255, .13); border: 1px solid rgba(67, 133, 255, .24); color: #8eb4ff; box-shadow: 0 15px 36px rgba(52, 120, 246, .15); }
.core-icon svg { width: 27px; height: 27px; }
.transformation-core small { position: relative; margin-bottom: 10px; color: #8eb4ff; font-size: 9px; font-weight: 850; letter-spacing: .22em; }
.transformation-core strong { position: relative; color: white; font-size: 20px; line-height: 1.25; }
.transformation-core p { position: relative; margin: 13px 0 0; color: #aeb9cc; font-size: 12px; line-height: 1.55; }
.signal-arrow { position: relative; width: 42px; height: 42px; display: grid; place-items: center; margin-top: 22px; border-radius: 50%; background: #3478f6; color: white; font-size: 20px; box-shadow: 0 12px 26px rgba(52, 120, 246, .25); }

.after-card { position: relative; padding-bottom: 98px; }
.result-badge { position: absolute; left: 42px; right: 42px; bottom: 36px; display: flex; align-items: center; gap: 10px; padding: 13px 15px; border: 1px solid rgba(74, 222, 167, .2); border-radius: 14px; background: rgba(74, 222, 167, .08); color: #83f0c6; font-size: 12px; font-weight: 750; }
.result-badge svg { width: 17px; height: 17px; flex: 0 0 auto; }

.process-grid { position: relative; list-style: none; display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin: 0; padding: 0; }
.process-grid::before { content: ""; position: absolute; left: 4%; right: 4%; top: 27px; height: 1px; background: linear-gradient(90deg, transparent, rgba(67, 133, 255, .6), transparent); }
.process-grid li { position: relative; min-height: 210px; padding: 26px 22px; border: 1px solid rgba(255, 255, 255, .08); border-radius: 22px; background: rgba(255, 255, 255, .035); transition: transform .3s, border-color .3s, background .3s; }
.process-grid li:hover { transform: translateY(-6px); border-color: rgba(67, 133, 255, .55); background: rgba(67, 133, 255, .08); }
.step-topline { position: relative; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.step-topline span { color: #8eb4ff; font-size: 9px; font-weight: 850; letter-spacing: .2em; }
.step-topline svg { width: 20px; height: 20px; color: #4385ff; }
.process-grid h4 { margin: 0 0 12px; color: white; font-size: 22px; }
.process-grid p { margin: 0; color: #a7b2c5; font-size: 13px; line-height: 1.65; }

@keyframes story-progress { from { transform: scaleX(0); } to { transform: scaleX(1); } }

@media (max-width: 1100px) {
  .transformations { padding: 120px 0; }
  .transformation-grid { grid-template-columns: 1fr; }
  .transformation-core { min-height: 220px; }
  .transformation-core::before { left: 30px; right: 30px; top: 50%; bottom: auto; width: auto; height: 1px; background: linear-gradient(90deg, transparent, rgba(52, 120, 246, .5), transparent); }
  .signal-dot { left: 34px; top: 50%; transform: translateY(-50%); }
  .signal-arrow { position: absolute; right: 24px; top: 50%; margin: 0; transform: translateY(-50%); }
  .process-grid { grid-template-columns: repeat(3, 1fr); }
  .story-stage { min-height: 0; }
}

@media (max-width: 768px) {
  .transformations { padding: 90px 0; }
  .heading { margin-bottom: 50px; }
  .heading h2 { font-size: 46px; }
  .heading p { font-size: 16px; }
  .case-tabs { flex-direction: column; align-items: stretch; }
  .case-tabs button { justify-content: center; }
  .state-card { min-height: auto; padding: 30px 24px; border-radius: 24px; }
  .state-card h3 { font-size: 26px; }
  .after-card { padding-bottom: 96px; }
  .result-badge { left: 24px; right: 24px; bottom: 26px; }
  .transformation-story,
  .process-panel { padding: 36px 22px; border-radius: 28px; }
  .story-heading,
  .process-heading { grid-template-columns: 1fr; gap: 20px; }
  .story-heading h3,
  .process-heading h3 { font-size: 38px; }
  .process-grid { grid-template-columns: 1fr; }
  .process-grid::before { display: none; }
  .process-grid li { min-height: auto; }
}

@media (max-width: 480px) {
  .heading h2 { font-size: 38px; }
  .transformation-core { min-height: 240px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
</style>
