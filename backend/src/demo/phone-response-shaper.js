// The LLM writes text; the phone needs a complete, short utterance. This
// guard runs after the model finishes and before anything reaches TTS.
const TERMINAL = /[.!?…。！？]|[।॥]/u

const RECOVERY = {
  te:"మీరు చెప్పిన విషయం అర్థమైంది. ఇందులో మీకు ఎక్కువ ఇబ్బంది కలిగించేది ఏది?",
  hi:"आपकी बात समझ गया। इसमें आपको सबसे ज़्यादा परेशानी किस बात में होती है?",
  ta:"நீங்கள் சொன்னது புரிகிறது. இதில் உங்களுக்கு அதிக சிரமம் தருவது எது?",
  en:"I understand. Which part of that is most difficult for you today?"
}

const clean = value => String(value || "").replace(/\s+/g, " ").trim()
const isQuestion = sentence => /[?？]$/u.test(sentence)
const LEADING_ACKNOWLEDGEMENTS = {
  en:/^(?:(?:yes|yeah|yep|sure)\s*[,،:—–-]?\s*)+/iu,
  te:/^(?:(?:అవును|అవునండి|అవును అండి|యెస్|యెస్ అండి)\s*[,،:—–-]?\s*)+/u,
  hi:/^(?:(?:हाँ|हां|जी हाँ|जी हां)\s*[,،:—–-]?\s*)+/u,
  ta:/^(?:(?:ஆம்|ஆமா|ஆமாங்க)\s*[,،:—–-]?\s*)+/u,
  kn:/^(?:(?:ಹೌದು|ಹೌದಾ|ಹೌದಪ್ಪ)\s*[,،:—–-]?\s*)+/u,
  ml:/^(?:(?:അതെ|അതേ|അതെ ശരി)\s*[,،:—–-]?\s*)+/u,
  mr:/^(?:(?:होय|हो|हां)\s*[,،:—–-]?\s*)+/u,
  gu:/^(?:(?:હા|હાં)\s*[,،:—–-]?\s*)+/u,
  bn:/^(?:(?:হ্যাঁ|হাঁ)\s*[,،:—–-]?\s*)+/u,
  pa:/^(?:(?:ਹਾਂ|ਹਾਂਜੀ)\s*[,،:—–-]?\s*)+/u,
  as:/^(?:(?:হয়|হʼয়)\s*[,،:—–-]?\s*)+/u,
  ur:/^(?:(?:ہاں|جی ہاں)\s*[,،:—–-]?\s*)+/u
}

// The model is instructed not to start with a bare acknowledgement, but that
// is easy to enforce safely after generation. Only strip it when real content
// follows; a standalone affirmative answer remains intact.
export function stripLeadingAcknowledgement(text, language="en") {
  const source = clean(text)
  const stripped = clean(source.replace(LEADING_ACKNOWLEDGEMENTS[language] || LEADING_ACKNOWLEDGEMENTS.en, ""))
  return stripped || source
}

function completeSentences(text) {
  const sentences = []
  let start = 0
  for (let index = 0; index < text.length; index += 1) {
    if (!TERMINAL.test(text[index])) continue
    const sentence = clean(text.slice(start, index + 1))
    if (sentence) sentences.push(sentence)
    start = index + 1
  }
  return { sentences, remainder:clean(text.slice(start)) }
}

export function shapePhoneResponse(text, { language="en", maximumCharacters=180, fullPictureMaximumCharacters=maximumCharacters, fullPictureMinimumSentences=5, forceExtended=false, stopReason=null }={}) {
  const rawSource = clean(text)
  const source = stripLeadingAcknowledgement(rawSource, language)
  const { sentences, remainder } = completeSentences(source)
  const ordinaryMaximum = Math.max(40, Number(maximumCharacters) || 180)
  const extendedMaximum = Math.max(ordinaryMaximum, Number(fullPictureMaximumCharacters) || ordinaryMaximum)
  // The model's full-picture contract is six to seven short sentences. Five
  // completed sentences is a conservative signal that it has begun that mode;
  // ordinary one- or two-sentence replies retain their strict small budget.
  const maximum = forceExtended || sentences.length >= Math.max(5, Number(fullPictureMinimumSentences) || 5) ? extendedMaximum : ordinaryMaximum
  const chosen = []
  let length = 0
  for (const sentence of sentences) {
    const nextLength = length + (chosen.length ? 1 : 0) + [...sentence].length
    // A slightly over-budget complete sentence is safer than a mid-sentence cut.
    if (chosen.length && nextLength > maximum) break
    chosen.push(sentence); length = nextLength
    if (length >= maximum) break
  }

  // A phone reply that ends after an acknowledgement but loses its later
  // question feels like the agent has run out of ideas. When the model wrote
  // a complete next question but exceeded the phone budget, keep that action
  // and, when it fits, the sentence immediately before it. This preserves the
  // conversation's direction without manufacturing a generic question.
  const questionIndex = sentences.findLastIndex(isQuestion)
  if (questionIndex >= 0) {
    const question = sentences[questionIndex]
    const previous = questionIndex > 0 ? sentences[questionIndex - 1] : ""
    const paired = previous ? `${previous} ${question}` : question
    const preserved = [...paired].length <= maximum ? paired : question
    if (spokenNeedsAction(chosen.join(" "), source) && [...preserved].length <= maximum) {
      return {
        text:preserved,
        reason:"phone_length_preserved_question",
        rawCharacters:[...source].length,
        spokenCharacters:[...preserved].length
      }
    }
  }
  if (chosen.length) {
    const spoken = chosen.join(" ")
    return {
      text:spoken,
      reason:spoken === source ? "complete" : stopReason === "MAX_TOKENS" ? "model_cutoff_trimmed" : "phone_length_trimmed",
      rawCharacters:[...source].length,
      spokenCharacters:[...spoken].length
    }
  }
  // Never send a raw model fragment such as an answer ending in a comma.
  const fallback = RECOVERY[language] || RECOVERY.en
  return {
    text:fallback,
    reason:remainder || source ? "incomplete_recovery" : "empty_recovery",
    rawCharacters:[...source].length,
    spokenCharacters:[...fallback].length
  }
}

function spokenNeedsAction(spoken, source) {
  // Only replace the usual beginning-of-answer selection when it actually
  // omitted a later complete question. A short answer with its own question
  // stays exactly as the model wrote it.
  return clean(spoken) !== clean(source) && !isQuestion(clean(spoken))
}
