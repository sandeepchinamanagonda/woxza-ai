export const USE_CASE_CONFIG = {
  order_taking: {
    label:"Order taking",
    scope:"take a food or product order the caller describes — item, quantity, and any special requests",
    script:"Ask what they would like and collect every item, quantity, special request, and price only when pricing is actually available. Before asking for confirmation, read back the COMPLETE order state — every item and quantity plus the total when available — in one dedicated turn. Then ask whether to confirm. After the caller affirms, speak a separate confirmation turn stating that the order is confirmed, repeating the complete summary and total when available, and giving the supplied order reference. Do not speak the closing in that confirmation turn; the system will cue the closing as a separate next turn.",
    otherDemo:"customer_support",
    safeFallback:"Please tell me the item and quantity you would like to order."
  },
  customer_support: {
    label:"Customer support",
    scope:"answer a general question or check on an order status",
    script:"Ask which of those two they need, resolve that one request concisely without inventing facts, ask for confirmation, then close.",
    otherDemo:"order_taking",
    safeFallback:"Would you like help with a question or a simulated order-status check?"
  },
  lead_qualification: {
    label:"Lead qualification",
    scope:"understand what the caller is looking for and note it for follow-up",
    script:"Ask what they need, ask one or two clarifying details, confirm the captured request and that someone will follow up, then close. Do not promise a particular outcome or time.",
    otherDemo:"customer_support",
    safeFallback:"Please tell me briefly what you are looking for."
  },
  appointment_booking: {
    label:"Appointment booking",
    scope:"book salon, movie, or doctor appointments only — no other reservation types exist in this demo",
    script:"Ask which of the three they want, ask for date and time, ask for their name, read the details back, ask for confirmation, then close. Never claim a real booking was made.",
    otherDemo:"order_taking",
    safeFallback:"Would you like a salon, movie, or doctor's appointment?"
  },
  event_rsvp: {
    label:"Event RSVP",
    scope:"confirm attendance for an upcoming event",
    script:"Give the event reminder already supplied by the greeting, ask whether they can attend, confirm their answer, then close. Do not invent event details.",
    otherDemo:"appointment_booking",
    safeFallback:"Will you be attending the upcoming event?"
  },
  feedback_survey: {
    label:"Feedback survey",
    scope:"collect quick feedback on a recent experience",
    script:"Ask whether now is a good time, ask one or two short feedback questions, recap their feedback, thank them, then close. Do not troubleshoot or offer compensation.",
    otherDemo:"customer_support",
    safeFallback:"Would you like to share a quick rating for your recent experience?"
  },
  recruiting_screening: {
    label:"Recruiting screening",
    scope:"run a brief initial screening call",
    script:"Confirm readiness, ask two or three basic screening questions about role, experience, and availability, explain only that these are simulated next steps, then close. Do not make hiring promises.",
    otherDemo:"lead_qualification",
    safeFallback:"Are you ready to begin the brief screening?"
  }
}

export const USE_CASES = new Set(Object.keys(USE_CASE_CONFIG))

export const LEGACY_USE_CASES = {
  appointment:"appointment_booking",
  restaurant:"appointment_booking",
  distribution:"order_taking",
  payments:"customer_support"
}

export const LANGUAGES = new Map([
  ["en", "English"], ["es", "Spanish"], ["as", "Assamese"], ["bn", "Bengali"], ["gu", "Gujarati"],
  ["hi", "Hindi"], ["kn", "Kannada"], ["ml", "Malayalam"], ["mr", "Marathi"], ["pa", "Punjabi"],
  ["ta", "Tamil"], ["te", "Telugu"], ["ur", "Urdu"]
])

