<template>
  <section class="integration-marquee landing-section" aria-labelledby="integration-marquee-title">
    <div class="marquee-heading">
      <span></span>
      <p id="integration-marquee-title">Connect Woxza to the tools your team already uses.</p>
      <span></span>
    </div>

    <div class="marquee-window">
      <div class="marquee-track marquee-left">
        <div v-for="copy in 2" :key="`top-${copy}`" class="marquee-group" :aria-hidden="copy === 2">
          <div v-for="company in topRow" :key="`${copy}-${company.name}`" class="company-logo">
            <img :src="company.logo" alt="" />
            <strong>{{ company.name }}</strong>
          </div>
        </div>
      </div>
    </div>

    <div class="marquee-window">
      <div class="marquee-track marquee-right">
        <div v-for="copy in 2" :key="`bottom-${copy}`" class="marquee-group" :aria-hidden="copy === 2">
          <div v-for="company in bottomRow" :key="`${copy}-${company.name}`" class="company-logo">
            <img :src="company.logo" alt="" />
            <strong>{{ company.name }}</strong>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const asset = name => `/brand-logos/${name}.svg`

const topRow = [
  { name: "Salesforce", logo: asset("salesforce") },
  { name: "HubSpot", logo: asset("hubspot") },
  { name: "Zoho CRM", logo: asset("zoho") },
  { name: "Odoo", logo: asset("odoo") },
  { name: "Slack", logo: asset("slack") },
  { name: "Microsoft Teams", logo: asset("microsoftteams") },
  { name: "Google Chat", logo: asset("google") },
  { name: "Zoom", logo: asset("zoom") }
]

const bottomRow = [
  { name: "WhatsApp", logo: asset("whatsapp") },
  { name: "SendGrid", logo: asset("sendgrid") },
  { name: "Gmail", logo: asset("gmail") },
  { name: "Google Calendar", logo: asset("googlecalendar") },
  { name: "Calendly", logo: asset("calendly") },
  { name: "Microsoft 365", logo: asset("microsoft") },
  { name: "Notion", logo: asset("notion") },
  { name: "Zapier", logo: asset("zapier") },
  { name: "GitHub", logo: asset("github") }
]
</script>

<style scoped>
.integration-marquee {
  position:relative;
  z-index:3;
  overflow:hidden;
  border-top:1px solid rgba(24,65,125,.08);
  border-bottom:1px solid rgba(24,65,125,.1);
  background:#fff;
  box-shadow:0 18px 44px rgba(27,59,107,.045);
}

.marquee-heading {
  display:grid;
  grid-template-columns:minmax(30px,110px) auto minmax(30px,110px);
  gap:16px;
  align-items:center;
  justify-content:center;
  margin:0 auto 26px;
  padding:0 24px;
}
.marquee-heading span { height:1px; background:linear-gradient(90deg,transparent,rgba(47,140,255,.42)); }
.marquee-heading span:last-child { background:linear-gradient(90deg,rgba(47,140,255,.42),transparent); }
.marquee-heading p { margin:0; color:#65738a; font-size:10px; font-weight:850; letter-spacing:.18em; text-align:center; text-transform:uppercase; }

.marquee-window {
  position:relative;
  overflow:hidden;
  width:100%;
  padding:8px 0;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);
  mask-image:linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent);
}
.marquee-window + .marquee-window { margin-top:12px; }
.marquee-track { display:flex; width:max-content; will-change:transform; }
.marquee-group { display:flex; align-items:center; gap:clamp(58px,6.5vw,118px); padding-right:clamp(58px,6.5vw,118px); }
.marquee-left { animation:marquee-left 34s linear infinite; }
.marquee-right { animation:marquee-right 38s linear infinite; }
.marquee-window:hover .marquee-track { animation-play-state:paused; }

.company-logo {
  display:flex;
  flex:0 0 auto;
  align-items:center;
  gap:11px;
  min-width:max-content;
  color:#10213d;
  opacity:.9;
  transition:opacity .22s ease,transform .22s ease;
}
.company-logo:hover { opacity:1; transform:translateY(-2px); }
.company-logo img {
  width:31px;
  height:31px;
  object-fit:contain;
  filter:none;
}
.company-logo strong { font-size:15px; font-weight:780; letter-spacing:-.02em; white-space:nowrap; }

@keyframes marquee-left {
  from { transform:translate3d(0,0,0); }
  to { transform:translate3d(-50%,0,0); }
}
@keyframes marquee-right {
  from { transform:translate3d(-50%,0,0); }
  to { transform:translate3d(0,0,0); }
}

@media(max-width:640px) {
  .marquee-heading { grid-template-columns:24px auto 24px; gap:10px; margin-bottom:20px; }
  .marquee-heading p { font-size:8px; letter-spacing:.13em; }
  .marquee-group { gap:46px; padding-right:46px; }
  .company-logo img { width:27px; height:27px; }
  .company-logo strong { font-size:13px; }
}

@media(prefers-reduced-motion:reduce) {
  .marquee-track { animation-play-state:paused; }
}
</style>
