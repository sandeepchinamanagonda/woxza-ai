<template>
  <section id="approach" class="transformations">
    <div class="container-custom">
      <header class="heading">
        <span>TRANSFORMATION, DELIVERED</span>
        <h2>See the operating system your calls become</h2>
        <p>
          Not a vague before-and-after. Pick a workflow and see the exact chain:
          what breaks today, what Voxa captures, where it goes, and what the team
          gets back.
        </p>
      </header>

      <div class="case-selector" aria-label="Choose a transformation workflow">
        <button
          v-for="(story, index) in stories"
          :key="story.id"
          type="button"
          :class="{ active: activeStory === index }"
          :aria-pressed="activeStory === index"
          @click="selectStory(index)"
        >
          <component :is="story.icon" />
          <span>
            <strong>{{ story.tab }}</strong>
            <small>{{ story.short }}</small>
          </span>
        </button>
      </div>

      <div :key="currentStory.id" class="case-board">
        <aside class="case-brief">
          <span class="case-label">{{ currentStory.label }}</span>
          <h3>{{ currentStory.title }}</h3>
          <p>{{ currentStory.copy }}</p>

          <div class="pressure-list">
            <article v-for="item in currentStory.pressure" :key="item.title">
              <component :is="item.icon" />
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.detail }}</span>
              </div>
            </article>
          </div>
        </aside>

        <main class="workflow-panel">
          <div class="panel-top">
            <div>
              <span>LIVE WORKFLOW</span>
              <strong>{{ currentStory.workflowTitle }}</strong>
            </div>
            <b>{{ currentStory.timeSaved }}</b>
          </div>

          <div class="workflow-track">
            <article
              v-for="(step, index) in currentStory.steps"
              :key="step.title"
              class="workflow-step"
            >
              <span class="step-number">{{ String(index + 1).padStart(2, "0") }}</span>
              <component :is="step.icon" />
              <div>
                <strong>{{ step.title }}</strong>
                <p>{{ step.detail }}</p>
              </div>
            </article>
          </div>

          <div class="record-preview">
            <section class="record-card">
              <div class="record-header">
                <span class="record-avatar">{{ currentStory.record.initials }}</span>
                <div>
                  <strong>{{ currentStory.record.name }}</strong>
                  <small>{{ currentStory.record.context }}</small>
                </div>
              </div>

              <dl>
                <div v-for="field in currentStory.record.fields" :key="field.label">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ field.value }}</dd>
                </div>
              </dl>
            </section>

            <section class="team-card">
              <div class="team-card-heading">
                <ClipboardList />
                <span>Team handoff</span>
              </div>
              <h4>{{ currentStory.handoff.title }}</h4>
              <p>{{ currentStory.handoff.detail }}</p>
              <div>
                <span v-for="chip in currentStory.handoff.chips" :key="chip">
                  <CheckCheck />
                  {{ chip }}
                </span>
              </div>
            </section>
          </div>
        </main>

        <aside class="outcome-panel">
          <span class="case-label">After Voxa</span>
          <h3>{{ currentStory.afterTitle }}</h3>

          <div class="outcome-list">
            <article v-for="outcome in currentStory.outcomes" :key="outcome.title">
              <component :is="outcome.icon" />
              <div>
                <strong>{{ outcome.title }}</strong>
                <p>{{ outcome.detail }}</p>
              </div>
            </article>
          </div>
        </aside>
      </div>

      <div class="metric-strip" aria-label="Transformation metrics">
        <article v-for="metric in metrics" :key="metric.label">
          <component :is="metric.icon" />
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue"
import {
  CalendarCheck2,
  CheckCheck,
  ClipboardList,
  Clock3,
  Copy,
  FileText,
  Focus,
  Headphones,
  Inbox,
  ListChecks,
  MessageSquareText,
  Network,
  PhoneCall,
  PhoneOff,
  RefreshCw,
  Route,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TimerReset,
  TrendingUp,
  UserRoundCheck,
  UsersRound,
  Zap
} from "lucide-vue-next"

const activeStory = ref(0)
let rotationTimer

