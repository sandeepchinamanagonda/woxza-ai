<template>
  <section id="why-voxa" class="why">
    <div class="grid-overlay" aria-hidden="true"></div>
    <div class="glow glow-one" aria-hidden="true"></div>
    <div class="glow glow-two" aria-hidden="true"></div>

    <div class="why-shell">
      <header class="why-intro">
        <span class="eyebrow">WHY VOXA</span>
        <h2>Built to run the work behind every conversation.</h2>
        <p>
          Not another scripted phone layer. Voxa works from your live business
          context, treats every customer correctly and completes the next step.
        </p>

        <button class="waitlist-cta" type="button" @click="emit('join-waitlist')">
          <span>Join the waitlist</span>
          <ArrowUpRight />
        </button>

        <div class="intro-proof">
          <div>
            <strong>Live</strong>
            <span>business context</span>
          </div>
          <div>
            <strong>Native</strong>
            <span>every language</span>
          </div>
          <div>
            <strong>Ready</strong>
            <span>from day one</span>
          </div>
        </div>
      </header>

      <div class="capability-rail">
        <article v-for="item in capabilities" :key="item.title" class="capability-row">
          <span class="row-icon"><component :is="item.icon" /></span>
          <div class="row-copy">
            <h3>{{ item.title }}</h3>
            <p>{{ item.description }}</p>
          </div>
          <span class="row-line" aria-hidden="true"></span>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ArrowUpRight, Cable, Languages, RefreshCw, Rocket, SlidersHorizontal } from "lucide-vue-next"

const emit = defineEmits(["join-waitlist"])

const capabilities = [
  {
    title: "Knows your business, not a script",
    description: "Connects to your systems and answers from your actual data, catalog, policies and pricing.",
    icon: Cable
  },
  {
    title: "Always current",
    description: "Uses live business data at the moment of the call, not yesterday's export.",
    icon: RefreshCw
  },
  {
    title: "Native in every language",
    description: "Natural conversations designed for the language, rather than translated line by line.",
    icon: Languages
  },
  {
    title: "Rules per customer",
    description: "VIPs, new leads and returning customers each receive the right treatment, not one generic answer.",
    icon: SlidersHorizontal
  },
  {
    title: "Live in minutes",
    description: "Self-serve setup, minimal support and no missed calls from day one.",
    icon: Rocket
  }
]
</script>

<style scoped>
.why {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 150px 0;
  color: #10213d;
  background-color: #fff !important;
  background-image: none !important;
}

.grid-overlay {
  display: none;
}

.glow {
  display: none;
}

.glow-one { top: -330px; left: -250px; background: rgba(37,99,235,.12); }
.glow-two { right: -320px; bottom: -360px; background: rgba(59,130,246,.09); }

.why-shell {
  display: grid;
  grid-template-columns: minmax(0,.8fr) minmax(560px,1.2fr);
  gap: clamp(70px,8vw,150px);
  align-items: start;
  width: min(1400px,calc(100% - 64px));
  margin: auto;
}

.why-intro {
  position: sticky;
  top: 140px;
  padding-top: 18px;
}

.eyebrow {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 26px;
  color: #60a5fa;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: .28em;
}

.eyebrow::after {
  content: "";
  width: 54px;
  height: 1px;
  background: #60a5fa;
}

.why-intro h2 {
  max-width: 650px;
  margin: 0;
  color: #0d1d38;
  font-size: clamp(48px,5vw,76px);
  font-weight: 700;
  line-height: .98;
  letter-spacing: -.052em;
  text-wrap: balance;
}

.why-intro > p {
  max-width: 560px;
  margin: 30px 0 0;
  color: #66758d;
  font-size: 16px;
  line-height: 1.75;
}

.waitlist-cta {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 30px;
  padding: 14px 20px;
  border: 1px solid #173b76;
  border-radius: 999px;
  color: #fff;
  background: #102b58;
  box-shadow: 0 12px 28px rgba(16,43,88,.16);
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .3s cubic-bezier(.22,1,.36,1),background .3s ease,box-shadow .3s ease;
}

.waitlist-cta svg {
  width: 17px;
  height: 17px;
  transition: transform .3s cubic-bezier(.22,1,.36,1);
}

