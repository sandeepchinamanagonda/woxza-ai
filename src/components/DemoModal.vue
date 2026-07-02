<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="overlay"
        @click.self="closeModal"
      >
        <div class="modal">
          <div class="modal-header">
            <div>
              <span class="eyebrow">{{ modalCopy.eyebrow }}</span>
              <h2>{{ modalCopy.title }}</h2>
            </div>

            <button
              class="close"
              type="button"
              aria-label="Close modal"
              @click="closeModal"
            >
              X
            </button>
          </div>

          <p class="intro">
            {{ modalCopy.intro }}
          </p>

          <div
            v-if="successMessage"
            class="success-card"
            role="status"
          >
            <strong>{{ successMessage }}</strong>
            <span>{{ successDetail }}</span>

            <button
              class="btn-primary"
              type="button"
              @click="closeModal"
            >
              Done
            </button>
          </div>

          <form
            v-else-if="props.mode === 'waitlist'"
            class="form"
            @submit.prevent="handleSubmit"
          >
            <div class="progress-row">
              <div class="steps">
                <span
                  v-for="(_, index) in waitlistSteps"
                  :key="index"
                  :class="{ active: index <= stepIndex }"
                ></span>
              </div>

              <span class="step-count">
                Step {{ stepIndex + 1 }} of {{ waitlistSteps.length }}
              </span>
            </div>

            <section
              v-show="stepIndex === 0"
              class="step-panel"
            >
              <label>
                <span>First name</span>
                <input v-model.trim="form.firstName" autocomplete="given-name" placeholder="First name" required>
              </label>

              <label>
                <span>Last name</span>
                <input v-model.trim="form.lastName" autocomplete="family-name" placeholder="Last name" required>
              </label>

              <label class="wide">
                <span>Email address</span>
                <input
                  v-model.trim="form.email"
                  autocomplete="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                >
              </label>

              <label class="wide">
                <span>Phone number</span>
                <div class="phone-row">
                  <select v-model="form.countryCode" aria-label="Country calling code" required>
                    <option v-for="country in countryCodeOptions" :key="`${country.flag}-${country.code}`" :value="country.code">
                      {{ country.flag }} {{ country.code }}
                    </option>
                  </select>
                  <input v-model.trim="form.phoneNumber" autocomplete="tel-national" inputmode="tel" placeholder="312 555 0100" required>
                </div>
              </label>

              <label class="wide">
                <span>Company <em>Optional</em></span>
                <input
                  v-model.trim="form.company"
                  autocomplete="organization"
                  placeholder="Business name"
                >
              </label>
            </section>

            <section
              v-show="stepIndex === 1"
              class="step-panel"
            >
              <div class="field-block wide">
                <span class="field-title">Industry</span>
                <div class="choice-grid industry-grid">
                  <label v-for="type in businessTypeOptions" :key="type.value" class="choice-pill" :class="{ active: form.industry === type.value }">
                    <input v-model="form.industry" type="radio" name="industry" :value="type.value">
                    <span>{{ type.label }}</span>
                  </label>
                </div>
              </div>

              <div class="field-block wide">
                <span class="field-title">Company size</span>
                <div class="choice-grid size-grid">
                  <label v-for="size in teamSizeOptions" :key="size.value" class="choice-pill" :class="{ active: form.companySize === size.value }">
                    <input v-model="form.companySize" type="radio" name="company-size" :value="size.value">
                    <span>{{ size.label }}</span>
                  </label>
                </div>
              </div>

              <label class="wide">
                <span>Main use case</span>
                <textarea
                  v-model.trim="form.useCase"
                  rows="4"
                  placeholder="Example: answer incoming calls, qualify customers, book appointments, update CRM"
                  required
                ></textarea>
              </label>
            </section>

            <section
              v-show="stepIndex === 2"
              class="step-panel"
            >
              <div class="field-block wide">
                <span class="field-title">Preferred pricing</span>

                <div class="option-grid">
                  <label
                    v-for="price in pricingOptions"
                    :key="price.value"
                    class="option-card"
                    :class="{ active: form.pricing === price.value }"
                  >
                    <input
                      v-model="form.pricing"
                      type="radio"
                      name="pricing"
                      :value="price.value"
                      required
                    >
                    <strong>{{ price.label }}</strong>
                    <span>{{ price.helper }}</span>
                  </label>
                </div>
              </div>

              <div class="field-block wide">
                <span class="field-title">Launch timeline</span>
                <div class="choice-grid timeline-grid">
                  <label v-for="timeline in timelineOptions" :key="timeline.value" class="choice-pill" :class="{ active: form.adoptionTimeline === timeline.value }">
                    <input v-model="form.adoptionTimeline" type="radio" name="timeline" :value="timeline.value">
                    <span>{{ timeline.label }}</span>
                  </label>
                </div>
              </div>

              <div class="field-block wide">
                <span class="field-title">Must-have features</span>

                <div class="option-grid feature-grid">
                  <label
                    v-for="feature in featureOptions"
                    :key="feature.value"
                    class="option-card compact"
                    :class="{
                      active: form.features.includes(feature.value),
                      disabled: featureDisabled(feature.value)
                    }"
                  >
                    <input
                      v-model="form.features"
                      type="checkbox"
                      :value="feature.value"
                      :disabled="featureDisabled(feature.value)"
                      @change="limitFeatures"
                    >
                    <span>{{ feature.label }}</span>
                  </label>
                </div>

                <small>
                  Choose up to {{ featureLimit }}.
                </small>
              </div>

              <label class="wide">
                <span>Anything else?</span>
                <textarea
                  v-model.trim="form.message"
                  rows="3"
                  placeholder="Optional notes"
                ></textarea>
              </label>
            </section>

            <p
              v-if="submitError"
              class="error-message"
              role="alert"
            >
              {{ submitError }}
            </p>

            <div class="form-actions">
              <button
                class="btn-secondary"
                type="button"
                :disabled="stepIndex === 0 || isSubmitting"
                @click="stepIndex -= 1"
              >
                Back
              </button>

              <button
                v-if="!isLastStep"
                class="btn-primary"
                type="button"
                :disabled="!canContinue || isSubmitting"
                @click="goNext"
              >
                Next
              </button>

              <button
                v-else
                class="btn-primary"
                type="submit"
                :disabled="!canContinue || isSubmitting"
              >
                {{ isSubmitting ? "Joining..." : "Join Waitlist" }}
              </button>
            </div>
          </form>

          <form
            v-else
            class="form"
            @submit.prevent="handleSubmit"
          >
            <section class="step-panel">
              <label>
                <span>First name</span>
                <input v-model.trim="form.firstName" autocomplete="given-name" placeholder="First name" required>
              </label>

              <label>
                <span>Last name</span>
                <input v-model.trim="form.lastName" autocomplete="family-name" placeholder="Last name" required>
              </label>

              <label class="wide">
                <span>Email address</span>
                <input
                  v-model.trim="form.email"
                  autocomplete="email"
                  type="email"
                  placeholder="you@company.com"
                  required
                >
              </label>

              <label class="wide">
                <span>Phone number</span>
                <div class="phone-row">
                  <select v-model="form.countryCode" aria-label="Country calling code" required>
                    <option v-for="country in countryCodeOptions" :key="`sales-${country.flag}-${country.code}`" :value="country.code">{{ country.flag }} {{ country.code }}</option>
                  </select>
                  <input v-model.trim="form.phoneNumber" autocomplete="tel-national" inputmode="tel" placeholder="312 555 0100" required>
                </div>
              </label>

              <label class="wide">
                <span>Company <em>Optional</em></span>
                <input
                  v-model.trim="form.company"
                  autocomplete="organization"
                  placeholder="Business name"
                >
              </label>

              <label class="wide">
                <span>Business type</span>
                <select
                  v-model="form.industry"
                  required
                >
                  <option value="" disabled>Select business type</option>
                  <option
                    v-for="type in businessTypeOptions"
                    :key="type.value"
                    :value="type.value"
                  >
                    {{ type.label }}
                  </option>
                </select>
              </label>

              <label class="wide">
                <span>What should we help with?</span>
                <textarea
                  v-model.trim="form.message"
                  rows="5"
                  placeholder="Tell us about the calls, workflows or customer journey you want to automate."
                  required
                ></textarea>
              </label>
            </section>

            <p
              v-if="submitError"
              class="error-message"
              role="alert"
            >
              {{ submitError }}
            </p>

            <div class="form-actions single">
              <button
                class="btn-primary"
                type="submit"
                :disabled="!salesReady || isSubmitting"
              >
                {{ isSubmitting ? "Sending..." : "Request a Sales Call" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from "vue"

const props = defineProps({
  isOpen: Boolean,
  mode: {
    type: String,
    default: "waitlist"
  }
})

const emit = defineEmits(["close"])

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const waitlistSteps = ["Contact", "Use case", "Launch fit"]
const featureLimit = 5
const phonePattern = /^[\d\s().-]{6,24}$/

const countryCodeOptions = [
  { flag: "🇺🇸", code: "+1" }, { flag: "🇨🇦", code: "+1" },
  { flag: "🇬🇧", code: "+44" }, { flag: "🇮🇳", code: "+91" },
  { flag: "🇦🇺", code: "+61" }, { flag: "🇸🇬", code: "+65" },
  { flag: "🇦🇪", code: "+971" }, { flag: "🇩🇪", code: "+49" },
  { flag: "🇫🇷", code: "+33" }, { flag: "🇳🇱", code: "+31" },
  { flag: "🇲🇽", code: "+52" }, { flag: "🇧🇷", code: "+55" }
]

const businessTypeOptions = [
  { label: "Healthcare or pharma", value: "healthcare" },
  { label: "Real estate", value: "real-estate" },
  { label: "Local services", value: "local-services" },
  { label: "Ecommerce", value: "ecommerce" },
  { label: "SaaS", value: "saas" },
  { label: "Agency", value: "agency" },
  { label: "Financial services", value: "financial-services" },
  { label: "Hospitality", value: "hospitality" },
  { label: "Other", value: "other" }
]

const teamSizeOptions = [
  { label: "Just me", value: "just-me" },
  { label: "2-10 people", value: "2-10" },
  { label: "11-50 people", value: "11-50" },
  { label: "51-200 people", value: "51-200" },
  { label: "201+ people", value: "201-plus" }
]

const pricingOptions = [
  {
    label: "Starter",
    value: "100-299",
    helper: "Simple call handling for one team"
  },
  {
    label: "Growth",
    value: "300-999",
    helper: "Calls, booking and CRM automation"
  },
  {
    label: "Custom",
    value: "1000-plus",
    helper: "Advanced workflows and integrations"
  },
  {
    label: "Not sure",
    value: "not-sure",
    helper: "Help me choose the right plan"
  }
]

const timelineOptions = [
  { label: "Immediately", value: "immediately" },
  { label: "1-3 months", value: "1-3-months" },
  { label: "3-6 months", value: "3-6-months" },
  { label: "Just exploring", value: "exploring" }
]

const featureOptions = [
  { label: "AI phone agent", value: "ai-phone-agent" },
  { label: "Appointment booking", value: "appointment-booking" },
  { label: "Customer support", value: "customer-support" },
  { label: "Lead qualification", value: "lead-qualification" },
  { label: "CRM integrations", value: "crm-integrations" },
  { label: "Analytics", value: "analytics" },
  { label: "Multilingual support", value: "multilingual-support" },
  { label: "Custom workflows", value: "custom-workflows" }
]

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  countryCode: "+1",
  phoneNumber: "",
  industry: "",
  companySize: "",
  useCase: "",
  pricing: "",
  adoptionTimeline: "",
  features: [],
  message: ""
})

