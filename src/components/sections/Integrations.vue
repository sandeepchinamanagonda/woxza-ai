<template>
  <section id="integrations" class="integrations">
    <div class="integration-shell">
      <header class="section-heading">
        <div class="eyebrow"><span>V</span>CONNECTED ECOSYSTEM</div>
        <h2>
          <span>One Voice Agent.</span>
          <span>Connected to <b>everything that matters.</b></span>
        </h2>
        <p>Voxa integrates with the platforms you use every day—so your team stays aligned, conversations flow, and work gets done.</p>
      </header>

      <div class="ecosystem-board">
        <div class="category-grid">
          <article
            v-for="category in categories"
            :key="category.title"
            class="category"
            :style="{ '--category-accent': category.accent, '--category-soft': category.soft }"
          >
            <div class="category-icon"><component :is="category.icon" /></div>
            <h3>{{ category.title }}</h3>
            <div class="tool-list">
              <div v-for="tool in category.tools" :key="tool.name" class="tool-item" :class="{ more: tool.more }">
                <span class="tool-mark">
                  <img v-if="tool.logo" :src="tool.logo" :alt="tool.name" />
                  <component v-else-if="tool.icon" :is="tool.icon" />
                  <b v-else>{{ tool.mark }}</b>
                </span>
                <strong>{{ tool.name }}</strong>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div class="assurance-bar" aria-label="Integration assurances">
        <article v-for="item in assurances" :key="item.title">
          <span><component :is="item.icon" /></span>
          <div><strong>{{ item.title }}</strong><small>{{ item.detail }}</small></div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { CalendarDays, CheckCircle2, LockKeyhole, Mail, MessageSquareText, Network, RefreshCw, ShieldCheck, Target, Zap } from "lucide-vue-next"

const asset = name => `/brand-logos/${name}.svg`

const categories = [
  {
    title: "CRM",
    icon: Target,
    accent: "#22dff3",
    soft: "#eaf2ff",
    tools: [
      { name: "Salesforce", logo: asset("salesforce") },
      { name: "HubSpot", logo: asset("hubspot") },
      { name: "Zoho CRM", logo: asset("zoho") },
      { name: "Odoo", logo: asset("odoo") }
    ]
  },
  {
    title: "Communication",
    icon: MessageSquareText,
    accent: "#2f8cff",
    soft: "#edf4ff",
    tools: [
      { name: "Slack", logo: asset("slack") },
      { name: "Microsoft Teams", logo: asset("microsoftteams") },
      { name: "Google Chat", logo: asset("google") },
      { name: "Zoom", logo: asset("zoom") }
    ]
  },
  {
    title: "Messaging",
    icon: MessageSquareText,
    accent: "#ff4fb7",
    soft: "#eef5ff",
    tools: [
      { name: "WhatsApp", logo: asset("whatsapp") },
      { name: "SMS", icon: MessageSquareText },
      { name: "Email", icon: Mail },
      { name: "SendGrid", logo: asset("sendgrid") }
    ]
  },
  {
    title: "Productivity & Scheduling",
    icon: CalendarDays,
    accent: "#c04eff",
    soft: "#eff7ff",
    tools: [
      { name: "Google Calendar", logo: asset("googlecalendar") },
      { name: "Gmail", logo: asset("gmail") },
      { name: "Calendly", logo: asset("calendly") },
      { name: "Microsoft 365", logo: asset("microsoft") }
    ]
  },
  {
    title: "Other Integrations",
    icon: Network,
    accent: "#28e2ef",
    soft: "#edf1f7",
    tools: [
      { name: "Zendesk", mark: "Z" },
      { name: "Notion", logo: asset("notion") },
      { name: "Zapier", logo: asset("zapier") },
      { name: "GitHub", logo: asset("github") }
    ]
  }
]

const assurances = [
  { title: "Secure & Compliant", detail: "Enterprise-grade security you can trust", icon: ShieldCheck },
  { title: "Real-time Sync", detail: "Always in the loop across every platform", icon: RefreshCw },
  { title: "Scalable", detail: "Built for growing teams and complex workflows", icon: Zap },
  { title: "Reliable", detail: "99.9% uptime for uninterrupted operations", icon: CheckCircle2 },
  { title: "Enterprise Ready", detail: "Built for the highest standards", icon: LockKeyhole }
]

</script>

