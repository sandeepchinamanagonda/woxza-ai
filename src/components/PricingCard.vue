<template>
  <section id="solutions" class="solutions-section">

    <div class="container-custom">

      <!-- Header -->

      <div class="section-header">

        <span class="eyebrow">
          AI SOLUTIONS
        </span>

        <h2>
          Built for real-world<br>
          business challenges.
        </h2>

        <p>
          Every solution is tailored to your organisation, combining strategy,
          automation, and intelligent AI employees that integrate seamlessly
          into your existing operations.
        </p>

      </div>

      <!-- Grid -->

      <div class="solutions-grid">

        <PricingCard
          v-for="(solution,index) in solutions"
          :key="index"
          :number="index+1"
          :category="solution.category"
          :title="solution.title"
          :description="solution.description"
          :features="solution.features"
        />

      </div>

    </div>

  </section>
</template>

<script setup>
import { ref } from "vue";
import PricingCard from "@/components/PricingCard.vue";

const solutions = ref([
  {
    category: "AI EMPLOYEE",
    title: "Customer Support",
    description:
      "Always-available AI employees capable of handling enquiries, support tickets, and customer interactions.",
    features: [
      "24/7 Support",
      "Natural Conversations",
      "CRM Integration",
      "Live Handoff"
    ]
  },
  {
    category: "VOICE AI",
    title: "Voice Automation",
    description:
      "Automate inbound and outbound calls while maintaining a natural, human-like conversational experience.",
    features: [
      "Appointment Booking",
      "Call Routing",
      "Lead Qualification",
      "Voice Intelligence"
    ]
  },
  {
    category: "AUTOMATION",
    title: "Workflow Automation",
    description:
      "Remove repetitive manual work through intelligent workflows connected to your existing business tools.",
    features: [
      "Internal Processes",
      "Email Automation",
      "Task Management",
      "Approvals"
    ]
  },
  {
    category: "ANALYTICS",
    title: "Business Intelligence",
    description:
      "Turn conversations and operational data into meaningful insights for better business decisions.",
    features: [
      "Performance Reports",
      "Conversation Analytics",
      "Customer Insights",
      "Executive Dashboards"
    ]
  },
  {
    category: "CONSULTING",
    title: "AI Strategy",
    description:
      "Work directly with our consultants to identify opportunities and create an AI transformation roadmap.",
    features: [
      "AI Assessment",
      "Roadmap",
      "Workshops",
      "Implementation Plan"
    ]
  },
  {
    category: "CUSTOM",
    title: "Enterprise Solutions",
    description:
      "Bespoke AI systems designed around your organisation's unique workflows, infrastructure, and objectives.",
    features: [
      "Custom Development",
      "Enterprise Security",
      "Scalable Infrastructure",
      "Dedicated Support"
    ]
  }
]);
</script>

<style scoped>

.solutions-section{
  background:#ffffff;
}

.section-header{
  max-width:760px;
  margin:0 auto 90px;
  text-align:center;
}

.eyebrow{
  display:inline-block;
  margin-bottom:22px;
  font-size:12px;
  letter-spacing:.28em;
  color:#9C8168;
  font-family:var(--font-primary);
}

.section-header h2{
  margin-bottom:28px;
}

.section-header p{
  max-width:650px;
  margin:auto;
}

.solutions-grid{

display:grid;

grid-template-columns:repeat(3,1fr);

gap:28px;

}

@media(max-width:1100px){

.solutions-grid{

grid-template-columns:repeat(2,1fr);

}

}

@media(max-width:768px){

.solutions-grid{

grid-template-columns:1fr;

}

.section-header{

margin-bottom:60px;

}

}

</style>
