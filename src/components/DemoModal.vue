<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="isOpen"
        class="overlay"
        @click.self="closeModal"
      >
        <div class="modal">
          <button
            class="close"
            type="button"
            aria-label="Close modal"
            @click="closeModal"
          >
            X
          </button>

          <aside class="modal-story">
            <div class="modal-brand" aria-hidden="true">
              <i class="modal-brand-dot"></i>
              <span>Voxa</span>
            </div>

            <div class="modal-header">
              <div>
                <span class="eyebrow">{{ props.mode === 'waitlist' ? `Step ${stepIndex + 1} of ${waitlistSteps.length}` : modalCopy.eyebrow }}</span>
                <h2>{{ modalCopy.title }}</h2>
              </div>
            </div>

            <p class="intro">
              {{ modalCopy.intro }}
            </p>

            <div v-if="props.mode === 'waitlist'" class="story-steps" :aria-label="`Step ${stepIndex + 1} of ${waitlistSteps.length}`">
              <div v-for="(label, index) in waitlistSteps" :key="label" :class="{ active: index <= stepIndex }">
                <span>{{ index + 1 }}</span>
                <small>{{ label }}</small>
              </div>
            </div>

          </aside>

          <div class="modal-content">

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

              <label class="wide phone-field">
                <span>Phone number</span>
                <div class="phone-row">
                  <div class="country-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (countryMenuOpen = false)">
                    <button class="country-select-trigger" type="button" aria-label="Country calling code" :aria-expanded="countryMenuOpen" @click="countryMenuOpen = !countryMenuOpen" @keydown.esc.stop="countryMenuOpen = false">
                      <span>{{ selectedCountry.flag }}</span><strong>{{ selectedCountry.code }}</strong><i></i>
                    </button>
                    <div v-if="countryMenuOpen" class="country-select-menu" role="listbox" aria-label="Country calling code">
                      <button v-for="country in countryCodeOptions" :key="`${country.flag}-${country.code}`" type="button" role="option" :aria-selected="form.countryFlag === country.flag" @click="selectCountry(country)">
                        <span>{{ country.flag }}</span><span class="country-select-name">{{ country.name }}</span><strong>{{ country.code }}</strong>
                      </button>
                    </div>
                  </div>
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
              <div class="field-block wide dropdown-field" :class="{ 'is-open': industryMenuOpen }">
                <span class="field-title">Industry</span>
                <div class="option-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (industryMenuOpen = false)">
                  <button class="option-select-trigger" type="button" aria-label="Industry" :aria-expanded="industryMenuOpen" @click="industryMenuOpen = !industryMenuOpen" @keydown.esc.stop="industryMenuOpen = false">
                    <span :class="{ placeholder: !form.industry }">{{ selectedIndustryLabel }}</span><i></i>
                  </button>
                  <div v-if="industryMenuOpen" class="option-select-menu" role="listbox" aria-label="Industry">
                    <button v-for="type in businessTypeOptions" :key="type.value" type="button" role="option" :aria-selected="form.industry === type.value" @click="selectIndustry(type.value)">
                      <span>{{ type.label }}</span><b v-if="form.industry === type.value">✓</b>
                    </button>
                  </div>
                </div>
              </div>

              <label v-if="form.industry === 'other'" class="wide">
                <span>Enter your industry</span>
                <input v-model.trim="form.otherIndustry" type="text" placeholder="For example, Manufacturing" maxlength="100" required>
              </label>

              <div class="field-block wide dropdown-field" :class="{ 'is-open': employeeMenuOpen }">
                <span class="field-title">Employee count</span>
                <div class="option-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (employeeMenuOpen = false)">
                  <button class="option-select-trigger" type="button" aria-label="Employee count" :aria-expanded="employeeMenuOpen" @click="employeeMenuOpen = !employeeMenuOpen" @keydown.esc.stop="employeeMenuOpen = false">
                    <span :class="{ placeholder: !form.companySize }">{{ selectedEmployeeLabel }}</span><i></i>
                  </button>
                  <div v-if="employeeMenuOpen" class="option-select-menu employee-select-menu" role="listbox" aria-label="Employee count">
                    <button v-for="size in teamSizeOptions" :key="size.value" type="button" role="option" :aria-selected="form.companySize === size.value" @click="selectEmployeeCount(size.value)">
                      <span>{{ size.label }}</span><b v-if="form.companySize === size.value">✓</b>
                    </button>
                  </div>
                </div>
              </div>

              <label class="wide">
                <span>What do you want Voxa to take off your plate?</span>
                <textarea
                  v-model.trim="form.useCase"
                  rows="4"
                  placeholder="Example: answer order calls, check stock, confirm delivery times, and update our team"
                  required
                ></textarea>
              </label>
            </section>

            <section
              v-show="stepIndex === 2"
              class="step-panel"
            >
              <div class="field-block wide dropdown-field" :class="{ 'is-open': pricingMenuOpen }">
                <span class="field-title">Preferred pricing</span>
                <div class="option-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (pricingMenuOpen = false)">
                  <button class="option-select-trigger" type="button" aria-label="Preferred pricing" :aria-expanded="pricingMenuOpen" @click="pricingMenuOpen = !pricingMenuOpen" @keydown.esc.stop="pricingMenuOpen = false">
                    <span :class="{ placeholder: !form.pricing }">{{ selectedPricingLabel }}</span><i></i>
                  </button>
                  <div v-if="pricingMenuOpen" class="option-select-menu pricing-select-menu" role="listbox" aria-label="Preferred pricing">
                    <button v-for="price in pricingOptions" :key="price.value" type="button" role="option" :aria-selected="form.pricing === price.value" @click="selectPricing(price.value)">
                      <span class="pricing-option-copy"><strong>{{ price.label }}</strong><small>{{ price.helper }}</small></span><b v-if="form.pricing === price.value">✓</b>
                    </button>
                  </div>
                </div>
              </div>

              <div class="field-block wide dropdown-field" :class="{ 'is-open': timelineMenuOpen }">
                <span class="field-title">Launch timeline</span>
                <div class="option-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (timelineMenuOpen = false)">
                  <button class="option-select-trigger" type="button" aria-label="Launch timeline" :aria-expanded="timelineMenuOpen" @click="timelineMenuOpen = !timelineMenuOpen" @keydown.esc.stop="timelineMenuOpen = false">
                    <span :class="{ placeholder: !form.adoptionTimeline }">{{ selectedTimelineLabel }}</span><i></i>
                  </button>
                  <div v-if="timelineMenuOpen" class="option-select-menu" role="listbox" aria-label="Launch timeline">
                    <button v-for="timeline in timelineOptions" :key="timeline.value" type="button" role="option" :aria-selected="form.adoptionTimeline === timeline.value" @click="selectTimeline(timeline.value)">
                      <span>{{ timeline.label }}</span><b v-if="form.adoptionTimeline === timeline.value">✓</b>
                    </button>
                  </div>
                </div>
              </div>

              <div class="field-block wide dropdown-field" :class="{ 'is-open': featureMenuOpen }">
                <span class="field-title">Must-have features</span>
                <div class="option-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (featureMenuOpen = false)">
                  <button class="option-select-trigger feature-select-trigger" type="button" aria-label="Must-have features" :aria-expanded="featureMenuOpen" @click="featureMenuOpen = !featureMenuOpen" @keydown.esc.stop="featureMenuOpen = false">
                    <span :class="{ placeholder: !form.features.length }">{{ selectedFeaturesLabel }}</span><i></i>
                  </button>
                  <div v-if="featureMenuOpen" class="option-select-menu feature-select-menu" role="listbox" aria-label="Must-have features" aria-multiselectable="true">
                    <button v-for="feature in featureOptions" :key="feature.value" type="button" role="option" :aria-selected="form.features.includes(feature.value)" :disabled="featureDisabled(feature.value)" @click="toggleFeature(feature.value)">
                      <span>{{ feature.label }}</span><b v-if="form.features.includes(feature.value)">✓</b>
                    </button>
                    <div class="custom-feature-entry">
                      <input
                        v-model.trim="form.customFeature"
                        type="text"
                        maxlength="100"
                        placeholder="Add your own feature"
                        aria-label="Custom feature"
                        @keydown.enter.prevent="addCustomFeature"
                      >
                      <button type="button" :disabled="!canAddCustomFeature" @click="addCustomFeature">Add</button>
                    </div>
                  </div>
                </div>

                <div v-if="form.features.length" class="selected-feature-list" aria-label="Selected features">
                  <span v-for="feature in form.features" :key="feature">
                    {{ featureLabel(feature) }}
                    <button type="button" :aria-label="`Remove ${featureLabel(feature)}`" @click="toggleFeature(feature)">×</button>
                  </span>
                </div>

                <small>
                  Choose up to {{ featureLimit }}.
                </small>
              </div>

              <label class="wide">
                <span>What would make this useful for you?</span>
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
                {{ isSubmitting ? "Joining" : "Join Waitlist" }}
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

              <label class="wide phone-field">
                <span>Phone number</span>
                <div class="phone-row">
                  <div class="country-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (countryMenuOpen = false)">
                    <button class="country-select-trigger" type="button" aria-label="Country calling code" :aria-expanded="countryMenuOpen" @click="countryMenuOpen = !countryMenuOpen" @keydown.esc.stop="countryMenuOpen = false">
                      <span>{{ selectedCountry.flag }}</span><strong>{{ selectedCountry.code }}</strong><i></i>
                    </button>
                    <div v-if="countryMenuOpen" class="country-select-menu" role="listbox" aria-label="Country calling code">
                      <button v-for="country in countryCodeOptions" :key="`sales-${country.flag}-${country.code}`" type="button" role="option" :aria-selected="form.countryFlag === country.flag" @click="selectCountry(country)">
                        <span>{{ country.flag }}</span><span class="country-select-name">{{ country.name }}</span><strong>{{ country.code }}</strong>
                      </button>
                    </div>
                  </div>
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

              <div class="field-block wide dropdown-field" :class="{ 'is-open': industryMenuOpen }">
                <span class="field-title">Industry</span>
                <div class="option-select" @focusout="!$event.currentTarget.contains($event.relatedTarget) && (industryMenuOpen = false)">
                  <button class="option-select-trigger" type="button" aria-label="Industry" :aria-expanded="industryMenuOpen" @click="industryMenuOpen = !industryMenuOpen" @keydown.esc.stop="industryMenuOpen = false">
                    <span :class="{ placeholder: !form.industry }">{{ selectedIndustryLabel }}</span><i></i>
                  </button>
                  <div v-if="industryMenuOpen" class="option-select-menu" role="listbox" aria-label="Industry">
                    <button v-for="type in businessTypeOptions" :key="`sales-${type.value}`" type="button" role="option" :aria-selected="form.industry === type.value" @click="selectIndustry(type.value)">
                      <span>{{ type.label }}</span><b v-if="form.industry === type.value">✓</b>
                    </button>
                  </div>
                </div>
              </div>

              <label v-if="form.industry === 'other'" class="wide">
                <span>Enter your industry</span>
                <input v-model.trim="form.otherIndustry" type="text" placeholder="For example, medical distribution" maxlength="100" required>
              </label>

              <label class="wide">
                <span>What do you want Voxa to take off your plate?</span>
                <textarea
                  v-model.trim="form.message"
                  rows="5"
                  placeholder="Example: answer order calls, check stock, confirm delivery times, and update our team"
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
                {{ isSubmitting ? "Requesting" : "Request My Demo" }}
              </button>
            </div>
          </form>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"

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
  { name: "India", flag: "🇮🇳", code: "+91" }, { name: "United States", flag: "🇺🇸", code: "+1" },
  { name: "Canada", flag: "🇨🇦", code: "+1" }, { name: "United Kingdom", flag: "🇬🇧", code: "+44" },
  { name: "Australia", flag: "🇦🇺", code: "+61" }, { name: "Singapore", flag: "🇸🇬", code: "+65" },
  { name: "United Arab Emirates", flag: "🇦🇪", code: "+971" }, { name: "Germany", flag: "🇩🇪", code: "+49" },
  { name: "France", flag: "🇫🇷", code: "+33" }, { name: "Netherlands", flag: "🇳🇱", code: "+31" },
  { name: "Mexico", flag: "🇲🇽", code: "+52" }, { name: "Brazil", flag: "🇧🇷", code: "+55" }
]