<style scoped>
.integrations {
  position:relative;
  padding:clamp(100px,8vw,130px) 0 80px;
  overflow:hidden;
  color:#fff;
  background:
    linear-gradient(rgba(147,197,253,.035) 1px,transparent 1px),
    linear-gradient(90deg,rgba(147,197,253,.035) 1px,transparent 1px),
    radial-gradient(circle at 14% 12%,rgba(47,140,255,.16),transparent 31%),
    radial-gradient(circle at 78% 24%,rgba(192,78,255,.08),transparent 24%),
    radial-gradient(circle at 88% 82%,rgba(34,223,243,.1),transparent 33%),
    linear-gradient(180deg,#07172f 0%,#06142a 100%);
  background-size:64px 64px,64px 64px,auto,auto,auto,auto;
}

.integration-shell { width:min(1680px,calc(100% - 80px)); margin:auto; }
.section-heading { display:flex; flex-direction:column; align-items:center; text-align:center; }
.eyebrow { display:inline-flex; align-items:center; gap:10px; margin-bottom:22px; color:#dbeafe; font-size:10px; font-weight:850; letter-spacing:.22em; }
.eyebrow::after { content:""; width:44px; height:1px; margin-left:5px; background:rgba(191,219,254,.65); }
.eyebrow>span { display:grid; width:20px; height:20px; place-items:center; border-radius:7px; color:#14264d; background:#fff; box-shadow:0 7px 18px rgba(0,0,0,.18); font-size:9px; letter-spacing:0; }
.section-heading h2 { margin:0; color:#fff; font-size:clamp(44px,4vw,68px); font-weight:730; line-height:.98; letter-spacing:-.05em; text-wrap:balance; }
.section-heading h2>span { display:block; }
.section-heading h2 b { color:#ff4fb7; background:linear-gradient(90deg,#ff4fb7,#c04eff); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; font-weight:inherit; }
.section-heading p { max-width:760px; margin:20px 0 0; color:rgba(219,234,254,.68); font-size:clamp(14px,1.1vw,17px); line-height:1.65; }

.ecosystem-board { position:relative; min-height:0; margin:50px auto 0; }
.category-grid { position:relative; z-index:3; display:grid; grid-template-columns:repeat(5,1fr); gap:clamp(24px,3vw,58px); }
.category { position:relative; min-width:0; text-align:center; }
.category:nth-child(1) { transform:translateY(10px); }
.category:nth-child(2) { transform:translateY(5px); }
.category:nth-child(3) { transform:translateY(0); }
.category:nth-child(4) { transform:translateY(-5px); }
.category:nth-child(5) { transform:translateY(-10px); }
.category-icon { position:relative; display:grid; width:46px; height:46px; margin:0 auto 16px; place-items:center; border:1px solid color-mix(in srgb,var(--category-accent) 66%,transparent); border-radius:14px; color:var(--category-accent); background:color-mix(in srgb,var(--category-accent) 16%,#07172f); box-shadow:0 0 0 7px color-mix(in srgb,var(--category-accent) 6%,transparent),0 0 32px color-mix(in srgb,var(--category-accent) 28%,transparent); }
.category-icon::after { content:""; position:absolute; inset:6px; border:1px solid color-mix(in srgb,var(--category-accent) 32%,transparent); border-radius:9px; }
.category-icon svg { width:20px; height:20px; stroke-width:2; }
.category h3 { min-height:38px; margin:0; color:var(--category-accent); font-size:14px; font-weight:800; line-height:1.25; letter-spacing:-.02em; }
.tool-list { position:relative; display:grid; gap:8px; min-height:300px; margin-top:16px; padding:14px 0 34px 28px; border:0; border-radius:0; background:transparent; box-shadow:none; text-align:left; }
.tool-list::before { content:""; position:absolute; left:11px; top:14px; bottom:18px; width:1px; background:linear-gradient(to bottom,var(--category-accent),color-mix(in srgb,var(--category-accent) 8%,transparent)); opacity:.82; }
.tool-list::after { content:""; position:absolute; left:9px; top:39.5px; width:5px; height:5px; border-radius:50%; background:var(--category-accent); box-shadow:0 64px 0 color-mix(in srgb,var(--category-accent) 76%,white),0 128px 0 color-mix(in srgb,var(--category-accent) 54%,white),0 192px 0 color-mix(in srgb,var(--category-accent) 34%,white),0 0 12px var(--category-accent); }
.tool-item { display:grid; grid-template-columns:44px 1fr; gap:12px; align-items:center; min-height:56px; padding:7px 12px; border:1px solid color-mix(in srgb,var(--category-accent) 16%,transparent); border-radius:15px; background:linear-gradient(135deg,color-mix(in srgb,var(--category-accent) 9%,#0a1c38),rgba(255,255,255,.045)); box-shadow:0 9px 24px rgba(0,0,0,.09); }
.tool-mark { display:grid; width:44px; height:44px; place-items:center; border-radius:11px; background:transparent; }
.tool-mark img { width:32px; height:32px; object-fit:contain; }
.tool-mark svg { width:28px; height:28px; color:var(--category-accent); }
.tool-mark b { color:var(--category-accent); font-size:14px; }
.tool-item strong { overflow:hidden; color:#f8fbff; font-size:12px; font-weight:750; text-overflow:ellipsis; white-space:nowrap; }
.tool-item.more { background:color-mix(in srgb,var(--category-accent) 6%,rgba(7,22,46,.55)); border-color:color-mix(in srgb,var(--category-accent) 13%,transparent); box-shadow:none; }
.tool-item.more .tool-mark { background:rgba(255,255,255,.12); }
.tool-item.more strong { color:var(--category-accent); }
.assurance-bar { position:relative; z-index:5; display:grid; grid-template-columns:repeat(5,1fr); gap:14px; width:100%; margin:20px auto 0; padding:0; }
.assurance-bar article { display:grid; grid-template-columns:46px 1fr; gap:12px; align-items:center; min-height:82px; padding:12px 14px; border:1px solid rgba(34,211,238,.24); border-radius:17px; background:linear-gradient(135deg,rgba(34,211,238,.08),rgba(8,26,52,.82)); box-shadow:0 14px 34px rgba(0,0,0,.15),inset 0 1px 0 rgba(255,255,255,.05); text-align:left; backdrop-filter:blur(14px); }
.assurance-bar article:nth-child(2) { border-color:rgba(59,130,246,.28); background:linear-gradient(135deg,rgba(59,130,246,.1),rgba(8,26,52,.82)); }
.assurance-bar article:nth-child(3) { border-color:rgba(236,72,153,.28); background:linear-gradient(135deg,rgba(236,72,153,.1),rgba(8,26,52,.82)); }
.assurance-bar article:nth-child(4) { border-color:rgba(168,85,247,.28); background:linear-gradient(135deg,rgba(168,85,247,.1),rgba(8,26,52,.82)); }
.assurance-bar article:nth-child(5) { border-color:rgba(34,211,238,.24); background:linear-gradient(135deg,rgba(34,211,238,.08),rgba(8,26,52,.82)); }
.assurance-bar article>span { display:grid; width:42px; height:42px; place-items:center; border-radius:13px; background:rgba(255,255,255,.08); }
.assurance-bar article:nth-child(1)>span { color:#22d3ee; background:rgba(34,211,238,.14); }
.assurance-bar article:nth-child(2)>span { color:#3b82f6; background:rgba(59,130,246,.14); }
.assurance-bar article:nth-child(3)>span { color:#ec4899; background:rgba(236,72,153,.14); }
.assurance-bar article:nth-child(4)>span { color:#a855f7; background:rgba(168,85,247,.14); }
.assurance-bar article:nth-child(5)>span { color:#22d3ee; background:rgba(34,211,238,.14); }
.assurance-bar svg { width:20px; height:20px; }
.assurance-bar strong { display:block; color:#fff; font-size:11px; }
.assurance-bar small { display:block; max-width:170px; margin-top:4px; color:rgba(255,255,255,.56); font-size:9px; line-height:1.35; }

@media(max-width:1080px){
  .category-grid{grid-template-columns:repeat(2,1fr);max-width:760px;margin:auto}.category,.category:nth-child(n){padding:22px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:rgba(255,255,255,.055);box-shadow:0 18px 48px rgba(0,0,0,.12);transform:none}.category:last-child{grid-column:1/-1;width:calc(50% - 10px);justify-self:center}.tool-list{min-height:0}.ecosystem-board{min-height:0}.assurance-bar{grid-template-columns:repeat(2,1fr);margin-top:28px}
}

@media(max-width:640px){
  .integrations{padding:90px 0 76px}.integration-shell{width:calc(100% - 32px)}.section-heading h2{font-size:40px}.section-heading p{font-size:14px}.eyebrow{font-size:9px;letter-spacing:.16em}.eyebrow::after{display:none}.ecosystem-board{margin-top:42px}.category-grid{grid-template-columns:1fr}.category:last-child{grid-column:auto;width:auto}.category{padding:20px}.assurance-bar{grid-template-columns:1fr;padding:0}
}
</style>