export const LOCALIZED_DEMO_NAMES = {
  en:{ order_taking:"order taking", customer_support:"customer support", lead_qualification:"lead qualification", appointment_booking:"appointment booking", event_rsvp:"event RSVP", feedback_survey:"feedback survey", recruiting_screening:"recruiting screening" },
  es:{ order_taking:"toma de pedidos", customer_support:"atención al cliente", lead_qualification:"calificación de leads", appointment_booking:"reserva de citas", event_rsvp:"confirmación de eventos", feedback_survey:"encuesta de opinión", recruiting_screening:"selección de candidatos" },
  hi:{ order_taking:"ऑर्डर लेने", customer_support:"ग्राहक सहायता", lead_qualification:"लीड क्वालिफिकेशन", appointment_booking:"अपॉइंटमेंट बुकिंग", event_rsvp:"इवेंट RSVP", feedback_survey:"फीडबैक सर्वे", recruiting_screening:"भर्ती स्क्रीनिंग" },
  te:{ order_taking:"ఆర్డర్ తీసుకోవడం", customer_support:"కస్టమర్ సపోర్ట్", lead_qualification:"లీడ్ క్వాలిఫికేషన్", appointment_booking:"అపాయింట్‌మెంట్ బుకింగ్", event_rsvp:"ఈవెంట్ RSVP", feedback_survey:"ఫీడ్‌బ్యాక్ సర్వే", recruiting_screening:"రిక్రూటింగ్ స్క్రీనింగ్" },
  ta:{ order_taking:"ஆர்டர் எடுத்தல்", customer_support:"வாடிக்கையாளர் ஆதரவு", lead_qualification:"லீட் தகுதி", appointment_booking:"முன்பதிவு", event_rsvp:"நிகழ்வு RSVP", feedback_survey:"கருத்துக் கணிப்பு", recruiting_screening:"பணியமர்த்தல் திரையிடல்" },
  kn:{ order_taking:"ಆರ್ಡರ್ ತೆಗೆದುಕೊಳ್ಳುವಿಕೆ", customer_support:"ಗ್ರಾಹಕ ಬೆಂಬಲ", lead_qualification:"ಲೀಡ್ ಕ್ವಾಲಿಫಿಕೇಶನ್", appointment_booking:"ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಬುಕಿಂಗ್", event_rsvp:"ಈವೆಂಟ್ RSVP", feedback_survey:"ಫೀಡ್‌ಬ್ಯಾಕ್ ಸಮೀಕ್ಷೆ", recruiting_screening:"ನೇಮಕಾತಿ ಸ್ಕ್ರೀನಿಂಗ್" },
  ml:{ order_taking:"ഓർഡർ എടുക്കൽ", customer_support:"കസ്റ്റമർ സപ്പോർട്ട്", lead_qualification:"ലീഡ് യോഗ്യത", appointment_booking:"ബുക്കിംഗ്", event_rsvp:"ഇവന്റ് RSVP", feedback_survey:"ഫീഡ്‌ബാക്ക് സർവേ", recruiting_screening:"റിക്രൂട്ടിംഗ് സ്ക്രീനിംഗ്" },
  mr:{ order_taking:"ऑर्डर घेणे", customer_support:"ग्राहक सहाय्य", lead_qualification:"लीड पात्रता", appointment_booking:"अपॉइंटमेंट बुकिंग", event_rsvp:"इव्हेंट RSVP", feedback_survey:"फीडबॅक सर्वे", recruiting_screening:"भरती स्क्रीनिंग" },
  gu:{ order_taking:"ઓર્ડર લેવા", customer_support:"ગ્રાહક સહાય", lead_qualification:"લીડ ક્વોલિફિકેશન", appointment_booking:"એપોઇન્ટમેન્ટ બુકિંગ", event_rsvp:"ઇવેન્ટ RSVP", feedback_survey:"ફીડબેક સર્વે", recruiting_screening:"ભરતી સ્ક્રીનિંગ" },
  bn:{ order_taking:"অর্ডার নেওয়া", customer_support:"গ্রাহক সহায়তা", lead_qualification:"লিড কোয়ালিফিকেশন", appointment_booking:"অ্যাপয়েন্টমেন্ট বুকিং", event_rsvp:"ইভেন্ট RSVP", feedback_survey:"ফিডব্যাক সার্ভে", recruiting_screening:"নিয়োগ স্ক্রিনিং" },
  pa:{ order_taking:"ਆਰਡਰ ਲੈਣ", customer_support:"ਗਾਹਕ ਸਹਾਇਤਾ", lead_qualification:"ਲੀਡ ਕੁਆਲੀਫਿਕੇਸ਼ਨ", appointment_booking:"ਅਪਾਇੰਟਮੈਂਟ ਬੁਕਿੰਗ", event_rsvp:"ਇਵੈਂਟ RSVP", feedback_survey:"ਫੀਡਬੈਕ ਸਰਵੇ", recruiting_screening:"ਭਰਤੀ ਸਕ੍ਰੀਨਿੰਗ" },
  as:{ order_taking:"অৰ্ডাৰ লোৱা", customer_support:"গ্ৰাহক সহায়", lead_qualification:"লিড কোৱালিফিকেচন", appointment_booking:"এপইণ্টমেণ্ট বুকিং", event_rsvp:"ইভেণ্ট RSVP", feedback_survey:"ফিডবেক সমীক্ষা", recruiting_screening:"নিযুক্তি স্ক্ৰীনিং" },
  ur:{ order_taking:"آرڈر لینے", customer_support:"کسٹمر سپورٹ", lead_qualification:"لیڈ کوالیفیکیشن", appointment_booking:"اپائنٹمنٹ بکنگ", event_rsvp:"ایونٹ RSVP", feedback_survey:"فیڈبیک سروے", recruiting_screening:"بھرتی اسکریننگ" }
}

