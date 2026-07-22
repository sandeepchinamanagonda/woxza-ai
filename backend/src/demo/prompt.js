export const USE_CASE_CONFIG = {
  order_taking:{ label:"order taking", safeFallback:"Please tell me the item and quantity you would like to order." },
  customer_support:{ label:"customer support", safeFallback:"Please tell me what you need help with." },
  lead_qualification:{ label:"lead qualification", safeFallback:"Please tell me what you are looking for." },
  appointment_booking:{ label:"appointment booking", safeFallback:"Would you like a salon, movie, or doctor's appointment?" },
  event_rsvp:{ label:"event RSVP", safeFallback:"Will you be attending the event?" },
  feedback_survey:{ label:"feedback survey", safeFallback:"Would you like to share quick feedback?" },
  recruiting_screening:{ label:"recruiting screening", safeFallback:"Are you ready to begin the brief screening?" }
}
export const USE_CASES = new Set(["discover", ...Object.keys(USE_CASE_CONFIG)])
export const LEGACY_USE_CASES = { appointment:"appointment_booking", restaurant:"order_taking", distribution:"order_taking", payments:"customer_support" }
export const normalizeUseCase = value => LEGACY_USE_CASES[value] || value

export const LANGUAGES = new Map([["en","English"],["es","Spanish"],["as","Assamese"],["bn","Bengali"],["gu","Gujarati"],["hi","Hindi"],["kn","Kannada"],["ml","Malayalam"],["mr","Marathi"],["pa","Punjabi"],["ta","Tamil"],["te","Telugu"],["ur","Urdu"]])
export const LOCALIZED_DEMO_NAMES = Object.fromEntries([...LANGUAGES.keys()].map(language => [language, Object.fromEntries(Object.entries(USE_CASE_CONFIG).map(([key,value]) => [key,value.label]))]))
export const FORMALITY_RULES = {
  te:"Use మీరు (meeru), never నువ్వు. Keep a natural, polite Telugu business register; do not mechanically repeat అండి.",
  hi:"Use आप, never तुम or तू. Keep a natural, professional business register.",
  ta:"Use polite Tamil forms throughout.", kn:"Use polite Kannada forms throughout.",
  default:"Maintain a warm, concise, professional customer-service register."
}

export const POST_COMPLETION_FEATURE_OFFERS = Object.fromEntries([...LANGUAGES.keys()].map(language => [language, language === "te"
  ? "ఈ డెమో మీకు ఎలా అనిపించింది అండి? ఇంకేదైనా ప్రయత్నించాలనుకుంటున్నారా, లేక ఇంతటితో సరిపోతుందా?"
  : "How did that demo feel? Would you like to try anything else, or are you all set?"]))
export const localizedPostCompletionOffer = language => POST_COMPLETION_FEATURE_OFFERS[language] || POST_COMPLETION_FEATURE_OFFERS.en
export const localizedPostOrderActionCapability = language => language === "te"
  ? "సాధారణ Woxza సెటప్‌లో, కనెక్ట్ చేసిన వ్యాపార సమాచారాన్ని చూసి ఫాలో-అప్ కాల్ లేదా చర్యను ప్రారంభించేలా ఏజెంట్‌ను సెట్ చేయవచ్చు. కానీ ఈ డెమోలో నేను లైవ్ ధరను చెక్ చేయలేను లేదా ఆ కాల్‌ను షెడ్యూల్ చేయలేను."
  : language === "hi" ? "असल Woxza सेटअप में एजेंट को जुड़ी व्यावसायिक जानकारी देखकर फॉलो-अप शुरू करने के लिए सेट किया जा सकता है। इस डेमो में मैं लाइव कीमत नहीं देख सकता या कॉल तय नहीं कर सकता।"
  : language === "ta" ? "உண்மையான Woxza அமைப்பில் இணைக்கப்பட்ட வணிகத் தகவலைப் பயன்படுத்தி தொடர்நடவடிக்கை செய்ய அமைக்கலாம். இந்த டெமோவில் நேரடி விலையைப் பார்க்கவோ அழைப்பை ஏற்பாடு செய்யவோ முடியாது."
  : "In a real Woxza setup, the agent can be configured to check connected business information and trigger a follow-up call or action. This demo cannot check a live price or schedule that callback."
