import { GoogleGenAI } from "@google/genai"
import { localizedDemoEnding, localizedDemoRoleHandoff, localizedDemoTaskConfirmation } from "./prompt.js"
import { isIncompleteBusinessDescription } from "./turn-normalizer.js"

const clean = value => String(value || "").replace(/\s+/g, " ").trim()
const business = context => {
  const value = clean(context?.profile?.business_label || context?.profile?.business || context?.business_profile?.business_label || context?.business_profile?.business)
  return isIncompleteBusinessDescription(value) ? "" : value
}
const nextQuestion = (language, missing) => {
  const te = {
    business:"మీరు ఏ వ్యాపారం నిర్వహిస్తున్నారు?",
    current_process:"మీరు కస్టమర్ ఆర్డర్‌లను ఎలా తీసుకుంటారు — ఫోన్ కాల్స్ ద్వారా లేదా మెసేజ్‌ల ద్వారా?",
    primary_pain:"ఫోన్ కాల్స్ ద్వారా ఆర్డర్‌లు తీసుకోవడంలో మీకు ఎదురయ్యే పెద్ద సమస్య ఏమిటి?",
    operating_detail:"మీ దగ్గర సుమారుగా ఎంతమంది కస్టమర్‌లు ఉన్నారు?"
  }
  const en = {
    business:"What kind of business do you run?",
    current_process:"How do you take customer orders today — phone calls or messages?",
    primary_pain:"What is the biggest challenge you face when taking orders by phone?",
    operating_detail:"About how many customers do you have?"
  }
  const planner = {
    identify_business_type:{ en:"What kind of business do you run?", te:"మీరు ఎలాంటి వ్యాపారం నిర్వహిస్తున్నారు?" },
    understand_interaction_and_workflow:{ en:"How do customers usually reach you, and how do you handle those enquiries today?", te:"కస్టమర్లు సాధారణంగా మిమ్మల్ని ఎలా సంప్రదిస్తారు, ఆ విచారణలను ఇప్పుడు ఎలా నిర్వహిస్తున్నారు?" },
    identify_pain_and_impact:{ en:"What tends to go wrong in that process, and what does it affect?", te:"ఆ ప్రక్రియలో సాధారణంగా ఏ సమస్య వస్తుంది, దాని ప్రభావం ఏమిటి?" },
    understand_scale:{ en:"Roughly what volume of customer conversations does your team handle?", te:"మీ టీమ్ సుమారుగా ఎంతమంది కస్టమర్ సంభాషణలను నిర్వహిస్తుంది?" },
    understand_desired_outcome:{ en:"What would you most like to improve first?", te:"ముందుగా మీరు ఏ విషయం మెరుగుపరచాలని అనుకుంటున్నారు?" }
  }
  return planner[missing]?.[language] || (language === "te" ? te[missing] : en[missing]) || (language === "te" ? "కొంచెం మరింత వివరంగా చెప్పగలరా?" : "Could you tell me a little more?")
}

const acknowledgement = ({ profile={}, ids=[] }, language) => {
  if (!ids.length) return ""
  const values = [...new Set(ids.map(key => Array.isArray(profile[key]) ? profile[key].join(", ") : profile[key]).filter(Boolean))]
  if (!values.length) return ""
  return language === "te" ? `${values.join("; ")}, అర్థమైంది అండి.` : `Got it — ${values.join("; ")}.`
}

