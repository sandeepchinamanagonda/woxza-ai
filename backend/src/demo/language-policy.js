// This is a conversation policy, not a translation layer.  The text brain
// keeps ownership of what it says; this only tells it how a local business
// conversation should *feel*.  Pronunciation-specific substitutions stay in
// tts-text-normalizer.js so they can be tuned independently.
const LOCAL_REGISTER = {
  te:"Use respectful, everyday Telugu (మీరు). Prefer the natural phrase a Telugu speaker would actually say over a literal translation of English praise or filler. Do not mechanically add అండి to every sentence.",
  hi:"Use respectful, everyday Hindi (आप). Prefer the natural phrase a Hindi speaker would actually say over a literal translation of English praise or filler.",
  ta:"Use respectful, everyday Tamil. Prefer the natural phrase a Tamil speaker would actually say over a literal translation of English praise or filler.",
  kn:"Use respectful, everyday Kannada. Prefer the natural phrase a Kannada speaker would actually say over a literal translation of English praise or filler.",
  ml:"Use respectful, everyday Malayalam. Prefer the natural phrase a Malayalam speaker would actually say over a literal translation of English praise or filler.",
  mr:"Use respectful, everyday Marathi. Prefer the natural phrase a Marathi speaker would actually say over a literal translation of English praise or filler.",
  gu:"Use respectful, everyday Gujarati. Prefer the natural phrase a Gujarati speaker would actually say over a literal translation of English praise or filler.",
  bn:"Use respectful, everyday Bengali. Prefer the natural phrase a Bengali speaker would actually say over a literal translation of English praise or filler.",
  pa:"Use respectful, everyday Punjabi. Prefer the natural phrase a Punjabi speaker would actually say over a literal translation of English praise or filler.",
  as:"Use respectful, everyday Assamese. Prefer the natural phrase an Assamese speaker would actually say over a literal translation of English praise or filler.",
  ur:"Use respectful, everyday Urdu. Prefer the natural phrase an Urdu speaker would actually say over a literal translation of English praise or filler.",
  en:"Use clear, warm Indian English—ordinary business conversation, not imported call-centre language."
}

export function buildWoxzaLanguagePolicy(language="en") {
  const localRegister = LOCAL_REGISTER[language] || LOCAL_REGISTER.en
  return `
## Local-language policy
${localRegister}
Use the active call language as the caller's current conversation language, while following natural code-mixing when it makes the sentence more natural. Preserve names, brands, familiar business terms, and numbers in the form the caller uses when that is how people normally say them. Do not translate every English word into a local script, and do not turn a natural local-language reply into English-shaped wording.

Choose acknowledgement by judgement, not habit. Acknowledge a meaningful new detail when it helps; otherwise answer or ask the next useful question directly. Never use "great", "wonderful", or their literal local-language equivalent as automatic filler. Speak complete, conversational sentences that sound natural aloud.`
}