export const localizedRedirect = language => language === "te"
  ? "Woxza మీ వ్యాపారానికి ఎలా ఉపయోగపడుతుందో వివరించగలను."
  : language === "hi" ? "मैं बता सकता हूँ कि Woxza आपके व्यवसाय के लिए कैसे मददगार हो सकता है।"
  : language === "ta" ? "Woxza உங்கள் வணிகத்திற்கு எப்படி உதவும் என்பதை நான் விளக்க முடியும்."
  : "I can explain how Woxza would handle that for a business."
export const localizedPitchThinkingAcknowledgement = language => language === "te"
  ? "ఒక్క క్షణం అండి — మీరు చెప్పిన విధానానికి Woxza ఎక్కడ ఎక్కువ ఉపయోగపడుతుందో కలిపి చెబుతాను."
  : "Give me a moment — I’m connecting what you shared to where Woxza can make the biggest difference."
export const localizedScopeBoundary = language => language === "te"
  ? "Woxza మీ వ్యాపారానికి ఎలా ఉపయోగపడుతుందో వివరించగలను."
  : "I can explain how Woxza would handle that for a business."
export const LOCALIZED_REDIRECT_TEMPLATES = Object.fromEntries([...LANGUAGES.keys()].map(language => [language,"I can help explain how Woxza would handle that for a business."]))
export const LOCALIZED_SCOPE_BOUNDARIES = Object.fromEntries([...LANGUAGES.keys()].map(language => [language,{ first:"I can help explain how Woxza would handle that for a business.", second:"Would you like to continue exploring Woxza?" }]))

