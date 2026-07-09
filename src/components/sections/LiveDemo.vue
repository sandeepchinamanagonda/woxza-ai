<template>
  <section id="demo" class="demo-section">
    <div class="demo-shell">
      <div class="demo-visual">
        <span class="eyebrow">LIVE VOXA DEMO</span>
        <h2>Hear what your next caller could hear</h2>
        <p>Pick a workflow and Voxa will call you for a focused, 90-second live demonstration</p>
        <VoiceRibbon :state="ribbonState" />
        <div class="call-state" aria-live="polite">
          <i :class="ribbonState"></i>
          {{ statusCopy }}
        </div>
      </div>

      <form class="demo-form" @submit.prevent="submitDemo">
        <div class="form-field">
          <span>Use case</span>
          <div class="custom-select" @focusout="closeUseCaseOnBlur" @keydown.esc="openUseCase = false">
            <button
              class="select-trigger"
              type="button"
              :disabled="busy"
              aria-haspopup="listbox"
              aria-controls="use-case-options"
              :aria-expanded="openUseCase"
              @click="openUseCase = !openUseCase"
              @keydown.down.prevent="openUseCase = true"
            >
              <span>{{ selectedUseCase.label }}</span>
              <ChevronDown :class="{ rotated: openUseCase }" />
            </button>

            <div v-if="openUseCase" id="use-case-options" class="select-menu" role="listbox" aria-label="Use case">
              <button
                v-for="useCase in useCases"
                :key="useCase.value"
                type="button"
                role="option"
                :aria-selected="form.useCase === useCase.value"
                :class="{ selected: form.useCase === useCase.value }"
                @click="selectUseCase(useCase.value)"
              >
                <span>{{ useCase.label }}</span>
                <Check v-if="form.useCase === useCase.value" />
              </button>
            </div>
          </div>
        </div>
        <label>
          <span>Name</span>
          <input v-model.trim="form.name" autocomplete="name" maxlength="160" :disabled="busy" required placeholder="Your name">
        </label>
        <label>
          <span>Phone number</span>
          <div class="phone-input">
            <select v-model="form.countryCode" aria-label="Country code" :disabled="busy">
              <option v-for="country in countries" :key="country.label" :value="country.code">{{ country.label }} {{ country.code }}</option>
            </select>
            <input v-model.trim="form.phone" autocomplete="tel-national" inputmode="tel" :disabled="busy" required placeholder="312 555 0100">
          </div>
        </label>
        <label>
          <span>Email <em>optional</em></span>
          <input v-model.trim="form.email" autocomplete="email" type="email" maxlength="254" :disabled="busy" placeholder="you@company.com">
        </label>
        <label class="consent">
          <input v-model="form.consentMarketing" type="checkbox" :disabled="busy">
          <span>I agree to be contacted about Voxa</span>
        </label>
        <label class="honeypot" aria-hidden="true">
          <span>Website</span>
          <input v-model="form.website" name="website" tabindex="-1" autocomplete="off">
        </label>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <button class="submit-demo" type="submit" :disabled="busy">
          {{ busy ? "Calling you now" : "Try our live demo" }}
        </button>
        <button v-if="limitReached" class="waitlist-link" type="button" @click="$emit('join-waitlist')">
          Demo limit reached for now, join the waitlist instead
        </button>
        <small>Carrier rates may apply, one demo per number every 30 minutes</small>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref } from "vue"
import { Check, ChevronDown } from "lucide-vue-next"
import VoiceRibbon from "@/components/VoiceRibbon.vue"

