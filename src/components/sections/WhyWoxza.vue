<template>
  <section id="why-woxza" class="why">
    <div class="ambient-glow"></div>

    <div class="why-shell">
      <div class="why-copy">
        <header class="intro">
          <span class="eyebrow">WHY WOXZA</span>
          <h2>Every conversation should lead somewhere</h2>
          <p>
            Woxza listens, understands and completes the next step while the
            conversation is still happening
          </p>
        </header>

        <div class="principles">
          <button
            v-for="(story, index) in stories"
            :key="story.title"
            class="principle"
            :class="{ active: activeStory === index }"
            type="button"
            :aria-pressed="activeStory === index"
            @click="activeStory = index"
            @mouseenter="activeStory = index"
          >
            <span class="principle-marker"></span>
            <div>
              <h3>{{ story.title }}</h3>
              <p>{{ story.description }}</p>
            </div>
          </button>
        </div>
      </div>

      <div class="ecosystem-panel">
        <header :key="activeStory" class="ecosystem-heading">
          <span>HOW WOXZA WORKS</span>
          <h3>{{ currentStory.heading }}</h3>
          <p>{{ currentStory.body }}</p>
        </header>

        <div class="ecosystem-map">
          <div class="ring ring-outer" :class="{ lit: activeStory === 1 }"></div>
          <div class="ring ring-middle" :class="{ lit: activeStory !== 2 }"></div>
          <div class="ring ring-inner lit"></div>
          <div class="connector connector-vertical"></div>
          <div class="connector connector-horizontal"></div>

          <div class="core lit">
            <small>AI CORE</small>
            <strong>Woxza</strong>
            <span>{{ currentStory.outcome }}</span>
          </div>

          <div class="node node-top" :class="{ lit: isLit('voice') }">
            <span class="node-icon"><AudioLines /></span>
            <strong>Voice AI</strong>
          </div>
          <div class="node node-right" :class="{ lit: isLit('agents') }">
            <span class="node-icon"><Bot /></span>
            <strong>Agents</strong>
          </div>
          <div class="node node-bottom" :class="{ lit: isLit('automation') }">
            <span class="node-icon"><Workflow /></span>
            <strong>Automation</strong>
          </div>
          <div class="node node-left" :class="{ lit: isLit('knowledge') }">
            <span class="node-icon"><BookOpen /></span>
            <strong>Knowledge</strong>
          </div>

          <div class="service service-top-left" :class="{ lit: isLit('incoming') }">
            <span class="node-icon"><PhoneCall /></span>
            <div><strong>Incoming call</strong><span>Customer intent</span></div>
          </div>
          <div class="service service-top-right" :class="{ lit: isLit('crm') }">
            <ContactRound />
            <div><strong>CRM updated</strong><span>Context saved</span></div>
          </div>
          <div class="service service-bottom-left" :class="{ lit: isLit('analytics') }">
            <ChartNoAxesCombined />
            <div><strong>Outcome tracked</strong><span>Visible result</span></div>
          </div>
          <div class="service service-bottom-right" :class="{ lit: isLit('calendar') }">
            <CalendarDays />
            <div><strong>Appointment booked</strong><span>Time confirmed</span></div>
          </div>
        </div>

        <div class="assurance-bar" :class="{ active: activeStory === 2 }">
          <span><ShieldCheck /> Guardrails</span>
          <span><UserRoundCheck /> Human handoff</span>
          <span><ListChecks /> Audit trail</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"
import {
  Bot,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  ContactRound,
  ListChecks,
  AudioLines,
  PhoneCall,
  Workflow,
  ShieldCheck,
  UserRoundCheck
} from "lucide-vue-next"

const activeStory = ref(0)

const stories = [
  {
    title: "Feels Human",
    description: "Customers speak naturally, get a clear answer and never have to repeat themselves",
    heading: "A conversation that feels understood",
    body: "Voice AI listens, knowledge brings the right context, and customers get thoughtful help from the first hello",
    outcome: "Customer understood",
    active: ["incoming", "voice", "knowledge"]
  },
  {
    title: "Takes Action",
    description: "Books appointments, updates systems, sends confirmations, and completes workflows automatically",
    heading: "The next step is already handled",
    body: "Agents decide what needs to happen, and automation updates the calendar and CRM before the call ends",
    outcome: "Work completed",
    active: ["voice", "knowledge", "agents", "automation", "crm", "calendar"]
  },
  {
    title: "Earns Trust",
    description: "Every conversation is logged, auditable, and ready for human review whenever needed",
    heading: "You can see what happened and why",
    body: "Guardrails keep actions in bounds, outcomes stay visible, and a person can step in whenever they are needed",
    outcome: "Ready for review",
    active: ["analytics"]
  }
]

