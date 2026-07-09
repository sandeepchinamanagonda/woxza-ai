<template>
  <section id="integrations" class="integrations">
    <div class="ambient ambient-left" aria-hidden="true" />
    <div class="ambient ambient-right" aria-hidden="true" />

    <div class="container-custom">
      <header class="section-heading">
        <span class="eyebrow">CONNECTED ECOSYSTEM</span>
        <h2>Every conversation flows into the tools that run your business</h2>
        <p>Choose a category to see how Voxa moves live customer data into the systems your team already uses</p>
      </header>

      <nav class="flow-tabs" aria-label="Integration categories">
        <button
          v-for="(flow, index) in flows"
          :key="flow.id"
          type="button"
          :class="{ active: activeFlow === index }"
          :aria-pressed="activeFlow === index"
          @click="selectFlow(index)"
        >
          {{ flow.label }}
        </button>
      </nav>

      <div class="flow-panel">
        <div class="panel-topline">
          <div>
            <span>{{ selectedFlow.kicker }}</span>
            <strong>{{ selectedFlow.title }}</strong>
          </div>
          <span class="live-status"><i /> Live data flow</span>
        </div>

        <div :key="selectedFlow.id" class="signal-stage">
          <div class="tool-column source-column">
            <span class="column-label">TOUCHPOINTS</span>
            <article v-for="tool in selectedFlow.left" :key="tool.name" class="flow-tool">
              <span class="logo-wrap"><img :src="tool.logo" alt=""></span>
              <strong>{{ tool.name }}</strong>
              <small>{{ tool.detail }}</small>
            </article>
          </div>

          <svg class="signal-map" viewBox="0 0 1000 420" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="route-in" x1="0" x2="1">
                <stop offset="0" stop-color="#cbd7ec" stop-opacity=".42" />
                <stop offset="1" stop-color="#3478f6" stop-opacity=".88" />
              </linearGradient>
              <linearGradient id="route-out" x1="0" x2="1">
                <stop offset="0" stop-color="#3478f6" stop-opacity=".88" />
                <stop offset="1" stop-color="#cbd7ec" stop-opacity=".42" />
              </linearGradient>
              <filter id="signal-glow" x="-100%" y="-100%" width="300%" height="300%">
                <feGaussianBlur stdDeviation="5" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            <g class="routes incoming-routes">
              <path v-for="(path, index) in leftPaths" :id="`left-route-${index}`" :key="`left-${index}`" :d="path" />
            </g>
            <g class="routes outgoing-routes">
              <path v-for="(path, index) in rightPaths" :id="`right-route-${index}`" :key="`right-${index}`" :d="path" />
            </g>

            <g v-for="(_, index) in leftPaths" :key="`incoming-signal-${index}`" class="signal signal-in" filter="url(#signal-glow)">
              <circle r="7">
                <animateMotion dur="2.4s" repeatCount="indefinite" :begin="`${index * 0.34}s`">
                  <mpath :href="`#left-route-${index}`" />
                </animateMotion>
              </circle>
              <circle r="2.5" class="signal-core">
                <animateMotion dur="2.4s" repeatCount="indefinite" :begin="`${index * 0.34}s`">
                  <mpath :href="`#left-route-${index}`" />
                </animateMotion>
              </circle>
            </g>

            <g v-for="(_, index) in rightPaths" :key="`outgoing-signal-${index}`" class="signal signal-out" filter="url(#signal-glow)">
              <circle r="7">
                <animateMotion dur="2.4s" repeatCount="indefinite" :begin="`${1.05 + index * 0.34}s`">
                  <mpath :href="`#right-route-${index}`" />
                </animateMotion>
              </circle>
              <circle r="2.5" class="signal-core">
                <animateMotion dur="2.4s" repeatCount="indefinite" :begin="`${1.05 + index * 0.34}s`">
                  <mpath :href="`#right-route-${index}`" />
                </animateMotion>
              </circle>
            </g>
          </svg>

          <div class="voxa-core" aria-label="Voxa processes and routes the data">
            <span class="core-rings" aria-hidden="true"><i /><i /><i /></span>
            <span class="voxa-mark" aria-hidden="true"><i /><i /><i /><i /><i /></span>
            <strong>VOXA</strong>
            <small>Understanding and routing</small>
          </div>

          <div class="tool-column destination-column">
            <span class="column-label">BUSINESS SYSTEMS</span>
            <article v-for="tool in selectedFlow.right" :key="tool.name" class="flow-tool">
              <span class="logo-wrap"><img :src="tool.logo" alt=""></span>
              <strong>{{ tool.name }}</strong>
              <small>{{ tool.detail }}</small>
            </article>
          </div>
        </div>

        <footer class="panel-footer">
          <span><i class="footer-dot" /> {{ selectedFlow.footer }}</span>
          <span>Encrypted in transit</span>
          <span>Real-time sync</span>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"

