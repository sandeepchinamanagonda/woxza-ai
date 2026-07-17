<template>
  <section id="integrations" class="integrations">
    <div class="container-custom">
      <header class="section-heading">
        <span class="eyebrow">CONNECTED ECOSYSTEM</span>
        <h2>All the customer work, sorted into the systems your team already trusts</h2>
        <p>
          Woxza does not replace your CRM or workspace. It keeps them clean:
          customer records, tasks, tickets, calendar events and team alerts stay
          connected after every conversation.
        </p>
      </header>

      <div class="integration-layout">
        <aside class="category-panel" aria-label="Integration categories">
          <button
            v-for="(flow, index) in flows"
            :key="flow.id"
            type="button"
            :class="{ active: activeFlow === index }"
            :aria-pressed="activeFlow === index"
            @click="selectFlow(index)"
          >
            <component :is="flow.icon" />
            <span>
              <strong>{{ flow.label }}</strong>
              <small>{{ flow.short }}</small>
            </span>
          </button>
        </aside>

        <main :key="selectedFlow.id" class="system-board">
          <div class="board-top">
            <div>
              <span>{{ selectedFlow.kicker }}</span>
              <strong>{{ selectedFlow.title }}</strong>
            </div>
            <b><RefreshCcw /> Live sync</b>
          </div>

          <div class="board-grid">
            <section class="primary-system">
              <span class="system-label">Primary record</span>
              <div class="system-head">
                <span class="logo-box"><img :src="selectedFlow.primary.logo" :alt="selectedFlow.primary.name"></span>
                <div>
                  <strong>{{ selectedFlow.primary.name }}</strong>
                  <small>{{ selectedFlow.primary.detail }}</small>
                </div>
              </div>

              <div class="record-fields">
                <div v-for="field in selectedFlow.fields" :key="field.label">
                  <span>{{ field.label }}</span>
                  <strong>{{ field.value }}</strong>
                </div>
              </div>
            </section>

            <section class="mapping-panel">
              <span class="system-label">What gets written</span>
              <article v-for="item in selectedFlow.mapping" :key="item.title">
                <component :is="item.icon" />
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.detail }}</p>
                </div>
              </article>
            </section>

            <section class="routing-panel">
              <span class="system-label">Routing rules</span>
              <ol>
                <li v-for="(rule, index) in selectedFlow.rules" :key="rule">
                  <span>{{ index + 1 }}</span>
                  {{ rule }}
                </li>
              </ol>
            </section>
          </div>
        </main>

        <aside :key="`${selectedFlow.id}-apps`" class="app-panel">
          <header>
            <span>Connected apps</span>
            <strong>{{ selectedFlow.appTitle }}</strong>
          </header>

          <div class="app-grid">
            <article v-for="tool in selectedFlow.tools" :key="tool.name">
              <span class="logo-box small"><img :src="tool.logo" :alt="tool.name"></span>
              <strong>{{ tool.name }}</strong>
              <small>{{ tool.detail }}</small>
            </article>
          </div>
        </aside>
      </div>

      <div class="governance-strip" aria-label="Integration assurances">
        <article v-for="item in governance" :key="item.title">
          <component :is="item.icon" />
          <span>
            <strong>{{ item.title }}</strong>
            <small>{{ item.detail }}</small>
          </span>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import {
  BellRing,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  ContactRound,
  FileText,
  Layers3,
  ListChecks,
  LockKeyhole,
  Mail,
  MessagesSquare,
  RefreshCcw,
  Route,
  ShieldCheck,
  Sparkles,
  Workflow
} from "lucide-vue-next"

const asset = name => `/brand-logos/${name}.svg`

const tools = {
  salesforce: { name: "Salesforce", logo: asset("salesforce"), detail: "Accounts, leads and notes" },
  hubspot: { name: "HubSpot", logo: asset("hubspot"), detail: "Deals and lifecycle stages" },
  zoho: { name: "Zoho", logo: asset("zoho"), detail: "Tickets and service records" },
  slack: { name: "Slack", logo: asset("slack"), detail: "Team alerts" },
  teams: { name: "Microsoft Teams", logo: asset("microsoftteams"), detail: "Internal handoffs" },
  calendar: { name: "Google Calendar", logo: asset("googlecalendar"), detail: "Bookings and callbacks" },
  gmail: { name: "Gmail", logo: asset("gmail"), detail: "Email confirmations" },
  whatsapp: { name: "WhatsApp", logo: asset("whatsapp"), detail: "Customer updates" },
  notion: { name: "Notion", logo: asset("notion"), detail: "Knowledge and SOPs" },
  odoo: { name: "Odoo", logo: asset("odoo"), detail: "Orders and operations" },
  sap: { name: "SAP", logo: asset("sap"), detail: "Enterprise data" },
  oracle: { name: "Oracle", logo: asset("oracle"), detail: "Business records" },
  sendgrid: { name: "SendGrid", logo: asset("sendgrid"), detail: "Transactional email" },
  mailchimp: { name: "Mailchimp", logo: asset("mailchimp"), detail: "Customer journeys" }
}

