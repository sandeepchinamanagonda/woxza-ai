<template>
  <section id="demo" class="demo-section landing-section">
    <div class="demo-shell">
      <div class="demo-intro">
        <span class="eyebrow"><PhoneCall :size="14" /> LIVE CALL DEMO</span>
        <h2 class="display-heading">See how every call can feel effortless.</h2>
        <p>Choose a scenario and Woxza will call your phone with a two-minute live demo.</p>
        <div class="trust-row">
          <span><ShieldCheck :size="16" /> Your number stays private</span>
          <span><Clock3 :size="16" /> Under 2 minutes</span>
        </div>
        <div class="demo-ready" aria-hidden="true">
          <VoiceRibbon state="idle" />
          <span><i></i>Ready when you are</span>
        </div>
      </div>

      <div class="phone-stage" :class="{ 'is-busy': busy }">
        <div class="dynamic-island"><i></i><b></b></div>
        <div class="phone-topbar"><span>9:41</span><span class="phone-status"><Signal :size="14" /><Wifi :size="14" /><BatteryFull :size="17" /></span></div>

        <div v-if="busy" class="call-screen" aria-live="polite">
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
          <label><span>Phone number</span><div class="phone-input"><select v-if="isLocalDemo" v-model="form.countryId" class="country-code" aria-label="Country code" @change="selectCountry"><option v-for="country in countries" :key="country.id" :value="country.id">{{ country.flag }} {{ country.code }}</option></select><span v-else class="country-code country-locked">{{ activeCountry.flag }} {{ activeCountry.code }}</span><input v-model.trim="form.phone" autocomplete="tel-national" inputmode="tel" required placeholder="312 555 0100" /></div></label>
          <div class="split-fields">
            <div class="form-field"><span>Language</span><div class="custom-select" @focusout="closeLanguageOnBlur" @keydown.esc="openLanguage = false"><button class="select-trigger" type="button" aria-haspopup="listbox" :aria-expanded="openLanguage" @click="openLanguage = !openLanguage"><span>{{ selectedLanguage.label }}</span><ChevronDown :class="{ rotated: openLanguage }" /></button><div v-if="openLanguage" class="select-menu language-menu" role="listbox" aria-label="Language"><button v-for="language in availableLanguages" :key="language.value" type="button" role="option" :aria-selected="form.language === language.value" :class="{ selected: form.language === language.value }" @click="selectLanguage(language.value)"><span>{{ language.label }}</span><Check v-if="form.language === language.value" /></button></div></div></div>
            <div class="form-field"><span>Call type</span><div class="custom-select" @focusout="closeUseCaseOnBlur" @keydown.esc="openUseCase = false"><button class="select-trigger" type="button" aria-haspopup="listbox" :aria-expanded="openUseCase" @click="openUseCase = !openUseCase"><span>{{ selectedUseCase.label }}</span><ChevronDown :class="{ rotated: openUseCase }" /></button><div v-if="openUseCase" class="select-menu" role="listbox" aria-label="Call type"><button v-for="useCase in useCases" :key="useCase.value" type="button" role="option" :aria-selected="form.useCase === useCase.value" :class="{ selected: form.useCase === useCase.value }" @click="selectUseCase(useCase.value)"><span>{{ useCase.label }}</span><Check v-if="form.useCase === useCase.value" /></button></div></div></div>
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
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue"
import { BatteryFull, Check, ChevronDown, ChevronLeft, Clock3, Mic, PhoneCall, PhoneOff, ShieldCheck, Signal, Volume2, Wifi } from "lucide-vue-next"
import VoiceRibbon from "@/components/VoiceRibbon.vue"