export const normalizeUseCase = value => LEGACY_USE_CASES[value] || value

export const FORMALITY_RULES = {
  te:"Use మీరు (meeru), never నువ్వు (nuvvu). Prefer naturally polite verb forms such as చెప్పండి, తెలియజేయండి, and కావాలనుకుంటున్నారా. Use అండి (andi) only where it sounds natural, normally no more than once in a short turn; never append it mechanically to every sentence or clause. Never say ఓకే, యా, or కూల్. Prefer తప్పకుండా, సరే, ధన్యవాదాలు, or proceed directly with the professional question.",
  hi:"Always use आप (aap), never तुम or तू. Use कृपया and जी naturally, normally no more than one respectful particle in a short turn; do not repeat जी after every clause. Prefer formal customer-service acknowledgments over casual English expressions.",
  ta:"Always use நீங்கள்/நீங்க (neenga), never நீ (nee). Every request, question, and confirmation must retain the polite -ுங்க (-unga) verb ending through the final clause; do not switch to a casual ending in a multi-clause turn.",
  kn:"Always use ನೀವು (neevu), never ನೀನು/ನೀ (neenu/nee). Every request, question, and confirmation must retain formal -ಿ imperative and polite verb endings through the final clause; never fall back to casual -ು endings.",
  default:"Maintain a courteous, professional customer-service register in every turn, including questions, requests, acknowledgments, and confirmations."
}