const flows = [
  {
    id: "crm",
    label: "CRM",
    short: "Records and follow-up",
    icon: ContactRound,
    kicker: "CUSTOMER RECORDS",
    title: "Turn every call into a useful CRM record",
    primary: tools.salesforce,
    appTitle: "Sales and support stay aligned",
    fields: [
      { label: "Contact", value: "Avery Morgan" },
      { label: "Intent", value: "Book appointment" },
      { label: "Stage", value: "Qualified" },
      { label: "Next action", value: "Send intake form" }
    ],
    mapping: [
      { title: "Conversation summary", detail: "Short call notes attached to the customer record.", icon: FileText },
      { title: "Owner and priority", detail: "Urgency and team ownership are set automatically.", icon: ClipboardList },
      { title: "Follow-up task", detail: "The next step is created before the call disappears.", icon: CheckCircle2 }
    ],
    rules: ["If urgent, assign to live owner", "If booked, update calendar", "If unresolved, open follow-up task"],
    tools: [tools.salesforce, tools.hubspot, tools.zoho, tools.gmail, tools.calendar, tools.slack]
  },
  {
    id: "communication",
    label: "Communication",
    short: "Messages and alerts",
    icon: MessagesSquare,
    kicker: "TEAM COMMUNICATION",
    title: "Send the right update to the right place",
    primary: tools.slack,
    appTitle: "No more status chasing",
    fields: [
      { label: "Channel", value: "Ops urgent" },
      { label: "Summary", value: "Stock split needed" },
      { label: "Owner", value: "Dispatch team" },
      { label: "Customer update", value: "WhatsApp ready" }
    ],
    mapping: [
      { title: "Internal alert", detail: "Teams receive the context, not just a notification.", icon: BellRing },
      { title: "Customer message", detail: "Confirmations can be sent through email or WhatsApp.", icon: Mail },
      { title: "Shared thread", detail: "Updates stay visible for everyone responsible.", icon: MessagesSquare }
    ],
    rules: ["Urgent requests go to team channel", "Customer confirmations use preferred channel", "Unanswered items stay pinned"],
    tools: [tools.slack, tools.teams, tools.whatsapp, tools.gmail, tools.sendgrid, tools.mailchimp]
  },
  {
    id: "operations",
    label: "Operations",
    short: "Orders, tickets, systems",
    icon: Workflow,
    kicker: "BUSINESS OPERATIONS",
    title: "Route work into the system that actually completes it",
    primary: tools.odoo,
    appTitle: "Operations gets structured requests",
    fields: [
      { label: "Request", value: "Split shipment" },
      { label: "SLA", value: "Urgent" },
      { label: "System", value: "Odoo order" },
      { label: "Status", value: "In progress" }
    ],
    mapping: [
      { title: "Ticket or order update", detail: "Structured records are created with required fields.", icon: ListChecks },
      { title: "System lookup", detail: "Existing records and inventory can be checked first.", icon: Layers3 },
      { title: "Completion route", detail: "The task is closed only when the outcome is clear.", icon: Route }
    ],
    rules: ["Validate required fields before routing", "Escalate exceptions to a human", "Write outcome back to source record"],
    tools: [tools.odoo, tools.sap, tools.oracle, tools.salesforce, tools.slack, tools.notion]
  }
]

const governance = [
  { title: "Field-level control", detail: "Write only what each workflow needs", icon: LockKeyhole },
  { title: "Human handoff", detail: "Escalate sensitive requests cleanly", icon: ShieldCheck },
  { title: "Calendar-safe", detail: "Bookings respect availability and ownership", icon: CalendarCheck2 },
  { title: "Workflow-ready", detail: "Built around your existing stack", icon: Sparkles }
]

const activeFlow = ref(0)
const selectedFlow = computed(() => flows[activeFlow.value])
let rotationTimer

function selectFlow(index) {
  activeFlow.value = index
  startRotation()
}

function startRotation() {
  window.clearInterval(rotationTimer)
  rotationTimer = window.setInterval(() => {
    activeFlow.value = (activeFlow.value + 1) % flows.length
  }, 7000)
}

onMounted(startRotation)
onBeforeUnmount(() => window.clearInterval(rotationTimer))
</script>