defineEmits(["join-waitlist"])
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const countries = [
  { id:"US", name:"United States", flag:"🇺🇸", code:"+1" }, { id:"CA", name:"Canada", flag:"🇨🇦", code:"+1" },
  { id:"IN", name:"India", flag:"🇮🇳", code:"+91" }, { id:"GB", name:"United Kingdom", flag:"🇬🇧", code:"+44" },
  { id:"AU", name:"Australia", flag:"🇦🇺", code:"+61" }, { id:"SG", name:"Singapore", flag:"🇸🇬", code:"+65" },
  { id:"AE", name:"United Arab Emirates", flag:"🇦🇪", code:"+971" }, { id:"DE", name:"Germany", flag:"🇩🇪", code:"+49" },
  { id:"FR", name:"France", flag:"🇫🇷", code:"+33" }, { id:"NL", name:"Netherlands", flag:"🇳🇱", code:"+31" },
  { id:"MX", name:"Mexico", flag:"🇲🇽", code:"+52" }, { id:"BR", name:"Brazil", flag:"🇧🇷", code:"+55" }
]
const useCases = [
  { value:"order_taking", label:"Order taking" }, { value:"customer_support", label:"Customer support" },
  { value:"lead_qualification", label:"Lead qualification" }, { value:"appointment_booking", label:"Booking" },
  { value:"event_rsvp", label:"Event RSVP" }, { value:"feedback_survey", label:"Feedback" }, { value:"recruiting_screening", label:"Recruiting" }
]
const regionalLanguages = {
  US:[{ value:"en", label:"English" }, { value:"es", label:"Spanish" }],
  IN:[{ value:"as", label:"Assamese" }, { value:"bn", label:"Bengali" }, { value:"en", label:"English" }, { value:"gu", label:"Gujarati" }, { value:"hi", label:"Hindi" }, { value:"kn", label:"Kannada" }, { value:"ml", label:"Malayalam" }, { value:"mr", label:"Marathi" }, { value:"pa", label:"Punjabi" }, { value:"ta", label:"Tamil" }, { value:"te", label:"Telugu" }, { value:"ur", label:"Urdu" }]
}
const isLocalDemo = import.meta.env.DEV
const inferredRegion = /^en-US|es-US|America\//.test(`${navigator.language} ${Intl.DateTimeFormat().resolvedOptions().timeZone}`) ? "US" : "IN"
const detectedRegion = ref(inferredRegion)
const form = reactive({ useCase:"order_taking", language:regionalLanguages[inferredRegion][0].value, name:"", countryId:inferredRegion, countryCode:countries.find(country => country.id === inferredRegion).code, phone:"", consent:false, website:"" })
const openUseCase = ref(false)
const openLanguage = ref(false)
const status = ref("idle")
const error = ref("")
const limitReached = ref(false)
let pollTimer
let returnTimer
const busy = computed(() => ["pending", "ringing", "connected"].includes(status.value))
const isTerminal = computed(() => ["completed", "no_answer", "failed"].includes(status.value))
const activeCountry = computed(() => countries.find(country => country.id === form.countryId) || countries[0])
const availableLanguages = computed(() => regionalLanguages[activeCountry.value.id] || regionalLanguages.US)
const selectedLanguage = computed(() => availableLanguages.value.find(language => language.value === form.language) || availableLanguages.value[0])
const selectedUseCase = computed(() => useCases.find(useCase => useCase.value === form.useCase) || useCases[0])
const selectCountry = () => {
  form.countryCode = activeCountry.value.code
  const languages = availableLanguages.value
  if (!languages.some(language => language.value === form.language)) form.language = languages[0].value
}
const selectLanguage = value => { form.language = value; openLanguage.value = false }
const selectUseCase = value => { form.useCase = value; openUseCase.value = false }
const closeLanguageOnBlur = event => { if (!event.currentTarget.contains(event.relatedTarget)) openLanguage.value = false }
const closeUseCaseOnBlur = event => { if (!event.currentTarget.contains(event.relatedTarget)) openUseCase.value = false }
const setDetectedRegion = region => {
  const country = countries.find(item => item.id === region) || countries.find(item => item.id === "US")
  detectedRegion.value = country.id
  form.countryId = country.id
  form.countryCode = country.code
  form.language = (regionalLanguages[country.id] || regionalLanguages.US)[0].value
}
const ribbonState = computed(() => status.value === "connected" ? "connected" : busy.value ? "calling" : "idle")
const statusCopy = computed(() => ({ pending:"Starting your call…", ringing:"Your phone is ringing…", connected:"Live now", completed:"Call complete", no_answer:"No answer", failed:"Couldn’t connect" }[status.value] || "Ready"))
const callTitle = computed(() => status.value === "connected" ? "Connected" : status.value === "completed" ? "Thanks for trying Woxza" : status.value === "no_answer" ? "We missed you" : status.value === "failed" ? "Call unavailable" : "Calling…")
const terminalNote = computed(() => status.value === "no_answer" ? "Check your phone and try again when you’re ready." : status.value === "failed" ? "Please try again in a moment." : "Your live demo is complete.")