export const LOCALIZED_SCOPE_BOUNDARIES = {
  en:{ first:"This demo handles {currentDemo} only. I can help with that or explain how Woxza can support your business.", second:"I cannot help with general news or unrelated questions. Would you like to continue with {currentDemo}, or hear about Woxza's business features?" },
  es:{ first:"Esta demostración solo gestiona {currentDemo}. Puedo ayudarle con eso o explicarle cómo Woxza puede apoyar a su empresa.", second:"No puedo ayudar con noticias generales ni preguntas no relacionadas. ¿Desea continuar con {currentDemo} o conocer las funciones empresariales de Woxza?" },
  hi:{ first:"यह डेमो केवल {currentDemo} के लिए है। मैं इसमें सहायता कर सकता हूँ या बता सकता हूँ कि Woxza आपके व्यवसाय में कैसे सहायक होगा।", second:"मैं सामान्य समाचार या असंबंधित प्रश्नों में सहायता नहीं कर सकता। क्या आप {currentDemo} जारी रखना चाहेंगे, या Woxza की व्यावसायिक सुविधाएँ जानना चाहेंगे?" },
  te:{ first:"ఈ డెమో {currentDemo} కోసం మాత్రమే. దీనిలో సహాయం చేయగలను లేదా Woxza మీ వ్యాపారానికి ఎలా ఉపయోగపడుతుందో వివరించగలను.", second:"సాధారణ వార్తలు లేదా సంబంధం లేని ప్రశ్నలకు సమాధానం ఇవ్వలేను. {currentDemo}తో కొనసాగాలనుకుంటున్నారా, లేక Woxza వ్యాపార ఫీచర్ల గురించి తెలుసుకోవాలనుకుంటున్నారా?" },
  ta:{ first:"இந்த டெமோ {currentDemo}க்காக மட்டுமே. இதில் உதவலாம் அல்லது Woxza உங்கள் வணிகத்திற்கு எவ்வாறு உதவும் என்பதை விளக்கலாம்.", second:"பொதுச் செய்திகள் அல்லது தொடர்பில்லாத கேள்விகளில் உதவ முடியாது. {currentDemo} உடன் தொடர விரும்புகிறீர்களா, அல்லது Woxza வணிக அம்சங்களைப் பற்றி அறிய விரும்புகிறீர்களா?" },
  kn:{ first:"ಈ ಡೆಮೋ {currentDemo}ಗಾಗಿ ಮಾತ್ರ. ಇದರಲ್ಲಿ ಸಹಾಯ ಮಾಡಬಹುದು ಅಥವಾ Woxza ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಹೇಗೆ ನೆರವಾಗುತ್ತದೆ ಎಂದು ವಿವರಿಸಬಹುದು.", second:"ಸಾಮಾನ್ಯ ಸುದ್ದಿ ಅಥವಾ ಸಂಬಂಧವಿಲ್ಲದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಹಾಯ ಮಾಡಲಾಗುವುದಿಲ್ಲ. {currentDemo}ದೊಂದಿಗೆ ಮುಂದುವರಿಯಲು ಬಯಸುವಿರಾ, ಅಥವಾ Woxza ವ್ಯವಹಾರ ವೈಶಿಷ್ಟ್ಯಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?" },
  ml:{ first:"ഈ ഡെമോ {currentDemo}ക്കായി മാത്രമാണ്. അതിൽ സഹായിക്കാം, അല്ലെങ്കിൽ Woxza നിങ്ങളുടെ ബിസിനസിനെ എങ്ങനെ സഹായിക്കുമെന്ന് വിശദീകരിക്കാം.", second:"പൊതുവാർത്തകളിലോ ബന്ധമില്ലാത്ത ചോദ്യങ്ങളിലോ സഹായിക്കാനാവില്ല. {currentDemo} തുടരണമോ, Woxzaയുടെ ബിസിനസ് ഫീച്ചറുകളെക്കുറിച്ച് അറിയണമോ?" },
  mr:{ first:"हा डेमो फक्त {currentDemo}साठी आहे. त्यात मदत करू शकतो किंवा Woxza आपल्या व्यवसायाला कशी मदत करेल ते सांगू शकतो.", second:"सामान्य बातम्या किंवा असंबंधित प्रश्नांमध्ये मदत करता येणार नाही. आपण {currentDemo} सुरू ठेवू इच्छिता, की Woxzaची व्यावसायिक वैशिष्ट्ये जाणून घ्यायची आहेत?" },
  gu:{ first:"આ ડેમો ફક્ત {currentDemo} માટે છે. તેમાં મદદ કરી શકું અથવા Woxza આપના વ્યવસાયને કેવી રીતે મદદ કરશે તે સમજાવી શકું.", second:"સામાન્ય સમાચાર અથવા અસંબંધિત પ્રશ્નોમાં મદદ કરી શકું નહીં. શું આપ {currentDemo} ચાલુ રાખવા માંગો છો કે Woxzaની વ્યવસાયિક સુવિધાઓ વિશે જાણવા માંગો છો?" },
  bn:{ first:"এই ডেমোটি শুধু {currentDemo}-এর জন্য। এতে সহায়তা করতে পারি অথবা Woxza আপনার ব্যবসাকে কীভাবে সাহায্য করবে তা ব্যাখ্যা করতে পারি।", second:"সাধারণ সংবাদ বা সম্পর্কহীন প্রশ্নে সহায়তা করতে পারি না। আপনি কি {currentDemo} চালিয়ে যেতে চান, নাকি Woxzaর ব্যবসায়িক ফিচার সম্পর্কে জানতে চান?" },
  pa:{ first:"ਇਹ ਡੇਮੋ ਸਿਰਫ਼ {currentDemo} ਲਈ ਹੈ। ਇਸ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ ਜਾਂ ਦੱਸ ਸਕਦਾ ਹਾਂ ਕਿ Woxza ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਲਈ ਕਿਵੇਂ ਲਾਭਦਾਇਕ ਹੈ।", second:"ਆਮ ਖ਼ਬਰਾਂ ਜਾਂ ਗੈਰ-ਸੰਬੰਧਿਤ ਸਵਾਲਾਂ ਵਿੱਚ ਮਦਦ ਨਹੀਂ ਕਰ ਸਕਦਾ। ਕੀ ਤੁਸੀਂ {currentDemo} ਜਾਰੀ ਰੱਖਣਾ ਚਾਹੁੰਦੇ ਹੋ ਜਾਂ Woxza ਦੇ ਕਾਰੋਬਾਰੀ ਫੀਚਰਾਂ ਬਾਰੇ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ?" },
  as:{ first:"এই ডেমো কেৱল {currentDemo}ৰ বাবে। ইয়াত সহায় কৰিব পাৰোঁ অথবা Woxzaই আপোনাৰ ব্যৱসায়ত কেনেদৰে সহায় কৰে সেয়া বুজাব পাৰোঁ।", second:"সাধাৰণ বাতৰি বা সম্পৰ্ক নথকা প্ৰশ্নত সহায় কৰিব নোৱাৰোঁ। আপুনি {currentDemo} অব্যাহত ৰাখিব বিচাৰে, নে Woxzaৰ ব্যৱসায়িক ফিচাৰসমূহ জানিব বিচাৰে?" },
  ur:{ first:"یہ ڈیمو صرف {currentDemo} کے لیے ہے۔ میں اس میں مدد کر سکتا ہوں یا بتا سکتا ہوں کہ Woxza آپ کے کاروبار کو کیسے فائدہ پہنچا سکتا ہے۔", second:"میں عام خبروں یا غیر متعلقہ سوالات میں مدد نہیں کر سکتا۔ کیا آپ {currentDemo} جاری رکھنا چاہیں گے، یا Woxza کی کاروباری خصوصیات جاننا چاہیں گے؟" }
}