const countryMenuOpen = ref(false)
const selectedCountry = computed(() => countryCodeOptions.find(country => country.flag === form.value.countryFlag) || countryCodeOptions[0])
const selectCountry = (country) => {
  form.value.countryCode = country.code
  form.value.countryFlag = country.flag
  countryMenuOpen.value = false
}

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
  { label: "1 employee", value: "just-me" },
  { label: "2-10 employees", value: "2-10" },
  { label: "11-50 employees", value: "11-50" },
  { label: "51-200 employees", value: "51-200" },
  { label: "200+ employees", value: "200-plus" }
]

const industryMenuOpen = ref(false)
const employeeMenuOpen = ref(false)
const selectedIndustryLabel = computed(() =>
  businessTypeOptions.find(option => option.value === form.value.industry)?.label || "Select industry"
)
const selectedEmployeeLabel = computed(() =>
  teamSizeOptions.find(option => option.value === form.value.companySize)?.label || "Select employee count"
)
const selectIndustry = (value) => {
  form.value.industry = value
  if (value !== "other") form.value.otherIndustry = ""
  industryMenuOpen.value = false
}
const selectEmployeeCount = (value) => {
  form.value.companySize = value
  employeeMenuOpen.value = false
}

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

const pricingMenuOpen = ref(false)
const timelineMenuOpen = ref(false)
const featureMenuOpen = ref(false)
const selectedPricingLabel = computed(() =>
  pricingOptions.find(option => option.value === form.value.pricing)?.label || "Select preferred pricing"
)
const selectedTimelineLabel = computed(() =>
  timelineOptions.find(option => option.value === form.value.adoptionTimeline)?.label || "Select launch timeline"
)
const selectedFeaturesLabel = computed(() => {
  if (!form.value.features.length) return "Select features"
  return form.value.features.map(featureLabel).join(", ")
})
const featureLabel = (value) => {
  if (value.startsWith("custom:")) return value.slice(7)
  return optionLabel(featureOptions, value)
}
const canAddCustomFeature = computed(() => {
  const label = form.value.customFeature.trim()
  if (!label || form.value.features.length >= featureLimit) return false
  return !form.value.features.some(feature => featureLabel(feature).toLowerCase() === label.toLowerCase())
})
const selectPricing = (value) => {
  form.value.pricing = value
  pricingMenuOpen.value = false
}
const selectTimeline = (value) => {
  form.value.adoptionTimeline = value
  timelineMenuOpen.value = false
}
const toggleFeature = (value) => {
  const index = form.value.features.indexOf(value)
  if (index >= 0) {
    form.value.features.splice(index, 1)
  } else if (form.value.features.length < featureLimit) {
    form.value.features.push(value)
  }
}
const addCustomFeature = () => {
  if (!canAddCustomFeature.value) return
  form.value.features.push(`custom:${form.value.customFeature.trim()}`)
  form.value.customFeature = ""
}

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
  countryCode: "+91",
  countryFlag: "🇮🇳",
  phoneNumber: "",
  industry: "",
  otherIndustry: "",
  companySize: "",
  useCase: "",
  pricing: "",
  adoptionTimeline: "",
  features: [],
  customFeature: "",
  message: ""
})

