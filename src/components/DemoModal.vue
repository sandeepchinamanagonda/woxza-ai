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
              <span>Woxza</span>
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

          <div class="modal-content" @wheel.stop>

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
                <span>Company name</span>
                <input
                  v-model.trim="form.company"
                  autocomplete="organization"
                  placeholder="Business name"
                  required
                >
              </label>
              <label class="wide">
                <span>Your role in the company</span>
                <FormDropdown v-model="form.role" :options="roleOptions" label="Your role in the company" placeholder="Select your role" />
              </label>

              <label class="wide">
                <span>Select your industry</span>
                <FormDropdown v-model="form.industry" :options="businessTypeOptions" label="Select your industry" placeholder="Select industry" />
              </label>

              <label class="wide">
                <span>Company size</span>
                <FormDropdown v-model="form.companySize" :options="teamSizeOptions" label="Company size" placeholder="Select company size" />
              </label>
            </section>

            <section v-show="stepIndex === 1" class="step-panel">
              <label class="wide"><span>What would you like Woxza to help you with?</span><MultiSelectDropdown v-model="form.helpWith" :options="helpOptions" label="Ways Woxza can help" placeholder="Select one or more" /></label>

              <label class="wide"><span>What's the biggest challenge you're trying to solve?</span><MultiSelectDropdown v-model="form.biggestChallenges" :options="challengeOptions" label="Biggest challenges" placeholder="Select one or more" /></label>
              <label class="wide"><span>How are customer calls handled today?</span><MultiSelectDropdown v-model="form.callHandlings" :options="callHandlingOptions" label="Current call handling" placeholder="Select one or more" /></label>

              <label class="wide"><span>Which software does your business currently use?</span><MultiSelectDropdown v-model="form.software" :options="softwareOptions" label="Business software" placeholder="Select one or more" /></label>

              <label class="wide"><span>Approximately how many customer calls does your business receive each day?</span><MultiSelectDropdown v-model="form.dailyCalls" :options="dailyCallOptions" label="Daily call volume" placeholder="Select one or more" /></label>
            </section>

            <section v-show="stepIndex === 2" class="step-panel">
              <label class="wide"><span>If Woxza could do one thing perfectly for your business, what would it be?</span><textarea v-model.trim="form.onePerfectThing" rows="4" placeholder="For example: Answer every incoming call, qualify leads, book appointments, update our CRM, and follow up with customers automatically." required></textarea></label>

              <label class="wide"><span>Which capabilities matter most to you?</span><MultiSelectDropdown v-model="form.features" :options="featureOptions" label="Required capabilities" placeholder="Select one or more" :max="featureLimit" /></label>

              <label class="wide"><span>When are you planning to implement a Voice AI solution?</span><FormDropdown v-model="form.adoptionTimeline" :options="timelineOptions" label="Implementation timeline" placeholder="Select implementation timeline" /></label>
              <label class="wide"><span>How much of a priority is solving this for your business?</span><FormDropdown v-model="form.pricing" :options="pricingOptions" label="Investment priority" placeholder="Select investment priority" /></label>
              <label class="wide"><span>How did you hear about Woxza?</span><FormDropdown v-model="form.referralSource" :options="referralOptions" label="Referral source" placeholder="Select a source" /></label>
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
                @click="goBack"
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
                <span>What do you want Woxza to take off your plate?</span>
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
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue"
import FormDropdown from "./FormDropdown.vue"
import MultiSelectDropdown from "./MultiSelectDropdown.vue"

const props = defineProps({
  isOpen: Boolean,
  mode: {
    type: String,
    default: "waitlist"
  }
})

const emit = defineEmits(["close"])

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "")
const waitlistSteps = ["About you", "Your business", "Requirements"]
const featureLimit = 16
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
  { label: "Financial services", value: "financial-services" },
  { label: "Insurance", value: "insurance" },
  { label: "Retail", value: "retail" },
  { label: "Ecommerce", value: "ecommerce" },
  { label: "Hospitality", value: "hospitality" },
  { label: "Restaurants", value: "restaurants" },
  { label: "Education", value: "education" },
  { label: "Logistics and supply chain", value: "logistics" },
  { label: "Manufacturing", value: "manufacturing" },
  { label: "Construction", value: "construction" },
  { label: "Automotive", value: "automotive" },
  { label: "Legal", value: "legal" },
  { label: "Accounting and tax", value: "accounting-tax" },
  { label: "Recruitment and staffing", value: "recruitment-staffing" },
  { label: "Home services", value: "home-services" },
  { label: "Beauty and wellness", value: "beauty-wellness" },
  { label: "Travel and tourism", value: "travel-tourism" },
  { label: "Telecommunications", value: "telecommunications" },
  { label: "IT services", value: "it-services" },
  { label: "SaaS", value: "saas" },
  { label: "Marketing agency", value: "marketing-agency" },
  { label: "Government", value: "government" },
  { label: "Non-profit", value: "non-profit" },
  { label: "Other", value: "other" }
]

