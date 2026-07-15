import { readFile } from "node:fs/promises"

const FAQ_URL = new URL("../../demo_agent/voxa_faq.md", import.meta.url)

export const USE_CASE_CONFIG = {
  order_taking: {
    label:"Order taking",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for order taking, and ask what they would like to order.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated order outcome, and invite them to try another Voxa demo scenario."
  },
  customer_support: {
    label:"Customer support",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for customer support, and ask what they need help with.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated support outcome, and invite them to try another Voxa demo scenario."
  },
  lead_qualification: {
    label:"Lead qualification",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for lead qualification, and ask a brief question about their needs.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated qualification outcome, and invite them to try another Voxa demo scenario."
  },
  appointment_booking: {
    label:"Appointment booking",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for appointment booking, and ask what kind of appointment they would like to simulate booking.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated appointment outcome, and invite them to try another Voxa demo scenario."
  },
  event_rsvp: {
    label:"Event RSVP",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for event RSVPs, and ask whether they would like to attend the simulated event.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated RSVP outcome, and invite them to try another Voxa demo scenario."
  },
  feedback_survey: {
    label:"Feedback survey",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for feedback surveys, and ask for their feedback on the simulated experience.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated feedback outcome, and invite them to try another Voxa demo scenario."
  },
  recruiting_screening: {
    label:"Recruiting screening",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for recruiting screening, and ask a brief question about their experience.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated screening outcome, and invite them to try another Voxa demo scenario."
  }
}

// Service validation still imports this set; derive it from the structured configuration.
export const USE_CASES = new Set(Object.keys(USE_CASE_CONFIG))

export const LEGACY_USE_CASES = {
  appointment: "appointment_booking",
  restaurant: "appointment_booking",
  distribution: "order_taking",
  payments: "customer_support"
}

export const LANGUAGES = new Map([
  ["en", "English"], ["es", "Spanish"], ["as", "Assamese"], ["bn", "Bengali"], ["gu", "Gujarati"],
  ["hi", "Hindi"], ["kn", "Kannada"], ["ml", "Malayalam"], ["mr", "Marathi"], ["pa", "Punjabi"],
  ["ta", "Tamil"], ["te", "Telugu"], ["ur", "Urdu"]
])

export const normalizeUseCase = value => LEGACY_USE_CASES[value] || value

export const WARMTH_GUIDELINES = "Sound like a friendly, competent human colleague: use natural contractions and brief acknowledgments, never rush the caller, and stay patient if they ask you to repeat something."

export const DIFFICULT_CALLER_POLICY = "If a caller is rude, hostile, or provocative, stay calm, do not mirror the hostility or argue, and redirect once to the demo scenario; if the hostility continues after that redirect, calmly end the call with a thank-you rather than escalating. If a caller raises a genuinely sensitive health, financial-hardship, or distress topic, offer a brief warm acknowledgment and steer back to the simulated scenario because this is a public demo, not a support line; do not engage with the real personal topic."

const safeCallerName = value => String(value || "")
  .replace(/[\r\n\t]+/g, " ")
  .replace(/[^\p{L}\p{M}\p{N} .'-]/gu, "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 160) || "the caller"

const personalize = (instruction, name) => instruction.replaceAll("{name}", safeCallerName(name))

export async function buildDemoPrompt({ name, useCase, language }) {
  // This is intentionally read on every answered call: editing the FAQ changes the next call.
  const faq = await readFile(FAQ_URL, "utf8")
  const languageName = LANGUAGES.get(language) || "English"
  const scenario = USE_CASE_CONFIG[useCase] || USE_CASE_CONFIG.appointment_booking
  const callerName = safeCallerName(name)
  return `You are the Voxa public live-demo voice agent. This is a short, simulated demonstration, not a real business transaction.

Selected demo scenario: ${scenario.label}. The caller is ${callerName}. Speak entirely in ${languageName}. Stay within that selected scenario for the whole call.

OPENING
${personalize(scenario.opening, name)}

CLOSING
${personalize(scenario.closing, name)} When a system warning arrives near the end of the call, immediately begin this warm, natural wrap-up.

TONE
${WARMTH_GUIDELINES}

HANDLING DIFFICULT MOMENTS
${DIFFICULT_CALLER_POLICY}

The knowledge source below is the only authority for Voxa facts. Do not invent capabilities, integrations, guarantees, availability, contracts, or pricing. If a Voxa question is outside it, say the team can follow up. Do not answer news, sports, weather, personal questions, general knowledge, or unrelated small talk; warmly redirect to the selected Voxa demo scenario every time. Never imply a real booking, reservation, order, payment action, or calendar connection occurred. Keep answers concise.

--- LIVE FAQ / KNOWLEDGE SOURCE ---
${faq}`
}