const stepIndex = ref(0)
const form = ref(emptyForm())
const registrationId = ref("")
const isSubmitting = ref(false)
const submitError = ref("")
const successMessage = ref("")

let pageScrollLock = null

const lockPageScroll = () => {
  if (pageScrollLock || typeof document === "undefined") return

  const body = document.body
  const root = document.documentElement
  const scrollY = window.scrollY
  const scrollbarWidth = Math.max(0, window.innerWidth - root.clientWidth)

  pageScrollLock = {
    scrollY,
    bodyOverflow: body.style.overflow,
    bodyPosition: body.style.position,
    bodyTop: body.style.top,
    bodyWidth: body.style.width,
    bodyPaddingRight: body.style.paddingRight,
    rootOverflow: root.style.overflow,
    rootScrollBehavior: root.style.scrollBehavior
  }

  root.style.overflow = "hidden"
  root.style.scrollBehavior = "auto"
  body.style.overflow = "hidden"
  body.style.position = "fixed"
  body.style.top = `-${scrollY}px`
  body.style.width = "100%"
  if (scrollbarWidth) body.style.paddingRight = `${scrollbarWidth}px`
}

const unlockPageScroll = () => {
  if (!pageScrollLock || typeof document === "undefined") return

  const body = document.body
  const root = document.documentElement
  const saved = pageScrollLock
  pageScrollLock = null

  body.style.overflow = saved.bodyOverflow
  body.style.position = saved.bodyPosition
  body.style.top = saved.bodyTop
  body.style.width = saved.bodyWidth
  body.style.paddingRight = saved.bodyPaddingRight
  root.style.overflow = saved.rootOverflow
  root.style.scrollBehavior = "auto"
  window.scrollTo(0, saved.scrollY)
  root.style.scrollBehavior = saved.rootScrollBehavior
}

