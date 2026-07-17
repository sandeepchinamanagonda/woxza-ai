<template>
  <section id="solutions" class="solutions">
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="ambient ambient-left" aria-hidden="true"></div>
    <div class="ambient ambient-right" aria-hidden="true"></div>

    <div class="container-custom">
      <header class="heading">
        <h2>AI built for <em>every</em> industry</h2>
        <p>
          Woxza adapts to the way your industry works and automates workflows,
          enhancing customer experiences and driving real business impact
        </p>
      </header>

      <div
        class="carousel"
        :data-active-index="active"
        tabindex="0"
        aria-label="Industry solutions carousel"
        @keydown.left.prevent="previous"
        @keydown.right.prevent="next"
        @pointerdown="onPointerDown"
        @pointerup="onPointerUp"
      >
        <div class="carousel-stage">
          <article
            v-for="(item, index) in industries"
            :key="item.title"
            class="industry-card"
            :class="{ active: index === active }"
            :style="cardStyle(index)"
            :aria-hidden="index !== active"
            @click="goTo(index)"
          >
            <div class="card-topline">
              <span class="industry-icon"><component :is="item.icon" /></span>
              <span class="card-count">{{ String(index + 1).padStart(2, '0') }}</span>
            </div>

            <div class="card-copy">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
            </div>

            <ul>
              <li v-for="feature in item.features" :key="feature.label">
                <span aria-hidden="true"><component :is="feature.icon" /></span>{{ feature.label }}
              </li>
            </ul>

            <footer>
              <span>{{ item.tag }}</span>
            </footer>
          </article>
        </div>
      </div>

      <div class="carousel-controls">
        <button type="button" class="step-button" aria-label="Previous industry" @click="previous">
          <ArrowLeft /><span>Previous</span>
        </button>

        <div class="progress" aria-label="Choose an industry">
          <button
            v-for="(item, index) in industries"
            :key="`${item.title}-progress`"
            type="button"
            :class="{ active: index === active }"
            :style="{ '--dot-accent': item.accent, '--dot-rgb': item.rgb }"
            :aria-label="`Show ${item.title}`"
            :aria-current="index === active ? 'true' : undefined"
            @click="goTo(index)"
          ><span>{{ item.title }}</span></button>
        </div>

        <button type="button" class="step-button" aria-label="Next industry" @click="next">
          <span>Next</span><ArrowRight />
        </button>
      </div>

      <p class="trust-note"><Building2 /> Trusted by businesses across 20+ industries worldwide</p>

      <div class="value-strip" aria-label="Woxza platform benefits">
        <div v-for="benefit in benefits" :key="benefit.title" class="value-item">
          <span class="value-icon"><component :is="benefit.icon" /></span>
          <span><strong>{{ benefit.title }}</strong><small>{{ benefit.detail }}</small></span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue"
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BellRing,
  Bot,
  Boxes,
  Briefcase,
  Building2,
  CalendarCheck,
  Compass,
  FileText,
  Files,
  Factory,
  GraduationCap,
  Handshake,
  HeartPulse,
  Headphones,
  Landmark,
  Languages,
  MapPinned,
  MessageCircleQuestion,
  MessagesSquare,
  PackageSearch,
  Plane,
  RefreshCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  Workflow,
  Wrench
} from "lucide-vue-next"

const active = ref(1)
const pointerStart = ref(0)
const rotationDelay = 3800
let rotationTimer

const benefits = [
  { title: "Purpose-built AI", detail: "Tailored to industry needs", icon: Bot },
  { title: "Proven impact", detail: "Measurable business results", icon: TrendingUp },
  { title: "Enterprise ready", detail: "Secure, reliable and scalable", icon: ShieldCheck }
]