const stories = [
  {
    id: "front-desk",
    tab: "Front desk",
    short: "Calls to appointments",
    icon: Headphones,
    label: "Healthcare and services",
    title: "When the desk gets busy, customers still get handled.",
    copy: "The call is answered, the request is understood, calendar options are checked, and the team receives a clean handoff instead of a half-written note.",
    workflowTitle: "Inbound call to booked appointment",
    timeSaved: "6 min saved per call",
    afterTitle: "A calmer desk with cleaner follow-through.",
    pressure: [
      { title: "Calls stack up", detail: "One person can only handle one caller at a time.", icon: PhoneOff },
      { title: "Details get repeated", detail: "Customers repeat names, dates and needs.", icon: MessageSquareText },
      { title: "Follow-up depends on memory", detail: "Busy days make small tasks easy to miss.", icon: TimerReset }
    ],
    steps: [
      { title: "Answer", detail: "Voxa picks up and captures the customer need in natural language.", icon: PhoneCall },
      { title: "Check context", detail: "Availability, customer history and required details are gathered.", icon: SearchCheck },
      { title: "Book or route", detail: "The appointment, callback or handoff is created in the right place.", icon: CalendarCheck2 },
      { title: "Brief the team", detail: "A short summary, owner and next action are sent to staff.", icon: ClipboardList }
    ],
    record: {
      initials: "AM",
      name: "Avery Morgan",
      context: "Same-day paediatric visit",
      fields: [
        { label: "Priority", value: "Same day" },
        { label: "Status", value: "Booked" },
        { label: "Owner", value: "Front desk" },
        { label: "Channel", value: "Inbound call" }
      ]
    },
    handoff: {
      title: "Appointment confirmed for 4:15 PM",
      detail: "The care team sees the reason for visit, patient form status and callback notes before the patient arrives.",
      chips: ["Calendar updated", "Form sent", "CRM note saved"]
    },
    outcomes: [
      { title: "No caller left hanging", detail: "Routine calls keep moving even during rush hours.", icon: PhoneCall },
      { title: "Less admin after calls", detail: "The summary and next step are already written.", icon: FileText },
      { title: "Better customer experience", detail: "People get an answer while intent is still fresh.", icon: Sparkles }
    ]
  },
  {
    id: "operations",
    tab: "Operations",
    short: "Requests to resolved tasks",
    icon: Network,
    label: "Teams and workflows",
    title: "Operational requests stop bouncing between people and tools.",
    copy: "Voxa turns scattered requests into structured work: the right fields, the right owner, and a status trail your team can actually follow.",
    workflowTitle: "Request intake to assigned resolution",
    timeSaved: "11 min saved per request",
    afterTitle: "Less chasing, more visible work.",
    pressure: [
      { title: "Copy-paste work", detail: "Teams move the same update through multiple apps.", icon: Copy },
      { title: "Loose ownership", detail: "Nobody knows who is supposed to finish the task.", icon: UsersRound },
      { title: "Late visibility", detail: "Managers see the problem after it has already slowed work.", icon: Clock3 }
    ],
    steps: [
      { title: "Capture", detail: "The request is collected with the fields needed for action.", icon: Inbox },
      { title: "Validate", detail: "Missing details are clarified before the work is routed.", icon: ListChecks },
      { title: "Assign", detail: "The task reaches the right team with priority and context.", icon: Route },
      { title: "Update", detail: "Systems stay current as the task moves toward completion.", icon: RefreshCw }
    ],
    record: {
      initials: "JS",
      name: "Jordan Singh",
      context: "Split shipment request",
      fields: [
        { label: "SLA", value: "Urgent" },
        { label: "Owner", value: "Ops team" },
        { label: "System", value: "Odoo" },
        { label: "Status", value: "In progress" }
      ]
    },
    handoff: {
      title: "Warehouse split assigned to operations",
      detail: "The team receives stock notes, delivery requirement, customer priority and the system record link in one place.",
      chips: ["Ticket opened", "Warehouse tagged", "Slack brief sent"]
    },
    outcomes: [
      { title: "Cleaner ownership", detail: "Tasks have a person, priority and next action.", icon: UserRoundCheck },
      { title: "Fewer status meetings", detail: "Progress is visible without asking around.", icon: TrendingUp },
      { title: "Safer execution", detail: "Actions leave a traceable status history.", icon: ShieldCheck }
    ]
  },
  {
    id: "revenue",
    tab: "Revenue",
    short: "Intent to follow-up",
    icon: TrendingUp,
    label: "Sales and retention",
    title: "High-intent conversations stop disappearing into inboxes.",
    copy: "Every buying signal becomes a prioritized record with the next response already queued, so sales follows up while the lead is still warm.",
    workflowTitle: "Customer intent to qualified follow-up",
    timeSaved: "2.4x faster response",
    afterTitle: "A pipeline with fewer silent leaks.",
    pressure: [
      { title: "Slow response", detail: "The best leads wait while teams sort the inbox.", icon: TimerReset },
      { title: "Weak context", detail: "Sales gets a name, but not the real buying reason.", icon: MessageSquareText },
      { title: "No next action", detail: "Follow-up depends on someone remembering later.", icon: Clock3 }
    ],
    steps: [
      { title: "Qualify", detail: "Need, timing and urgency are captured during the conversation.", icon: SearchCheck },
      { title: "Score", detail: "The lead is prioritized based on intent and fit.", icon: Sparkles },
      { title: "Queue", detail: "The right follow-up task, email or callback is prepared.", icon: Zap },
      { title: "Advance", detail: "The CRM stage and activity history stay current.", icon: TrendingUp }
    ],
    record: {
      initials: "RK",
      name: "Riya Kapoor",
      context: "Pricing and callback request",
      fields: [
        { label: "Intent", value: "High" },
        { label: "Stage", value: "Qualified" },
        { label: "Next step", value: "Callback" },
        { label: "Owner", value: "Sales" }
      ]
    },
    handoff: {
      title: "Callback queued for 10:30 AM",
      detail: "Sales sees the product interest, objections, buying timeline and suggested next message before reaching out.",
      chips: ["Deal updated", "Email drafted", "Reminder set"]
    },
    outcomes: [
      { title: "Faster first response", detail: "Interested customers hear back while timing matters.", icon: TimerReset },
      { title: "Sharper sales context", detail: "Reps understand the reason behind the call.", icon: Focus },
      { title: "Better pipeline hygiene", detail: "Records move forward with complete activity history.", icon: TrendingUp }
    ]
  }
]