const teamSizeOptions = [
  { label: "Just me", value: "just-me" }, { label: "2-10", value: "2-10" },
  { label: "11-25", value: "11-25" }, { label: "26-50", value: "26-50" },
  { label: "51-100", value: "51-100" }, { label: "101-250", value: "101-250" },
  { label: "251-500", value: "251-500" }, { label: "501-1000", value: "501-1000" },
  { label: "1000+", value: "1000-plus" }
]

const roleOptions = ["Founder","Co-founder","CEO","COO","Operations Manager","Sales Manager","Customer Success Manager","Customer Support Manager","Marketing Manager","IT / Engineering","Other"].map(label => ({ label, value:label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }))
const helpOptions = ["Answer incoming calls","Book appointments","Customer support","Qualify leads","Make outbound calls","Follow up with customers","Send appointment reminders","Answer FAQs","Route calls to the right person","Update our CRM","Collect customer information","Process orders","Payment reminders","Collect customer feedback","Technical support","HR and recruitment calls","Internal employee support","Other"].map(label => ({ label, value:label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }))
const challengeOptions = ["Missing customer calls","Spending too much time answering repetitive questions","High hiring and staffing costs","Overloaded support team","Inconsistent lead follow-ups","Slow response times","Lack of after-hours support","Too many manual processes","Improving customer experience","Automating business operations","Exploring Voice AI for the business","Other"].map(label => ({ label, value:label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }))
const callHandlingOptions = ["Receptionist","Customer support team","Call center","IVR (Interactive Voice Response)","Employees answer calls directly","Voicemail","No structured process","A combination of the above","Other"].map(label => ({ label, value:label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }))
const softwareOptions = ["Salesforce","HubSpot","Zoho CRM","Pipedrive","Microsoft Dynamics","Freshworks CRM","Twilio","Aircall","RingCentral","Five9","WhatsApp Business","Zendesk","Intercom","Freshdesk","Google Workspace","Microsoft 365","Slack","Microsoft Teams","Calendly","Shopify","WooCommerce","None","Other"].map(label => ({ label, value:label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }))
const dailyCallOptions = [
  { label:"Less than 20", value:"under-20" }, { label:"20-50", value:"20-50" },
  { label:"50-100", value:"50-100" }, { label:"100-300", value:"100-300" },
  { label:"300-1,000", value:"300-1000" }, { label:"More than 1,000", value:"1000-plus" },
  { label:"Not sure", value:"not-sure" }
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
  { label:"Exploring options", value:"under-100" }, { label:"Low priority", value:"100-300" },
  { label:"Moderate priority", value:"300-700" }, { label:"High priority", value:"700-1500" },
  { label:"Strategic priority", value:"1500-3000" }, { label:"Business-critical", value:"3000-plus" },
  { label:"Not sure yet", value:"not-sure" }
]

const timelineOptions = [
  { label: "Immediately", value: "immediately" },
  { label: "Within the next 30 days", value: "within-30-days" },
  { label: "In the next 1-3 months", value: "1-3-months" },
  { label: "In the next 3-6 months", value: "3-6-months" },
  { label: "More than 6 months from now", value: "6-plus-months" },
  { label: "Just exploring", value: "exploring" }
]