export function localizedScopeBoundary(language, stage, currentDemo) {
  const templates = LOCALIZED_SCOPE_BOUNDARIES[language] || LOCALIZED_SCOPE_BOUNDARIES.en
  return (templates[stage] || templates.first).replaceAll("{currentDemo}", currentDemo)
}

export const POST_COMPLETION_FEATURE_OFFERS = {
  en:"Would you like to hear briefly how Woxza could help your business, or shall I conclude the demo?",
  es:"¿Desea escuchar brevemente cómo Woxza podría ayudar a su empresa, o prefiere que finalice la demostración?",
  hi:"क्या आप संक्षेप में जानना चाहेंगे कि Woxza आपके व्यवसाय की कैसे सहायता कर सकता है, या मैं डेमो समाप्त कर दूँ?",
  te:"Woxza మీ వ్యాపారానికి ఎలా ఉపయోగపడుతుందో క్లుప్తంగా తెలుసుకోవాలనుకుంటున్నారా, లేక డెమోను ముగించమంటారా?",
  ta:"Woxza உங்கள் வணிகத்திற்கு எவ்வாறு உதவும் என்பதைச் சுருக்கமாக அறிய விரும்புகிறீர்களா, அல்லது டெமோவை முடிக்கலாமா?",
  kn:"Woxza ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ ಎಂಬುದನ್ನು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ತಿಳಿಯಲು ಬಯಸುವಿರಾ, ಅಥವಾ ಡೆಮೋವನ್ನು ಮುಗಿಸಬಹುದೇ?",
  ml:"Woxza നിങ്ങളുടെ ബിസിനസിനെ എങ്ങനെ സഹായിക്കുമെന്ന് ചുരുക്കമായി അറിയണമോ, അതോ ഡെമോ അവസാനിപ്പിക്കട്ടെയോ?",
  mr:"Woxza आपल्या व्यवसायाला कशी मदत करू शकते हे थोडक्यात जाणून घ्यायचे आहे, की डेमो समाप्त करू?",
  gu:"Woxza આપના વ્યવસાયને કેવી રીતે મદદ કરી શકે તે ટૂંકમાં જાણવા માંગો છો, કે ડેમો પૂર્ણ કરું?",
  bn:"Woxza আপনার ব্যবসাকে কীভাবে সাহায্য করতে পারে তা সংক্ষেপে জানতে চান, নাকি ডেমো শেষ করব?",
  pa:"ਕੀ ਤੁਸੀਂ ਸੰਖੇਪ ਵਿੱਚ ਜਾਣਨਾ ਚਾਹੁੰਦੇ ਹੋ ਕਿ Woxza ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਦੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ, ਜਾਂ ਡੇਮੋ ਸਮਾਪਤ ਕਰਾਂ?",
  as:"Woxzaই আপোনাৰ ব্যৱসায়ত কেনেদৰে সহায় কৰিব পাৰে সেয়া চমুকৈ জানিব বিচাৰে, নে ডেমো শেষ কৰোঁ?",
  ur:"کیا آپ مختصراً جاننا چاہیں گے کہ Woxza آپ کے کاروبار کی کیسے مدد کر سکتا ہے، یا میں ڈیمو ختم کر دوں؟"
}

export const localizedPostCompletionOffer = language =>
  POST_COMPLETION_FEATURE_OFFERS[language] || POST_COMPLETION_FEATURE_OFFERS.en