const modalCopy = computed(() => {
  if (props.mode === "sales") {
    return {
      eyebrow: "GET A DEMO",
      title: "Get a tailored Voxa demo",
      intro: "Tell us what you want to automate and we'll help map the right Voxa setup for your business"
    }
  }

  return {
    eyebrow: "JOIN THE WAITLIST",
    title: "Join the Voxa waitlist",
    intro: "Share the basics now, and we will use this to prioritize early access and the first Voxa launch packages"
  }
})

const successDetail = computed(() =>
  props.mode === "sales"
    ? "Your sales inquiry was saved in the backend"
    : "Your waitlist registration and preferences were saved in the backend"
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
  Boolean(
    form.value.industry &&
    (form.value.industry !== "other" || form.value.otherIndustry.trim()) &&
    form.value.companySize &&
    form.value.useCase
  )
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
    (form.value.industry !== "other" || form.value.otherIndustry.trim()) &&
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
    const details = Array.isArray(body.details) ? ` ${body.details.join(", ")}` : ""
    throw new Error(`${body.error || "Request failed"}${details}`)
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
      businessTypeLabel: form.value.industry === "other"
        ? form.value.otherIndustry
        : optionLabel(businessTypeOptions, form.value.industry),
      otherIndustry: form.value.industry === "other" ? form.value.otherIndustry : undefined,
      companySizeLabel: optionLabel(teamSizeOptions, form.value.companySize),
      pricingLabel: optionLabel(pricingOptions, form.value.pricing),
      selectedFeatures: form.value.features.map(featureLabel),
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
  countryMenuOpen.value = false
  industryMenuOpen.value = false
  employeeMenuOpen.value = false
  pricingMenuOpen.value = false
  timelineMenuOpen.value = false
  featureMenuOpen.value = false
}

