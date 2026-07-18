import { readFile } from "node:fs/promises"

const FAQ_URL = new URL("../../demo_agent/voxa_faq.md", import.meta.url)

export const USE_CASE_CONFIG = {
  appointment_booking: {
    label:"Appointment booking",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for appointment booking, and ask what kind of appointment they would like to simulate booking.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated appointment outcome, and invite them to try another Voxa demo scenario."
  },
  restaurant_reservations: {
    label:"Restaurant reservations",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for restaurant reservations, and ask for the party size and preferred reservation time.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated reservation outcome, and invite them to try another Voxa demo scenario."
  },
  medical_distribution: {
    label:"Medical distribution",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for wholesale medical orders, and ask which sample product and quantity they would like to simulate ordering.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated wholesale order outcome, and invite them to try another Voxa demo scenario."
  },
  payments_support: {
    label:"Payments support",
    opening:"Greet {name} by name, explain that you are the Voxa demo agent for payment support, and ask what payment-related question they would like to simulate resolving.",
    closing:"When the end-of-call warning arrives, thank {name} by name, briefly recap the simulated support outcome, and invite them to try another Voxa demo scenario."
  }
}

// Service validation still imports this set; derive it from the structured configuration.
export const USE_CASES = new Set(Object.keys(USE_CASE_CONFIG))

export const LEGACY_USE_CASES = {
  appointment: "appointment_booking",
  restaurant: "restaurant_reservations",
  distribution: "medical_distribution",
  payments: "payments_support"
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