const stepIndex = ref(0)
const form = ref(emptyForm())
const registrationId = ref("")
const isSubmitting = ref(false)
const submitError = ref("")
const successMessage = ref("")

const modalCopy = computed(() => {
  if (props.mode === "sales") {
    return {
      eyebrow: "CALL SALES",
      title: "Talk to our sales team.",
      intro: "Tell us what you want to automate and we'll help map the right Voxa setup for your business."
    }
  }

  return {
    eyebrow: "JOIN THE WAITLIST",
    title: "Join the Voxa waitlist.",
    intro: "Share the basics now. We will use this to prioritize early access and the first Voxa launch packages."
  }
})

const successDetail = computed(() =>
  props.mode === "sales"
    ? "Your sales inquiry was saved in the backend."
    : "Your waitlist registration and preferences were saved in the backend."
)

const emailReady = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
)

const phoneReady = computed(() =>
  /^\+[1-9]\d{0,3}$/.test(form.value.countryCode) && phonePattern.test(form.value.phoneNumber)
)

const isLastStep = computed(() =>
  stepIndex.value === waitlistSteps.length - 1
)

const contactReady = computed(() =>
  Boolean(form.value.firstName && form.value.lastName && emailReady.value && phoneReady.value)
)

const useCaseReady = computed(() =>
  Boolean(form.value.industry && form.value.companySize && form.value.useCase)
)