const referralOptions = ["Google Search","LinkedIn","Instagram","X (Twitter)","YouTube","Referral","Friend or colleague","Event or conference","Other"].map(label => ({ label, value:label.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") }))

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
  { label: "Human-like conversations", value: "human-like-conversations" },
  { label: "Appointment booking", value: "appointment-booking" },
  { label: "CRM integrations", value: "crm-integrations" },
  { label: "Multilingual support", value: "multilingual-support" },
  { label: "24/7 availability", value: "24-7-availability" },
  { label: "Human handoff to an agent", value: "human-handoff" },
  { label: "Call recording and transcripts", value: "call-recording-transcripts" },
  { label: "Analytics and reporting", value: "analytics-reporting" },
  { label: "Knowledge base integration", value: "knowledge-base-integration" },
  { label: "Custom workflows", value: "custom-workflows" },
  { label: "Outbound calling", value: "outbound-calling" },
  { label: "WhatsApp integration", value: "whatsapp-integration" },
  { label: "Email automation", value: "email-automation" },
  { label: "Existing phone number support", value: "existing-phone-number-support" },
  { label: "Fast response times", value: "fast-response-times" },
  { label: "Other", value: "other" }
]

const emptyForm = () => ({
  firstName: "",
  lastName: "",
  email: "",
  company: "",
  countryCode: "+91",
  countryFlag: "🇮🇳",
  phoneNumber: "",
  role: "",
  industry: "",
  otherIndustry: "",
  companySize: "",
  helpWith: [],
  biggestChallenges: [],
  callHandlings: [],
  software: [],
  dailyCalls: "",
  onePerfectThing: "",
  pricing: "",
  adoptionTimeline: "",
  features: [],
  referralSource: "",
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
      title: "Get a tailored Woxza demo",
      intro: "Tell us what you want to automate and we'll help map the right Woxza setup for your business"
    }
  }

  return {
    eyebrow: "JOIN THE WAITLIST",
    title: "Join the Woxza waitlist",
    intro: "Share the basics now, and we will use this to prioritize early access and the first Woxza launch packages"
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
  Boolean(
    form.value.firstName && form.value.lastName && emailReady.value && phoneReady.value &&
    form.value.company && form.value.role && form.value.industry && form.value.companySize
  )
)

const useCaseReady = computed(() =>
  Boolean(
    form.value.helpWith.length && form.value.biggestChallenges.length && form.value.callHandlings.length &&
    form.value.software.length && form.value.dailyCalls
  )
)

const launchReady = computed(() =>
  Boolean(
    form.value.onePerfectThing && form.value.features.length && form.value.adoptionTimeline &&
    form.value.pricing && form.value.referralSource
  )
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
    const error = new Error(`${body.error || "Request failed"}${details}`)
    error.status = response.status
    throw error
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
    role: form.value.role,
    metadata: {
      source: "website-modal",
      intent,
      businessTypeLabel: form.value.industry === "other"
        ? (form.value.otherIndustry || "Other")
        : optionLabel(businessTypeOptions, form.value.industry),
      otherIndustry: form.value.industry === "other" ? form.value.otherIndustry : undefined,
      role: optionLabel(roleOptions, form.value.role),
      companySizeLabel: optionLabel(teamSizeOptions, form.value.companySize),
      helpWith: form.value.helpWith.map(value => optionLabel(helpOptions, value)),
      biggestChallenges: form.value.biggestChallenges.map(value => optionLabel(challengeOptions, value)),
      callHandlings: form.value.callHandlings.map(value => optionLabel(callHandlingOptions, value)),
      software: form.value.software.map(value => optionLabel(softwareOptions, value)),
      dailyCalls: form.value.dailyCalls.map(value => optionLabel(dailyCallOptions, value)),
      onePerfectThing: form.value.onePerfectThing || undefined,
      selectedCapabilities: form.value.features.map(featureLabel),
      implementationTimeline: optionLabel(timelineOptions, form.value.adoptionTimeline),
      investmentPriority: optionLabel(pricingOptions, form.value.pricing),
      referralSource: optionLabel(referralOptions, form.value.referralSource),
      message: form.value.message || undefined
    }
  }
}

const preferencesPayload = () => ({
  priceRange: form.value.pricing,
  desiredFeatures: form.value.features,
  primaryChallenge: form.value.onePerfectThing,
  adoptionTimeline: form.value.adoptionTimeline,
  teamSize: form.value.companySize
})

const waitlistPayload = () => ({
  ...registrationPayload("waitlist"),
  ...preferencesPayload(),
  helpWith: form.value.helpWith,
  biggestChallenge: form.value.biggestChallenges[0],
  biggestChallenges: form.value.biggestChallenges,
  callHandling: form.value.callHandlings[0],
  callHandlings: form.value.callHandlings,
  software: form.value.software,
  dailyCalls: form.value.dailyCalls,
  referralSource: form.value.referralSource
})

const salesPayload = () => ({
  ...registrationPayload("sales"),
  message: form.value.message
})

const submitWaitlist = async () => {
  try {
    const registration = await postJson("/api/waitlist/registrations/complete", waitlistPayload())
    registrationId.value = registration.registrationId
  } catch (error) {
    // Supports an already-running API during a rolling deployment; it still stores
    // the complete questionnaire in registration metadata and preferences.
    if (error.status !== 404) throw error
    const registration = await postJson("/api/waitlist/registrations", registrationPayload("waitlist"))
    registrationId.value = registration.registrationId
    await postJson(`/api/waitlist/registrations/${registrationId.value}/preferences`, preferencesPayload())
  }
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
  nextTick(() => document.querySelector(".modal-content")?.scrollTo({ top:0, behavior:"auto" }))
}

const goBack = () => {
  submitError.value = ""
  stepIndex.value -= 1
  nextTick(() => document.querySelector(".modal-content")?.scrollTo({ top:0, behavior:"auto" }))
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
      successMessage.value = "You are on the Woxza waitlist"
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
  color:var(--woxza-accent);
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
  color:var(--woxza-blue);
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
  color:var(--woxza-accent);
}

.success-card{
  display:grid;
  gap:14px;
  padding:24px;
  border-radius:18px;
  background:rgba(var(--woxza-accent-rgb),.08);
  border:1px solid rgba(var(--woxza-accent-rgb),.16);
}

.success-card strong{
  color:var(--woxza-blue);
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
  background:var(--woxza-accent);
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
  color:var(--woxza-blue);
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
  border-color:var(--woxza-accent);
  box-shadow:0 0 0 4px rgba(var(--woxza-accent-rgb),.10);
}

.choice-field{
  min-width:0;
  margin:0;
  padding:0;
  border:0;
}

.choice-field legend{
  margin-bottom:9px;
  color:#475569;
  font-size:13px;
  font-weight:800;
}

.choice-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:8px;
  padding:10px;
  border:1px solid rgba(15,23,42,.1);
  border-radius:14px;
  background:#f8fbff;
}

