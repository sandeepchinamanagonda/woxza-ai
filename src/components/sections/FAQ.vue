<template>
  <section id="faq" class="faq landing-section">
    <div class="container-custom">
      <div class="heading">
        <span>{{ t("FREQUENTLY ASKED QUESTIONS") }}</span>
        <h2 class="display-heading">{{ t("Everything you need to know") }}</h2>
        <p>{{ t("Answers to the questions businesses ask before launching a Woxza voice AI solution.") }}</p>
      </div>

      <div class="faq-list">
        <TransitionGroup name="faq-reveal">
          <article v-for="item in visibleFaqs" :key="item.question" class="faq-item">
            <div class="question">
              <h3>{{ t(item.question) }}</h3>
            </div>
            <div class="answer">
              <p>{{ t(item.answer) }}</p>
            </div>
          </article>
        </TransitionGroup>

        <button
          v-if="faqs.length > initialCount"
          class="more-button"
          type="button"
          :aria-expanded="showAll"
          aria-controls="faq"
          @click="toggleAll"
        >
          {{ t(showAll ? "Less" : "More...") }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useI18n } from "@/composables/useI18n"

const { t } = useI18n()

const initialCount = 3
const showAll = ref(false)
const featuredStart = ref(0)

const faqs = [
  {
    question: "What services does Woxza provide?",
    answer: "Woxza lets you build and launch AI voice agents yourself—without code or a developer—and go live the same day. Need separate agents for wholesale and retail, each with its own pricing? Build both. You are billed per call, not per agent, so running five agents costs the same as running one. You can customise each agent's voice, tone, behaviour, and data at any time, without tickets or vendor delays."
  },
  {
    question: "Which industries do you work with?",
    answer: "Woxza is not limited to one industry. The platform adapts to your business, whether you are a restaurant that cannot miss a booking during rush hour or a hospital checking in patients without a front-desk queue. We work across restaurants, healthcare, education, distribution, and enterprise. Our platform already handles live pharmaceutical and wholesale orders across more than 1,500 products in real time."
  },
  {
    question: "Can the AI handle both inbound and outbound calls?",
    answer: "Yes. Woxza agents answer incoming calls instantly, helping you avoid hold music and missed calls during busy periods. They can also make outbound calls to follow up on abandoned orders, confirm appointments, and re-engage inactive leads whenever a workflow calls for it."
  },
  {
    question: "Can the AI integrate with our existing software?",
    answer: "Yes. Woxza connects to the CRM, calendars, and databases you already use, with no need to replace your existing tools. You control your agent's information directly. For example, if a restaurant special sells out at 3 p.m., update its availability and the agent will stop offering it on the next call."
  },
  {
    question: "Can the AI answer questions about my business?",
    answer: "Yes. Your agent is trained on your real business information, not a generic script. Connect it to live systems or upload your catalogue, pricing, and FAQs. You can also customise its messages, tone, and behaviour. When customers ask about stock or availability, the agent uses your current information rather than guessing."
  },
  {
    question: "Can the AI book appointments and update my CRM?",
    answer: "Yes. Your agent can book appointments directly in your calendar, update your CRM with customer details, and move workflows forward during the call. Your team does not need to enter the information again afterwards."
  },
  {
    question: "Can the AI speak multiple languages?",
    answer: "Yes. Woxza supports English, Hindi, Telugu, Tamil, Kannada, and more. It can follow customers as they naturally switch languages during a conversation, including mixed-language conversations such as Telugu and English."
  },
  {
    question: "Does the AI sound natural?",
    answer: "Yes. Woxza agents are designed to sound natural, respond to tone, and handle interruptions mid-sentence. Conversations feel responsive and human rather than like a script being read aloud."
  },
  {
    question: "What happens if the AI can't answer a question?",
    answer: "When an agent cannot answer a question, it does not guess. It can transfer the call to your team, schedule a callback, or collect the customer's details for follow-up. Unanswered questions are flagged so you can fill the knowledge gap and improve future conversations."
  },
  {
    question: "How long does implementation take?",
    answer: "Woxza can get you live in minutes, not weeks. Sign up, choose a plan, upload your data, and create your agent yourself—without waiting for a vendor team or working around someone else's schedule."
  },
  {
    question: "How much does a Voice AI solution cost?",
    answer: "Woxza uses pay-as-you-go pricing. You are charged per call, not per agent, so you can create as many voice agents as you need without an extra charge for each one. Your cost scales with usage rather than the number of agents you build. Join the waitlist for pricing based on your expected call volume."
  },
  {
    question: "Is customer data secure?",
    answer: "Yes. Woxza is designed with India's data-protection standards in mind. Calls, transcripts, and business data are encrypted in transit and at rest; customer data is isolated at the platform level; and access controls limit information to authorised team members."
  },
  {
    question: "Can the solution scale as my business grows?",
    answer: "Yes. Woxza is built to scale with your business. Agents can handle multiple calls at the same time, helping you manage seasonal spikes, outbound campaigns, and sudden surges without callers waiting on hold. Complex or high-value calls can be handed to your team with full context."
  },
  {
    question: "Will I get analytics and call recordings?",
    answer: "Yes. Every call can be recorded and transcribed, with a summary of the customer's request, the outcome, and any required follow-up. Recordings, transcripts, and summaries are available in your Woxza dashboard. APIs and webhooks can also send call data to your CRM, spreadsheets, or other tools."
  },
  {
    question: "Do you provide ongoing support?",
    answer: "Yes. We continue to support your agent as your business changes. Contact us at support@woxza.com, join the Woxza community on Discord or in our forums, or work with a dedicated solutions engineer on an Enterprise plan. We also monitor system health around the clock."
  }
]

const visibleFaqs = computed(() => {
  if (showAll.value) return faqs

  return Array.from({ length: initialCount }, (_, offset) =>
    faqs[(featuredStart.value + offset) % faqs.length]
  )
})

const toggleAll = () => {
  showAll.value = !showAll.value
}

let rotationTimer

onMounted(() => {
  rotationTimer = window.setInterval(() => {
    if (!showAll.value) featuredStart.value = (featuredStart.value + initialCount) % faqs.length
  }, 60_000)
})

onBeforeUnmount(() => window.clearInterval(rotationTimer))
</script>

<style scoped>
.faq {
  position: relative;
  background: #fff;
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
}

.question h3 {
  flex: 1;
  margin: 0;
  color: #101828;
  font-size: 22px;
  transition: color .35s ease;
}

.faq-item:hover h3 {
  color: #3b82f6;
}

.answer {
  padding-top: 12px;
}

.faq-item p {
  margin: 0;
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

@media (max-width: 640px) {

  .heading {
    margin-bottom: 44px;
  }

  .heading h2 {
    font-size: clamp(46px, 14vw, 60px);
  }

  .heading p {
    font-size: 17px;
    line-height: 1.6;
  }

  .faq-item {
    padding: 22px 20px;
  }

  .question {
    gap: 12px;
  }

  .question h3 {
    font-size: 18px;
    line-height: 1.3;
  }

  .answer {
    padding-top: 14px;
  }
}

.faq-reveal-enter-from,
.faq-reveal-leave-to {
  opacity: 0;
  transform: translateY(18px);
}

@media (max-width: 1100px) {
  .heading { margin-bottom: 64px; }
  .question h3 { font-size: 21px; }
  .faq-item { padding: 24px 26px; }
}

@media (max-width: 768px) {
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