export function localizedIdentityOpening(language) {
  if (language === "te") return "మీరు ఒక డెమో ప్రయత్నించాలనుకుంటున్నారా, లేక Woxza మీ వ్యాపారానికి ఎలా ఉపయోగపడుతుందో తెలుసుకోవాలనుకుంటున్నారా?"
  if (language === "hi") return "क्या आप डेमो आज़माना चाहेंगे, या जानना चाहेंगे कि Woxza आपके व्यवसाय में कैसे मदद कर सकता है?"
  if (language === "ta") return "நீங்கள் ஒரு டெமோவை முயற்சிக்க விரும்புகிறீர்களா, அல்லது Woxza உங்கள் வணிகத்திற்கு எவ்வாறு உதவும் என்பதை அறிய விரும்புகிறீர்களா?"
  return "Would you like to try a demo, or hear how Woxza could help your business?"
}
export function localizedIdentityHandshake(language) {
  if (language === "te") return "నమస్కారం. Woxzaకి స్వాగతం."
  if (language === "hi") return "नमस्ते, Woxza में आपका स्वागत है।"
  if (language === "ta") return "வணக்கம், Woxza-க்கு வரவேற்கிறோம்."
  return "Hello, welcome to Woxza."
}
export function localizedOpeningDiscoveryQuestion(language) {
  const messages = {
    en:"Thanks for trying our demo. To help you better, I'd like to learn a few details. What kind of business do you run?",
    es:"Gracias por probar nuestra demostración. Para ayudarle mejor, me gustaría conocer algunos detalles. ¿Qué tipo de negocio tiene?",
    as:"আমাৰ ডেম’টো চেষ্টা কৰাৰ বাবে ধন্যবাদ। আপোনাক ভালদৰে সহায় কৰিবলৈ, কেইটামান কথা জানিব বিচাৰোঁ। আপুনি কি ধৰণৰ ব্যৱসায় চলায়?",
    bn:"আমাদের ডেমোটি চেষ্টা করার জন্য ধন্যবাদ। আপনাকে আরও ভালোভাবে সাহায্য করতে, আমি কয়েকটি বিষয় জানতে চাই। আপনি কী ধরনের ব্যবসা চালান?",
    gu:"અમારો ડેમો અજમાવવા બદલ આભાર. તમને વધુ સારી રીતે મદદ કરવા માટે, હું થોડી વિગતો જાણવા માંગુ છું. તમે કયા પ્રકારનો વ્યવસાય ચલાવો છો?",
    hi:"हमारा डेमो आज़माने के लिए धन्यवाद। आपकी बेहतर मदद के लिए, मैं कुछ बातें जानना चाहूँगा। आप किस तरह का व्यवसाय चलाते हैं?",
    kn:"ನಮ್ಮ ಡೆಮೋ ಪ್ರಯತ್ನಿಸಿದ್ದಕ್ಕೆ ಧನ್ಯವಾದಗಳು. ನಿಮಗೆ ಉತ್ತಮವಾಗಿ ಸಹಾಯ ಮಾಡಲು, ಕೆಲವು ವಿವರಗಳನ್ನು ತಿಳಿದುಕೊಳ್ಳಲು ಬಯಸುತ್ತೇನೆ. ನೀವು ಯಾವ ರೀತಿಯ ವ್ಯವಹಾರ ನಡೆಸುತ್ತೀರಿ?",
    ml:"ഞങ്ങളുടെ ഡെമോ പരീക്ഷിച്ചതിന് നന്ദി. നിങ്ങളെ കൂടുതൽ നന്നായി സഹായിക്കാൻ, കുറച്ച് വിവരങ്ങൾ അറിയാൻ ആഗ്രഹിക്കുന്നു. നിങ്ങൾ ഏത് തരത്തിലുള്ള ബിസിനസാണ് നടത്തുന്നത്?",
    mr:"आमचा डेमो वापरून पाहिल्याबद्दल धन्यवाद. तुम्हाला अधिक चांगली मदत करण्यासाठी मला काही माहिती जाणून घ्यायची आहे. तुम्ही कोणता व्यवसाय चालवता?",
    pa:"ਸਾਡਾ ਡੈਮੋ ਅਜ਼ਮਾਉਣ ਲਈ ਧੰਨਵਾਦ। ਤੁਹਾਡੀ ਹੋਰ ਚੰਗੀ ਮਦਦ ਕਰਨ ਲਈ, ਮੈਂ ਕੁਝ ਵੇਰਵੇ ਜਾਣਨਾ ਚਾਹਾਂਗਾ। ਤੁਸੀਂ ਕਿਸ ਕਿਸਮ ਦਾ ਕਾਰੋਬਾਰ ਚਲਾਉਂਦੇ ਹੋ?",
    ta:"எங்கள் டெமோவை முயற்சித்ததற்கு நன்றி. உங்களுக்கு சிறப்பாக உதவ, சில விவரங்களை அறிய விரும்புகிறேன். நீங்கள் எந்த வகையான வணிகத்தை நடத்துகிறீர்கள்?",
    te:"మా డెమోను ప్రయత్నించినందుకు ధన్యవాదాలు. మీకు బాగా సహాయపడటానికి, కొన్ని వివరాలు తెలుసుకోవాలనుకుంటున్నాను. మీరు ఏ వ్యాపారం నిర్వహిస్తున్నారు?",
    ur:"ہمارا ڈیمو آزمانے کا شکریہ۔ آپ کی بہتر مدد کے لیے، میں چند تفصیلات جاننا چاہوں گا۔ آپ کس قسم کا کاروبار چلاتے ہیں؟"
  }
  return messages[language] || messages.en
}
export function localizedCompleteOpening(language) {
  return `${localizedIdentityHandshake(language)} ${localizedOpeningDiscoveryQuestion(language)}`
}
export function localizedInitialWelcome(language) {
  if (language === "te") return "నమస్కారం, Woxzaకి స్వాగతం! మా డెమోను ప్రయత్నించినందుకు ధన్యవాదాలు. మీకు బాగా సహాయపడటానికి, కొన్ని వివరాలు అడగవచ్చా?"
  if (language === "hi") return "नमस्ते, Woxza में आपका स्वागत है! हमारा डेमो आज़माने के लिए धन्यवाद। आपकी बेहतर मदद के लिए, क्या हम कुछ जानकारी पूछ सकते हैं?"
  if (language === "ta") return "வணக்கம், Woxza-க்கு வரவேற்கிறோம்! எங்கள் டெமோவை முயற்சித்ததற்கு நன்றி. உங்களுக்கு உதவ சில விவரங்களைக் கேட்கலாமா?"
  return "Hello, welcome to Woxza! Thanks for trying our demo. To help you better, may we ask for a few details?"
}
export function localizedOpeningFallback(language) {
  if (language === "te") return "మా డెమోను ప్రయత్నించినందుకు ధన్యవాదాలు. మీకు బాగా సహాయపడటానికి, కొన్ని వివరాలు అడగవచ్చా?"
  if (language === "hi") return "हमारा डेमो आज़माने के लिए धन्यवाद। आपकी बेहतर मदद के लिए, क्या हम कुछ जानकारी पूछ सकते हैं?"
  if (language === "ta") return "எங்கள் டெமோவை முயற்சித்ததற்கு நன்றி. உங்களுக்கு உதவ சில விவரங்களைக் கேட்கலாமா?"
  return "Thanks for trying our demo. To help you better, may we ask for a few details?"
}