const metrics = [
  { value: "70%", label: "Less manual follow-up", icon: Clock3 },
  { value: "2-5x", label: "Faster cycle time", icon: TrendingUp },
  { value: "24/7", label: "Calls keep moving", icon: PhoneCall },
  { value: "1 view", label: "Shared source of truth", icon: ClipboardList }
]

const currentStory = computed(() => stories[activeStory.value])

function selectStory(index) {
  activeStory.value = index
  startRotation()
}

function startRotation() {
  window.clearInterval(rotationTimer)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
  rotationTimer = window.setInterval(() => {
    activeStory.value = (activeStory.value + 1) % stories.length
  }, 7600)
}

onMounted(startRotation)
onUnmounted(() => window.clearInterval(rotationTimer))
</script>

<style scoped>
.transformations {
  position: relative;
  padding: 132px 0 122px;
  overflow: hidden;
  background:
    radial-gradient(circle at 82% 14%, rgba(37, 99, 235, .11), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f4f7fb 100%);
  color: #14264d;
  isolation: isolate;
}

.container-custom {
  position: relative;
  z-index: 1;
}

.heading {
  max-width: 980px;
  margin: 0 auto 34px;
  text-align: center;
  animation: section-rise .72s cubic-bezier(.22, 1, .36, 1) both;
}

.heading > span,
.case-label {
  display: inline-flex;
  color: #2563eb;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .24em;
  text-transform: uppercase;
}

.heading > span {
  margin-bottom: 18px;
}

.heading h2 {
  margin: 0;
  color: #11152b;
  font-size: clamp(46px, 5.4vw, 78px);
  line-height: .98;
  letter-spacing: -.058em;
  text-wrap: balance;
}

.heading p {
  max-width: 760px;
  margin: 22px auto 0;
  color: #68758e;
  font-size: 16px;
  line-height: 1.75;
}

.case-selector {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
  animation: section-rise .72s .08s cubic-bezier(.22, 1, .36, 1) both;
}

.case-selector button {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 76px;
  padding: 13px;
  border: 1px solid rgba(20, 38, 77, .09);
  border-radius: 22px;
  color: #60708d;
  background: rgba(255, 255, 255, .82);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: .26s cubic-bezier(.22, 1, .36, 1);
}

.case-selector button:hover,
.case-selector button.active {
  border-color: rgba(20, 38, 77, .2);
  color: #14264d;
  background: #fff;
  transform: translateY(-3px);
  box-shadow: 0 16px 38px rgba(20, 38, 77, .1);
}

.case-selector button.active {
  border-color: #14264d;
}

.case-selector svg {
  width: 42px;
  height: 42px;
  padding: 11px;
  border-radius: 15px;
  color: #2563eb;
  background: #eaf2ff;
  box-sizing: border-box;
}

.case-selector button.active svg {
  color: #fff;
  background: #14264d;
  animation: icon-pop .42s cubic-bezier(.22, 1, .36, 1) both;
}

.case-selector strong {
  display: block;
  color: inherit;
  font-size: 14px;
}

