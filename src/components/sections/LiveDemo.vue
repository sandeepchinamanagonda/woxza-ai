<template>
  <section id="demo" class="demo-section">
    <div class="demo-shell">
      <div class="demo-intro">
        <span class="eyebrow"><PhoneCall :size="14" /> LIVE CALL DEMO</span>
        <h2>See how every call can feel effortless.</h2>
        <p>Choose a scenario and Woxza will call your phone with a two-minute live demo.</p>
        <div class="trust-row">
          <span><ShieldCheck :size="16" /> Your number stays private</span>
          <span><Clock3 :size="16" /> Under 2 minutes</span>
        </div>
      </div>

      <div class="phone-stage" :class="{ 'is-busy': busy }">
        <div class="dynamic-island"><i></i><b></b></div>
        <div class="phone-topbar"><span>9:41</span><span class="phone-status"><Signal :size="14" /><Wifi :size="14" /><BatteryFull :size="17" /></span></div>

        <div v-if="busy || isTerminal" class="call-screen" aria-live="polite">
          <button class="back-to-form" type="button" :disabled="busy" @click="resetCall"><ChevronLeft :size="19" /> Back</button>
          <div class="caller-avatar" :class="status"><span>W</span><i></i></div>
          <p class="calling-label">{{ status === 'connected' ? 'Woxza voice agent' : 'Woxza' }}</p>
          <h3>{{ callTitle }}</h3>
          <p class="call-status"><span :class="status"></span>{{ statusCopy }}</p>
          <VoiceRibbon :state="ribbonState" />
          <div class="call-actions">
            <button type="button" aria-label="Mute"><Mic :size="22" /></button>
            <button type="button" aria-label="Speaker"><Volume2 :size="22" /></button>
            <button class="hangup" type="button" :disabled="busy" aria-label="Return to demo details" @click="resetCall"><PhoneOff :size="24" /></button>
          </div>
          <p v-if="isTerminal" class="terminal-note">{{ terminalNote }}</p>
        </div>

        <form v-else class="call-form" @submit.prevent="submitDemo">
          <div class="form-heading">
            <div class="form-icon"><PhoneCall :size="21" /></div>
            <div><span>Try Woxza live</span><small>We’ll call you in seconds</small></div>
          </div>
          <label><span>Your name</span><input v-model.trim="form.name" autocomplete="name" maxlength="160" required placeholder="Name" /></label>
          <label><span>Phone number</span><div class="phone-input"><span class="country-code">{{ activeCountry.flag }} {{ activeCountry.code }}</span><input v-model.trim="form.phone" autocomplete="tel-national" inputmode="tel" required placeholder="312 555 0100" /></div></label>
          <div class="split-fields">
            <label><span>Language</span><select v-model="form.language"><option v-for="language in availableLanguages" :key="language.value" :value="language.value">{{ language.label }}</option></select></label>
            <label><span>Call type</span><select v-model="form.useCase"><option v-for="useCase in useCases" :key="useCase.value" :value="useCase.value">{{ useCase.label }}</option></select></label>
          </div>
          <label class="consent"><input v-model="form.consent" type="checkbox" required /><span>I agree to receive this demo call from Woxza.</span></label>
          <label class="honeypot" aria-hidden="true"><span>Website</span><input v-model="form.website" name="website" tabindex="-1" autocomplete="off" /></label>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <button class="start-call" type="submit"><PhoneCall :size="18" /> Call me now</button>
          <small>Carrier rates may apply. Up to 3 calls per number every 24 hours.</small>
          <button v-if="limitReached" class="waitlist-link" type="button" @click="$emit('join-waitlist')">Join the waitlist instead</button>
        </form>
        <div class="home-indicator"></div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue"
import { BatteryFull, ChevronLeft, Clock3, Mic, PhoneCall, PhoneOff, ShieldCheck, Signal, Volume2, Wifi } from "lucide-vue-next"
import VoiceRibbon from "@/components/VoiceRibbon.vue"

