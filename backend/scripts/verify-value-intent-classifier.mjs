import { createTurnInterpreter } from "../src/demo/turn-interpreter.js"
import { getCapabilityCatalog } from "../src/demo/capability-catalog.js"

const cases = {
  en:["I run a steel shop.", "How can Woxza help my steel shop?"],
  es:["Tengo una tienda de acero.", "¿Cómo puede Woxza ayudar a mi tienda de acero?"],
  as:["মই এখন ষ্টীলৰ দোকান চলাওঁ।", "Woxza-এ মোৰ ষ্টীলৰ দোকানত কেনেকৈ সহায় কৰিব পাৰে?"],
  bn:["আমি একটি স্টিলের দোকান চালাই।", "Woxza কীভাবে আমার স্টিলের দোকানকে সাহায্য করতে পারে?"],
  gu:["હું સ્ટીલની દુકાન ચલાવું છું.", "Woxza મારી સ્ટીલની દુકાનને કેવી રીતે મદદ કરી શકે?"],
  hi:["मैं स्टील की दुकान चलाता हूँ।", "Woxza मेरी स्टील की दुकान में कैसे मदद कर सकता है?"],
  kn:["ನಾನು ಸ್ಟೀಲ್ ಅಂಗಡಿ ನಡೆಸುತ್ತೇನೆ.", "Woxza ನನ್ನ ಸ್ಟೀಲ್ ಅಂಗಡಿಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?"],
  ml:["ഞാൻ ഒരു സ്റ്റീൽ കട നടത്തുന്നു.", "Woxza എന്റെ സ്റ്റീൽ കടയെ എങ്ങനെ സഹായിക്കും?"],
  mr:["मी स्टीलचे दुकान चालवतो.", "Woxza माझ्या स्टीलच्या दुकानाला कशी मदत करू शकते?"],
  pa:["ਮੈਂ ਸਟੀਲ ਦੀ ਦੁਕਾਨ ਚਲਾਉਂਦਾ ਹਾਂ।", "Woxza ਮੇਰੀ ਸਟੀਲ ਦੀ ਦੁਕਾਨ ਦੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ?"],
  ta:["நான் ஒரு ஸ்டீல் கடை நடத்துகிறேன்.", "Woxza என் ஸ்டீல் கடைக்கு எப்படி உதவும்?"],
  te:["నేను స్టీల్ షాప్ నడుపుతాను.", "Woxza నా స్టీల్ షాప్‌కి ఎలా ఉపయోగపడుతుంది?"],
  ur:["میں اسٹیل کی دکان چلاتا ہوں۔", "Woxza میری اسٹیل کی دکان میں کیسے مدد کر سکتا ہے؟"]
}

const interpreter = createTurnInterpreter()
const selectedLanguages = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(cases)
for (const language of selectedLanguages) {
  const [plainBusiness, explicitRequest] = cases[language] || []
  if (!plainBusiness || !explicitRequest) throw new Error(`Unsupported language: ${language}`)
  const catalog = await getCapabilityCatalog(language)
  const capabilityIndex = catalog.map(item => ({ id:item.id, title:item.title, claim:item.callerSafeClaim, impact:item.callerImpact, availability:item.availability, requirements:item.requirements }))
  const classify = async callerText => (await interpreter.interpretValueIntent({
    callerText, language, businessProfile:{ business:"", businessName:"", channels:[], workflows:[], painPoints:[], impact:"", manualEffort:"", desiredOutcomes:[] },
    recentHistory:[{ role:"assistant", content:"Please tell me about your business." }, { role:"user", content:callerText }],
    isAlreadyActive:false, capabilityIndex
  })).raw
  const [plain, explicit] = await Promise.all([classify(plainBusiness), classify(explicitRequest)])
  console.log(JSON.stringify({ language, plainBusiness, explicitRequest, plain, explicit }))
}
