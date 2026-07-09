<template>
  <section
    id="approach"
    class="transformations"
  >
    <div class="grid-bg" />
    <div class="container-custom">
      <header class="heading">
        <span>TRANSFORMATION, DELIVERED</span>
        <h2>From daily friction to a <em>business that moves</em></h2>
        <p>See what changes when Voxa joins the workflow, every conversation becomes a visible, measurable result</p>
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
        <article v-if="activeSlide < stories.length" class="comparison" :key="activeSlide">
          <div class="state-card before-card">
            <span class="state-label">BEFORE VOXA</span>
            <h3>{{ currentStory.beforeTitle }}</h3>
            <ul>
              <li v-for="item in currentStory.before" :key="item.text"><component :is="item.icon" /><span>{{ item.text }}</span></li>
            </ul>
          </div>

          <div class="voxa-hub">
            <div class="channels" :aria-label="currentStory.inputLabel">
              <span v-for="(icon, index) in currentStory.inputs" :key="index"><component :is="icon" /></span>
            </div>
            <div class="connector-lines" />
            <div class="core-orb"><component :is="currentStory.coreIcon" /><strong>VOXA</strong><small>{{ currentStory.solution }}</small></div>
            <div class="tool-row" :aria-label="currentStory.outputLabel">
              <span v-for="(icon, index) in currentStory.outputs" :key="index"><component :is="icon" /></span>
            </div>
          </div>

          <div class="state-card after-card">
            <span class="state-label">WITH VOXA</span>
            <h3>{{ currentStory.afterTitle }}</h3>
            <ul>
              <li v-for="item in currentStory.after" :key="item.text"><component :is="item.icon" /><span>{{ item.text }}</span></li>
            </ul>
            <div class="result-badge"><Clock3 /><span>{{ currentStory.result }}</span></div>
          </div>
        </article>

        <div v-else class="process-panel" :key="activeSlide">
          <header><span>HOW WE GET THERE</span><h3>A clear path from first conversation to lasting value</h3></header>
          <ol class="process-grid">
            <li v-for="(step, index) in process" :key="step.title">
              <span>0{{ index + 1 }}</span><component :is="step.icon" /><h4>{{ step.title }}</h4><p>{{ step.description }}</p>
            </li>
          </ol>
        </div>
      </div>

      <div class="impact-strip" aria-label="Voxa impact metrics">
        <div v-for="metric in metrics" :key="metric.label"><component :is="metric.icon" /><strong>{{ metric.value }}</strong><span>{{ metric.label }}</span></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue"
import {
  ArrowRightLeft, BrainCircuit, CalendarCheck2, ChartNoAxesCombined,
  ClipboardList, Clock3, ClockAlert, Copy, Database, Focus, Gauge, Globe2,
  Headphones, Mail, MessageSquare, MessagesSquare, Moon, Network, Phone,
  PhoneCall, PhoneOff, RefreshCw, Route, Search, ShieldCheck, TriangleAlert,
  TrendingUp, UsersRound, Wrench, Zap
} from "lucide-vue-next"

const activeSlide = ref(0)
let storyTimer

