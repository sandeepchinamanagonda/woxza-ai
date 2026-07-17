<template>
  <section id="faq" class="faq">
    <div class="container-custom">
      <div class="heading">
        <span>FREQUENTLY ASKED QUESTIONS</span>
        <h2>Everything you<br>need to know</h2>
        <p>Answers to the questions we hear most before launching a Woxza Voice AI solution.</p>
      </div>

      <div class="faq-list">
        <details v-for="(item, index) in faqs" :key="item.question" class="faq-item">
          <summary>
            <span>{{ String(index + 1).padStart(2, "0") }}</span>
            <h3>{{ item.question }}</h3>
            <i aria-hidden="true"></i>
          </summary>
          <p>{{ item.answer }}</p>
        </details>
      </div>
    </div>
  </section>
</template>

<script setup>
const faqs = [
  { question:"What services does Woxza provide?", answer:"We build Voice AI agents, workflow automations, enterprise knowledge systems, and custom AI integrations tailored to your business." },
  { question:"Which industries do you work with?", answer:"We build Voice AI solutions for healthcare, real estate, logistics, retail, finance, hospitality, home services, education, and more." },
  { question:"Can the AI handle both inbound and outbound calls?", answer:"Absolutely. Our AI agents can answer incoming calls, make outbound calls, qualify leads, schedule appointments, and follow up with customers." },
  { question:"Can AI integrate with our existing software?", answer:"Yes. We integrate with CRMs, ERPs, telephony providers, APIs, databases, calendars, and other business tools." },
  { question:"Can the AI answer questions about my business?", answer:"Yes. We train the AI using your website, documents, FAQs, SOPs, and internal knowledge so it can provide accurate, business-specific answers." },
  { question:"Can the AI book appointments and update my CRM?", answer:"Yes. The AI can schedule appointments, update your CRM, capture customer information, trigger workflows, and perform actions in real time." },
  { question:"Can the AI speak multiple languages?", answer:"Yes. Our Voice AI agents support multiple languages and accents, allowing you to serve customers across different regions." },
  { question:"Does the AI sound natural?", answer:"Yes. We use advanced conversational AI with realistic voices, natural interruptions, and human-like responses for seamless conversations." },
  { question:"What happens if the AI can't answer a question?", answer:"The AI can seamlessly transfer the call to your team, schedule a callback, or collect customer information for follow-up." },
  { question:"How long does implementation take?", answer:"Most Voice AI solutions are deployed within a few days to 2 weeks, depending on the complexity and integrations required." },
  { question:"How much does a Voice AI solution cost?", answer:"Pricing depends on your use case, integrations, and expected call volume. Contact us for a tailored proposal." },
  { question:"Is customer data secure?", answer:"Yes. We follow industry best practices for data security, encrypted communications, and secure integrations to protect your business information." },
  { question:"Can the solution scale as my business grows?", answer:"Absolutely. Whether you receive dozens or thousands of calls each day, your Voice AI scales effortlessly with demand." },
  { question:"Will I get analytics and call recordings?", answer:"Yes. You'll have access to call recordings, transcripts, conversation summaries, performance insights, and other analytics to continuously improve your AI." },
  { question:"Do you provide ongoing support?", answer:"Yes. We continuously monitor, optimize, and improve your AI systems after deployment." },
  { question:"Can I customize the AI's voice and personality?", answer:"Absolutely. We tailor the AI's voice, tone, conversation style, and behavior to match your brand and customer experience." }
]
</script>

<style scoped>
.faq{position:relative;padding:180px 0;background:radial-gradient(circle at 12% 18%,rgba(var(--woxza-accent-rgb),.08),transparent 32%),#fff;overflow:hidden}
.faq::after{content:"";position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(91,140,255,.08),transparent 72%);filter:blur(90px);pointer-events:none}
.container-custom{position:relative;z-index:1}
.heading{max-width:760px;margin:0 auto 80px;text-align:center}
.heading span{display:inline-block;margin-bottom:18px;font-size:12px;font-weight:700;letter-spacing:.35em;color:#5b8cff}
.heading h2{font-size:clamp(54px,6vw,86px);line-height:.94;letter-spacing:-.05em;margin-bottom:26px;color:#101828}
.heading p{max-width:650px;margin:auto;font-size:20px;line-height:1.75;color:#667085}
.faq-list{max-width:1000px;margin:auto;display:grid;gap:16px}
.faq-item{position:relative;background:#fff;border:1px solid #e5ecf6;border-radius:22px;box-shadow:0 18px 55px rgba(59,130,246,.055);transition:transform .3s ease,border-color .3s ease,box-shadow .3s ease;overflow:hidden}
.faq-item:hover,.faq-item[open]{border-color:#8fb0ff;box-shadow:0 24px 64px rgba(59,130,246,.1)}
summary{display:grid;grid-template-columns:48px 1fr 24px;align-items:center;gap:18px;padding:27px 32px;cursor:pointer;list-style:none}
summary::-webkit-details-marker{display:none}
summary span{font-size:12px;font-weight:800;letter-spacing:.22em;color:#5b8cff}
summary h3{font-size:23px;line-height:1.25;color:#101828;margin:0;transition:color .3s ease}
summary i{position:relative;width:18px;height:18px}
summary i::before,summary i::after{content:"";position:absolute;left:50%;top:50%;width:14px;height:2px;background:#5b8cff;transform:translate(-50%,-50%);border-radius:2px;transition:transform .25s ease}
summary i::after{transform:translate(-50%,-50%) rotate(90deg)}
.faq-item[open] summary i::after{transform:translate(-50%,-50%) rotate(0)}
.faq-item[open] summary h3{color:#3b82f6}
.faq-item p{margin:0;padding:0 74px 28px 98px;font-size:17px;line-height:1.75;color:#667085}
@media(max-width:768px){.faq{padding:110px 0}.heading{margin-bottom:56px}.heading h2{font-size:44px}.heading p{font-size:17px}summary{grid-template-columns:36px 1fr 20px;gap:12px;padding:22px 20px}summary h3{font-size:19px}.faq-item p{padding:0 20px 23px 68px;font-size:16px}}
@media(max-width:480px){.heading h2{font-size:36px}.faq-item p{padding-left:20px}summary span{display:none}summary{grid-template-columns:1fr 20px}}
</style>