const industries = [
  {
    title: "Healthcare",
    description: "Never miss a patient call",
    features: [
      { label: "Appointment scheduling", icon: CalendarCheck },
      { label: "Patient FAQs and triage", icon: Stethoscope },
      { label: "Prescription and report updates", icon: FileText },
      { label: "Multilingual patient support", icon: Languages }
    ],
    icon: HeartPulse,
    tag: "Patient access",
    accent: "#48d6a8",
    rgb: "72, 214, 168"
  },
  {
    title: "Education",
    description: "Support every learner from enquiry to enrollment",
    features: [
      { label: "Admission enquiries", icon: MessageCircleQuestion },
      { label: "Course recommendations", icon: Compass },
      { label: "Interview scheduling", icon: CalendarCheck },
      { label: "Fee and application reminders", icon: BellRing }
    ],
    icon: GraduationCap,
    tag: "Student enrollment",
    accent: "#4f8cff",
    rgb: "79, 140, 255"
  },
  {
    title: "Professional Services",
    description: "Convert more enquiries into clients",
    features: [
      { label: "Lead qualification", icon: UserCheck },
      { label: "Consultation booking", icon: CalendarCheck },
      { label: "Client follow-ups", icon: MessagesSquare },
      { label: "Document collection", icon: Files }
    ],
    icon: Briefcase,
    tag: "Client engagement",
    accent: "#9b6cff",
    rgb: "155, 108, 255"
  },
  {
    title: "Enterprise",
    description: "Automate conversations across every department",
    features: [
      { label: "IT helpdesk", icon: Headphones },
      { label: "HR employee support", icon: Users },
      { label: "Internal workflows", icon: Workflow },
      { label: "Customer service automation", icon: Bot }
    ],
    icon: Building2,
    tag: "Business operations",
    accent: "#22d3ee",
    rgb: "34, 211, 238"
  },
  {
    title: "Retail",
    description: "Turn every shopper into a returning customer",
    features: [
      { label: "Product enquiries", icon: Search },
      { label: "Order tracking", icon: PackageSearch },
      { label: "Returns and exchanges", icon: RefreshCcw },
      { label: "Personalized recommendations", icon: Sparkles }
    ],
    icon: ShoppingBag,
    tag: "Customer support",
    accent: "#ef7bce",
    rgb: "239, 123, 206"
  },
  {
    title: "Manufacturing",
    description: "Keep operations moving without missed calls",
    features: [
      { label: "Supplier coordination", icon: Handshake },
      { label: "Inventory enquiries", icon: Boxes },
      { label: "Service requests", icon: Wrench },
      { label: "Dispatch and order updates", icon: Truck }
    ],
    icon: Factory,
    tag: "Operations support",
    accent: "#f59a5c",
    rgb: "245, 154, 92"
  },
  {
    title: "Travel",
    description: "Deliver seamless journeys from booking to arrival",
    features: [
      { label: "Booking assistance", icon: CalendarCheck },
      { label: "Cancellations and changes", icon: RefreshCcw },
      { label: "Itinerary updates", icon: MapPinned },
      { label: "Travel support", icon: Headphones }
    ],
    icon: Plane,
    tag: "Booking and support",
    accent: "#2dd4bf",
    rgb: "45, 212, 191"
  },
  {
    title: "Finance",
    description: "Deliver secure banking conversations 24/7",
    features: [
      { label: "Account enquiries", icon: MessageCircleQuestion },
      { label: "Loan pre-qualification", icon: BadgeCheck },
      { label: "Appointment booking", icon: CalendarCheck },
      { label: "Payment reminders", icon: BellRing }
    ],
    icon: Landmark,
    tag: "Customer banking",
    accent: "#f6c453",
    rgb: "246, 196, 83"
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
  const x = offset * 390

  return {
    "--industry-accent": industries[index].accent,
    "--industry-rgb": industries[index].rgb,
    transform: `translate3d(${x}px, ${distance * 20}px, ${-distance * 170}px) rotateY(${-offset * 5}deg) scale(${Math.max(.76, 1 - distance * .1)})`,
    opacity: distance > 2 ? 0 : Math.max(.18, 1 - distance * .34),
    zIndex: 20 - distance,
    visibility: distance > 2 ? "hidden" : "visible",
    pointerEvents: distance > 1 ? "none" : "auto"
  }
}

function advance() {
  active.value = (active.value + 1) % industries.length
}

function restartRotation() {
  window.clearInterval(rotationTimer)
  rotationTimer = window.setInterval(advance, rotationDelay)
}

function next() {
  advance()
  restartRotation()
}

function previous() {
  active.value = (active.value - 1 + industries.length) % industries.length
  restartRotation()
}

function goTo(index) {
  active.value = index
  restartRotation()
}

function onPointerDown(event) {
  pointerStart.value = event.clientX
}

function onPointerUp(event) {
  const distance = event.clientX - pointerStart.value
  if (Math.abs(distance) < 45) return
  distance > 0 ? previous() : next()
}

onMounted(restartRotation)
onBeforeUnmount(() => window.clearInterval(rotationTimer))
</script>

<style scoped>
.solutions {
  position: relative;
  min-height: 100vh;
  padding: 108px 0 64px;
  overflow: hidden;
  color: #fff;
  background:
    radial-gradient(circle at 50% 46%, rgba(37, 99, 235, .12), transparent 30%),
    linear-gradient(180deg, #071225 0%, #09162b 58%, #071225 100%);
  isolation: isolate;
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, .045) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, .045) 1px, transparent 1px);
  background-size: 54px 54px;
  mask-image: linear-gradient(to bottom, transparent, #000 16%, #000 88%, transparent);
}

