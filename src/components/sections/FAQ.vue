<template>
  <section id="faq" class="faq">
    <div class="container-custom">
      <div class="heading">
        <span>FREQUENTLY ASKED QUESTIONS</span>
        <h2>Everything you<br>need to know</h2>
        <p>Answers based on what businesses want to know before joining Voxa.</p>
      </div>

      <div class="faq-list">
        <TransitionGroup name="faq-reveal">
          <article
            v-for="(item, index) in visibleFaqs"
            :key="item.question"
            class="faq-item"
          >
            <div class="question">
              <span>{{ String(index + 1).padStart(2, "0") }}</span>
              <h3>{{ item.question }}</h3>
            </div>
            <p>{{ item.answer }}</p>
          </article>
        </TransitionGroup>

        <button
          v-if="faqs.length > initialCount"
          class="more-button"
          type="button"
          :aria-expanded="showAll"
          aria-controls="faq"
          @click="showAll = !showAll"
        >
          {{ showAll ? "Less" : "More..." }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from "vue"

const initialCount = 4
const showAll = ref(false)

const faqs = [
  {
    question: "What can Voxa help my business automate?",
    answer: "Voxa can answer incoming calls, book appointments, support customers, qualify leads, make outbound calls, follow up, send reminders, route calls, update your CRM, collect information, process orders and more."
  },
  {
    question: "Which business challenges is Voxa designed to solve?",
    answer: "Voxa is built for missed calls, repetitive questions, high staffing costs, overloaded support teams, inconsistent follow-ups, slow response times, limited after-hours coverage and manual operations."
  },
  {
    question: "Can Voxa work with the software we already use?",
    answer: "Yes. Voxa can connect with platforms such as Salesforce, HubSpot, Zoho CRM, Pipedrive, Microsoft Dynamics, Freshworks, Twilio, Aircall, RingCentral, Five9, Zendesk, Intercom, Google Workspace, Microsoft 365, Slack, Teams, Calendly, Shopify and WooCommerce."
  },
  {
    question: "Which capabilities can we prioritize?",
    answer: "You can prioritize human-like conversations, appointment booking, CRM integrations, multilingual support, 24/7 availability, human handoff, call recording and transcripts, analytics, knowledge-base integration, custom workflows, outbound calling, WhatsApp, email automation and existing-number support."
  },
  {
    question: "Which industries can use Voxa?",
    answer: "Voxa can be configured for healthcare, real estate, finance, insurance, retail, ecommerce, hospitality, education, logistics, manufacturing, construction, automotive, legal, recruitment, home services, travel, telecom, SaaS, agencies, government, nonprofits and other industries."
  },
  {
    question: "Will Voxa fit the way our calls are handled today?",
    answer: "Yes. Voxa can work alongside a receptionist, support team, call centre, IVR, direct employee call handling, voicemail or a mixed setup, then automate only the parts that make sense for your business."
  },
  {
    question: "Can Voxa support our daily call volume?",
    answer: "Voxa is planned for businesses receiving anything from fewer than 20 calls a day to more than 1,000. The final setup is sized around your actual traffic, workflows and peak demand."
  },
  {
    question: "Can Voxa use our existing phone number?",
    answer: "Existing phone-number support can be included in the solution, so your customers can continue using the number they already know."
  },
  {
    question: "Does Voxa support human handoff?",
    answer: "Yes. Voxa can transfer a conversation to the right person when a request needs human attention, while preserving the context already collected."
  },
  {
    question: "Can Voxa communicate in multiple languages?",
    answer: "Multilingual support is one of the capabilities that can be included and prioritized based on your customers and operating regions."
  },
  {
    question: "How soon can we implement Voxa?",
    answer: "Implementation can be planned immediately, within 30 days, in one to three months, in three to six months or later, depending on your readiness, integrations and workflow complexity."
  },
  {
    question: "What size of company is Voxa suitable for?",
    answer: "Voxa is intended for businesses ranging from solo operators and small teams to organizations with more than 1,000 employees. The solution scales with the scope of the operation."
  },
  {
    question: "Can Voxa make outbound calls and follow up automatically?",
    answer: "Yes. Voxa can support outbound calling, lead qualification, customer follow-ups, appointment reminders, payment reminders and feedback collection as part of a connected workflow."
  }
]

const visibleFaqs = computed(() =>
  showAll.value ? faqs : faqs.slice(0, initialCount)
)
</script>

<style scoped>
.faq {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  padding: 170px 0;
  background:
    radial-gradient(circle at 12% 18%, rgba(var(--voxa-accent-rgb), .08), transparent 32%),
    #fff;
}

.faq::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 900px;
  height: 900px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(91, 140, 255, .08), transparent 72%);
  filter: blur(90px);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.container-custom,