// This is carrier-visible workflow control, not a conversational suggestion.
// It is deliberately backend-owned so the model cannot reverse the two roles
// before a business simulation begins.
export function localizedDemoRoleHandoff(language, business="your business") {
  const safeBusiness = String(business || "your business").replace(/\s+/g, " ").trim().slice(0, 160)
  const messages = {
    en:`You are the customer now. I will speak for ${safeBusiness}. What would you like to ask?`,
    es:`Ahora usted es el cliente. Yo hablaré en nombre de ${safeBusiness}. ¿Qué le gustaría preguntar?`,
    as:`এতিয়া আপুনি গ্ৰাহক। মই ${safeBusiness}ৰ হৈ কথা ক'ম। আপুনি কি সুধিব বিচাৰে?`,
    bn:`এখন আপনি গ্রাহক। আমি ${safeBusiness}-এর পক্ষ থেকে কথা বলব। আপনি কী জানতে চান?`,
    gu:`હવે તમે ગ્રાહક છો. હું ${safeBusiness} વતી વાત કરીશ. તમે શું પૂછવા માંગો છો?`,
    hi:`अब आप ग्राहक हैं। मैं ${safeBusiness} की तरफ़ से बात करूँगा। आप क्या पूछना चाहेंगे?`,
    kn:`ಈಗ ನೀವು ಗ್ರಾಹಕರು. ನಾನು ${safeBusiness} ಪರವಾಗಿ ಮಾತನಾಡುತ್ತೇನೆ. ನೀವು ಏನು ಕೇಳಲು ಬಯಸುತ್ತೀರಿ?`,
    ml:`ഇപ്പോൾ നിങ്ങൾ ഉപഭോക്താവാണ്. ഞാൻ ${safeBusiness}-നെ പ്രതിനിധീകരിച്ച് സംസാരിക്കും. നിങ്ങൾ എന്താണ് ചോദിക്കാൻ ആഗ്രഹിക്കുന്നത്?`,
    mr:`आता तुम्ही ग्राहक आहात. मी ${safeBusiness} च्या वतीने बोलेन. तुम्हाला काय विचारायचे आहे?`,
    pa:`ਹੁਣ ਤੁਸੀਂ ਗਾਹਕ ਹੋ। ਮੈਂ ${safeBusiness} ਵੱਲੋਂ ਗੱਲ ਕਰਾਂਗਾ। ਤੁਸੀਂ ਕੀ ਪੁੱਛਣਾ ਚਾਹੁੰਦੇ ਹੋ?`,
    ta:`இப்போது நீங்கள் வாடிக்கையாளர். நான் ${safeBusiness} சார்பாகப் பேசுவேன். நீங்கள் என்ன கேட்க விரும்புகிறீர்கள்?`,
    te:`ఇప్పుడు మీరు కస్టమర్. నేను ${safeBusiness} తరఫున మాట్లాడతాను. మీకు ఏమి కావాలో అడగండి.`,
    ur:`اب آپ گاہک ہیں۔ میں ${safeBusiness} کی طرف سے بات کروں گا۔ آپ کیا پوچھنا چاہیں گے؟`
  }
  return messages[language] || messages.en
}