const stories = [
  {
    solution: "AI Receptionist",
    coreIcon: Headphones,
    inputLabel: "Customer conversation channels",
    inputs: [Phone, MessageSquare, MessagesSquare, Mail, Globe2],
    outputLabel: "AI receptionist outcomes",
    outputs: [PhoneCall, BrainCircuit, CalendarCheck2, ClipboardList, Clock3],
    beforeTitle: "Calls wait, customers repeat themselves",
    before: [
      { text: "Calls depend on one available person", icon: PhoneOff },
      { text: "Evening calls go unanswered", icon: Moon },
      { text: "Details are copied between systems", icon: Copy },
      { text: "Follow up slips on busy days", icon: ClockAlert }
    ],
    afterTitle: "Every conversation moves forward",
    after: [
      { text: "Every call is answered at any hour", icon: PhoneCall },
      { text: "Intent is understood in real time", icon: BrainCircuit },
      { text: "Appointments happen instantly", icon: CalendarCheck2 },
      { text: "Your team receives complete context", icon: ClipboardList }
    ],
    result: "Every caller leaves with a clear next step"
  },
  {
    solution: "Connected Automation",
    coreIcon: Network,
    inputLabel: "Disconnected business work",
    inputs: [Database, Copy, ArrowRightLeft, ClockAlert, TriangleAlert],
    outputLabel: "Connected automation outcomes",
    outputs: [RefreshCw, Zap, ChartNoAxesCombined, Focus, TrendingUp],
    beforeTitle: "Work is fragmented, teams are stretched",
    before: [
      { text: "Teams copy data between systems", icon: Copy },
      { text: "Routine updates require a handoff", icon: ArrowRightLeft },
      { text: "Reports arrive after decisions are made", icon: ClockAlert },
      { text: "Small errors create hours of rework", icon: TriangleAlert }
    ],
    afterTitle: "Work flows, business grows",
    after: [
      { text: "Applications update each other", icon: RefreshCw },
      { text: "Routine work completes automatically", icon: Zap },
      { text: "Results stay visible in real time", icon: ChartNoAxesCombined },
      { text: "People focus on exceptions and decisions", icon: Focus }
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
  { title: "Listen", description: "Find the conversations and friction that matter most", icon: Search },
  { title: "Design", description: "Map the experience, actions and human handoffs", icon: Network },
  { title: "Build", description: "Connect Voxa to your real workflow and tools", icon: Wrench },
  { title: "Prove", description: "Test real scenarios safely with your team", icon: ShieldCheck },
  { title: "Grow", description: "Measure outcomes and expand with confidence", icon: TrendingUp }
]

const metrics = [
  { value: "70%", label: "Less manual work", icon: Clock3 },
  { value: "2 to 5x", label: "Faster cycle time", icon: TrendingUp },
  { value: "99.9%", label: "Data accuracy", icon: Gauge },
  { value: "Happier teams", label: "Focused on impact", icon: UsersRound }
]

const currentStory = computed(() => stories[activeSlide.value] || stories[0])
function selectSlide(index) {
  activeSlide.value = index
  startAuto()
}
function startAuto() {
  window.clearInterval(storyTimer)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  storyTimer = window.setInterval(() => { activeSlide.value = (activeSlide.value + 1) % slides.length }, 5600)
}
onMounted(startAuto)
onUnmounted(() => window.clearInterval(storyTimer))
</script>

<style scoped>
.transformations { position: relative; padding: 132px 0 118px; overflow: hidden; isolation: isolate; background: #07152d; }
.grid-bg { position: absolute; inset: 0; background-image: linear-gradient(rgba(116,154,220,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(116,154,220,.06) 1px,transparent 1px); background-size: 48px 48px; mask-image: linear-gradient(180deg,transparent,#000 10%,#000 92%,transparent); }
.transformations::before { content:""; position:absolute; width:820px; height:820px; left:50%; top:38%; transform:translate(-50%,-50%); border-radius:50%; background:rgba(31,111,255,.1); filter:blur(150px); }
.container-custom { position:relative; z-index:1; }
.heading { max-width:900px; margin:0 auto 46px; text-align:center; }
.heading > span { display:inline-block; margin-bottom:18px; color:#7ba7ff; font-size:10px; font-weight:850; letter-spacing:.28em; }
.heading h2 { margin:0 0 24px; color:#fff; font-size:clamp(50px,5.5vw,78px); line-height:.98; letter-spacing:-.055em; text-wrap:balance; }
.heading h2 em { color:#67a5ff; font-style:normal; }
.heading p { max-width:720px; margin:auto; color:#a7b4c8; font-size:17px; line-height:1.7; }
.case-tabs { display:flex; justify-content:center; gap:12px; margin-bottom:28px; }
.case-tabs button { position:relative; display:flex; align-items:center; gap:10px; min-width:210px; justify-content:center; padding:14px 20px; border:1px solid rgba(255,255,255,.13); border-radius:999px; background:rgba(255,255,255,.035); color:#c0c9d8; font:inherit; font-size:13px; font-weight:700; cursor:pointer; transition:.3s ease; }
.case-tabs svg { width:18px; height:18px; }
.case-tabs button.active { border-color:#3478f6; background:linear-gradient(135deg,#1747a7,#2467e9); color:#fff; box-shadow:0 12px 34px rgba(27,100,239,.28); }
.case-tabs button.active::before,.case-tabs button.active::after { content:""; position:absolute; left:10%; right:10%; bottom:-14px; height:4px; border-radius:999px; }
.case-tabs button.active::before { background:rgba(67,133,255,.2); }
.case-tabs button.active::after { background:linear-gradient(90deg,#65a2ff,#fff); box-shadow:0 0 12px rgba(67,133,255,.8); transform:scaleX(0); transform-origin:left center; will-change:transform; animation:tab-progress 5.6s linear forwards; }
.story-stage { min-height:570px; }
.comparison { display:grid; grid-template-columns:minmax(0,1fr) minmax(310px,.82fr) minmax(0,1fr); gap:24px; align-items:stretch; }
.state-card { min-height:500px; padding:34px; border:1px solid rgba(255,255,255,.11); border-radius:28px; background:linear-gradient(180deg,rgba(255,255,255,.055),rgba(255,255,255,.025)); box-shadow:0 28px 70px rgba(0,0,0,.24); }
.before-card { border-color:rgba(230,148,134,.28); }
.after-card { border-color:rgba(72,211,153,.28); }
.state-label { display:inline-flex; padding:7px 12px; border-radius:999px; font-size:9px; font-weight:850; letter-spacing:.18em; }
.before-card .state-label { color:#ff9d8f; background:rgba(230,112,92,.11); }
.after-card .state-label { color:#79e7b5; background:rgba(57,197,137,.11); }
.state-card h3 { min-height:82px; margin:22px 0 28px; color:#fff; font-size:clamp(28px,2.3vw,38px); line-height:1.08; letter-spacing:-.035em; }
.state-card ul { display:grid; gap:10px; list-style:none; margin:0; padding:0; }
.state-card li { display:flex; align-items:center; gap:11px; min-height:50px; padding:11px 14px; border:1px solid rgba(255,255,255,.07); border-radius:12px; background:rgba(255,255,255,.035); color:#d0d7e4; font-size:13px; line-height:1.35; }
.state-card li svg { width:17px; height:17px; flex:0 0 auto; }
.before-card li svg { color:#ff8372; }
.after-card li svg { padding:3px; border-radius:50%; background:#57db9a; color:#06221a; }
.after-card { position:relative; padding-bottom:92px; }
.result-badge { position:absolute; left:34px; right:34px; bottom:30px; display:flex; align-items:center; gap:10px; padding:14px; border:1px solid rgba(72,211,153,.2); border-radius:13px; background:rgba(72,211,153,.08); color:#74e3b0; font-size:12px; font-weight:750; }
.result-badge svg { width:18px; height:18px; }
.voxa-hub { position:relative; min-height:500px; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:20px 0 14px; }
.channels,.tool-row { position:relative; z-index:2; display:flex; justify-content:center; gap:10px; width:100%; }
.channels span,.tool-row span { width:44px; height:44px; display:grid; place-items:center; border:1px solid rgba(73,137,255,.27); border-radius:14px; background:#0c203f; color:#82adff; box-shadow:0 12px 30px rgba(0,0,0,.2); }
.channels svg,.tool-row svg { width:19px; height:19px; }
.connector-lines { position:absolute; inset:76px 20px 73px; background:repeating-conic-gradient(from 0deg at 50% 50%,transparent 0 14deg,rgba(55,126,255,.18) 14.5deg 15deg,transparent 15.5deg 29deg); mask-image:radial-gradient(circle,transparent 0 20%,#000 21% 65%,transparent 66%); }
.core-orb { position:absolute; z-index:3; left:50%; top:50%; width:164px; height:164px; display:flex; flex-direction:column; align-items:center; justify-content:center; transform:translate(-50%,-50%); border:1px solid #4385ff; border-radius:50%; background:radial-gradient(circle at 50% 35%,#174f9f,#07152d 72%); color:#fff; box-shadow:0 0 0 12px rgba(52,120,246,.05),0 0 52px rgba(35,111,255,.45); }
.core-orb svg { width:42px; height:42px; margin-bottom:8px; color:#fff; }
.core-orb strong { font-size:24px; letter-spacing:-.03em; }
.core-orb small { max-width:120px; margin-top:4px; color:#8eb4ff; font-size:8px; text-align:center; text-transform:uppercase; letter-spacing:.14em; }
.tool-row span { color:#65d6b4; }
.process-panel { min-height:520px; padding:54px; border:1px solid rgba(255,255,255,.1); border-radius:30px; background:rgba(255,255,255,.035); }
.process-panel header { max-width:760px; margin:0 auto 52px; text-align:center; }.process-panel header span { color:#7ba7ff; font-size:10px; font-weight:850; letter-spacing:.22em; }.process-panel h3 { margin:14px 0 0; color:#fff; font-size:42px; line-height:1.05; }
.process-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin:0; padding:0; list-style:none; }
.process-grid li { position:relative; min-height:220px; padding:24px; border:1px solid rgba(255,255,255,.09); border-radius:20px; background:#0b1c38; }.process-grid li > span { color:#6284bb; font-size:9px; font-weight:850; }.process-grid svg { display:block; width:24px; height:24px; margin:28px 0 22px; color:#4385ff; }.process-grid h4 { margin:0 0 10px; color:#fff; font-size:20px; }.process-grid p { margin:0; color:#aab5c8; font-size:12px; line-height:1.6; }
.impact-strip { display:grid; grid-template-columns:repeat(4,1fr); margin-top:34px; padding:22px 8px; border:1px solid rgba(255,255,255,.1); border-radius:24px; background:rgba(255,255,255,.035); }
.impact-strip > div { display:grid; grid-template-columns:42px auto; grid-template-rows:auto auto; align-items:center; column-gap:13px; padding:4px 26px; }
.impact-strip > div + div { border-left:1px solid rgba(255,255,255,.11); }
.impact-strip svg { grid-row:1/3; width:24px; height:24px; padding:9px; box-sizing:content-box; border-radius:13px; background:rgba(52,120,246,.11); color:#4f8cff; }
.impact-strip strong { color:#4f8cff; font-size:24px; line-height:1; }.impact-strip span { color:#aab5c8; font-size:11px; }
@keyframes tab-progress { from{transform:scaleX(0)} to{transform:scaleX(1)} }
@media (max-width:1100px) { .comparison{grid-template-columns:1fr 260px 1fr}.state-card{padding:26px}.state-card h3{font-size:27px}.impact-strip > div{padding:4px 14px}.impact-strip strong{font-size:20px} }
@media (max-width:900px) { .transformations{padding:100px 0}.comparison{grid-template-columns:1fr}.voxa-hub{min-height:380px}.state-card{min-height:auto}.process-grid{grid-template-columns:repeat(2,1fr)}.impact-strip{grid-template-columns:repeat(2,1fr);gap:20px}.impact-strip > div:nth-child(3){border-left:0}.case-tabs{flex-wrap:wrap}.case-tabs button{min-width:0}.story-stage{min-height:0} }
@media (max-width:600px) { .heading h2{font-size:42px}.case-tabs{display:grid}.comparison{gap:18px}.state-card{padding:24px}.after-card{padding-bottom:92px}.result-badge{left:24px;right:24px}.process-panel{padding:32px 20px}.process-grid{grid-template-columns:1fr}.impact-strip{grid-template-columns:1fr}.impact-strip > div + div{border-left:0;border-top:1px solid rgba(255,255,255,.1);padding-top:18px}.channels span,.tool-row span{width:39px;height:39px} }
@media (prefers-reduced-motion:reduce) { *,*::before,*::after{animation:none!important;transition:none!important} }
</style>