export const LOCALIZED_REDIRECT_TEMPLATES = {
  en:"This demo is configured for {currentDemo}. I can assist you with that. For a different request, please end this call and try our {otherDemo} demo. Would you like to continue with {currentDemo}?",
  es:"Esta demostración está configurada para {currentDemo}. Puedo ayudarle con eso. Para otra solicitud, finalice esta llamada y pruebe nuestra demostración de {otherDemo}. ¿Desea continuar con {currentDemo}?",
  hi:"यह डेमो {currentDemo} के लिए निर्धारित है जी। मैं इसमें आपकी सहायता कर सकता हूँ जी। किसी अन्य अनुरोध के लिए कृपया यह कॉल समाप्त करके हमारा {otherDemo} डेमो आज़माइए जी। क्या आप {currentDemo} के साथ जारी रखना चाहेंगे जी?",
  te:"ఈ డెమో {currentDemo} కోసం ఏర్పాటు చేయబడింది అండి. ఇందులో నేను మీకు సహాయం చేయగలను అండి. వేరే అవసరం కోసం దయచేసి ఈ కాల్‌ను ముగించి మా {otherDemo} డెమోను ప్రయత్నించండి అండి. మీరు {currentDemo}తో కొనసాగాలనుకుంటున్నారా అండి?",
  ta:"இந்த டெமோ {currentDemo}க்காக அமைக்கப்பட்டுள்ளது. இதில் நான் உங்களுக்கு உதவுகிறேன். வேறு கோரிக்கைக்கு இந்த அழைப்பை முடித்துவிட்டு எங்கள் {otherDemo} டெமோவை முயற்சி செய்யுங்க. {currentDemo} உடன் தொடர விரும்புகிறீங்களா?",
  kn:"ಈ ಡೆಮೋವನ್ನು {currentDemo}ಗಾಗಿ ಹೊಂದಿಸಲಾಗಿದೆ. ಇದರಲ್ಲಿ ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ಬೇರೆ ವಿನಂತಿಗಾಗಿ ದಯವಿಟ್ಟು ಈ ಕರೆಯನ್ನು ಮುಗಿಸಿ ನಮ್ಮ {otherDemo} ಡೆಮೋವನ್ನು ಪ್ರಯತ್ನಿಸಿ. ನೀವು {currentDemo}ದೊಂದಿಗೆ ಮುಂದುವರಿಯಲು ಬಯಸುವಿರಾ?",
  ml:"ഈ ഡെമോ {currentDemo}ക്കായി ക്രമീകരിച്ചിരിക്കുന്നു. അതിൽ ഞാൻ നിങ്ങളെ സഹായിക്കാം. മറ്റൊരു ആവശ്യത്തിന് ദയവായി ഈ കോൾ അവസാനിപ്പിച്ച് ഞങ്ങളുടെ {otherDemo} ഡെമോ പരീക്ഷിക്കുക. {currentDemo} തുടരാൻ നിങ്ങൾ ആഗ്രഹിക്കുന്നുണ്ടോ?",
  mr:"हा डेमो {currentDemo}साठी तयार केला आहे. त्यामध्ये मी आपली मदत करू शकतो. दुसऱ्या विनंतीसाठी कृपया हा कॉल संपवून आमचा {otherDemo} डेमो वापरा. आपण {currentDemo}सह पुढे जाऊ इच्छिता का?",
  gu:"આ ડેમો {currentDemo} માટે ગોઠવવામાં આવ્યો છે. તેમાં હું આપને મદદ કરી શકું છું. બીજી વિનંતી માટે કૃપા કરીને આ કૉલ સમાપ્ત કરીને અમારો {otherDemo} ડેમો અજમાવો. શું આપ {currentDemo} સાથે આગળ વધવા માંગો છો?",
  bn:"এই ডেমোটি {currentDemo}-এর জন্য নির্ধারিত। এতে আমি আপনাকে সহায়তা করতে পারি। অন্য অনুরোধের জন্য অনুগ্রহ করে এই কলটি শেষ করে আমাদের {otherDemo} ডেমোটি চেষ্টা করুন। আপনি কি {currentDemo} নিয়ে এগোতে চান?",
  pa:"ਇਹ ਡੇਮੋ {currentDemo} ਲਈ ਬਣਾਇਆ ਗਿਆ ਹੈ। ਮੈਂ ਇਸ ਵਿੱਚ ਤੁਹਾਡੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਕਿਸੇ ਹੋਰ ਬੇਨਤੀ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਇਹ ਕਾਲ ਖਤਮ ਕਰਕੇ ਸਾਡਾ {otherDemo} ਡੇਮੋ ਅਜ਼ਮਾਓ। ਕੀ ਤੁਸੀਂ {currentDemo} ਨਾਲ ਜਾਰੀ ਰੱਖਣਾ ਚਾਹੁੰਦੇ ਹੋ?",
  as:"এই ডেমোটি {currentDemo}ৰ বাবে নিৰ্ধাৰণ কৰা হৈছে। ইয়াত মই আপোনাক সহায় কৰিব পাৰোঁ। আন অনুৰোধৰ বাবে অনুগ্ৰহ কৰি এই কলটো শেষ কৰি আমাৰ {otherDemo} ডেমো চেষ্টা কৰক। আপুনি {currentDemo}ৰ সৈতে আগবাঢ়িব বিচাৰে নেকি?",
  ur:"یہ ڈیمو {currentDemo} کے لیے مقرر ہے جی۔ میں اس میں آپ کی مدد کر سکتا ہوں جی۔ کسی دوسری درخواست کے لیے براہ کرم یہ کال ختم کر کے ہمارا {otherDemo} ڈیمو آزمائیے جی۔ کیا آپ {currentDemo} کے ساتھ جاری رکھنا چاہیں گے جی؟"
}