function resetCall() { window.clearTimeout(pollTimer); window.clearTimeout(returnTimer); status.value = "idle"; error.value = ""; limitReached.value = false }
async function poll(callId) {
  try {
    const response = await fetch(`${apiBaseUrl}/api/demo-call/${callId}/status`)
    if (!response.ok) throw new Error("Could not check call status")
    const body = await response.json()
    status.value = body.status
    if (isTerminal.value) {
      returnTimer = window.setTimeout(resetCall, 700)
      return
    }
    pollTimer = window.setTimeout(() => poll(callId), 2000)
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
onBeforeUnmount(() => { window.clearTimeout(pollTimer); window.clearTimeout(returnTimer) })
onMounted(async () => {
  if (isLocalDemo) return
  try {
    const response = await fetch("https://ipapi.co/json/")
    const location = await response.json()
    setDetectedRegion(location.country_code === "IN" ? "IN" : "US")
  } catch { setDetectedRegion(inferredRegion) }
})
</script>

<style scoped>
.demo-section { padding-inline:24px; background:linear-gradient(145deg,#f5f7fb 0%,#e8edf7 100%); overflow:hidden; }
.demo-shell { width:min(1040px,100%); margin:auto; display:grid; grid-template-columns:minmax(0,1fr) 350px; align-items:center; gap:clamp(40px,6vw,80px); }
.eyebrow { display:inline-flex; align-items:center; gap:8px; color:#49617f; font-size:11px; font-weight:800; letter-spacing:.16em; }
h2 { max-width:540px; margin:17px 0; color:#12213d; font-size:clamp(40px,4.6vw,60px); line-height:.98; letter-spacing:-.065em; }
.demo-intro>p { max-width:460px; margin:0; color:#66738a; font-size:16px; line-height:1.65; }
.trust-row { display:flex; flex-wrap:wrap; gap:14px 22px; margin-top:28px; color:#526078; font-size:13px; font-weight:700; }
.trust-row span { display:inline-flex; align-items:center; gap:7px; }
.trust-row svg { color:#3282f6; }
.demo-ready { width:min(480px,100%); margin-top:26px; display:grid; gap:0; color:#526078; font-size:12px; font-weight:800; }
.demo-ready .voice-ribbon { height:82px; overflow:hidden; }
.demo-ready .voice-ribbon svg { transform:translateY(-38px) scaleY(1.3); transform-origin:center; }
.demo-ready span { display:flex; align-items:center; gap:8px; margin-top:-8px; }
.demo-ready i { width:12px; height:12px; border:3px solid #f6f9ff; border-radius:50%; background:#93a4bd; box-shadow:0 0 0 1px rgba(81,104,138,.18); }
.phone-stage { position:relative; min-height:590px; padding:11px 11px 19px; border:6px solid #111726; border-radius:48px; background:linear-gradient(180deg,#f7faff,#e9effa); box-shadow:0 32px 64px rgba(37,55,88,.22),inset 0 0 0 1px #566174; overflow:hidden; }
.phone-stage::before { content:""; position:absolute; inset:0; background:radial-gradient(circle at 80% 10%,rgba(105,167,255,.25),transparent 28%),radial-gradient(circle at 15% 75%,rgba(135,107,255,.18),transparent 35%); pointer-events:none; }
.dynamic-island { position:relative; z-index:2; width:96px; height:27px; margin:-3px auto 0; display:flex; align-items:center; justify-content:flex-end; gap:7px; padding-right:10px; border-radius:20px; background:#111725; }
.dynamic-island i { width:8px; height:8px; border-radius:50%; background:#252f48; }.dynamic-island b { width:40px; height:6px; border-radius:5px; background:#1d2639; }
.phone-topbar { position:relative; z-index:1; display:flex; justify-content:space-between; margin:-20px 15px 0; color:#172038; font-size:11px; font-weight:800; }.phone-status { display:flex; align-items:center; gap:3px; }
.call-form,.call-screen { position:relative; z-index:1; }.call-form { display:grid; gap:10px; padding:62px 10px 34px; }.form-heading { display:flex; align-items:center; gap:10px; margin-bottom:4px; color:#172541; font-size:15px; font-weight:800; }.form-heading small { display:block; margin-top:2px; color:#79869b; font-size:11px; font-weight:600; }.form-icon { width:42px; height:42px; display:grid; place-items:center; border-radius:13px; color:#fff; background:#287bf3; box-shadow:0 8px 18px rgba(40,123,243,.28); }.form-icon svg { width:18px; height:18px; stroke-width:2; }
label { display:grid; gap:5px; color:#526078; font-size:10px; font-weight:800; letter-spacing:.02em; } input,select { width:100%; min-height:44px; border:1px solid rgba(94,113,144,.22); border-radius:12px; background:rgba(255,255,255,.76); color:#192540; font:inherit; font-size:13px; font-weight:650; outline:none; } input { padding:0 12px; } select { padding:0 9px; -webkit-appearance:auto; } input:focus,select:focus { border-color:#3282f6; box-shadow:0 0 0 4px rgba(50,130,246,.14); background:#fff; }
.phone-input { display:grid; grid-template-columns:88px 1fr; gap:7px; }.country-code { min-height:44px; display:flex; align-items:center; padding:0 8px; border:1px solid rgba(94,113,144,.18); border-radius:12px; background:rgba(255,255,255,.54); color:#263757; font-size:11px; letter-spacing:0; }.split-fields { display:grid; grid-template-columns:1fr 1fr; gap:9px; }.consent { grid-template-columns:16px 1fr; align-items:start; gap:8px; margin:0 1px; font-size:10px; font-weight:650; letter-spacing:0; line-height:1.35; }.consent input { width:16px; min-height:16px; margin:0; accent-color:#287bf3; }.honeypot { position:absolute!important; left:-10000px!important; }.start-call { min-height:47px; display:flex; align-items:center; justify-content:center; gap:7px; margin-top:1px; border:0; border-radius:15px; color:white; background:#1f7af5; box-shadow:0 10px 20px rgba(31,122,245,.24); font:inherit; font-size:13px; font-weight:800; cursor:pointer; }.start-call:hover { background:#116be6; }.call-form small { color:#8590a2; font-size:9px; text-align:center; line-height:1.35; }.form-error { margin:0; color:#b42318; font-size:11px; line-height:1.4; }.waitlist-link { border:0; color:#196ede; background:transparent; font:inherit; font-size:11px; font-weight:800; cursor:pointer; }
.call-screen { min-height:560px; padding:46px 18px 24px; display:flex; flex-direction:column; align-items:center; text-align:center; }.back-to-form { position:absolute; top:14px; left:10px; display:flex; align-items:center; gap:1px; border:0; color:#276ed2; background:transparent; font:inherit; font-size:12px; cursor:pointer; }.back-to-form:disabled { opacity:0; }.caller-avatar { position:relative; width:94px; height:94px; display:grid; place-items:center; margin-top:14px; border-radius:50%; color:white; background:linear-gradient(145deg,#275cad,#77a6fa); box-shadow:0 14px 30px rgba(38,91,180,.24); font-size:40px; font-weight:750; }.caller-avatar i { position:absolute; right:4px; bottom:5px; width:16px; height:16px; border:3px solid #f0f4fb; border-radius:50%; background:#32c263; }.caller-avatar.failed i,.caller-avatar.no_answer i { background:#f3a31d; }.calling-label { margin:16px 0 3px; color:#586782; font-size:12px; font-weight:700; }.call-screen h3 { margin:0; color:#13203a; font-size:22px; letter-spacing:-.03em; }.call-status { display:flex; align-items:center; gap:6px; margin:8px 0 0; color:#68758b; font-size:12px; font-weight:650; }.call-status span { width:7px; height:7px; border-radius:50%; background:#f0a329; }.call-status span.connected { background:#2bbb5d; animation:pulse 1.2s infinite; }.call-status span.completed { background:#2bbb5d; }.call-status span.failed { background:#df4e4e; }.voice-ribbon { width:calc(100% + 20px); margin:24px -10px auto; }.call-actions { display:flex; justify-content:center; gap:18px; margin-top:auto; }.call-actions button { width:48px; height:48px; display:grid; place-items:center; border:0; border-radius:50%; color:#172039; background:rgba(255,255,255,.75); box-shadow:0 8px 20px rgba(47,61,84,.1); }.call-actions .hangup { color:white; background:#f34a4a; transform:rotate(135deg); }.call-actions .hangup:disabled { opacity:.65; }.terminal-note { margin:16px 0 -2px; color:#637189; font-size:11px; line-height:1.5; }.home-indicator { position:absolute; z-index:2; bottom:8px; left:50%; width:100px; height:4px; border-radius:4px; background:#172039; transform:translateX(-50%); }
@keyframes pulse { 50% { box-shadow:0 0 0 6px rgba(43,187,93,.18); } }
@media(max-width:850px) { .demo-section { padding-inline:18px; }.demo-shell { grid-template-columns:1fr; max-width:400px; gap:40px; }.demo-intro { text-align:center; }.demo-intro>p,.demo-ready { margin-inline:auto; }.trust-row { justify-content:center; }.demo-ready span { justify-content:center; }.phone-stage { min-height:590px; } }
@media(max-width:390px) { .phone-stage { border-radius:44px; padding-inline:10px; }.call-form { padding-inline:9px; }.split-fields { grid-template-columns:1fr; }.phone-stage { min-height:685px; } }

/* Live Demo composition reused from the established main-branch design. */
.demo-section{position:relative;padding:120px 24px;background:#06142a;}
.demo-section::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:46px 46px;opacity:.45;pointer-events:none;}
.demo-shell{position:relative;z-index:1;width:min(1180px,100%);grid-template-columns:1.08fr .92fr;gap:70px;padding:64px;border:1px solid rgba(255,255,255,.1);border-radius:36px;background:#162238;box-shadow:0 35px 100px rgba(0,0,0,.24);}
.eyebrow{color:#8eb4ff;}.demo-intro h2{max-width:650px;color:#fff;font-size:clamp(42px,5vw,68px);letter-spacing:-.045em;}.demo-intro>p{max-width:570px;color:#aeb9cc;font-size:18px;line-height:1.7;}.trust-row{display:none;}
.demo-ready{width:calc(100% + 60px);margin:14px -30px -18px;color:#c2cad8;font-size:13px;font-weight:750;}.demo-ready .voice-ribbon{height:auto;overflow:visible;}.demo-ready .voice-ribbon svg{transform:none;}.demo-ready span{gap:10px;margin:0 0 0 38px;}.demo-ready i{width:9px;height:9px;border:0;background:#94a3b8;box-shadow:0 0 0 6px #f1f5f9;}
.phone-stage{min-height:0;padding:0;border:1px solid #e2e8f0;border-radius:24px;background:#fff;box-shadow:0 18px 45px rgba(20,38,77,.08);overflow:visible;}.phone-stage::before,.dynamic-island,.phone-topbar,.home-indicator{display:none;}.call-form{gap:16px;padding:30px;}.form-heading{font-size:17px;}.form-icon{width:46px;height:46px;}.form-icon svg{width:20px;height:20px;}label{gap:7px;font-size:13px;}input,select{min-height:50px;font-size:14px;}.phone-input{grid-template-columns:120px 1fr;gap:9px;}.country-code{min-height:50px;font-size:12px;}.split-fields{gap:10px;}.consent{grid-template-columns:20px 1fr;gap:9px;font-size:11px;}.consent input{width:18px;min-height:18px;}.start-call{min-height:54px;border-radius:999px;font-size:14px;}.call-form small{font-size:10px;}.call-screen{min-height:540px;}.call-screen .voice-ribbon{margin:24px -10px auto;}
@media(max-width:850px){.demo-section{padding:80px 16px;}.demo-shell{grid-template-columns:1fr;gap:35px;padding:34px 24px;}.demo-intro{text-align:left;}.demo-ready{margin-left:-18px;}.demo-ready span{margin-left:18px;}.phone-stage{max-width:none;}.trust-row{display:none;}}
@media(max-width:480px){.demo-shell{padding:28px 18px;}.phone-input,.split-fields{grid-template-columns:1fr;}.call-form{padding:22px 18px;}.demo-ready{width:calc(100% + 36px);}.demo-intro h2{font-size:40px;}}

/* Keep the phone interaction as the right-hand visual inside the dark panel. */
.phone-stage{min-height:590px;padding:11px 11px 19px;border:6px solid #111726;border-radius:48px;background:linear-gradient(180deg,#f7faff,#e9effa);box-shadow:0 32px 64px rgba(0,0,0,.28),inset 0 0 0 1px #566174;overflow:hidden;}
.phone-stage::before{display:block;background:radial-gradient(circle at 80% 10%,rgba(105,167,255,.25),transparent 28%),radial-gradient(circle at 15% 75%,rgba(135,107,255,.18),transparent 35%);}
.dynamic-island{display:flex;}.phone-topbar{display:flex;}.home-indicator{display:block;}
.call-form{gap:10px;padding:62px 10px 34px;}.form-heading{font-size:15px;}.form-icon{width:42px;height:42px;}.form-icon svg{width:18px;height:18px;}label{gap:5px;font-size:10px;}input,select{min-height:44px;font-size:13px;}.phone-input{grid-template-columns:88px 1fr;gap:7px;}.country-code{min-height:44px;font-size:11px;}.split-fields{gap:9px;}.consent{grid-template-columns:16px 1fr;gap:8px;font-size:10px;}.consent input{width:16px;min-height:16px;}.start-call{min-height:47px;border-radius:15px;font-size:13px;}.call-form small{font-size:9px;}
.country-code{display:block;appearance:auto;padding:0 5px;cursor:pointer;}
.country-locked{display:flex;align-items:center;appearance:none;cursor:default;}
.form-field{display:grid;gap:5px;color:#526078;font-size:10px;font-weight:800;letter-spacing:.02em;}
.custom-select{position:relative;}.select-trigger{width:100%;min-height:44px;display:flex;align-items:center;justify-content:space-between;gap:7px;padding:0 9px;border:1px solid rgba(94,113,144,.22);border-radius:12px;background:rgba(255,255,255,.76);color:#192540;font:inherit;font-size:13px;font-weight:650;text-align:left;cursor:pointer;}.select-trigger:focus-visible,.custom-select:focus-within .select-trigger{outline:none;border-color:#3282f6;box-shadow:0 0 0 4px rgba(50,130,246,.14);background:#fff;}.select-trigger svg{width:15px;height:15px;flex:0 0 auto;transition:transform .2s;}.select-trigger svg.rotated{transform:rotate(180deg);}.select-menu{position:absolute;z-index:20;left:0;right:0;top:calc(100% + 5px);display:grid;gap:2px;padding:5px;border:1px solid #dce4ef;border-radius:12px;background:rgba(255,255,255,.98);box-shadow:0 14px 30px rgba(15,23,42,.2);}.language-menu{max-height:190px;overflow-y:auto;overscroll-behavior:contain;}.select-menu button{width:100%;min-height:32px;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:#475569;font:inherit;font-size:11px;font-weight:650;text-align:left;cursor:pointer;}.select-menu button:hover,.select-menu button:focus-visible{outline:none;background:#eef4ff;color:#14264d;}.select-menu button.selected{background:#eaf2ff;color:#2563eb;}.select-menu button svg{width:13px;height:13px;flex:0 0 auto;}
@media(max-width:850px){.phone-stage{min-height:590px;}.demo-intro{text-align:center;}.demo-ready span{margin-left:0;justify-content:center;}}

/* iPhone 17 Pro-style hardware proportions — never stretch the device to its grid column. */
.phone-stage{width:min(100%,320px);min-height:0;aspect-ratio:1 / 2;justify-self:center;padding:10px 8px 15px;border:6px solid #101621;border-radius:46px;background:linear-gradient(135deg,#4c5668 0%,#151c2a 8%,#0a101a 92%,#536072 100%);box-shadow:0 24px 52px rgba(0,0,0,.38),0 0 0 1px rgba(255,255,255,.22),inset 0 0 0 1px rgba(255,255,255,.22);isolation:isolate;}
.phone-stage::before{inset:7px;border-radius:43px;background:radial-gradient(circle at 80% 10%,rgba(105,167,255,.25),transparent 28%),radial-gradient(circle at 15% 75%,rgba(135,107,255,.18),transparent 35%),linear-gradient(180deg,#f7faff,#e9effa);z-index:0;}
.dynamic-island{width:98px;height:28px;margin:-3px auto 0;border-radius:20px;box-shadow:inset 0 1px 1px rgba(255,255,255,.06);}.dynamic-island b{width:42px;}.phone-topbar{margin:-20px 13px 0;}.call-form{padding-top:48px;}.home-indicator{bottom:8px;width:88px;}
@media(max-width:850px){.phone-stage{width:min(100%,320px);min-height:0;}.phone-stage::before{inset:6px;}}

/* Use the complete device screen and keep each choice on its own row. */
.call-form{height:calc(100% - 26px);padding:48px 10px 32px;align-content:space-between;}.split-fields{grid-template-columns:1fr;gap:10px;}.phone-stage.is-busy{animation:phone-vibrate .22s ease-in-out 0s 3;}.phone-stage.is-busy .phone-topbar{color:#fff;}.phone-stage.is-busy::before{background:linear-gradient(180deg,#152841,#0a1426);}
.call-screen{height:calc(100% - 26px);min-height:0;margin:0 -2px;padding:56px 18px 28px;border-radius:38px;background:radial-gradient(circle at 50% 18%,#3a5c92 0%,#1b2b46 30%,#0b1425 78%);color:#fff;}.call-screen .calling-label,.call-screen h3,.call-screen .call-status,.call-screen .terminal-note{color:#fff;}.call-screen .calling-label{opacity:.72;}.call-screen .call-status{opacity:.78;}.call-screen .caller-avatar{width:104px;height:104px;background:linear-gradient(145deg,#387cf2,#75a9ff);box-shadow:0 18px 42px rgba(29,105,238,.42);}.call-screen .voice-ribbon{margin:28px -10px auto;}.call-screen .call-actions{gap:22px;}.call-screen .call-actions button{width:54px;height:54px;color:#fff;background:rgba(255,255,255,.18);box-shadow:none;backdrop-filter:blur(8px);}.call-screen .call-actions .hangup{background:#ef4444;}
@keyframes phone-vibrate{0%,100%{transform:translateX(0) rotate(0)}25%{transform:translateX(-2px) rotate(-.25deg)}75%{transform:translateX(2px) rotate(.25deg)}}
</style>
