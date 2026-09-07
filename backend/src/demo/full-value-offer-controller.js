// This controller owns the one-turn handoff after Woxza explicitly offers a
// fuller explanation. It deliberately uses the conversational state (the
// agent just asked a yes/no invitation), rather than trying to match one
// particular caller phrase in thirteen languages.
const text = value => String(value || "").trim()

export function isFullValueOffer(agentText) {
  const source = text(agentText)
  if (!/woxza/i.test(source)) return false
  // The agent has just offered the caller a Woxza explanation. Detect the
  // meaning of that invitation instead of depending on one translated phrase
  // per language. A completed pitch normally ends in a statement, so it does
  // not re-arm this one-turn state.
  const asks = /[?？]$/u.test(source)
  const valueConcept = /(?:would you like|want me to explain|shall i explain|tell you how|how .*help|how .*work|సహాయ|ఉపయోగ|ఎలా|చెప్ప|मदद|कैसे|बताऊ|सहाय|உதவ|எப்படி|சொல்ல|ಸಹಾಯ|ಹೇಗೆ|ಹೇಳ|സഹായ|എങ്ങനെ|പറയ|સહાય|કેવી રીતે|કહે|সাহায|কীভাবে|বল|ਸਹਾਇ|ਕਿਵੇਂ|ਦੱਸ|সহায়|কেনেকৈ|কও|مدد|کیسے|بتا)/iu
  return asks && valueConcept.test(source)
}

const decline = /(?:^|\s)(?:no|nope|not now|later|don't|do not|వద్దు|అక్కర్లేదు|తర్వాత|లేదు|नहीं|नही|बाद में|வேண்டாம்|பிறகு|ಬೇಡ|ನಂತರ|വേണ്ട|പിന്നീട്|না|নাহি|নहीं चाहिए|નહીં|ਨਾ ਜੀ|نہیں|بعد میں)(?:\s|$)/iu
const directFullValue = /(?:how (?:can|could|does).*woxza|how.*help|tell me more|what else|ఎలా.*(?:సహాయ|ఉపయోగ)|చెప్పండి|ఇంకా|कैसे.*मदद|और बताइए|எப்படி.*உதவ|மேலும் சொல்ல|ಹೇಗೆ.*ಸಹಾಯ|ಹೆಚ್ಚು ಹೇಳ|എങ്ങനെ.*സഹായ|കൂടുതൽ പറയ)/iu
const clearNewQuestion = /(?:\?|price|pricing|cost|integration|connect|website|when.*launch|ఎంత ఖర్చు|ధర|ఇంటిగ్రేషన్|వెబ్‌సైట్|ఎప్పుడు ప్రారంభ|कीमत|कितना खर्च|इंटीग्रेशन|விலை|இன்டிக்ரேஷன்|ಬೆಲೆ|ಇಂಟಿಗ್ರೇಷನ್|വില|ഇന്റഗ്രേഷൻ)/iu

export function classifyFullValueOfferReply(callerText) {
  const source = text(callerText)
  if (!source) return { decision:"new_question", reason:"empty" }
  if (decline.test(source)) return { decision:"decline", reason:"clear_decline" }
  // A follow-up asking how Woxza helps is still an affirmative request for the
  // fuller explanation, even though it is grammatically a question.
  if (directFullValue.test(source)) return { decision:"accept", reason:"direct_full_value_request" }
  if (clearNewQuestion.test(source)) return { decision:"new_question", reason:"specific_new_question" }
  // In response to Woxza's direct invitation, an otherwise meaningful reply
  // is treated as acceptance. This covers natural answers such as "tell all
  // of it together" without maintaining brittle language-specific word lists.
  return { decision:"accept", reason:"contextual_offer_acceptance" }
}

export function isFullValueFollowUp(callerText) {
  return directFullValue.test(text(callerText))
}