const launchReady = computed(() =>
  Boolean(form.value.pricing && form.value.adoptionTimeline && form.value.features.length)
)

const canContinue = computed(() => {
  if (stepIndex.value === 0) return contactReady.value
  if (stepIndex.value === 1) return useCaseReady.value
  return launchReady.value
})

const salesReady = computed(() =>
  Boolean(
    form.value.firstName &&
    form.value.lastName &&
    emailReady.value &&
    phoneReady.value &&
    form.value.industry &&
    form.value.message
  )
)

const optionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value

const postJson = async (path, payload) => {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  })

  let body = {}
  try {
    body = await response.json()
  } catch {
    body = {}
  }

  if (!response.ok) {
    const details = Array.isArray(body.details) ? ` ${body.details.join(". ")}` : ""
    throw new Error(`${body.error || "Request failed."}${details}`)
  }

  return body
}

const registrationPayload = (intent) => {
  return {
    firstName: form.value.firstName,
    lastName: form.value.lastName,
    email: form.value.email,
    countryCode: form.value.countryCode,
    phoneNumber: form.value.phoneNumber,
    businessName: form.value.company || null,
    businessType: form.value.industry || "other",
    metadata: {
      source: "website-modal",
      intent,
      businessTypeLabel: optionLabel(businessTypeOptions, form.value.industry),
      companySizeLabel: optionLabel(teamSizeOptions, form.value.companySize),
      pricingLabel: optionLabel(pricingOptions, form.value.pricing),
      selectedFeatures: form.value.features.map((feature) =>
        optionLabel(featureOptions, feature)
      ),
      message: form.value.message || undefined
    }
  }
}