.case-selector small {
  display: block;
  margin-top: 4px;
  color: #8a95a8;
  font-size: 11px;
}

.case-board {
  display: grid;
  grid-template-columns: minmax(260px, .82fr) minmax(0, 1.48fr) minmax(260px, .86fr);
  gap: 16px;
  animation: board-in .58s cubic-bezier(.22, 1, .36, 1) both;
}

.case-brief,
.workflow-panel,
.outcome-panel {
  border: 1px solid rgba(20, 38, 77, .09);
  border-radius: 30px;
  background: rgba(255, 255, 255, .88);
  box-shadow: 0 28px 86px rgba(20, 38, 77, .09);
}

.case-brief,
.outcome-panel {
  padding: 28px;
}

.case-brief h3,
.outcome-panel h3 {
  margin: 18px 0 14px;
  color: #11152b;
  font-size: clamp(28px, 2.8vw, 42px);
  line-height: 1.04;
  letter-spacing: -.045em;
}

.case-brief > p {
  margin: 0 0 24px;
  color: #68758e;
  font-size: 14px;
  line-height: 1.7;
}

.pressure-list,
.outcome-list {
  display: grid;
  gap: 12px;
}

.pressure-list article,
.outcome-list article {
  display: grid;
  grid-template-columns: 40px 1fr;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(20, 38, 77, .07);
  border-radius: 18px;
  background: #fbfcff;
  animation: item-pop .45s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.pressure-list article:nth-child(2),
.outcome-list article:nth-child(2) {
  animation-delay: .08s;
}

.pressure-list article:nth-child(3),
.outcome-list article:nth-child(3) {
  animation-delay: .16s;
}

.pressure-list article:hover,
.outcome-list article:hover,
.workflow-step:hover,
.record-card:hover,
.team-card:hover,
.metric-strip article:hover {
  border-color: rgba(37, 99, 235, .16);
  box-shadow: 0 18px 42px rgba(20, 38, 77, .09);
  transform: translateY(-4px);
}

.pressure-list svg,
.outcome-list svg {
  width: 40px;
  height: 40px;
  padding: 10px;
  border-radius: 14px;
  box-sizing: border-box;
}

.pressure-list svg {
  color: #c2410c;
  background: #fff4ed;
}

.outcome-list svg {
  color: #15803d;
  background: #edfff4;
}

.pressure-list strong,
.outcome-list strong {
  display: block;
  color: #14264d;
  font-size: 13px;
}

.pressure-list span,
.outcome-list p {
  display: block;
  margin: 5px 0 0;
  color: #738096;
  font-size: 12px;
  line-height: 1.5;
}

.workflow-panel {
  overflow: hidden;
}

.panel-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  min-height: 82px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(20, 38, 77, .08);
  background: linear-gradient(180deg, #fff, #f9fbff);
}

.panel-top span {
  color: #7b879d;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .18em;
}

.panel-top strong {
  display: block;
  margin-top: 6px;
  color: #14264d;
  font-size: 18px;
  line-height: 1.2;
}

.panel-top b {
  flex: 0 0 auto;
  padding: 9px 12px;
  border-radius: 999px;
  color: #15803d;
  background: #effdf4;
  font-size: 11px;
}

.workflow-track {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.workflow-step {
  display: grid;
  grid-template-columns: 42px 42px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 82px;
  padding: 14px;
  border: 1px solid rgba(20, 38, 77, .07);
  border-radius: 20px;
  background: #fff;
  animation: track-in .46s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.workflow-step:nth-child(2) {
  animation-delay: .08s;
}

.workflow-step:nth-child(3) {
  animation-delay: .16s;
}

.workflow-step:nth-child(4) {
  animation-delay: .24s;
}

.step-number {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 50%;
  color: #2563eb;
  background: #eaf2ff;
  font-size: 10px;
  font-weight: 850;
}

.workflow-step > svg {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 14px;
  color: #fff;
  background: #14264d;
  box-sizing: border-box;
}

.workflow-step strong {
  color: #14264d;
  font-size: 14px;
}

.workflow-step p {
  margin: 5px 0 0;
  color: #68758e;
  font-size: 12px;
  line-height: 1.5;
}

.record-preview {
  display: grid;
  grid-template-columns: .88fr 1.12fr;
  gap: 12px;
  padding: 0 18px 18px;
}

.record-card,
.team-card {
  border: 1px solid rgba(20, 38, 77, .08);
  border-radius: 22px;
  background: #fbfcff;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.record-card {
  padding: 16px;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-bottom: 14px;
  border-bottom: 1px solid rgba(20, 38, 77, .08);
}

.record-avatar {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  border-radius: 15px;
  color: #fff;
  background: #14264d;
  font-size: 13px;
  font-weight: 850;
}

.record-header strong {
  display: block;
  color: #14264d;
  font-size: 13px;
}

.record-header small {
  color: #8a95a8;
  font-size: 11px;
}

dl {
  display: grid;
  gap: 8px;
  margin: 14px 0 0;
}

dl div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(20, 38, 77, .06);
}

dl div:last-child {
  border-bottom: 0;
}

dt {
  color: #8793a7;
  font-size: 10px;
  font-weight: 800;
}

dd {
  margin: 0;
  color: #14264d;
  font-size: 11px;
  font-weight: 850;
  text-align: right;
}

.team-card {
  padding: 18px;
  background: #14264d;
}

.team-card-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #9fbaff;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .16em;
  text-transform: uppercase;
}

.team-card-heading svg {
  width: 16px;
  height: 16px;
}

.team-card h4 {
  margin: 18px 0 10px;
  color: #fff;
  font-size: 24px;
  line-height: 1.08;
  letter-spacing: -.035em;
}

.team-card p {
  margin: 0;
  color: #bfcae0;
  font-size: 13px;
  line-height: 1.6;
}

.team-card div:last-child {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 18px;
}

.team-card div:last-child span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 9px;
  border-radius: 999px;
  color: #eaf2ff;
  background: rgba(255, 255, 255, .09);
  font-size: 10px;
  font-weight: 750;
  animation: chip-in .42s cubic-bezier(.22, 1, .36, 1) both;
}