.ambient { position: absolute; width: 520px; height: 520px; border-radius: 50%; filter: blur(120px); opacity: .16; pointer-events: none; }
.ambient-left { left: -300px; top: 24%; background: #2563eb; }
.ambient-right { right: -300px; bottom: 4%; background: #60a5fa; }
.container-custom { position: relative; z-index: 2; }

.heading { max-width: 760px; margin: 0 auto 24px; text-align: center; }
.heading h2 { margin: 0; color: #f8fafc; font-size: clamp(44px, 4.5vw, 64px); line-height: .97; letter-spacing: -.055em; }
.heading h2 em { color: #4f8cff; font-style: normal; }
.heading p { max-width: 650px; margin: 16px auto 0; color: #aebbd0; font-size: 15px; line-height: 1.6; }

.value-strip { display: grid; grid-template-columns: repeat(3, 1fr); max-width: 850px; margin: 18px auto 0; }
.value-item { display: flex; align-items: center; justify-content: center; gap: 12px; min-width: 0; padding: 8px 22px; border-right: 1px solid rgba(148, 163, 184, .12); }
.value-item:last-child { border-right: 0; }
.value-icon { width: 38px; height: 38px; display: grid; flex: 0 0 auto; place-items: center; border: 1px solid rgba(96, 165, 250, .14); border-radius: 50%; color: #82aaff; background: rgba(37, 99, 235, .08); }
.value-icon :deep(svg) { width: 18px; height: 18px; stroke-width: 1.8; }
.value-item > span:last-child { display: grid; gap: 3px; }
.value-item strong { color: #eef4ff; font-size: 12px; }
.value-item small { color: #77869d; font-size: 10px; }

.carousel { position: relative; width: 100%; max-width: 100%; height: 450px; overflow: hidden; contain: layout paint; outline: none; touch-action: pan-y; user-select: none; }
.carousel:focus-visible { border-radius: 32px; box-shadow: 0 0 0 2px rgba(96, 165, 250, .45); }
.carousel-stage { position: absolute; inset: 0; width: 100%; max-width: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; perspective: 2200px; transform-style: preserve-3d; }

.industry-card {
  position: absolute;
  width: min(410px, calc(100vw - 42px));
  min-height: 420px;
  display: flex;
  flex-direction: column;
  padding: 22px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, .12);
  border-radius: 25px;
  color: #fff;
  background: linear-gradient(155deg, rgba(21, 38, 66, .98), rgba(10, 25, 48, .98));
  box-shadow: 0 26px 65px rgba(0, 0, 0, .3);
  cursor: pointer;
  backface-visibility: hidden;
  transition: transform .72s cubic-bezier(.22, 1, .36, 1), opacity .5s ease, border-color .35s, box-shadow .35s;
}

.industry-card::before { content: ""; position: absolute; inset: 0 0 auto; height: 1px; background: linear-gradient(90deg, transparent, rgba(var(--industry-rgb), .92), transparent); opacity: 0; }
.industry-card::after { content: ""; position: absolute; width: 180px; height: 180px; right: -80px; top: -90px; border-radius: 50%; background: rgba(var(--industry-rgb), .12); filter: blur(8px); }
.industry-card.active { border-color: rgba(var(--industry-rgb), .82); box-shadow: 0 34px 80px rgba(0, 0, 0, .42), 0 0 0 1px rgba(var(--industry-rgb), .14), 0 0 55px rgba(var(--industry-rgb), .13); }
.industry-card.active::before { opacity: 1; }

.card-topline { position: relative; z-index: 1; display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.industry-icon { width: 50px; height: 50px; display: grid; place-items: center; border: 1px solid rgba(var(--industry-rgb), .22); border-radius: 15px; color: var(--industry-accent); background: linear-gradient(145deg, rgba(var(--industry-rgb), .2), rgba(var(--industry-rgb), .06)); box-shadow: inset 0 1px 0 rgba(255, 255, 255, .06); }
.industry-icon :deep(svg) { width: 27px; height: 27px; stroke-width: 1.7; }
.card-count { color: rgba(var(--industry-rgb), .58); font-size: 10px; font-weight: 800; letter-spacing: .16em; }
.card-copy { position: relative; z-index: 1; min-height: 82px; }
.card-copy h3 { max-width: 300px; margin: 0 0 8px; color: #fff; font-size: 25px; line-height: 1.05; letter-spacing: -.035em; }
.card-copy p { margin: 0; color: #bac5d7; font-size: 14px; line-height: 1.55; }

.industry-card ul { position: relative; z-index: 1; display: grid; gap: 7px; margin: 12px 0 18px; padding: 12px 0; list-style: none; border-top: 1px solid rgba(148, 163, 184, .11); border-bottom: 1px solid rgba(148, 163, 184, .11); }
.industry-card li { display: flex; align-items: center; gap: 9px; color: #d8e0ec; font-size: 12px; line-height: 1.35; }
.industry-card li span { width: 18px; height: 18px; display: grid; flex: 0 0 auto; place-items: center; border-radius: 50%; color: #fff; background: var(--industry-accent); font-size: 9px; box-shadow: 0 0 0 4px rgba(var(--industry-rgb), .09); }
.industry-card li span :deep(svg) { width: 10px; height: 10px; stroke-width: 2.25; }

.industry-card footer { position: relative; z-index: 1; display: flex; align-items: center; justify-content: flex-start; margin-top: auto; }
.industry-card footer span { padding: 7px 10px; border: 1px solid rgba(var(--industry-rgb), .2); border-radius: 999px; color: var(--industry-accent); background: rgba(var(--industry-rgb), .1); font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }

.carousel-controls { width: min(820px, 100%); display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 18px; margin: 2px auto 0; }
.step-button { height: 38px; display: inline-flex; align-items: center; gap: 8px; padding: 0 13px; border: 1px solid rgba(148, 163, 184, .14); border-radius: 999px; color: #9cabc0; background: rgba(255, 255, 255, .035); font: inherit; font-size: 10px; font-weight: 750; cursor: pointer; }
.step-button :deep(svg) { width: 14px; height: 14px; }
.step-button:hover { color: #fff; border-color: rgba(96, 165, 250, .42); background: rgba(37, 99, 235, .12); }
.progress { display: flex; align-items: center; justify-content: center; gap: 7px; }
.progress button { position: relative; width: 7px; height: 7px; padding: 0; overflow: visible; border: 0; border-radius: 999px; background: rgba(148, 163, 184, .3); cursor: pointer; }
.progress button.active { width: 34px; background: var(--dot-accent); box-shadow: 0 0 18px rgba(var(--dot-rgb), .34); }
.progress button span { position: absolute; left: 50%; bottom: 17px; padding: 5px 8px; border: 1px solid rgba(148, 163, 184, .14); border-radius: 7px; color: #dbeafe; background: #0c1b32; font-size: 9px; white-space: nowrap; opacity: 0; pointer-events: none; transform: translate(-50%, 4px); transition: .2s; }
.progress button:hover span, .progress button:focus-visible span { opacity: 1; transform: translate(-50%, 0); }
.trust-note { display: flex; align-items: center; justify-content: center; gap: 10px; margin: 18px 0 0; color: #8291a8; font-size: 11px; }
.trust-note :deep(svg) { width: 17px; height: 17px; color: #5f94ff; }

@media (max-height: 840px) and (min-width: 769px) {
  .solutions { padding: 76px 0 48px; }
  .heading { margin-bottom: 24px; }
  .heading h2 { font-size: clamp(42px, 4.6vw, 60px); }
  .heading p { margin-top: 14px; font-size: 14px; }
  .value-strip { margin-top: 16px; }
  .carousel { height: 420px; }
  .industry-card { width: 380px; min-height: 390px; padding: 20px; }
  .card-topline { margin-bottom: 16px; }
  .industry-icon { width: 48px; height: 48px; }
  .card-copy { min-height: 87px; }
  .card-copy h3 { font-size: 24px; }
  .industry-card ul { gap: 7px; margin: 12px 0 18px; padding: 12px 0; }
  .industry-card li { font-size: 11px; }
}

@media (max-width: 900px) {
  .solutions { padding: 100px 0 76px; }
  .heading h2 { font-size: 46px; }
  .value-strip { grid-template-columns: 1fr; max-width: 420px; }
  .value-item { justify-content: flex-start; border-right: 0; border-bottom: 1px solid rgba(148, 163, 184, .1); }
  .value-item:last-child { border-bottom: 0; }
  .carousel { height: 510px; }
  .carousel-controls { grid-template-columns: auto 1fr auto; gap: 10px; }
  .step-button span { display: none; }
}

@media (max-width: 560px) {
  .solutions { padding-top: 88px; }
  .solutions .ambient { display: none; }
  .solutions .container-custom { width: calc(100% - 24px); max-width: 100%; }
  .heading { margin-bottom: 28px; }
  .heading h2 { font-size: 39px; }
  .heading p { font-size: 14px; }
  .value-strip { display: none; }
  .carousel { width: 100%; max-width: 100%; height: 500px; overflow: hidden; contain: strict; }
  .carousel-stage { width: 100%; max-width: 100%; overflow: hidden; perspective: none; transform-style: flat; }
  .industry-card { width: calc(100% - 8px); max-width: 420px; min-width: 0; min-height: 455px; padding: 22px; }
  .industry-card::after { width: 100px; height: 100px; right: 0; top: -40px; }
  .industry-card > * { min-width: 0; }
  .industry-card.active { transform: translate3d(0, 0, 0) scale(1) !important; }
  .industry-card:not(.active) { display: none; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; transform: none !important; }
  .carousel-controls { width: calc(100% - 10px); }
  .step-button { width: 38px; justify-content: center; padding: 0; }
  .progress { gap: 5px; }
  .progress button.active { width: 24px; }
  .trust-note { text-align: center; }
}

@media (prefers-reduced-motion: reduce) {
  .industry-card { transition-duration: .01ms; }
}
</style>