.choice{
  display:flex;
  grid-template-columns:none;
  align-items:flex-start;
  gap:9px;
  min-width:0;
  padding:8px 9px;
  border-radius:9px;
  color:#475569;
  cursor:pointer;
}

.choice:hover{background:#eef4ff}
.choice:has(input:checked){color:#14264d;background:#e7efff}
.choice input{
  flex:0 0 auto;
  width:16px;
  min-height:16px;
  margin:2px 0 0;
  padding:0;
  accent-color:var(--woxza-accent);
}
.choice span{font-size:12px;font-weight:700;line-height:1.35}

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
  color:var(--woxza-blue);
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
  border-color:rgba(var(--woxza-accent-rgb),.45);
}

.choice-pill.active{
  border-color:var(--woxza-accent);
  background:rgba(var(--woxza-accent-rgb),.09);
  box-shadow:0 8px 20px rgba(var(--woxza-accent-rgb),.10);
}

.choice-pill.active span{
  color:var(--woxza-blue);
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
  color:var(--woxza-blue);
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
  border-color:var(--woxza-accent);
  background:rgba(var(--woxza-accent-rgb),.08);
  box-shadow:0 12px 28px rgba(var(--woxza-accent-rgb),.12);
}

.option-card.disabled{
  cursor:not-allowed;
  opacity:.48;
}

.option-card.active span,
.option-card.active strong{
  color:var(--woxza-blue);
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
  background:var(--woxza-accent);
  color:#fff;
}

.btn-secondary{
  background:#f8fbff;
  color:var(--woxza-blue);
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
  height:min(720px,calc(100dvh - 48px));
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
  scrollbar-gutter:stable;
  background:#fff;
}

.modal-content::-webkit-scrollbar{ width:8px; }
.modal-content::-webkit-scrollbar-track{ background:transparent; }
.modal-content::-webkit-scrollbar-thumb{
  border:2px solid #fff;
  border-radius:999px;
  background:#cbd5e1;
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
  position:sticky;
  z-index:20;
  right:0;
  bottom:-26px;
  left:0;
  align-items:center;
  margin:auto -38px -26px;
  padding:16px 38px 26px;
  border-top:1px solid rgba(15,23,42,.07);
  background:rgba(255,255,255,.96);
  box-shadow:0 -12px 24px rgba(15,23,42,.05);
  backdrop-filter:blur(10px);
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
  .form-actions{
    position:static;
    margin-top:auto;
    margin-right:0;
    margin-bottom:0;
    margin-left:0;
    padding:16px 0 0;
    border-top:0;
    box-shadow:none;
    backdrop-filter:none;
  }
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