.team-card div:last-child span:nth-child(2) {
  animation-delay: .08s;
}

.team-card div:last-child span:nth-child(3) {
  animation-delay: .16s;
}

.team-card div:last-child svg {
  width: 13px;
  height: 13px;
  color: #86efac;
}

.metric-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.metric-strip article {
  display: grid;
  grid-template-columns: 44px 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
  min-height: 88px;
  padding: 16px;
  border: 1px solid rgba(20, 38, 77, .08);
  border-radius: 22px;
  background: rgba(255, 255, 255, .8);
  animation: item-pop .45s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.metric-strip article:nth-child(2) {
  animation-delay: .06s;
}

.metric-strip article:nth-child(3) {
  animation-delay: .12s;
}

.metric-strip article:nth-child(4) {
  animation-delay: .18s;
}

.metric-strip svg {
  grid-row: 1 / 3;
  width: 44px;
  height: 44px;
  padding: 11px;
  border-radius: 15px;
  color: #2563eb;
  background: #eaf2ff;
  box-sizing: border-box;
}

.metric-strip strong {
  color: #11152b;
  font-size: 24px;
  line-height: 1;
}

.metric-strip span {
  color: #748096;
  font-size: 11px;
  font-weight: 700;
}

@keyframes section-rise {
  from { transform: translateY(22px); }
  to { transform: translateY(0); }
}

@keyframes board-in {
  from { transform: translateY(16px) scale(.99); }
  to { transform: translateY(0) scale(1); }
}

@keyframes item-pop {
  from { transform: translateY(14px) scale(.97); }
  to { transform: translateY(0) scale(1); }
}

@keyframes track-in {
  from { transform: translateX(-12px); }
  to { transform: translateX(0); }
}

@keyframes chip-in {
  from { transform: translateY(8px) scale(.94); }
  to { transform: translateY(0) scale(1); }
}

@keyframes icon-pop {
  0% { transform: scale(.88) rotate(-7deg); }
  58% { transform: scale(1.1) rotate(4deg); }
  100% { transform: scale(1) rotate(0); }
}

@media (max-width: 1220px) {
  .case-board {
    grid-template-columns: 1fr;
  }

  .pressure-list,
  .outcome-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .transformations {
    padding: 98px 0 86px;
  }

  .case-selector,
  .pressure-list,
  .outcome-list,
  .record-preview,
  .metric-strip {
    grid-template-columns: 1fr;
  }

  .heading h2 {
    font-size: 42px;
  }
}

@media (max-width: 560px) {
  .case-brief,
  .outcome-panel {
    padding: 22px;
  }

  .panel-top {
    align-items: flex-start;
    flex-direction: column;
  }

  .workflow-step {
    grid-template-columns: 36px 1fr;
  }

  .workflow-step > svg {
    grid-column: 1;
  }

  .workflow-step > div {
    grid-column: 1 / -1;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