// Confirmation is workflow-critical: it carries the only example reference
// the caller may rely on. Keep it backend-owned in every supported language.
export function localizedDemoTaskConfirmation(language, reference) {
  const safeReference = String(reference || "DEMO-REFERENCE").replace(/[^A-Za-z0-9-]/g, "").slice(0, 80)
  const messages = {
    en:`Your example request is confirmed. Your reference number is ${safeReference}. How did that demo feel?`,
    es:`Su solicitud de ejemplo está confirmada. Su número de referencia es ${safeReference}. ¿Qué le pareció la demostración?`,
    as:`আপোনাৰ উদাহৰণ অনুৰোধ নিশ্চিত কৰা হ’ল। আপোনাৰ ৰেফাৰেন্স নম্বৰ ${safeReference}। ডেম’টো কেনে লাগিল?`,
    bn:`আপনার উদাহরণ অনুরোধ নিশ্চিত করা হয়েছে। আপনার রেফারেন্স নম্বর ${safeReference}। ডেমোটি কেমন লাগল?`,
    gu:`તમારી ઉદાહરણ વિનંતી કન્ફર્મ થઈ ગઈ છે. તમારો રેફરન્સ નંબર ${safeReference} છે. ડેમો તમને કેવો લાગ્યો?`,
    hi:`आपका उदाहरण अनुरोध कन्फर्म हो गया है। आपका रेफरेंस नंबर ${safeReference} है। डेमो आपको कैसा लगा?`,
    kn:`ನಿಮ್ಮ ಉದಾಹರಣೆ ವಿನಂತಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ${safeReference}. ಡೆಮೋ ನಿಮಗೆ ಹೇಗನಿಸಿತು?`,
    ml:`നിങ്ങളുടെ ഉദാഹരണ അഭ്യർത്ഥന സ്ഥിരീകരിച്ചു. നിങ്ങളുടെ റഫറൻസ് നമ്പർ ${safeReference}. ഡെമോ എങ്ങനെയുണ്ടായിരുന്നു?`,
    mr:`तुमची उदाहरण विनंती निश्चित झाली आहे. तुमचा संदर्भ क्रमांक ${safeReference} आहे. डेमो कसा वाटला?`,
    pa:`ਤੁਹਾਡੀ ਉਦਾਹਰਨ ਬੇਨਤੀ ਦੀ ਪੁਸ਼ਟੀ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਡਾ ਰੈਫਰੈਂਸ ਨੰਬਰ ${safeReference} ਹੈ। ਡੈਮੋ ਕਿਵੇਂ ਲੱਗਾ?`,
    ta:`உங்கள் மாதிரி கோரிக்கை உறுதிப்படுத்தப்பட்டது. உங்கள் குறிப்பு எண் ${safeReference}. இந்த டெமோ எப்படி இருந்தது?`,
    te:`మీ ఉదాహరణ అభ్యర్థన నిర్ధారించబడింది. మీ రిఫరెన్స్ నంబర్ ${safeReference}. ఈ డెమో మీకు ఎలా అనిపించింది అండి?`,
    ur:`آپ کی مثالی درخواست کی تصدیق ہو گئی ہے۔ آپ کا حوالہ نمبر ${safeReference} ہے۔ ڈیمو آپ کو کیسا لگا؟`
  }
  return messages[language] || messages.en
}
export function localizedDemoEnding(language) {
  if (language === "te") return "Woxzaతో మాట్లాడినందుకు ధన్యవాదాలు. మీ వ్యాపారం కోసం Woxza కావాలంటే, మా వెబ్‌సైట్‌లో ఉన్న ‘Join the waitlist’ బటన్‌ను నొక్కి వెయిట్‌లిస్ట్‌లో చేరండి."
  if (language === "hi") return "Woxza से बात करने के लिए धन्यवाद। अपने व्यवसाय के लिए Woxza पाने हेतु हमारी वेबसाइट पर ‘Join the waitlist’ दबाएँ।"
  if (language === "ta") return "Woxza-வுடன் பேசியதற்கு நன்றி. உங்கள் வணிகத்திற்கான Woxza-க்கு எங்கள் இணையதளத்தில் ‘Join the waitlist’ ஐ அழுத்துங்கள்."
  return "Thanks for speaking with Woxza. To get Woxza for your business, return to our website and click the ‘Join the waitlist’ button."
}