const preferencesPayload = () => ({
  priceRange: form.value.pricing,
  desiredFeatures: form.value.features,
  primaryChallenge: form.value.useCase,
  adoptionTimeline: form.value.adoptionTimeline,
  teamSize: form.value.companySize
})

const salesPayload = () => ({
  ...registrationPayload("sales"),
  message: form.value.message
})

const submitWaitlist = async () => {
  if (!registrationId.value) {
    const registration = await postJson(
      "/api/waitlist/registrations",
      registrationPayload("waitlist")
    )

    registrationId.value = registration.registrationId
  }

  await postJson(
    `/api/waitlist/registrations/${registrationId.value}/preferences`,
    preferencesPayload()
  )
}

const submitSales = async () => {
  await postJson("/api/sales/inquiries", salesPayload())
}

const limitFeatures = () => {
  form.value.features = form.value.features.slice(0, featureLimit)
}

const featureDisabled = (value) =>
  !form.value.features.includes(value) && form.value.features.length >= featureLimit

const goNext = () => {
  submitError.value = ""
  stepIndex.value += 1
}

const resetForm = () => {
  stepIndex.value = 0
  form.value = emptyForm()
  registrationId.value = ""
  isSubmitting.value = false
  submitError.value = ""
  successMessage.value = ""
}

const closeModal = () => {
  emit("close")
  resetForm()
}

const friendlyError = (error) => {
  const message = error instanceof Error ? error.message : "Something went wrong."

  if (message.includes("already on the waitlist")) {
    return "That email is already on the waitlist. Use another email, or call sales if you want to talk now."
  }

  if (message.includes("Failed to fetch")) {
    return "I could not reach the backend. Make sure the API server is running on port 8787."
  }

  return message
}