defineEmits(["join-waitlist"])
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const countries = [{ id:"US", flag:"🇺🇸", code:"+1" }, { id:"IN", flag:"🇮🇳", code:"+91" }]
const useCases = [
  { value:"order_taking", label:"Order taking" }, { value:"customer_support", label:"Customer support" },
  { value:"lead_qualification", label:"Lead qualification" }, { value:"appointment_booking", label:"Booking" },
  { value:"event_rsvp", label:"Event RSVP" }, { value:"feedback_survey", label:"Feedback" }, { value:"recruiting_screening", label:"Recruiting" }
]
const regionalLanguages = {
  US:[{ value:"en", label:"English" }, { value:"es", label:"Spanish" }],
  IN:[{ value:"as", label:"Assamese" }, { value:"bn", label:"Bengali" }, { value:"en", label:"English" }, { value:"gu", label:"Gujarati" }, { value:"hi", label:"Hindi" }, { value:"kn", label:"Kannada" }, { value:"ml", label:"Malayalam" }, { value:"mr", label:"Marathi" }, { value:"pa", label:"Punjabi" }, { value:"ta", label:"Tamil" }, { value:"te", label:"Telugu" }, { value:"ur", label:"Urdu" }]
}
const inferredRegion = /^en-US|es-US|America\//.test(`${navigator.language} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`) ? "US" : "IN"
const form = reactive({ useCase:"order_taking", language:regionalLanguages[inferredRegion][0].value, name:"", countryCode:countries.find(country => country.id === inferredRegion).code, phone:"", consent:false, website:"" })
const status = ref("idle")
const error = ref("")
const limitReached = ref(false)
let pollTimer
const busy = computed(() => ["pending", "ringing", "connected"].includes(status.value))
const isTerminal = computed(() => ["completed", "no_answer", "failed"].includes(status.value))
const activeCountry = computed(() => countries.find(country => country.code === form.countryCode) || countries[0])
const availableLanguages = computed(() => regionalLanguages[activeCountry.value.id])
const ribbonState = computed(() => status.value === "connected" ? "connected" : busy.value ? "calling" : "idle")
const statusCopy = computed(() => ({ pending:"Starting your call…", ringing:"Your phone is ringing…", connected:"Live now", completed:"Call complete", no_answer:"No answer", failed:"Couldn’t connect" }[status.value] || "Ready"))
const callTitle = computed(() => status.value === "connected" ? "Connected" : status.value === "completed" ? "Thanks for trying Woxza" : status.value === "no_answer" ? "We missed you" : status.value === "failed" ? "Call unavailable" : "Calling…")
const terminalNote = computed(() => status.value === "no_answer" ? "Check your phone and try again when you’re ready." : status.value === "failed" ? "Please try again in a moment." : "Your live demo is complete.")