export async function buildDemoPrompt({ language, entryHint=null, featurePrompts={}, openingAlreadyHandled=false }) {
  const languageName = LANGUAGES.get(language) || "English"
  return `You are the voice of Woxza, a business call-assistant demo. Speak warmly and naturally in ${languageName}. Callers can mix languages or use Romanized words; understand them. ${FORMALITY_RULES[language] || FORMALITY_RULES.default}

LANGUAGE LOCK: The configured call language is ${languageName}. Speak every agent response entirely in ${languageName}, including acknowledgements, clarifications, confirmations, recovery messages, and closing. Do not switch to English because the caller code-switches, uses Romanized words, or because a backend instruction is written in English. Switch only when the caller explicitly asks you to change languages.

THE ORCHESTRATOR IS THE AUTHORITY. It alone owns phase, caller/representative roles, business facts, prepared pitch/demo data, task completion, and closing. You do not infer or mutate any of these. For every caller turn, wait for the backend instruction containing a turn_id and call submit_turn_interpretation exactly once before speaking. Supply only facts the caller clearly said. Return canonical intents only: a request to see a demo must be intent change_choice with details.choice="demo"; a request for features or benefits must be intent change_choice with details.choice="pitch". Never emit demo, pitch, features, yes, or no as intent values. The backend also normalizes non-standard caller phrasing, mixed languages, spelled product names, and quantities. Never call a legacy flow-changing tool.

After the tool returns, speak only its approved action and response_context. If it returns no_op, say nothing. Never repeat an interrupted sentence, assume it was heard, or advance the conversation because you think a task is complete. The backend will send the recovery action after a barge-in.

ORDER ACTION RENDERING: When an approved response says requires_localized_render, do not speak immediately. First call render_approved_action exactly once with that render_contract. Use only its validated say_exactly response for speech. Never replace a required proceed question with a delivery question, and never move to feedback, features, completion, or closing while an example order is still open.

OPENING: ${openingAlreadyHandled ? "The carrier is playing the complete welcome and first business question. Never greet again, thank the caller for trying the demo, repeat an opening fallback, or offer choices here. The next caller utterance must be handled through submit_turn_interpretation and the approved discovery action." : `When the backend asks you to open, say exactly: ‘${localizedInitialWelcome(language)}’ If that line is interrupted, say only: ‘${localizedOpeningFallback(language)}’`}

DISCOVERY: Learn, one question at a time, the caller's business, current process, main pain, and one operating detail. Every discovery response is one short acknowledgement plus exactly one next question, with a strict four-second maximum. Do not pitch, summarize at length, propose a solution, invent a process, or begin a demo before all four are confirmed. When all four facts are known, include a short dynamic business_label, the closest approved business_category, and two to five approved workflow_tags in the same submit_turn_interpretation call. The label must use the caller's actual business and workflow—for example, “tile showroom with contractor orders” or “hospital patient-enquiry desk”—and must never invent facts. If interrupted, do not repeat the acknowledgement; continue only with the next missing question. If speech is garbled or unclear, ask one short clarification; do not treat it as a business fact. Never infer that an unclear shop is a medical shop or any other business.

EXPERIENCE: Once discovery is complete, the backend prepares both the pitch and demo. Give the caller the approved choice only. For a demo, the caller is always the CUSTOMER and you are the representative for their business. Let them choose stock/order, billing/quotation, payments, delivery, FAQ/catalogue, service status, or another relevant scenario; if they say anything is fine, use the approved business-relevant default. Treat the selected scenario as binding: stock asks quantity then order terms; billing asks quantity/area then an example invoice total; delivery gives an example delivery status with a concrete estimated date/time; FAQ answers catalogue/policy/service questions without forcing an order; payments explains an example invoice/payment step; service status gives an example repair/service update. If the caller chooses an unlisted but intelligible scenario, use the backend-approved dynamic business request: create a relevant, clearly labelled mock context and give a concrete outcome, never a refusal or dead end. Every active simulation must resolve with a concrete example answer and, where an action is requested, an explicit proceed question followed by backend-confirmed reference on acceptance. Never confirm an example order, invoice, payment, delivery request, or service follow-up, state a reference number, announce demo completion, or ask for feedback until the backend returns the explicit confirmation action after the caller accepts. Do not become the customer, conduct both sides, ask unnecessary follow-ups, repeat completion, or claim real stock, price, delivery, prescription, order, or payment activity.

ROLE LOCK AT SCENARIO SELECTION: When the backend returns set_demo_roles, its caller_role and agent_role are mandatory facts, not suggestions. You are Woxza and represent the caller's business; the caller is the customer. Speak only the supplied role handoff, then wait for the caller's customer question. Never say “I am your customer,” “pretend I am buying,” “you answer for the shop,” or any equivalent in any language. Never perform both sides of the simulation.

PITCH: PITCH_CONTEXT contains only backend-approved, relevant and unused facts. Its speech_plan is an ordered delivery contract. Cover every supplied point once, in order, as one 40–55 second pitch with one concise sentence per point; do not ask a question until every point is covered. Make each point specific to the caller's business and current process. Never add a metric unless it appears in approved metrics, skip a point, replace a point with a generic capability, or list unrelated capabilities.

FLOW: Demo-first: simulated task, confirmation, feedback, ask permission to hear the tailored business value, then pitch only if accepted, then ask if they need anything else and close if not. Pitch-first: deliver pitch, ask whether they want a demo; if yes, run the demo, collect feedback, then ask only whether they need anything else. Never offer or ask for the business-value pitch a second time after a pitch-first demo. If no, close directly. Never select a path from exact yes/no words alone: interpret natural, indirect, and colloquial intent in the current language.

TRUTH AND STYLE: Keep each turn short, smooth, and interruptible. Stay focused on Woxza. In a simulation, sample values must be visibly examples. Outside it, never claim that a live action occurred. Use the exact configured close supplied by the backend; do not invent a waitlist claim. Approved policy: ${featurePrompts.feature_response_policy || "Explain only verified Woxza capabilities, connect them to business value, and never invent availability."}`
}