const asset = (name) => `/brand-logos/${name}.svg`

const tools = {
  salesforce: { name: "Salesforce", logo: asset("salesforce"), detail: "Customer records" },
  hubspot: { name: "HubSpot", logo: asset("hubspot"), detail: "Sales workflows" },
  zoho: { name: "Zoho", logo: asset("zoho"), detail: "CRM activity" },
  whatsapp: { name: "WhatsApp", logo: asset("whatsapp"), detail: "Customer messages" },
  slack: { name: "Slack", logo: asset("slack"), detail: "Team updates" },
  teams: { name: "Microsoft Teams", logo: asset("microsoftteams"), detail: "Internal alerts" },
  google: { name: "Google", logo: asset("google"), detail: "Workspace data" },
  microsoft: { name: "Microsoft 365", logo: asset("microsoft"), detail: "Business documents" },
  notion: { name: "Notion", logo: asset("notion"), detail: "Shared knowledge" },
  calendar: { name: "Google Calendar", logo: asset("googlecalendar"), detail: "Live scheduling" },
  calendly: { name: "Calendly", logo: asset("calendly"), detail: "Meeting booking" },
  gmail: { name: "Gmail", logo: asset("gmail"), detail: "Email confirmation" },
  sendgrid: { name: "SendGrid", logo: asset("sendgrid"), detail: "Automated email" },
  mailchimp: { name: "Mailchimp", logo: asset("mailchimp"), detail: "Customer journeys" },
  sap: { name: "SAP", logo: asset("sap"), detail: "Enterprise operations" },
  oracle: { name: "Oracle", logo: asset("oracle"), detail: "Business data" },
  odoo: { name: "Odoo", logo: asset("odoo"), detail: "Operational workflows" },
  aws: { name: "AWS", logo: asset("aws"), detail: "Cloud services" },
  googleCloud: { name: "Google Cloud", logo: asset("googlecloud"), detail: "Cloud data" },
  github: { name: "GitHub", logo: asset("github"), detail: "Developer workflows" }
}

const flows = [
  {
    id: "crm",
    label: "CRM",
    kicker: "CUSTOMER CONTEXT",
    title: "Keep every customer record current",
    left: [tools.salesforce, tools.hubspot, tools.zoho],
    right: [tools.gmail, tools.slack, tools.calendar],
    footer: "Records, notes and follow-ups stay synchronized"
  },
  {
    id: "communication",
    label: "Communication",
    kicker: "CUSTOMER TOUCHPOINTS",
    title: "Turn every message into the right business action",
    left: [tools.whatsapp, tools.slack, tools.teams],
    right: [tools.salesforce, tools.oracle, tools.gmail],
    footer: "Messages are understood, routed and completed"
  },
  {
    id: "productivity",
    label: "Productivity",
    kicker: "TEAM PRODUCTIVITY",
    title: "Move conversations directly into daily work",
    left: [tools.google, tools.microsoft, tools.notion],
    right: [tools.salesforce, tools.calendar, tools.slack],
    footer: "Updates reach the right people without manual handoffs"
  },
  {
    id: "business",
    label: "Business Systems",
    kicker: "CORE OPERATIONS",
    title: "Connect customer intent with enterprise systems",
    left: [tools.sap, tools.oracle, tools.odoo],
    right: [tools.salesforce, tools.gmail, tools.teams],
    footer: "Operational data moves securely between systems"
  },
  {
    id: "developer",
    label: "Developer Tools",
    kicker: "DEVELOPER ECOSYSTEM",
    title: "Give every workflow a reliable technical foundation",
    left: [tools.aws, tools.googleCloud, tools.github],
    right: [tools.salesforce, tools.oracle, tools.slack],
    footer: "Cloud events and business actions stay in sync"
  }
]