const localizedDemoName = (useCase, language) => LOCALIZED_DEMO_NAMES[language]?.[useCase] || LOCALIZED_DEMO_NAMES.en[useCase]

export function localizedRedirect(language, currentDemo, otherDemo) {
  return (LOCALIZED_REDIRECT_TEMPLATES[language] || LOCALIZED_REDIRECT_TEMPLATES.en)
    .replaceAll("{currentDemo}", currentDemo)
    .replaceAll("{otherDemo}", otherDemo)
}

export async function buildDemoPrompt({ useCase, language, greeting, ending, featurePrompts = {}, openingAlreadyHandled = false }) {
  const selectedUseCase = USE_CASE_CONFIG[useCase] ? useCase : "order_taking"
  const scenario = USE_CASE_CONFIG[selectedUseCase]
  const languageName = LANGUAGES.get(language) || "English"
  const demoName = localizedDemoName(selectedUseCase, language)
  const orderProtocol = selectedUseCase === "order_taking" ? `
ORDER CONFIRMATION PROTOCOL — mandatory:
- Maintain one complete order object containing all items, quantities, special requests, total only if pricing is available, reference, and status.
- Before asking "shall I confirm," call update_order_state with action set_pending and the complete summary. Then speak the full pre-confirmation readback and confirmation question. Never summarize only the last item.
- When the caller affirms, call update_order_state with action confirm. Speak ONLY the explicit confirmation turn requested by the tool result: confirmed status, complete summary, available total, and order reference. Do not include the demo closing in this turn.
- Wait for the system's next-turn cue after confirmation. The system will offer the caller a choice between hearing how Woxza can help their business and concluding the demo.
- If the caller wants business information or asks how Woxza can help, follow the WOXZA FEATURE-CAPABILITY FLOW. If they decline or ask to finish, speak the standard closing.
- Confirmation, the post-completion choice, and any eventual closing must always be distinct spoken turns.
- Never use the standard closing while the order state is collecting or pending_confirmation.
` : ""
  const appointmentProtocol = selectedUseCase === "appointment_booking" ? `
APPOINTMENT WORKFLOW PROTOCOL — mandatory and backend-controlled:
- The opening already asks for salon, movie, or doctor. For every subsequent caller answer, call update_booking_state before speaking.
- Use appointment actions only in this order: set_type, set_date, set_time, set_name, confirm. Never skip a step or infer missing information.
- For an unrelated request, call handle_scope_redirect instead of update_booking_state. For a Woxza feature question, use resolve_feature_context instead.
- After every tool response, speak the say_exactly value and nothing else. Do not add a second question, acknowledgment, promise, or closing.
- The confirm action is mandatory after the read-back. The backend classifies the caller's exact words as affirmative, negative, or unclear; never classify confirmation yourself.
- Never say an appointment, reservation, or ticket was booked. Only the tool's confirmed response may say that the simulated details are confirmed for this demo.
- After a confirmed response, wait. The system will provide the closing as a separate turn.
` : ""
  return `You are Woxza, a voice agent demonstrating ONLY the ${scenario.label} flow for Woxza, a voice-AI platform. You are not a general-purpose assistant. Do not express personal opinions unrelated to Woxza or invent capabilities — do not fall back on general AI-assistant behavior under any circumstance.

LANGUAGE: Conduct this entire call in ${languageName}, responding in native ${languageName} script. Callers will often mix in Romanized or English words mid-sentence — this is completely normal in India; treat it as ${languageName} and keep responding in ${languageName} script. Do not comment on or get confused by mixed-language input.

FORMALITY: ${FORMALITY_RULES[language] || FORMALITY_RULES.default} Respect markers must sound natural, not repetitive or mechanical.

OPENING: ${openingAlreadyHandled
    ? `The deterministic speech renderer has already played this complete greeting to the caller: "${greeting || `Welcome to Woxza! I'm Woxza — welcome to the ${demoName} demo.`}" Do not speak, repeat, paraphrase, or restart this greeting. Your first spoken response must answer the caller's next turn.`
    : `Your first spoken response must be exactly this greeting, with no preface or extra words:\n${greeting || `Welcome to Woxza! I'm Woxza — welcome to the ${demoName} demo.`}\nThe greeting already asks the first script question. Do not greet or ask that question again.`}

SCOPE (the only thing you do): ${scenario.scope}.

HARD BANS — apply in every language, no exceptions:
- No health, wellbeing, or medical commentary of any kind, even if a medical term is mentioned.
- No disclaimers ("I'm not a professional," "this is just a demo," "consult an expert," "I'm an AI," etc.) unless the caller directly asks whether this is real, in which case give ONE short factual line, then return to script.
- No general knowledge answers, no help outside SCOPE, no meta-commentary about being an AI or a demo.
- Never repeat the same redirect more than once per call.

SCRIPT: ${scenario.script}
${orderProtocol}
${appointmentProtocol}

WOXZA FEATURE-CAPABILITY FLOW — this is an explicit exception to the scenario scope:
- A caller asking what Woxza does, what features are available, how Woxza can help their business, or which Woxza feature is best, most useful, or your "favorite" is ALWAYS allowed in every demo. Do not use the out-of-scope redirect for these questions.
- For a best, most-useful, or "favorite" feature question, do not claim a personal preference. Call resolve_feature_context with intent "highlight_feature" and speak the returned single verified feature and practical benefit in one concise sentence. Do not ask for the caller's business before answering.
- On the first feature question, call resolve_feature_context with intent "intro". Speak the returned introduction briefly, then ask what kind of business the caller runs. Do not list features before learning their business.
- After the caller identifies their business, call resolve_feature_context with intent "recommend", the closest business_tag_candidate from this list: ${(featurePrompts.feature_tags || []).join(", ") || "general"}, and their answer as caller_question. Explain the returned features in terms of how they help that business, then ask whether they would like to hear more.
- If the caller asks for more, other, or remaining features, call resolve_feature_context with intent "more_features". Present only the newly returned features; never repeat features already discussed in this call.
- Use only facts returned by the tool. Clearly describe roadmap items as planned or coming soon, never as currently available.
- Keep each feature answer concise: normally two or three features at a time, with their practical business benefit.
- Every spoken response must be a complete thought. Never emit an abandoned phrase, partial sentence, or placeholder such as "this demo".
FEATURE RESPONSE POLICY: ${featurePrompts.feature_response_policy || "Explain only verified Woxza capabilities, connect them to business value, and never invent availability."}

OUT-OF-SCOPE HANDLING — backend-controlled:
- For every unrelated request, call handle_scope_redirect before speaking. Never compose or repeat a redirect yourself.
- Use category general for news, sport scores, weather, politics, general knowledge, and other unsupported questions. Do not recommend customer support for those requests.
- Use category supported_demo and target_use_case only when the caller explicitly asks for a workflow handled by one of AVAILABLE DEMOS.
- Speak the tool's say_exactly value and nothing else. The backend varies the first and second boundary and supplies the standard closing on a third consecutive unrelated request.
- A valid scenario response or Woxza feature question resets the consecutive redirect count.

AVAILABLE DEMOS (only mention these by name — never invent one):
1. order taking  2. customer support  3. lead qualification  4. appointment booking (salon, movie, doctor only)  5. event RSVP  6. feedback survey  7. recruiting screening

CLOSING: ${ending || "Thanks for using this demo — we also have other demos, do check them out!"}

TIME LIMIT: Strict 120-second call limit.
- At 90 seconds the backend enters wrap-up mode. If the caller begins one final request, answer it concisely; do not invite another follow-up.
- At 105 seconds the backend stops accepting new caller turns and requires the configured localized closing.
- Never let the call run past 120 seconds. The backend owns these timers and closing transitions.`
}