const handleSubmit = async () => {
  if (isSubmitting.value) return

  submitError.value = ""
  isSubmitting.value = true

  try {
    if (props.mode === "sales") {
      await submitSales()
      successMessage.value = "Sales request received."
    } else {
      await submitWaitlist()
      successMessage.value = "You are on the Voxa waitlist."
    }
  } catch (error) {
    submitError.value = friendlyError(error)
  } finally {
    isSubmitting.value = false
  }
}

watch(
  () => props.mode,
  () => {
    resetForm()
  }
)

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      resetForm()
    }
  }
)
</script>

<style scoped>
.overlay{
  position:fixed;
  inset:0;
  background:rgba(15,23,42,.62);
  display:flex;
  justify-content:center;
  align-items:center;
  padding:30px;
  z-index:10000;
}

.modal{
  width:min(920px,100%);
  max-height:calc(100vh - 48px);
  overflow:auto;
  background:#fff;
  border-radius:24px;
  padding:42px;
  box-shadow:0 40px 120px rgba(0,0,0,.12);
  border:1px solid rgba(15,23,42,.08);
}

.modal-header{
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  gap:24px;
  margin-bottom:18px;
}

.eyebrow{
  font-size:12px;
  letter-spacing:.24em;
  color:var(--voxa-accent);
  font-family:"IBM Plex Sans",sans-serif;
  font-weight:800;
  display:block;
  margin-bottom:12px;
}

.modal h2{
  font-family:"Inter",sans-serif;
  font-size:clamp(32px,5vw,46px);
  font-weight:800;
  line-height:1.04;
  color:var(--voxa-blue);
}

.intro{
  margin-bottom:30px;
  max-width:620px;
  color:#64748b;
  line-height:1.7;
}

.close{
  width:40px;
  height:40px;
  border:none;
  border-radius:50%;
  background:#f8fbff;
  cursor:pointer;
  color:#64748b;
  font-weight:800;
}

.close:hover{
  color:var(--voxa-accent);
}

.success-card{
  display:grid;
  gap:14px;
  padding:24px;
  border-radius:18px;
  background:rgba(var(--voxa-accent-rgb),.08);
  border:1px solid rgba(var(--voxa-accent-rgb),.16);
}

.success-card strong{
  color:var(--voxa-blue);
  font-size:20px;
}

.success-card span{
  color:#64748b;
  line-height:1.6;
}

.success-card .btn-primary{
  width:max-content;
  margin-top:6px;
}

.progress-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:18px;
  margin-bottom:24px;
}

.steps{
  display:flex;
  flex:1;
  gap:8px;
}

.steps span{
  height:6px;
  flex:1;
  border-radius:999px;
  background:#e2e8f0;
}

.steps span.active{
  background:var(--voxa-accent);
}

.step-count{
  color:#64748b;
  font-size:13px;
  font-weight:700;
}

.form{
  display:grid;
  gap:20px;
}

.step-panel{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:18px;
}

label,
.field-block{
  display:grid;
  gap:9px;
}

label.wide,
.field-block.wide{
  grid-column:1 / -1;
}

label > span,
.field-title{
  color:#475569;
  font-size:13px;
  font-weight:800;
}

label > span em{
  margin-left:6px;
  color:#94a3b8;
  font-size:11px;
  font-style:normal;
  font-weight:700;
  text-transform:uppercase;
  letter-spacing:.06em;
}

.field-block small{
  color:#64748b;
  font-size:12px;
  font-weight:700;
}

.form input,
.form textarea,
.form select{
  width:100%;
  min-height:52px;
  padding:14px 15px;
  border-radius:14px;
  background:#f8fbff;
  border:1px solid rgba(15,23,42,.10);
  color:var(--voxa-blue);
  font:inherit;
  outline:none;
}

.form textarea{
  resize:none;
}

.form input::placeholder,
.form textarea::placeholder{
  color:#94a3b8;
}

.form input:focus,
.form textarea:focus,
.form select:focus{
  border-color:var(--voxa-accent);
  box-shadow:0 0 0 4px rgba(var(--voxa-accent-rgb),.10);
}

.phone-row{
  display:grid;
  grid-template-columns:120px minmax(0,1fr);
  gap:10px;
}

.phone-row select,
.phone-row input{
  margin:0;
}

.choice-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:10px;
}

.industry-grid{
  grid-template-columns:repeat(3,minmax(0,1fr));
}