.heading,
.faq-list {
  position: relative;
  z-index: 2;
}

.heading {
  max-width: 760px;
  margin: 0 auto 72px;
  text-align: center;
}

.heading span {
  display: inline-block;
  margin-bottom: 18px;
  color: #5b8cff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .35em;
}

.heading h2 {
  margin-bottom: 26px;
  color: #101828;
  font-size: clamp(60px, 6vw, 90px);
  line-height: .94;
  letter-spacing: -.05em;
  text-wrap: balance;
}

.heading p {
  max-width: 620px;
  margin: auto;
  color: #667085;
  font-size: 20px;
  line-height: 1.9;
  text-wrap: pretty;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 1000px;
  margin: auto;
}

.faq-item {
  position: relative;
  overflow: hidden;
  padding: 26px 30px;
  border: 1px solid #e5ecf6;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 18px 55px rgba(59, 130, 246, .06);
  backface-visibility: hidden;
  transition:
    transform .4s cubic-bezier(.22, 1, .36, 1),
    box-shadow .35s ease,
    border-color .35s ease;
}

.faq-item:hover {
  border-color: #5b8cff;
  box-shadow: 0 28px 70px rgba(59, 130, 246, .12);
  transform: translateY(-8px);
}

.question {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 12px;
}

.question span {
  flex: 0 0 auto;
  color: #5b8cff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .28em;
}

.question h3 {
  color: #101828;
  font-size: 22px;
  transition: color .35s ease;
}

.faq-item:hover h3 {
  color: #3b82f6;
}

.faq-item p {
  color: #667085;
  font-size: 15px;
  line-height: 1.7;
  transition: color .35s ease;
}

.faq-item:hover p {
  color: #475467;
}

.more-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 8px auto 0;
  padding: 8px 12px;
  border: 0;
  color: #1f5fd4;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: color .25s ease;
}

.more-button:hover {
  color: #3b82f6;
}

.faq-reveal-enter-active,
.faq-reveal-leave-active {
  transition: opacity .35s ease, transform .35s ease;
}

.faq-reveal-enter-from,
.faq-reveal-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

@media (max-width: 1100px) {
  .faq { padding: 140px 0; }
  .heading { margin-bottom: 64px; }
  .question h3 { font-size: 21px; }
  .faq-item { padding: 24px 26px; }
}

@media (max-width: 768px) {
  .faq { padding: 100px 0; }
  .heading h2 { font-size: 44px; line-height: 1; }
  .heading p { font-size: 17px; }
  .question { align-items: flex-start; gap: 16px; }
  .question h3 { font-size: 18px; }
  .faq-item { padding: 20px; border-radius: 18px; }
  .faq-item p { font-size: 14px; line-height: 1.7; }
}

@media (max-width: 480px) {
  .heading h2 { font-size: 36px; }
  .heading p { font-size: 15px; }
  .question h3 { font-size: 17px; }
  .faq-item { padding: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  .faq-item,
  .more-button,
  .faq-reveal-enter-active,
  .faq-reveal-leave-active {
    transition: none;
  }
}
</style>