defineEmits(["join-waitlist"])
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const countries = [
  { label:"🇺🇸 US", code:"+1" }, { label:"🇨🇦 CA", code:"+1" }, { label:"🇮🇳 IN", code:"+91" },
  { label:"🇬🇧 UK", code:"+44" }, { label:"🇦🇺 AU", code:"+61" }, { label:"🇸🇬 SG", code:"+65" }
]
const useCases = [
  { value:"appointment", label:"Appointment booking" },
  { value:"restaurant", label:"Restaurant reservations" },
  { value:"distribution", label:"Medical distribution" },
  { value:"payments", label:"Payments support" }
]
const form = reactive({ useCase:"appointment", name:"", countryCode:"+1", phone:"", email:"", consentMarketing:true, website:"" })
const openUseCase = ref(false)
const status = ref("idle")
const error = ref("")
const limitReached = ref(false)
let pollTimer
const busy = computed(() => ["pending", "ringing", "connected"].includes(status.value))
const selectedUseCase = computed(() => useCases.find(useCase => useCase.value === form.useCase) || useCases[0])
const ribbonState = computed(() => status.value === "connected" ? "connected" : busy.value ? "calling" : "idle")
const statusCopy = computed(() => ({
  idle:"Ready when you are", pending:"Starting your call…", ringing:"Your phone is ringing…", connected:"You’re live with Voxa",
  completed:"Demo complete, thanks for calling", no_answer:"We couldn’t reach you", failed:"The call could not connect"
}[status.value] || "Ready when you are"))

function selectUseCase(value) {
  form.useCase = value
  openUseCase.value = false
}

function closeUseCaseOnBlur(event) {
  if (!event.currentTarget.contains(event.relatedTarget)) openUseCase.value = false
}

const poll = async callId => {
  try {
    const response = await fetch(`${apiBaseUrl}/api/demo-call/${callId}/status`)
    if (!response.ok) throw new Error("Could not check call status")
    const body = await response.json()
    status.value = body.status
    if (["completed", "no_answer", "failed"].includes(body.status)) return
    pollTimer = window.setTimeout(() => poll(callId), 2000)
  } catch {
    pollTimer = window.setTimeout(() => poll(callId), 4000)
  }
}

const submitDemo = async () => {
  if (form.website) return
  error.value = ""
  limitReached.value = false
  status.value = "pending"
  try {
    const response = await fetch(`${apiBaseUrl}/api/demo-call`, {
      method:"POST", headers:{ "content-type":"application/json" },
      body:JSON.stringify({ ...form, phone:`${form.countryCode}${form.phone}` })
    })
    const body = await response.json().catch(() => ({}))
    if (response.status === 429) {
      limitReached.value = true
      throw new Error("Demo limit reached for now, join the waitlist instead")
    }
    if (!response.ok) throw new Error(body.error || "We could not start the demo call")
    status.value = "ringing"
    poll(body.callId)
  } catch (caught) {
    status.value = "failed"
    error.value = caught.message
  }
}

onBeforeUnmount(() => window.clearTimeout(pollTimer))
</script>