<style scoped>
.integrations {
  position: relative;
  padding: 136px 0 124px;
  overflow: hidden;
  background:
    radial-gradient(circle at 14% 18%, rgba(37, 99, 235, .08), transparent 30%),
    linear-gradient(180deg, #ffffff 0%, #f5f7fb 100%);
  color: #14264d;
  isolation: isolate;
}

.container-custom {
  position: relative;
  z-index: 1;
}

.section-heading {
  max-width: 980px;
  margin: 0 auto 40px;
  text-align: center;
  animation: section-rise .72s cubic-bezier(.22, 1, .36, 1) both;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 18px;
  color: #2563eb;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .28em;
}

.section-heading h2 {
  margin: 0;
  color: #11152b;
  font-size: clamp(44px, 4.8vw, 70px);
  line-height: 1;
  letter-spacing: -.055em;
  text-wrap: balance;
}

.section-heading p {
  max-width: 760px;
  margin: 22px auto 0;
  color: #68758e;
  font-size: 16px;
  line-height: 1.75;
}

.integration-layout {
  display: grid;
  grid-template-columns: 270px minmax(0, 1fr) 285px;
  gap: 16px;
  align-items: stretch;
  animation: board-in .66s .08s cubic-bezier(.22, 1, .36, 1) both;
}

.category-panel,
.system-board,
.app-panel {
  border: 1px solid rgba(20, 38, 77, .09);
  border-radius: 30px;
  background: rgba(255, 255, 255, .88);
  box-shadow: 0 28px 86px rgba(20, 38, 77, .09);
}

.category-panel {
  display: grid;
  gap: 10px;
  align-content: start;
  padding: 14px;
}

.category-panel button {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 78px;
  padding: 13px;
  border: 1px solid transparent;
  border-radius: 20px;
  color: #60708d;
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: .26s cubic-bezier(.22, 1, .36, 1);
}

.category-panel button:hover,
.category-panel button.active {
  border-color: rgba(20, 38, 77, .16);
  color: #14264d;
  background: #f7faff;
  transform: translateY(-3px);
  box-shadow: 0 16px 36px rgba(20, 38, 77, .08);
}

.category-panel svg {
  width: 44px;
  height: 44px;
  padding: 11px;
  border-radius: 15px;
  color: #2563eb;
  background: #eaf2ff;
  box-sizing: border-box;
}

.category-panel button.active svg {
  color: #fff;
  background: #14264d;
  animation: icon-pop .42s cubic-bezier(.22, 1, .36, 1) both;
}

.category-panel strong,
.app-panel strong,
.system-head strong {
  display: block;
  color: inherit;
  font-size: 14px;
}

.category-panel small,
.app-panel small,
.system-head small {
  display: block;
  margin-top: 4px;
  color: #8a95a8;
  font-size: 11px;
}

.system-board {
  overflow: hidden;
  animation: board-in .5s cubic-bezier(.22, 1, .36, 1) both;
}

.board-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  align-items: center;
  min-height: 86px;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(20, 38, 77, .08);
  background: linear-gradient(180deg, #fff, #f9fbff);
}

.board-top span,
.system-label,
.app-panel header span {
  color: #7b879d;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .18em;
  text-transform: uppercase;
}

.board-top strong {
  display: block;
  margin-top: 6px;
  color: #14264d;
  font-size: 20px;
  line-height: 1.2;
}

.board-top b {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  padding: 9px 12px;
  border-radius: 999px;
  color: #15803d;
  background: #effdf4;
  font-size: 11px;
}

.board-top b svg {
  width: 14px;
  height: 14px;
  animation: sync-spin 2.8s linear infinite;
}

.board-grid {
  display: grid;
  grid-template-columns: .92fr 1.08fr;
  gap: 14px;
  padding: 18px;
}

.primary-system,
.mapping-panel,
.routing-panel {
  border: 1px solid rgba(20, 38, 77, .08);
  border-radius: 22px;
  background: #fff;
}

.primary-system {
  padding: 18px;
}

.system-head {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(20, 38, 77, .08);
}

.logo-box {
  display: grid;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid rgba(20, 38, 77, .08);
  border-radius: 16px;
  background: #fff;
}

.logo-box.small {
  width: 42px;
  height: 42px;
  border-radius: 14px;
}

.logo-box img {
  width: auto;
  max-width: 34px;
  height: 31px;
  object-fit: contain;
}

.record-fields {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.record-fields div {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  padding: 11px;
  border-radius: 14px;
  background: #f7f9fd;
  animation: item-pop .42s cubic-bezier(.22, 1, .36, 1) both;
}

.record-fields div:nth-child(2) { animation-delay: .06s; }
.record-fields div:nth-child(3) { animation-delay: .12s; }
.record-fields div:nth-child(4) { animation-delay: .18s; }

.record-fields span {
  color: #8793a7;
  font-size: 11px;
  font-weight: 750;
}

.record-fields strong {
  color: #14264d;
  font-size: 11px;
  text-align: right;
}

.mapping-panel {
  display: grid;
  gap: 10px;
  padding: 18px;
}

.mapping-panel article {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: start;
  padding: 13px;
  border: 1px solid rgba(20, 38, 77, .07);
  border-radius: 17px;
  background: #fbfcff;
  animation: item-pop .42s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.mapping-panel article:nth-of-type(2) { animation-delay: .08s; }
.mapping-panel article:nth-of-type(3) { animation-delay: .16s; }

.mapping-panel article:hover,
.routing-panel li:hover,
.app-grid article:hover,
.governance-strip article:hover {
  border-color: rgba(37, 99, 235, .16);
  box-shadow: 0 16px 38px rgba(20, 38, 77, .08);
  transform: translateY(-4px);
}

.mapping-panel svg {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 14px;
  color: #2563eb;
  background: #eaf2ff;
  box-sizing: border-box;
}

.mapping-panel strong {
  color: #14264d;
  font-size: 13px;
}

.mapping-panel p {
  margin: 5px 0 0;
  color: #6f7b91;
  font-size: 12px;
  line-height: 1.5;
}

.routing-panel {
  grid-column: 1 / -1;
  padding: 18px;
}

.routing-panel ol {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin: 15px 0 0;
  padding: 0;
  list-style: none;
}

.routing-panel li {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 9px;
  align-items: center;
  min-height: 58px;
  padding: 12px;
  border: 1px solid rgba(20, 38, 77, .07);
  border-radius: 16px;
  color: #3d4961;
  background: #fbfcff;
  font-size: 12px;
  font-weight: 720;
  line-height: 1.35;
  animation: item-pop .42s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.routing-panel li:nth-child(2) { animation-delay: .08s; }
.routing-panel li:nth-child(3) { animation-delay: .16s; }

.routing-panel li span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 50%;
  color: #2563eb;
  background: #eaf2ff;
  font-size: 10px;
  font-weight: 850;
}

.app-panel {
  padding: 20px;
}

.app-panel header strong {
  margin-top: 8px;
  color: #14264d;
  font-size: 20px;
  line-height: 1.18;
  letter-spacing: -.02em;
}

.app-grid {
  display: grid;
  gap: 10px;
  margin-top: 18px;
}

.app-grid article {
  display: grid;
  grid-template-columns: 42px 1fr;
  column-gap: 11px;
  align-items: center;
  min-height: 74px;
  padding: 11px;
  border: 1px solid rgba(20, 38, 77, .07);
  border-radius: 17px;
  background: #fff;
  animation: item-pop .42s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.app-grid article:nth-child(2) { animation-delay: .05s; }
.app-grid article:nth-child(3) { animation-delay: .1s; }
.app-grid article:nth-child(4) { animation-delay: .15s; }
.app-grid article:nth-child(5) { animation-delay: .2s; }
.app-grid article:nth-child(6) { animation-delay: .25s; }

.app-grid article strong {
  align-self: end;
  color: #14264d;
  font-size: 12px;
}

.app-grid article small {
  align-self: start;
}

.governance-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 18px;
}

.governance-strip article {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: center;
  min-height: 82px;
  padding: 15px;
  border: 1px solid rgba(20, 38, 77, .08);
  border-radius: 22px;
  background: rgba(255, 255, 255, .8);
  animation: item-pop .45s cubic-bezier(.22, 1, .36, 1) both;
  transition: .24s cubic-bezier(.22, 1, .36, 1);
}

.governance-strip article:nth-child(2) { animation-delay: .06s; }
.governance-strip article:nth-child(3) { animation-delay: .12s; }
.governance-strip article:nth-child(4) { animation-delay: .18s; }

.governance-strip svg {
  width: 42px;
  height: 42px;
  padding: 10px;
  border-radius: 14px;
  color: #2563eb;
  background: #eaf2ff;
  box-sizing: border-box;
}

.governance-strip strong {
  display: block;
  color: #14264d;
  font-size: 13px;
}

.governance-strip small {
  display: block;
  margin-top: 3px;
  color: #7b879d;
  font-size: 11px;
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
  from { transform: translateY(12px) scale(.97); }
  to { transform: translateY(0) scale(1); }
}

@keyframes icon-pop {
  0% { transform: scale(.88) rotate(-7deg); }
  58% { transform: scale(1.1) rotate(4deg); }
  100% { transform: scale(1) rotate(0); }
}

@keyframes sync-spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1180px) {
  .integration-layout {
    grid-template-columns: 1fr;
  }

  .category-panel {
    grid-template-columns: repeat(3, 1fr);
  }

  .app-grid,
  .governance-strip {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 780px) {
  .integrations {
    padding: 98px 0 86px;
  }

  .section-heading h2 {
    font-size: 42px;
  }

  .category-panel,
  .board-grid,
  .routing-panel ol,
  .app-grid,
  .governance-strip {
    grid-template-columns: 1fr;
  }

  .board-top {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 520px) {
  .category-panel,
  .app-panel,
  .board-grid {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