const closeModal = () => {
  emit("close")
  resetForm()
}

const friendlyError = (error) => {
  const message = error instanceof Error ? error.message : "Something went wrong"

  if (message.includes("already on the waitlist")) {
    return "That email is already on the waitlist, use another email or call sales if you want to talk now"
  }

  if (message.includes("Failed to fetch")) {
    return "I could not reach the backend, make sure the API server is running on port 8787"
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
      successMessage.value = "Sales request received"
    } else {
      await submitWaitlist()
      successMessage.value = "You are on the Voxa waitlist"
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
      lockPageScroll()
      resetForm()
    } else {
      unlockPageScroll()
    }
  },
  { immediate: true }
)

onBeforeUnmount(unlockPageScroll)
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
  position:relative;
  z-index:30;
  display:grid;
  grid-template-columns:120px minmax(0,1fr);
  gap:10px;
}

.phone-row select,
.phone-row input{
  margin:0;
}

.country-select{
  position:relative;
  z-index:40;
  min-width:0;
}

.phone-field{
  position:relative;
  z-index:100;
}

.country-select-trigger{
  display:grid;
  width:100%;
  min-height:52px;
  grid-template-columns:auto 1fr auto;
  align-items:center;
  gap:8px;
  padding:0 13px;
  border:1px solid rgba(15,23,42,.10);
  border-radius:14px;
  color:var(--voxa-blue);
  background:#f8fbff;
  font:inherit;
  cursor:pointer;
}

.country-select-trigger strong{ font-weight:700; text-align:left; }
.country-select-trigger i{
  width:8px;
  height:8px;
  border-right:2px solid currentColor;
  border-bottom:2px solid currentColor;
  transform:rotate(45deg) translateY(-2px);
}

.country-select-menu{
  position:absolute;
  z-index:50;
  top:auto;
  bottom:calc(100% + 6px);
  left:0;
  width:270px;
  max-height:220px;
  overflow-y:auto;
  padding:6px;
  border:1px solid rgba(15,23,42,.12);
  border-radius:10px;
  background:#fff;
  box-shadow:0 18px 44px rgba(15,23,42,.2);
}

.country-select-menu button{
  display:grid;
  width:100%;
  grid-template-columns:26px minmax(0,1fr) auto;
  align-items:center;
  gap:8px;
  min-height:40px;
  padding:0 10px;
  border:0;
  border-radius:7px;
  color:#475569;
  background:#fff;
  font:inherit;
  text-align:left;
  cursor:pointer;
}