function resetCall() { window.clearTimeout(pollTimer); status.value = "idle"; error.value = ""; limitReached.value = false }
async function poll(callId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/demo-call/${callId}/status`)
    if (!response.ok) throw new Error("Could not check call status")
    const body = await response.json()
    status.value = body.status
    if (!isTerminal.value) pollTimer = window.setTimeout(() => poll(callId), 2000)
  } catch { if (!isTerminal.value) pollTimer = window.setTimeout(() => poll(callId), 4000) }
}
async function submitDemo() {
  if (form.website) return
  error.value = ""; limitReached.value = false; status.value = "pending"
  try {
    const response = await fetch(`${apiBaseUrl}/api/demo/call`, { method:"POST", headers:{ "content-type":"application/json" }, body:JSON.stringify({ use_case:form.useCase, language:form.language, name:form.name, country_code:form.countryCode, phone_number:form.phone, consent:form.consent, website:form.website }) })
    const body = await response.json().catch(() => ({}))
    if (response.status === 429) limitReached.value = true
    if (!response.ok) throw new Error(body.error || "We could not start the demo call")
    status.value = "ringing"; poll(body.callId)
  } catch (caught) { status.value = "failed"; error.value = caught.message }
}
onBeforeUnmount(() => window.clearTimeout(pollTimer))
</script>

<style scoped>
.demo-section { padding:clamp(76px,10vw,140px) 24px; background:linear-gradient(145deg,#f5f7fb 0%,#e8edf7 100%); overflow:hidden; }
.demo-shell { width:min(1120px,100%); margin:auto; display:grid; grid-template-columns:minmax(0,1fr) 400px; align-items:center; gap:clamp(48px,8vw,120px); }
.eyebrow { display:inline-flex; align-items:center; gap:8px; color:#49617f; font-size:11px; font-weight:800; letter-spacing:.16em; }
h2 { max-width:620px; margin:17px 0; color:#12213d; font-size:clamp(42px,5.2vw,70px); line-height:.98; letter-spacing:-.065em; }
.demo-intro>p { max-width:500px; margin:0; color:#66738a; font-size:18px; line-height:1.65; }
.trust-row { display:flex; flex-wrap:wrap; gap:14px 22px; margin-top:28px; color:#526078; font-size:13px; font-weight:700; }
.trust-row span { display:inline-flex; align-items:center; gap:7px; }
.trust-row svg { color:#3282f6; }
.phone-stage { position:relative; min-height:740px; padding:13px 14px 23px; border:7px solid #111726; border-radius:54px; background:linear-gradient(180deg,#f7faff,#e9effa); box-shadow:0 40px 80px rgba(37,55,88,.24),inset 0 0 0 1px #566174; overflow:hidden; }
.phone-stage::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 80% 10%,rgba(105,167,255,.25),transparent 28%),radial-gradient(circle at 15% 75%,rgba(135,107,255,.18),transparent 35%); pointer-events:none; }
.dynamic-island { position:relative; z-index:2; width:110px; height:30px; margin:-3px auto 0; display:flex; align-items:center; justify-content:flex-end; gap:8px; padding-right:11px; border-radius:20px; background:#111725; }
.dynamic-island i { width:9px; height:9px; border-radius:50%; background:#252f48; }.dynamic-island b { width:46px; height:7px; border-radius:5px; background:#1d2639; }
.phone-topbar { position:relative; z-index:1; display:flex; justify-content:space-between; margin:-22px 17px 0; color:#172038; font-size:12px; font-weight:800; }.phone-status { display:flex; align-items:center; gap:4px; }
.call-form,.call-screen { position:relative; z-index:1; }.call-form { display:grid; gap:15px; padding:95px 13px 25px; }.form-heading { display:flex; align-items:center; gap:12px; margin-bottom:8px; color:#172541; font-size:17px; font-weight:800; }.form-heading small { display:block; margin-top:3px; color:#79869b; font-size:12px; font-weight:600; }.form-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:14px; color:#fff; background:#287bf3; box-shadow:0 8px 18px rgba(40,123,243,.28); }
label { display:grid; gap:7px; color:#526078; font-size:11px; font-weight:800; letter-spacing:.02em; } input,select { width:100%; min-height:48px; border:1px solid rgba(94,113,144,.22); border-radius:13px; background:rgba(255,255,255,.76); color:#192540; font:inherit; font-size:14px; font-weight:650; outline:none; } input { padding:0 13px; } select { padding:0 10px; -webkit-appearance:auto; } input:focus,select:focus { border-color:#3282f6; box-shadow:0 0 0 4px rgba(50,130,246,.14); background:#fff; }
.phone-input { display:grid; grid-template-columns:96px 1fr; gap:7px; }.country-code { min-height:48px; display:flex; align-items:center; padding:0 9px; border:1px solid rgba(94,113,144,.18); border-radius:13px; background:rgba(255,255,255,.54); color:#263757; font-size:12px; letter-spacing:0; }.split-fields { display:grid; grid-template-columns:1fr 1fr; gap:10px; }.consent { grid-template-columns:18px 1fr; align-items:start; gap:9px; margin:2px 1px 0; font-size:11px; font-weight:650; letter-spacing:0; line-height:1.4; }.consent input { width:18px; min-height:18px; margin:0; accent-color:#287bf3; }.honeypot { position:absolute!important; left:-10000px!important; }.start-call { min-height:53px; display:flex; align-items:center; justify-content:center; gap:8px; margin-top:4px; border:0; border-radius:17px; color:white; background:#1f7af5; box-shadow:0 12px 22px rgba(31,122,245,.26); font:inherit; font-size:14px; font-weight:800; cursor:pointer; }.start-call:hover { background:#116be6; }.call-form small { color:#8590a2; font-size:10px; text-align:center; line-height:1.4; }.form-error { margin:0; color:#b42318; font-size:12px; line-height:1.4; }.waitlist-link { border:0; color:#196ede; background:transparent; font:inherit; font-size:12px; font-weight:800; cursor:pointer; }
.call-screen { min-height:655px; padding:58px 22px 26px; display:flex; flex-direction:column; align-items:center; text-align:center; }.back-to-form { position:absolute; top:17px; left:14px; display:flex; align-items:center; gap:1px; border:0; color:#276ed2; background:transparent; font:inherit; font-size:13px; cursor:pointer; }.back-to-form:disabled { opacity:0; }.caller-avatar { position:relative; width:116px; height:116px; display:grid; place-items:center; margin-top:18px; border-radius:50%; color:white; background:linear-gradient(145deg,#275cad,#77a6fa); box-shadow:0 16px 38px rgba(38,91,180,.24); font-size:50px; font-weight:750; }.caller-avatar i { position:absolute; right:5px; bottom:6px; width:19px; height:19px; border:3px solid #f0f4fb; border-radius:50%; background:#32c263; }.caller-avatar.failed i,.caller-avatar.no_answer i { background:#f3a31d; }.calling-label { margin:22px 0 4px; color:#586782; font-size:13px; font-weight:700; }.call-screen h3 { margin:0; color:#13203a; font-size:25px; letter-spacing:-.03em; }.call-status { display:flex; align-items:center; gap:7px; margin:10px 0 0; color:#68758b; font-size:13px; font-weight:650; }.call-status span { width:7px; height:7px; border-radius:50%; background:#f0a329; }.call-status span.connected { background:#2bbb5d; animation:pulse 1.2s infinite; }.call-status span.completed { background:#2bbb5d; }.call-status span.failed { background:#df4e4e; }.voice-ribbon { width:calc(100% + 28px); margin:35px -14px auto; }.call-actions { display:flex; justify-content:center; gap:22px; margin-top:auto; }.call-actions button { width:56px; height:56px; display:grid; place-items:center; border:0; border-radius:50%; color:#172039; background:rgba(255,255,255,.75); box-shadow:0 8px 20px rgba(47,61,84,.1); }.call-actions .hangup { color:white; background:#f34a4a; transform:rotate(135deg); }.call-actions .hangup:disabled { opacity:.65; }.terminal-note { margin:21px 0 -2px; color:#637189; font-size:12px; line-height:1.5; }.home-indicator { position:absolute; z-index:2; bottom:8px; left:50%; width:118px; height:4px; border-radius:4px; background:#172039; transform:translateX(-50%); }
@keyframes pulse { 50% { box-shadow:0 0 0 6px rgba(43,187,93,.18); } }
@media(max-width:850px) { .demo-section { padding:76px 18px; }.demo-shell { grid-template-columns:1fr; max-width:440px; gap:40px; }.demo-intro { text-align:center; }.demo-intro>p { margin-inline:auto; }.trust-row { justify-content:center; }.phone-stage { min-height:710px; } }
@media(max-width:390px) { .phone-stage { border-radius:44px; padding-inline:10px; }.call-form { padding-inline:9px; }.split-fields { grid-template-columns:1fr; }.phone-stage { min-height:765px; } }
</style>