.waitlist-cta:hover {
  background: #1d4f9c;
  box-shadow: 0 16px 34px rgba(37,99,235,.2);
  transform: translateY(-3px);
}

.waitlist-cta:hover svg { transform: translate(2px,-2px); }

.intro-proof {
  display: grid;
  grid-template-columns: repeat(3,1fr);
  gap: 1px;
  margin-top: 56px;
  overflow: hidden;
  border: 1px solid #dce7f7;
  border-radius: 18px;
  background: #dce7f7;
}

.intro-proof div {
  min-width: 0;
  padding: 18px;
  background: #f8fbff;
}

.intro-proof strong {
  display: block;
  color: #10213d;
  font-size: 14px;
  font-weight: 650;
}

.intro-proof span {
  display: block;
  margin-top: 5px;
  color: #75839a;
  font-size: 10px;
  line-height: 1.35;
}

.capability-rail {
  display: grid;
  gap: 14px;
}

.capability-row {
  position: relative;
  display: grid;
  grid-template-columns: 68px 1fr;
  gap: 26px;
  align-items: start;
  min-height: 132px;
  padding: 24px;
  border: 1px solid #dce7f7;
  border-radius: 21px;
  background: linear-gradient(145deg,#fff,#f5f9ff);
  box-shadow: 0 14px 34px rgba(20,38,77,.055);
  transition: transform .35s cubic-bezier(.22,1,.36,1),border-color .3s ease,box-shadow .3s ease;
}

.capability-row:hover {
  border-color: #9fc3ff;
  box-shadow: 0 20px 46px rgba(37,99,235,.1);
  transform: translateY(-4px);
}

.row-icon {
  position: relative;
  display: grid;
  width: 54px;
  height: 54px;
  margin: 0;
  place-items: center;
  border: 1px solid #c9dcfb;
  border-radius: 16px;
  color: #2563eb;
  background: #eaf2ff;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.8);
  transition: color .3s ease,background .3s ease,transform .35s cubic-bezier(.22,1,.36,1);
}

.row-icon::before {
  content: none;
}

.row-icon::after {
  content: none;
}

.row-icon svg { width: 22px; height: 22px; stroke-width: 1.65; }

.capability-row:nth-child(2) .row-icon,
.capability-row:nth-child(5) .row-icon {
  color: #0369a1;
  border-color: #bae6fd;
  background: #e0f2fe;
}

.capability-row:nth-child(3) .row-icon {
  color: #4338ca;
  border-color: #c7d2fe;
  background: #eef2ff;
}

.capability-row:hover .row-icon {
  transform: rotate(-4deg) scale(1.05);
}

.row-copy h3 {
  margin: 2px 0 10px;
  color: #10213d;
  font-size: clamp(22px,2vw,29px);
  font-weight: 650;
  line-height: 1.15;
  letter-spacing: -.03em;
}

.row-copy p {
  max-width: 590px;
  margin: 0;
  color: #66758d;
  font-size: 14px;
  line-height: 1.65;
}

.row-line {
  display: none;
}

.row-copy { min-width: 0; }

@media(max-width:1100px) {
  .why { padding: 120px 0; }
  .why-shell { grid-template-columns: 1fr; gap: 80px; max-width: 900px; }
  .why-intro { position: static; }
  .why-intro h2 { max-width: 780px; }
  .intro-proof { max-width: 620px; }
}

@media(max-width:640px) {
  .why { padding: 90px 0; }
  .why-shell { width: calc(100% - 32px); gap: 58px; }
  .why-intro h2 { font-size: 44px; }
  .intro-proof { grid-template-columns: 1fr; }
  .capability-row { grid-template-columns: 48px minmax(0,1fr); gap: 15px; min-height: 0; padding: 18px; }
  .row-icon { width: 46px; height: 46px; }
  .row-copy h3 { font-size: 20px; }
  .row-copy p { font-size: 13px; }
}

@media(prefers-reduced-motion:reduce) {
  .capability-row,.row-icon,.row-line,.waitlist-cta,.waitlist-cta svg { transition: none; }
}
</style>