.country-select-menu button:hover,
.country-select-menu button[aria-selected="true"]{
  color:#14264d;
  background:#eef2f8;
}

.country-select-name{
  overflow:hidden;
  font-size:13px;
  font-weight:700;
  text-overflow:ellipsis;
  white-space:nowrap;
}

.country-select-menu strong{ color:inherit; font-size:13px; }

.dropdown-field{
  position:relative;
  z-index:1;
}
.dropdown-field.is-open{ z-index:200; }
.option-select{ position:relative; }
.option-select-trigger{
  display:grid;
  width:100%;
  min-height:48px;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:center;
  gap:12px;
  padding:0 14px;
  border:1px solid rgba(15,23,42,.12);
  border-radius:8px;
  color:#14264d;
  background:#fff;
  font:inherit;
  text-align:left;
  cursor:pointer;
}
.option-select-trigger span{ overflow:hidden; font-weight:700; text-overflow:ellipsis; white-space:nowrap; }
.feature-select-trigger{ min-height:54px; padding-top:9px; padding-bottom:9px; }
.feature-select-trigger span{ overflow:visible; line-height:1.45; text-overflow:clip; white-space:normal; }
.option-select-trigger .placeholder{ color:#94a3b8; font-weight:500; }
.option-select-trigger i{
  width:8px;
  height:8px;
  border-right:2px solid currentColor;
  border-bottom:2px solid currentColor;
  transform:rotate(45deg) translateY(-2px);
}
.option-select-trigger:focus{
  border-color:#14264d;
  box-shadow:0 0 0 4px rgba(20,38,77,.1);
  outline:none;
}
.option-select-menu{
  position:absolute;
  z-index:210;
  top:calc(100% + 6px);
  right:0;
  left:0;
  max-height:210px;
  overflow-y:auto;
  padding:6px;
  border:1px solid rgba(15,23,42,.12);
  border-radius:10px;
  background:#fff;
  box-shadow:0 18px 44px rgba(15,23,42,.18);
}
.option-select-menu button{
  display:grid;
  width:100%;
  min-height:40px;
  grid-template-columns:minmax(0,1fr) auto;
  align-items:center;
  gap:12px;
  padding:0 10px;
  border:0;
  border-radius:7px;
  color:#475569;
  background:#fff;
  font:inherit;
  font-size:13px;
  font-weight:700;
  text-align:left;
  cursor:pointer;
}
.option-select-menu button:hover,
.option-select-menu button[aria-selected="true"]{
  color:#14264d;
  background:#eef2f8;
}
.option-select-menu b{ color:#14264d; }
.employee-select-menu{ max-height:260px; }
.pricing-select-menu{ max-height:240px; }
.pricing-select-menu button{ min-height:54px; }
.pricing-option-copy{
  display:grid;
  gap:2px;
}
.pricing-option-copy strong{
  color:inherit;
  font-size:13px;
}
.pricing-option-copy small{
  color:#64748b;
  font-size:11px;
  font-weight:500;
  line-height:1.35;
}
.feature-select-menu button:disabled{
  color:#a8b3c4;
  cursor:not-allowed;
  background:#fff;
}
.custom-feature-entry{
  display:grid;
  grid-template-columns:minmax(0,1fr) auto;
  gap:8px;
  margin-top:6px;
  padding:10px 6px 4px;
  border-top:1px solid rgba(15,23,42,.1);
}
.custom-feature-entry input{
  width:100%;
  min-height:40px;
  padding:0 10px;
  border:1px solid rgba(15,23,42,.14);
  border-radius:7px;
  color:#14264d;
  background:#fff;
  font:inherit;
  font-size:13px;
}
.custom-feature-entry button{
  width:auto;
  min-height:40px;
  padding:0 14px;
  color:#fff;
  background:#14264d;
}
.custom-feature-entry button:hover{ color:#fff; background:#203969; }
.custom-feature-entry button:disabled{ color:#8f9aab; background:#eef1f5; cursor:not-allowed; }
.selected-feature-list{
  display:flex;
  flex-wrap:wrap;
  gap:7px;
  margin-top:9px;
}
.selected-feature-list > span{
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:6px 8px 6px 10px;
  border:1px solid rgba(20,38,77,.12);
  border-radius:999px;
  color:#314261;
  background:#f7f9fc;
  font-size:11px;
  font-weight:700;
}
.selected-feature-list button{
  width:18px;
  height:18px;
  padding:0;
  border:0;
  border-radius:50%;
  color:#63708a;
  background:rgba(20,38,77,.08);
  font:inherit;
  line-height:1;
  cursor:pointer;
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
  position:relative;
  z-index:1;
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

/* Split lead-flow layout */
.overlay{
  padding:24px;
  background:rgba(8,9,11,.78);
  backdrop-filter:blur(10px);
}

.modal{
  --lead-accent:#14264d;
  --lead-accent-rgb:20,38,77;
  position:relative;
  display:grid;
  grid-template-columns:minmax(290px,.8fr) minmax(430px,1.2fr);
  width:min(900px,100%);
  height:min(560px,calc(100vh - 48px));
  min-height:0;
  max-height:calc(100vh - 48px);
  overflow:hidden;
  padding:0;
  border:1px solid rgba(255,255,255,.68);
  border-radius:22px;
  box-shadow:0 32px 100px rgba(0,0,0,.38);
}

.close{
  position:absolute;
  z-index:4;
  top:20px;
  right:20px;
  width:36px;
  height:36px;
  background:#f4f7fb;
}

.modal-story{
  position:relative;
  display:flex;
  min-width:0;
  flex-direction:column;
  padding:30px 34px 28px;
  overflow:hidden;
  border-right:1px solid rgba(15,23,42,.08);
  background:#f8fbff;
}

.modal-story::after{
  position:absolute;
  right:-62px;
  bottom:-78px;
  width:210px;
  height:210px;
  border:1px solid rgba(var(--lead-accent-rgb),.12);
  border-radius:50%;
  content:"";
}

.modal-brand{
  display:flex;
  align-items:center;
  gap:10px;
  color:var(--lead-accent);
  font-size:18px;
  font-weight:800;
}

.modal-brand-dot{
  width:8px;
  height:8px;
  flex:0 0 auto;
  border-radius:50%;
  background:var(--lead-accent);
  box-shadow:0 0 18px rgba(var(--lead-accent-rgb),.28);
}

.modal-header{
  display:block;
  margin:34px 0 0;
}

.eyebrow{
  margin:0 0 12px;
  color:var(--lead-accent);
  font-family:"Inter",sans-serif;
  letter-spacing:0;
  text-transform:none;
}

.modal h2{
  max-width:310px;
  color:var(--lead-accent);
  font-size:clamp(31px,3.5vw,38px);
  letter-spacing:-.035em;
}

.intro{
  max-width:290px;
  margin:12px 0 0;
  color:#64748b;
  font-size:14px;
  line-height:1.6;
}

.story-steps{
  position:relative;
  display:grid;
  gap:18px;
  margin-top:30px;
  padding-top:4px;
}

.story-steps::before{
  position:absolute;
  top:18px;
  bottom:0;
  left:13px;
  width:2px;
  border-radius:2px;
  background:#dce4ef;
  content:"";
}

.story-steps div{
  position:relative;
  z-index:1;
  display:grid;
  grid-template-columns:28px 1fr;
  align-items:center;
  gap:10px;
  color:#94a3b8;
}

.story-steps span{
  display:grid;
  width:28px;
  height:28px;
  place-items:center;
  border:2px solid #dce4ef;
  border-radius:50%;
  color:#64748b;
  background:#f8fbff;
  font-size:11px;
  font-weight:800;
}

.story-steps small{ font-size:12px; font-weight:800; }
.story-steps div.active{ color:var(--lead-accent); }
.story-steps div.active span{
  border-color:var(--lead-accent);
  color:#fff;
  background:var(--lead-accent);
  box-shadow:0 0 0 5px rgba(var(--lead-accent-rgb),.1);
}

.modal-content{
  min-width:0;
  height:100%;
  max-height:none;
  overflow-y:auto;
  padding:32px 38px 26px;
  background:#fff;
}

.modal-content .form{ min-height:100%; gap:14px; }
.modal-content .progress-row{ display:none; }
.modal-content .step-panel{
  position:relative;
  z-index:10;
  grid-template-columns:1fr;
  gap:13px;
  padding:0;
  isolation:auto;
  content-visibility:visible;
  contain-intrinsic-size:auto;
}
.modal-content label.wide,
.modal-content .field-block.wide{ grid-column:auto; }

.form input,
.form textarea,
.form select{
  min-height:44px;
  padding:10px 13px;
  border-radius:8px;
  background:#fff;
}

.modal .country-select-trigger{
  min-height:44px;
  border-radius:8px;
  color:var(--lead-accent);
  background:#fff;
}
.modal .country-select-trigger:focus{
  border-color:var(--lead-accent);
  box-shadow:0 0 0 4px rgba(var(--lead-accent-rgb),.1);
  outline:none;
}

.modal-content label,
.modal-content .field-block{ gap:6px; }

.modal .form input:focus,
.modal .form textarea:focus,
.modal .form select:focus{
  border-color:var(--lead-accent);
  background:#fff;
  box-shadow:0 0 0 4px rgba(var(--lead-accent-rgb),.1);
}

.modal .form input:-webkit-autofill,
.modal .form input:-webkit-autofill:hover,
.modal .form input:-webkit-autofill:focus{
  -webkit-text-fill-color:var(--lead-accent);
  box-shadow:0 0 0 1000px #fff inset;
  transition:background-color 9999s ease-out 0s;
}

.choice-grid,
.industry-grid,
.size-grid,
.timeline-grid{ grid-template-columns:repeat(3,minmax(0,1fr)); }
.option-grid,
.feature-grid{ grid-template-columns:repeat(2,minmax(0,1fr)); }
.choice-pill,
.option-card{ border-radius:8px; }

.modal .choice-pill:hover{ border-color:rgba(var(--lead-accent-rgb),.4); }
.modal .choice-pill.active,
.modal .option-card.active{
  border-color:var(--lead-accent);
  background:rgba(var(--lead-accent-rgb),.07);
  box-shadow:0 8px 20px rgba(var(--lead-accent-rgb),.1);
}
.modal .choice-pill.active span,
.modal .option-card.active span,
.modal .option-card.active strong{ color:var(--lead-accent); }

.form-actions{
  align-items:center;
  margin-top:auto;
  padding-top:16px;
}

.btn-primary,
.btn-secondary{
  min-height:50px;
  border-radius:8px;
}

.btn-primary{ min-width:210px; background:var(--lead-accent); box-shadow:0 12px 26px rgba(var(--lead-accent-rgb),.2); }
.btn-secondary{ background:#fff; }

.success-card{
  align-content:center;
  min-height:480px;
  padding:0;
  border:0;
  background:#fff;
}

@media(max-width:820px){
  .overlay{ align-items:flex-start; padding:12px; overflow-y:auto; }
  .modal{ grid-template-columns:1fr; height:auto; min-height:0; max-height:none; border-radius:16px; }
  .modal-story{ padding:24px; border-right:0; border-bottom:1px solid rgba(15,23,42,.08); }
  .modal-header{ margin-top:30px; }
  .modal h2{ max-width:560px; font-size:32px; }
  .intro{ max-width:560px; margin-top:12px; }
  .story-steps{ grid-template-columns:repeat(3,1fr); gap:8px; margin-top:26px; padding:0; }
  .story-steps::before{ top:13px; right:14%; bottom:auto; left:14%; width:auto; height:2px; }
  .story-steps div{ grid-template-columns:28px; justify-content:center; gap:7px; text-align:center; }
  .story-steps small{ font-size:10px; }
  .modal-content{ max-height:none; overflow:visible; padding:30px 24px 26px; }
  .modal-content .form{ min-height:430px; }
}

@media(max-width:520px){
  .overlay{ padding:0; background:#fff; }
  .modal{ min-height:100vh; border:0; border-radius:0; box-shadow:none; }
  .modal-story{ padding:22px 20px 20px; }
  .modal-header{ margin-top:28px; }
  .modal h2{ padding-right:26px; font-size:29px; }
  .modal-content{ padding:26px 20px 30px; }
  .choice-grid,
  .industry-grid,
  .size-grid,
  .timeline-grid,
  .option-grid,
  .feature-grid{ grid-template-columns:1fr; }
  .phone-row{ grid-template-columns:96px minmax(0,1fr); gap:8px; }
  .form-actions{ align-items:stretch; flex-direction:column-reverse; }
  .form-actions.single{ align-items:stretch; }
  .btn-primary{ width:100%; min-width:0; }
}
</style>