const leftPaths = [
  "M210 92 C338 92 360 210 455 210",
  "M210 210 L455 210",
  "M210 328 C338 328 360 210 455 210"
]

const rightPaths = [
  "M545 210 C640 210 662 92 790 92",
  "M545 210 L790 210",
  "M545 210 C640 210 662 328 790 328"
]

const activeFlow = ref(0)
const selectedFlow = computed(() => flows[activeFlow.value])
let rotationTimer

const startRotation = () => {
  window.clearInterval(rotationTimer)
  rotationTimer = window.setInterval(() => {
    activeFlow.value = (activeFlow.value + 1) % flows.length
  }, 5000)
}

const selectFlow = (index) => {
  activeFlow.value = index
  startRotation()
}

onMounted(startRotation)
onBeforeUnmount(() => window.clearInterval(rotationTimer))
</script>

<style scoped>
.integrations {
  position: relative;
  padding: 138px 0 130px;
  overflow: hidden;
  color: #14264d;
  background: linear-gradient(180deg, #ffffff 0%, #f7f9fd 100%);
  isolation: isolate;
}

.ambient { position: absolute; width: 540px; height: 540px; border-radius: 50%; filter: blur(110px); pointer-events: none; opacity: .22; }
.ambient-left { left: -340px; top: 18%; background: #90b7ff; }
.ambient-right { right: -340px; bottom: 2%; background: #b8c8e7; }
.container-custom { position: relative; z-index: 2; }

.section-heading { max-width: 900px; margin: 0 auto 34px; text-align: center; }
.eyebrow { display: inline-block; margin-bottom: 17px; color: #3478f6; font-size: 10px; font-weight: 850; letter-spacing: .28em; }
.section-heading h2 { margin: 0; color: #14264d; font-size: clamp(44px, 4.35vw, 66px); line-height: 1; letter-spacing: -.055em; text-wrap: balance; }
.section-heading p { max-width: 720px; margin: 22px auto 0; color: #697894; font-size: 16px; line-height: 1.7; }

.flow-tabs { display: flex; justify-content: center; flex-wrap: wrap; gap: 9px; margin: 0 auto 26px; }
.flow-tabs button { min-height: 42px; padding: 0 18px; border: 1px solid rgba(20,38,77,.11); border-radius: 999px; color: #64728d; background: rgba(255,255,255,.82); font: inherit; font-size: 12px; font-weight: 760; cursor: pointer; box-shadow: 0 8px 24px rgba(20,38,77,.04); transition: color .25s, border-color .25s, background .25s, transform .25s, box-shadow .25s; }
.flow-tabs button:hover { color: #14264d; border-color: rgba(52,120,246,.32); transform: translateY(-1px); }
.flow-tabs button.active { color: #fff; border-color: #14264d; background: #14264d; box-shadow: 0 12px 30px rgba(20,38,77,.2); }

.flow-panel { max-width: 1240px; margin: auto; overflow: hidden; border: 1px solid rgba(20,38,77,.1); border-radius: 32px; background: rgba(255,255,255,.86); box-shadow: 0 34px 100px rgba(20,38,77,.1); }
.panel-topline { min-height: 76px; display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 18px 28px; border-bottom: 1px solid rgba(20,38,77,.08); }
.panel-topline > div { display: grid; gap: 5px; }
.panel-topline > div span { color: #7f8da5; font-size: 9px; font-weight: 850; letter-spacing: .2em; }
.panel-topline strong { color: #14264d; font-size: 17px; }
.live-status { display: inline-flex; align-items: center; gap: 8px; color: #60708d; font-size: 10px; font-weight: 750; }
.live-status i { width: 8px; height: 8px; border-radius: 50%; background: #22a35b; box-shadow: 0 0 0 5px rgba(34,163,91,.12); animation: live-pulse 1.8s ease-in-out infinite; }

.signal-stage { position: relative; min-height: 470px; display: grid; grid-template-columns: 245px 1fr 245px; align-items: center; padding: 20px 30px; animation: stage-enter .42s cubic-bezier(.22,1,.36,1) both; }
.signal-map { position: absolute; z-index: 1; inset: 35px 0 15px; width: 100%; height: calc(100% - 50px); pointer-events: none; }
.routes path { fill: none; stroke-width: 2.2; vector-effect: non-scaling-stroke; }
.incoming-routes path { stroke: url(#route-in); }
.outgoing-routes path { stroke: url(#route-out); }
.signal > circle:first-child { fill: rgba(52,120,246,.19); }
.signal-core { fill: #3478f6; }

.tool-column { position: relative; z-index: 3; display: grid; gap: 16px; }
.column-label { margin: 0 5px 2px; color: #8793a7; font-size: 9px; font-weight: 850; letter-spacing: .2em; }
.flow-tool { min-height: 84px; display: grid; grid-template-columns: 48px 1fr; grid-template-rows: auto auto; column-gap: 13px; align-items: center; padding: 13px 15px; border: 1px solid rgba(20,38,77,.09); border-radius: 17px; background: rgba(255,255,255,.94); box-shadow: 0 12px 30px rgba(20,38,77,.06); }
.flow-tool .logo-wrap { grid-row: 1 / 3; width: 46px; height: 46px; display: grid; place-items: center; border-radius: 14px; background: #f5f8fd; }
.flow-tool img { width: auto; max-width: 34px; height: 31px; object-fit: contain; }
.flow-tool strong { align-self: end; color: #14264d; font-size: 12px; line-height: 1.2; }
.flow-tool small { align-self: start; color: #8a96aa; font-size: 9px; line-height: 1.25; }

.voxa-core { position: relative; z-index: 4; width: 172px; height: 172px; display: flex; flex-direction: column; align-items: center; justify-content: center; justify-self: center; border: 1px solid rgba(52,120,246,.34); border-radius: 50%; color: #fff; background: radial-gradient(circle at 35% 28%, #315ea8, #14264d 68%); box-shadow: 0 24px 65px rgba(20,38,77,.28), inset 0 1px 0 rgba(255,255,255,.14); animation: core-process 2.4s ease-in-out infinite; }
.voxa-core::after { content: ""; position: absolute; inset: 10px; border: 1px solid rgba(255,255,255,.15); border-radius: inherit; }
.core-rings, .core-rings i { position: absolute; inset: 0; border-radius: 50%; pointer-events: none; }
.core-rings i { border: 1px solid rgba(52,120,246,.22); animation: ring-out 2.4s ease-out infinite; }
.core-rings i:nth-child(2) { animation-delay: .8s; }
.core-rings i:nth-child(3) { animation-delay: 1.6s; }
.voxa-mark { height: 25px; display: flex; align-items: center; gap: 3px; margin-bottom: 8px; }
.voxa-mark i { width: 3px; border-radius: 3px; background: #fff; animation: mark-wave 1s ease-in-out infinite alternate; }
.voxa-mark i:nth-child(1), .voxa-mark i:nth-child(5) { height: 9px; }
.voxa-mark i:nth-child(2), .voxa-mark i:nth-child(4) { height: 18px; animation-delay: -.25s; }
.voxa-mark i:nth-child(3) { height: 25px; animation-delay: -.5s; }
.voxa-core strong { position: relative; z-index: 2; font-size: 24px; letter-spacing: -.035em; }
.voxa-core small { position: relative; z-index: 2; margin-top: 5px; color: #bfcef0; font-size: 8px; }

.panel-footer { min-height: 58px; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 28px; padding: 12px 24px; border-top: 1px solid rgba(20,38,77,.08); color: #728099; font-size: 9px; font-weight: 700; }
.panel-footer span { display: inline-flex; align-items: center; gap: 7px; }
.footer-dot { width: 6px; height: 6px; border-radius: 50%; background: #3478f6; }

@keyframes stage-enter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes live-pulse { 50% { opacity: .45; transform: scale(.78); } }
@keyframes core-process { 0%, 36%, 54%, 100% { filter: brightness(1); transform: scale(1); } 44% { filter: brightness(1.35); transform: scale(1.035); box-shadow: 0 28px 78px rgba(52,120,246,.36), 0 0 0 9px rgba(52,120,246,.08); } }
@keyframes ring-out { 0% { opacity: 0; transform: scale(.9); } 25% { opacity: .7; } 75%, 100% { opacity: 0; transform: scale(1.42); } }
@keyframes mark-wave { to { transform: scaleY(.48); opacity: .72; } }

@media (max-width: 1000px) {
  .signal-stage { grid-template-columns: 210px 1fr 210px; padding-inline: 22px; }
  .flow-tool { grid-template-columns: 42px 1fr; padding-inline: 11px; }
  .flow-tool .logo-wrap { width: 40px; height: 40px; }
  .voxa-core { width: 148px; height: 148px; }
}

@media (max-width: 760px) {
  .integrations { padding: 104px 0 90px; }
  .section-heading h2 { font-size: 42px; }
  .flow-tabs { justify-content: flex-start; flex-wrap: nowrap; overflow-x: auto; padding: 0 2px 8px; scrollbar-width: none; }
  .flow-tabs::-webkit-scrollbar { display: none; }
  .flow-tabs button { flex: 0 0 auto; }
  .panel-topline { align-items: flex-start; }
  .live-status { margin-top: 4px; }
  .signal-stage { min-height: auto; grid-template-columns: 1fr 120px 1fr; gap: 12px; padding: 28px 14px; }
  .signal-map { display: none; }
  .tool-column { gap: 10px; }
  .column-label { font-size: 7px; }
  .flow-tool { min-height: 94px; display: flex; flex-direction: column; justify-content: center; gap: 5px; padding: 10px 6px; text-align: center; }
  .flow-tool .logo-wrap { flex: 0 0 auto; }
  .flow-tool small { display: none; }
  .voxa-core { width: 108px; height: 108px; }
  .voxa-core strong { font-size: 18px; }
  .voxa-core small { display: none; }
  .voxa-mark { transform: scale(.8); margin-bottom: 3px; }
}

@media (max-width: 480px) {
  .flow-panel { border-radius: 24px; }
  .panel-topline { padding: 16px 18px; }
  .panel-topline strong { font-size: 14px; }
  .live-status { display: none; }
  .signal-stage { grid-template-columns: 1fr 82px 1fr; gap: 6px; padding-inline: 8px; }
  .voxa-core { width: 76px; height: 76px; }
  .voxa-core strong { font-size: 14px; }
  .voxa-mark { display: none; }
  .flow-tool strong { font-size: 9px; }
  .panel-footer { gap: 12px; }
}

@media (prefers-reduced-motion: reduce) {
  animateMotion { display: none; }
  .voxa-core, .core-rings i, .voxa-mark i, .live-status i { animation: none; }
}
</style>