const currentStory = computed(() => stories[activeStory.value])
const activeKeys = computed(() => new Set(currentStory.value.active))
const isLit = key => activeKeys.value.has(key)
</script>

<style scoped>
.why {
  position: relative;
  padding: 120px 0;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 12% 18%, rgba(var(--woxza-accent-rgb), .08), transparent 32%),
    #fff;
}

.ambient-glow {
  position: absolute;
  width: 900px;
  height: 900px;
  left: -360px;
  bottom: -380px;
  border-radius: 50%;
  background: rgba(var(--woxza-accent-rgb), .07);
  filter: blur(130px);
  pointer-events: none;
}

.why-shell {
  position: relative;
  z-index: 2;
  width: min(1560px, calc(100% - 64px));
  margin: auto;
  display: grid;
  grid-template-columns: minmax(0, .92fr) minmax(620px, 1.08fr);
  gap: clamp(44px, 5vw, 86px);
  align-items: stretch;
}

.why-copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px 0;
}

.intro { max-width: 680px; margin-bottom: 74px; }

.eyebrow {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 28px;
  color: #3478f6;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: .3em;
}

.eyebrow::after { content: ""; width: 56px; height: 1px; background: #4385ff; }

.intro h2 {
  margin: 0 0 30px;
  color: #091329;
  font-size: clamp(50px, 4.4vw, 76px);
  font-weight: 730;
  line-height: .98;
  letter-spacing: -.052em;
  text-wrap: balance;
}

.intro > p { max-width: 600px; margin: 0; color: #66758f; font-size: 17px; line-height: 1.8; }

.principles { border-bottom: 1px solid rgba(20, 38, 77, .1); }

.principle {
  width: 100%;
  display: grid;
  grid-template-columns: 18px 1fr;
  gap: 22px;
  padding: 29px 18px 29px 0;
  border-top: 1px solid rgba(20, 38, 77, .1);
  border-right: 0;
  border-bottom: 0;
  border-left: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: padding .35s ease, background .35s ease;
}

.principle:hover,
.principle.active { padding-left: 16px; background: linear-gradient(90deg, rgba(67, 133, 255, .1), transparent); }
.principle:focus { outline: none; }
.principle:focus-visible { outline: 2px solid #4385ff; outline-offset: -2px; border-radius: 12px; }
.principle-marker { width: 7px; height: 7px; margin-top: 10px; border: 1px solid #4385ff; border-radius: 50%; transition: background .3s, box-shadow .3s; }
.principle.active .principle-marker { background: #4385ff; box-shadow: 0 0 18px rgba(67, 133, 255, .8); }
.principles h3 { margin: 0 0 9px; color: #14264d; font-size: 25px; letter-spacing: -.025em; }
.principles p { max-width: 540px; margin: 0; color: #66758f; font-size: 15px; line-height: 1.7; }

.ecosystem-panel {
  min-height: 940px;
  padding: 52px 38px 36px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, .48);
  border-radius: 42px;
  background: linear-gradient(145deg, #ffffff, #f2f6fc);
  box-shadow: 0 38px 110px rgba(20, 38, 77, .14);
}

.ecosystem-heading { max-width: 540px; min-height: 122px; margin: 0 auto 18px; text-align: center; animation: story-in .45s ease both; }
.ecosystem-heading > span { color: #3478f6; font-size: 10px; font-weight: 800; letter-spacing: .26em; }
.ecosystem-heading h3 { margin: 13px 0 13px; color: #11152b; font-size: clamp(34px, 3vw, 48px); line-height: 1; letter-spacing: -.04em; }
.ecosystem-heading p { max-width: 460px; margin: auto; color: #6d7890; font-size: 14px; line-height: 1.65; }

.ecosystem-map { position: relative; height: 650px; max-width: 720px; margin: auto; }

.ring,
.connector { position: absolute; left: 50%; top: 50%; pointer-events: none; }
.ring { border: 1px solid rgba(52, 120, 246, .12); border-radius: 50%; transform: translate(-50%, -50%); transition: border-color .45s, box-shadow .45s; }
.ring.lit { border-color: rgba(52, 120, 246, .48); box-shadow: inset 0 0 42px rgba(52, 120, 246, .035); }
.ring-outer { width: 510px; height: 510px; }
.ring-middle { width: 380px; height: 380px; border-color: rgba(52, 120, 246, .38); }
.ring-inner { width: 235px; height: 235px; border-color: rgba(52, 120, 246, .3); }
.ring.lit { border-color: rgba(52, 120, 246, .48); box-shadow: inset 0 0 42px rgba(52, 120, 246, .035); }
.connector { background: rgba(52, 120, 246, .13); transform: translate(-50%, -50%); }
.connector-vertical { width: 1px; height: 510px; }
.connector-horizontal { width: 510px; height: 1px; }

.core {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 5;
  width: 164px;
  height: 164px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(52, 120, 246, .24);
  border-radius: 50%;
  background: rgba(255, 255, 255, .96);
  box-shadow: 0 20px 60px rgba(52, 120, 246, .16);
  transform: translate(-50%, -50%);
}

.core small { margin-bottom: 8px; color: #4385ff; font-size: 9px; font-weight: 800; letter-spacing: .28em; }
.core strong { color: #11152b; font-size: 38px; letter-spacing: -.04em; }
.core span { margin-top: 7px; color: #7b879d; font-size: 11px; text-transform: capitalize; }

.node {
  position: absolute;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 17px;
  border: 1px solid rgba(52, 120, 246, .18);
  border-radius: 17px;
  background: rgba(255, 255, 255, .98);
  box-shadow: 0 12px 35px rgba(20, 38, 77, .09);
  color: #14264d;
  opacity: .36;
  filter: saturate(.45);
  transition: opacity .4s, filter .4s, border-color .4s, box-shadow .4s;
}
.node.lit { opacity: 1; filter: saturate(1); border-color: rgba(52, 120, 246, .5); box-shadow: 0 14px 40px rgba(52, 120, 246, .16); }
.node-icon { width: 46px; height: 46px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 14px; background: #eef4ff; color: #3478f6; }
.node-icon svg { width: 20px; height: 20px; stroke-width: 2; }
.node strong { font-size: 13px; }
.node-top { left: 50%; top: 66px; transform: translateX(-50%); }
.node-right { right: 26px; top: 50%; transform: translateY(-50%); }
.node-bottom { left: 50%; bottom: 64px; transform: translateX(-50%); }
.node-left { left: 26px; top: 50%; transform: translateY(-50%); }

.service {
  position: absolute;
  z-index: 7;
  width: 154px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  border: 1px solid rgba(20, 38, 77, .09);
  border-radius: 16px;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 14px 36px rgba(20, 38, 77, .07);
  opacity: .32;
  filter: saturate(.4);
  transition: opacity .4s, filter .4s, border-color .4s, box-shadow .4s;
}
.service.lit { opacity: 1; filter: saturate(1); border-color: rgba(52, 120, 246, .42); box-shadow: 0 15px 42px rgba(52, 120, 246, .14); }
.service > .node-icon { width: 46px; height: 46px; color: #3478f6; }
.service div { display: grid; gap: 3px; }
.service strong { color: #14264d; font-size: 11px; }
.service span { color: #8994a8; font-size: 9px; }
.service-top-left { left: 0; top: 16px; }
.service-top-right { right: 0; top: 16px; }
.service-bottom-left { left: 0; bottom: 14px; }
.service-bottom-right { right: 0; bottom: 14px; }

.assurance-bar {
  display: flex;
  justify-content: center;
  gap: 10px;
  opacity: .42;
  transition: opacity .4s;
}
.assurance-bar.active { opacity: 1; }
.assurance-bar span { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border: 1px solid rgba(20, 38, 77, .1); border-radius: 999px; background: rgba(255, 255, 255, .72); color: #667085; font-size: 10px; font-weight: 700; }
.assurance-bar svg { width: 14px; height: 14px; color: #3478f6; }

@keyframes story-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1240px) {
  .why-shell { grid-template-columns: 1fr; max-width: 940px; }
  .why-copy { padding: 20px 0; }
  .intro { max-width: 780px; }
  .ecosystem-panel { min-height: 900px; }
}

@media (max-width: 768px) {
  .why { padding: 90px 0; }
  .why-shell { width: calc(100% - 32px); gap: 54px; }
  .intro { margin-bottom: 52px; }
  .intro h2 { font-size: 46px; }
  .principle { grid-template-columns: 14px 1fr; gap: 14px; }
  .ecosystem-panel { min-height: 700px; padding: 38px 14px 20px; border-radius: 28px; }
  .ecosystem-map { height: 500px; transform: scale(.76); transform-origin: top center; width: 620px; left: 50%; margin-left: -310px; }
  .ecosystem-heading h3 { font-size: 35px; }
  .assurance-bar { margin-top: -76px; flex-wrap: wrap; }
}

@media (max-width: 430px) {
  .intro h2 { font-size: 40px; }
  .ecosystem-panel { min-height: 650px; }
  .ecosystem-map { transform: scale(.68); }
}
</style>