.size-grid{
  grid-template-columns:repeat(5,minmax(0,1fr));
}

.choice-pill{
  position:relative;
  display:flex;
  min-height:48px;
  align-items:center;
  justify-content:center;
  padding:10px 12px;
  border:1px solid rgba(15,23,42,.10);
  border-radius:13px;
  background:#f8fbff;
  cursor:pointer;
  text-align:center;
  transition:.2s ease;
}

.choice-pill input{
  position:absolute;
  width:1px;
  height:1px;
  opacity:0;
}

.choice-pill span{
  color:#475569;
  font-size:13px;
  font-weight:800;
}

.choice-pill:hover{
  border-color:rgba(var(--voxa-accent-rgb),.45);
}

.choice-pill.active{
  border-color:var(--voxa-accent);
  background:rgba(var(--voxa-accent-rgb),.09);
  box-shadow:0 8px 20px rgba(var(--voxa-accent-rgb),.10);
}

.choice-pill.active span{
  color:var(--voxa-blue);
}

.option-grid{
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:12px;
}

.feature-grid{
  grid-template-columns:repeat(4,minmax(0,1fr));
}

.option-card{
  position:relative;
  min-height:112px;
  padding:16px;
  border-radius:16px;
  background:#f8fbff;
  border:1px solid rgba(15,23,42,.08);
  cursor:pointer;
  transition:.25s ease;
}

.option-card input{
  position:absolute;
  opacity:0;
  pointer-events:none;
}

.option-card strong{
  display:block;
  margin-bottom:7px;
  color:var(--voxa-blue);
  font-size:15px;
}

.option-card span{
  color:#64748b;
  font-size:13px;
  line-height:1.45;
}

.option-card.compact{
  min-height:0;
  padding:14px 15px;
}

.option-card.compact span{
  font-weight:800;
  color:#475569;
}

.option-card.active{
  border-color:var(--voxa-accent);
  background:rgba(var(--voxa-accent-rgb),.08);
  box-shadow:0 12px 28px rgba(var(--voxa-accent-rgb),.12);
}

.option-card.disabled{
  cursor:not-allowed;
  opacity:.48;
}

.option-card.active span,
.option-card.active strong{
  color:var(--voxa-blue);
}

.error-message{
  padding:14px 16px;
  border-radius:14px;
  background:#fff1f2;
  border:1px solid #fecdd3;
  color:#9f1239;
  font-weight:700;
  line-height:1.5;
}

.form-actions{
  display:flex;
  justify-content:space-between;
  gap:14px;
  margin-top:6px;
}

.form-actions.single{
  justify-content:flex-end;
}

.btn-primary,
.btn-secondary{
  min-height:52px;
  padding:0 24px;
  border-radius:999px;
  border:none;
  font-weight:800;
  cursor:pointer;
  transition:.25s ease;
}

.btn-primary{
  background:var(--voxa-accent);
  color:#fff;
}

.btn-secondary{
  background:#f8fbff;
  color:var(--voxa-blue);
  border:1px solid rgba(15,23,42,.08);
}

.btn-primary:hover,
.btn-secondary:hover{
  transform:translateY(-2px);
}

.btn-primary:disabled,
.btn-secondary:disabled{
  opacity:.45;
  cursor:not-allowed;
  transform:none;
}

.fade-enter-active,
.fade-leave-active{
  transition:.3s;
}

.fade-enter-from,
.fade-leave-to{
  opacity:0;
}

@media(max-width:900px){
  .option-grid,
  .choice-grid,
  .industry-grid,
  .size-grid,
  .feature-grid{
    grid-template-columns:repeat(2,minmax(0,1fr));
  }
}

@media(max-width:768px){
  .overlay{
    padding:16px;
  }

  .modal{
    padding:26px;
    border-radius:20px;
  }

  .step-panel,
  .option-grid,
  .feature-grid,
  .choice-grid,
  .industry-grid,
  .size-grid{
    grid-template-columns:1fr;
  }

  .phone-row{
    grid-template-columns:105px minmax(0,1fr);
  }

  .progress-row,
  .form-actions{
    align-items:stretch;
    flex-direction:column;
  }

  .form-actions.single{
    align-items:stretch;
  }
}
</style>