<style scoped>
.demo-section { position:relative; padding:120px 24px; overflow:hidden; background:var(--voxa-blue); }
.demo-section::before { content:""; position:absolute; inset:0; background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px); background-size:46px 46px; opacity:.45; pointer-events:none; }
.demo-shell { position:relative; z-index:1; width:min(1180px,100%); margin:auto; display:grid; grid-template-columns:1.08fr .92fr; gap:70px; align-items:center; padding:64px; border:1px solid rgba(255,255,255,.1); border-radius:36px; background:var(--voxa-blue-2); box-shadow:0 35px 100px rgba(0,0,0,.24); }
.eyebrow { color:#8eb4ff; font-size:12px; font-weight:800; letter-spacing:.22em; }
h2 { max-width:650px; margin:16px 0 20px; color:#fff; font-size:clamp(42px,5vw,68px); line-height:.98; letter-spacing:-.045em; }
.demo-visual>p { max-width:570px; color:#aeb9cc; font-size:18px; line-height:1.7; }
.voice-ribbon { margin:14px -30px -18px; width:calc(100% + 60px); }
.call-state { display:flex; align-items:center; gap:10px; color:#c2cad8; font-size:13px; font-weight:750; }
.call-state i { width:9px; height:9px; border-radius:50%; background:#94a3b8; box-shadow:0 0 0 6px #f1f5f9; }
.call-state i.calling { background:#f59e0b; box-shadow:0 0 0 6px #fef3c7; }
.call-state i.connected { background:#22c55e; box-shadow:0 0 0 6px #dcfce7; animation:pulse 1.1s infinite; }
.demo-form { display:grid; gap:16px; padding:30px; border-radius:24px; background:#fff; border:1px solid #e2e8f0; box-shadow:0 18px 45px rgba(20,38,77,.08); }
label,.form-field { display:grid; gap:7px; color:#475569; font-size:13px; font-weight:750; }
label em { color:#94a3b8; font-style:normal; font-weight:600; }
input,select { width:100%; min-height:50px; padding:0 13px; border:1px solid #d7e0ec; border-radius:12px; background:#f8fbff; color:#14264d; font:inherit; outline:none; }
input:focus,select:focus { border-color:var(--voxa-accent); box-shadow:0 0 0 4px rgba(var(--voxa-accent-rgb),.1); }
.custom-select { position:relative; }
.select-trigger { width:100%; min-height:50px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 14px; border:1px solid #d7e0ec; border-radius:12px; background:#f8fbff; color:#14264d; font:inherit; font-weight:700; text-align:left; cursor:pointer; transition:border-color .25s,box-shadow .25s,background .25s; }
.select-trigger:hover { background:#fff; border-color:#b9c8dd; }
.select-trigger:focus-visible,.custom-select:focus-within .select-trigger { outline:none; border-color:var(--voxa-accent); box-shadow:0 0 0 4px rgba(var(--voxa-accent-rgb),.1); }
.select-trigger:disabled { cursor:wait; opacity:.65; }
.select-trigger svg { width:18px; height:18px; color:#64748b; transition:transform .25s; }
.select-trigger svg.rotated { transform:rotate(180deg); }
.select-menu { position:absolute; z-index:30; left:0; right:0; top:calc(100% + 8px); display:grid; gap:4px; padding:8px; border:1px solid #dce4ef; border-radius:16px; background:rgba(255,255,255,.98); box-shadow:0 22px 55px rgba(15,23,42,.18); backdrop-filter:blur(18px); }
.select-menu button { width:100%; min-height:44px; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:0 12px; border:0; border-radius:10px; background:transparent; color:#475569; font:inherit; font-weight:650; text-align:left; cursor:pointer; transition:background .2s,color .2s; }
.select-menu button:hover,.select-menu button:focus-visible { outline:none; background:#eef4ff; color:#14264d; }
.select-menu button.selected { background:#eaf2ff; color:#2563eb; }
.select-menu button svg { width:17px; height:17px; flex:0 0 auto; }
.phone-input { display:grid; grid-template-columns:120px 1fr; gap:9px; }
.consent { grid-template-columns:20px 1fr; align-items:center; }
.consent input { min-height:0; height:18px; accent-color:var(--voxa-accent); }
.honeypot { position:absolute!important; left:-10000px!important; top:auto!important; width:1px!important; height:1px!important; overflow:hidden!important; }
.submit-demo { min-height:54px; border:0; border-radius:999px; color:#fff; background:var(--voxa-accent); font:inherit; font-weight:800; cursor:pointer; }
.submit-demo:disabled { cursor:wait; opacity:.65; }
.waitlist-link { padding:0; border:0; color:var(--voxa-accent); background:none; font:inherit; font-weight:750; cursor:pointer; }
.form-error { margin:0; color:#b91c1c; font-size:13px; line-height:1.5; }
.demo-form small { color:#94a3b8; text-align:center; }
@keyframes pulse { 50% { box-shadow:0 0 0 9px #dcfce7; } }
@media(max-width:850px) { .demo-shell { grid-template-columns:1fr; gap:35px; padding:34px 24px; } .demo-section { padding:80px 16px; } }
@media(max-width:480px) { .phone-input { grid-template-columns:1fr; } .demo-form { padding:22px 18px; } }
</style>