export function templateResponse({ action, context={}, language="en" }={}) {
  const isTelugu = language === "te"
  // System actions are backend-supplied text. They still enter a response job
  // so the opening, retry and closing paths cannot bypass the audio fence.
  if (["opening", "silence_reprompt", "presence_recovery"].includes(action)) return clean(context.response_text)
  if (context.response_text) return clean(context.response_text)
  if (action === "ask_missing_business_detail") {
    const ids = context.acknowledge_fact_ids || context.planner?.acknowledge_fact_ids
    const profile = context.profile || {}
    // Legacy callers without a planner context retain their prior template;
    // planner-owned calls always supply an explicit acknowledgement ledger.
    const legacyAcknowledgement = business(context) ? (isTelugu ? `${business(context)}, చాలా బాగుంది!` : `${business(context)}, that sounds great!`) : ""
    return clean(`${Array.isArray(ids) ? acknowledgement({ profile, ids }, language) : legacyAcknowledgement} ${nextQuestion(language, context.next_goal || context.missing)}`)
  }
  if (action === "continue_incomplete") {
    const cue = { en:"Mm-hmm, please continue.", te:"అవును అండి, కొనసాగించండి.", hi:"जी, कृपया आगे बताइए।", ta:"சரி, தொடர்ந்து சொல்லுங்கள்." }
    return cue[language] || cue.en
  }
  if (action === "broader_discovery_fallback") {
    const field = context.field || "business"
    const copy = {
      business:{ en:"No worries — roughly what kind of business do you run?", te:"పర్లేదు అండి — సుమారుగా మీరు ఎలాంటి వ్యాపారం నిర్వహిస్తున్నారు?", hi:"कोई बात नहीं जी — मोटे तौर पर आपका व्यवसाय किस तरह का है?", ta:"பரவாயில்லை — தோராயமாக நீங்கள் எந்த வகை வியாபாரம் நடத்துகிறீர்கள்?" },
      current_process:{ en:"No worries — do customers usually call or message you?", te:"పర్లేదు అండి — కస్టమర్లు సాధారణంగా కాల్ చేస్తారా లేదా మెసేజ్ చేస్తారా?", hi:"कोई बात नहीं जी — ग्राहक आमतौर पर कॉल करते हैं या संदेश भेजते हैं?", ta:"பரவாயில்லை — வாடிக்கையாளர்கள் வழக்கமாக அழைப்பார்களா அல்லது செய்தி அனுப்புவார்களா?" },
      primary_pain:{ en:"No worries — what is the main difficulty with those customer conversations?", te:"పర్లేదు అండి — ఆ కస్టమర్ సంభాషణల్లో ప్రధాన ఇబ్బంది ఏమిటి?", hi:"कोई बात नहीं जी — उन ग्राहक बातचीत में मुख्य परेशानी क्या है?", ta:"பரவாயில்லை — அந்த வாடிக்கையாளர் உரையாடல்களில் முக்கிய சிரமம் என்ன?" },
      operating_detail:{ en:"No worries — about how many customers do you have?", te:"పర్లేదు అండి — మీకు సుమారుగా ఎంతమంది కస్టమర్లు ఉన్నారు?", hi:"कोई बात नहीं जी — आपके लगभग कितने ग्राहक हैं?", ta:"பரவாயில்லை — உங்களிடம் சுமார் எத்தனை வாடிக்கையாளர்கள் உள்ளனர்?" }
    }
    return copy[field]?.[language] || copy[field]?.en || copy.business.en
  }
  if (action === "confirm_memory_fact" || action === "confirm_business_name") return clean(context.confirm_text)
  if (action === "set_demo_roles") return localizedDemoRoleHandoff(language, business(context))
  if (action === "confirm_simulated_task") return localizedDemoTaskConfirmation(language, context.example_reference)
  if (action === "complete_simulated_task") return isTelugu ? "సరే అండి, ఈ ఉదాహరణను ఇక్కడితో ముగిద్దాం. ఈ డెమో మీకు ఎలా అనిపించింది?" : "Alright, we can end this example here. How did that demo feel?"
  if (action === "ask_demo_scenario") return isTelugu ? "ఏ డెమో ప్రయత్నిద్దాం అండి — ఆర్డర్, బిల్లింగ్, డెలివరీ, పేమెంట్స్, లేదా క్యాటలాగ్ ప్రశ్న?" : "Which demo would you like to try: orders, billing, delivery, payments, or a catalogue question?"
  if (action === "guide_customer_request") return isTelugu ? "ఇప్పుడు మీరు కస్టమర్ అండి. మీకు ఏమి కావాలో అడగండి." : "You are the customer now. Please ask what you need."
  if (action === "clarify_order_confirmation") return isTelugu ? "ఈ ఉదాహరణ ఆర్డర్ ఇంకా ఓపెన్‌లో ఉంది అండి. కొనసాగించాలనుకుంటున్నారా?" : "The example order is still open. Would you like to proceed?"
  if (action === "ask_business_value_permission") return isTelugu ? "మీ వ్యాపారానికి Woxza ఎలా ఉపయోగపడుతుందో వివరించమంటారా?" : "Would you like me to explain how Woxza could help your business?"
  if (action === "ask_anything_else") return isTelugu ? "మీరు ఇంకేదైనా ప్రయత్నించాలనుకుంటున్నారా లేదా అడగాలనుకుంటున్నారా?" : "Would you like to try or ask anything else?"
  if (action === "close") return localizedDemoEnding(language)
  if (action === "clarify") return isTelugu ? "క్షమించండి అండి, అది ఇంకొంచెం వివరంగా చెప్పగలరా?" : "Sorry, could you tell me that a little more clearly?"
  return null
}

const dynamicActions = new Set([
  "deliver_pitch", "answer_or_offer_help", "answer_faq_and_offer_next_step",
  "deliver_simulated_answer_and_ask_quantity", "answer_order_follow_up_and_ask_quantity",
  "present_order_terms_and_ask_proceed", "deliver_billing_quote_and_ask_measurement",
  "answer_billing_follow_up_and_ask_measurement", "present_billing_total_and_ask_proceed",
  "deliver_delivery_status_and_ask_proceed", "explain_payment_and_ask_proceed",
  "deliver_service_status_and_ask_proceed", "deliver_dynamic_business_resolution_and_ask_proceed"
])

export function createResponseTextBuilder({ apiKey=process.env.GEMINI_API_KEY, model=process.env.GEMINI_RESPONSE_TEXT_MODEL || "gemini-2.5-flash", generate }={}) {
  const ai = !generate && apiKey ? new GoogleGenAI({ apiKey }) : null
  const render = generate || (async input => {
    if (!ai) throw new Error("Gemini response text renderer is not configured")
    const response = await ai.models.generateContent({ model, contents:input.prompt, config:{ responseMimeType:"application/json", responseSchema:{ type:"OBJECT", properties:{ response_text:{ type:"STRING" } }, required:["response_text"] }, temperature:0.2 } })
    return JSON.parse(String(response.text || "{}"))
  })
  return {
    async build({ action, context, language="en" }) {
      const fixed = templateResponse({ action, context, language })
      if (fixed) return { response_text:fixed, text_source:"template", model:null }
      if (!dynamicActions.has(action)) throw new Error(`No approved response text contract for action ${action}`)
      const prompt = [
        "Return JSON only. You are a text-only response phrasing component; you cannot speak, call tools, or choose a workflow action.",
        "Write one concise, warm phone response in the configured language using only the approved action and context. Do not add facts, questions, workflow steps, prices, names, or promises not present in context.",
        `Language: ${language}. Action: ${action}.`,
        `Approved context: ${JSON.stringify(context || {})}`
      ].join("\n")
      const result = await render({ prompt })
      const response_text = clean(result?.response_text)
      if (!response_text) throw new Error("Response text renderer returned no response_text")
      return { response_text, text_source:"text_renderer", model }
    }
  }
}
