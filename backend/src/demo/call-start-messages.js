// Fixed call-start copy is intentionally separate from the model prompt. These
// are delivery-critical messages, so they must be available even before the
// conversation model has received its first caller turn.
const AGENT_FIRST_GREETINGS = Object.freeze({
  en:"Hello, I am Woxza AI Assistant. How are you today?",
  as:"নমস্কাৰ, মই Woxza AI Assistant। আজি আপুনি কেনে আছে?",
  bn:"হ্যালো, আমি Woxza AI Assistant। আজ আপনি কেমন আছেন?",
  gu:"હેલો, હું Woxza AI Assistant છું. આજે તમે કેમ છો?",
  hi:"नमस्ते, मैं Woxza AI Assistant हूं। आज आप कैसे हैं?",
  kn:"ನಮಸ್ಕಾರ, ನಾನು Woxza AI Assistant. ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ?",
  ml:"ഹലോ, ഞാൻ Woxza AI Assistant ആണ്. ഇന്ന് നിങ്ങൾക്ക് സുഖമാണോ?",
  mr:"नमस्कार, मी Woxza AI Assistant आहे. आज तुम्ही कसे आहात?",
  pa:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ Woxza AI Assistant ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ?",
  ta:"வணக்கம், நான் Woxza AI Assistant. இன்று நீங்கள் எப்படி இருக்கிறீர்கள்?",
  te:"హలో, నేను Woxza AI Assistantని. ఈరోజు మీరు ఎలా ఉన్నారు?",
  ur:"ہیلو، میں Woxza AI Assistant ہوں۔ آج آپ کیسے ہیں؟"
})

const OPENING_PERMISSION_MESSAGES = Object.freeze({
  en:{ ask:"Would you have two minutes for me to briefly explain how Woxza can help your business?", reassure:"We will not take much time. I will keep it very brief—may I have two minutes?", decline:"No problem. This is Woxza AI Assistant. You can try the Woxza demo again whenever you have time. Thank you." },
  as:{ ask:"Woxza-এ আপোনাৰ ব্যৱসায়ক কেনেকৈ সহায় কৰিব পাৰে সেইটো চমুকৈ ক'বলৈ আপোনাৰ দুই মিনিট সময় হ'বনে?", reassure:"বেছি সময় নলওঁ। একেবাৰে চমুকৈ ক'ম—দুই মিনিট সময় দিবনে?", decline:"ঠিক আছে। এইটো Woxza AI Assistant। সময় পালে আকৌ Woxza ডেমো চেষ্টা কৰিব পাৰে। ধন্যবাদ।" },
  bn:{ ask:"Woxza কীভাবে আপনার ব্যবসায় সাহায্য করতে পারে, সংক্ষেপে বলার জন্য কি আপনার দুই মিনিট সময় হবে?", reassure:"বেশি সময় নেব না। খুব সংক্ষেপে বলব—দুই মিনিট সময় দেবেন?", decline:"কোনো সমস্যা নেই। এটি Woxza AI Assistant। সময় হলে আবার Woxza ডেমো চেষ্টা করতে পারেন। ধন্যবাদ।" },
  gu:{ ask:"Woxza તમારા વ્યવસાયને કેવી રીતે મદદ કરી શકે તે ટૂંકમાં સમજાવવા માટે તમારી પાસે બે મિનિટ હશે?", reassure:"વધુ સમય નહીં લઈએ. બહુ ટૂંકમાં કહીશ—બે મિનિટ આપશો?", decline:"કોઈ વાંધો નહીં. આ Woxza AI Assistant છે. સમય મળે ત્યારે ફરી Woxza ડેમો અજમાવી શકો છો. આભાર." },
  hi:{ ask:"Woxza आपके व्यवसाय में कैसे मदद कर सकता है, यह संक्षेप में बताने के लिए क्या आपके पास दो मिनट हैं?", reassure:"हम ज़्यादा समय नहीं लेंगे। बहुत संक्षेप में बताऊँगा—क्या आप दो मिनट देंगे?", decline:"कोई बात नहीं। यह Woxza AI Assistant है। समय मिलने पर आप Woxza डेमो फिर से आज़मा सकते हैं। धन्यवाद।" },
  kn:{ ask:"Woxza ನಿಮ್ಮ ವ್ಯವಹಾರಕ್ಕೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು ಎಂದು ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಹೇಳಲು ಎರಡು ನಿಮಿಷ ಸಮಯ ಇದೆಯೇ?", reassure:"ಹೆಚ್ಚು ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುವುದಿಲ್ಲ. ತುಂಬಾ ಸಂಕ್ಷಿಪ್ತವಾಗಿ ಹೇಳುತ್ತೇನೆ—ಎರಡು ನಿಮಿಷ ಕೊಡುತ್ತೀರಾ?", decline:"ಪರವಾಗಿಲ್ಲ. ಇದು Woxza AI Assistant. ಸಮಯ ಸಿಕ್ಕಾಗ Woxza ಡೆಮೊವನ್ನು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಬಹುದು. ಧನ್ಯವಾದಗಳು." },
  ml:{ ask:"Woxza നിങ്ങളുടെ ബിസിനസിന് എങ്ങനെ സഹായിക്കാമെന്ന് ചുരുക്കി പറയാൻ രണ്ട് മിനിറ്റ് സമയമുണ്ടോ?", reassure:"കൂടുതൽ സമയം എടുക്കില്ല. വളരെ ചുരുക്കി പറയാം—രണ്ട് മിനിറ്റ് തരുമോ?", decline:"സാരമില്ല. ഇത് Woxza AI Assistant ആണ്. സമയം കിട്ടുമ്പോൾ Woxza ഡെമോ വീണ്ടും പരീക്ഷിക്കാം. നന്ദി." },
  mr:{ ask:"Woxza तुमच्या व्यवसायाला कशी मदत करू शकते हे थोडक्यात सांगण्यासाठी तुमच्याकडे दोन मिनिटे आहेत का?", reassure:"जास्त वेळ घेणार नाही. अगदी थोडक्यात सांगेन—दोन मिनिटे द्याल का?", decline:"काही हरकत नाही. हे Woxza AI Assistant आहे. वेळ मिळाल्यावर पुन्हा Woxza डेमो वापरून पाहू शकता. धन्यवाद." },
  pa:{ ask:"ਕੀ ਤੁਹਾਡੇ ਕੋਲ ਦੋ ਮਿੰਟ ਹਨ ਤਾਂ ਜੋ ਮੈਂ ਸੰਖੇਪ ਵਿੱਚ ਦੱਸ ਸਕਾਂ ਕਿ Woxza ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਦੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹੈ?", reassure:"ਅਸੀਂ ਜ਼ਿਆਦਾ ਸਮਾਂ ਨਹੀਂ ਲਵਾਂਗੇ। ਬਹੁਤ ਸੰਖੇਪ ਵਿੱਚ ਦੱਸਾਂਗਾ—ਦੋ ਮਿੰਟ ਦੇਵੋਗੇ?", decline:"ਕੋਈ ਗੱਲ ਨਹੀਂ। ਇਹ Woxza AI Assistant ਹੈ। ਸਮਾਂ ਮਿਲੇ ਤਾਂ ਤੁਸੀਂ Woxza ਡੈਮੋ ਫਿਰ ਅਜ਼ਮਾ ਸਕਦੇ ਹੋ। ਧੰਨਵਾਦ।" },
  ta:{ ask:"Woxza உங்கள் வணிகத்திற்கு எப்படி உதவ முடியும் என்பதை சுருக்கமாக சொல்ல இரண்டு நிமிடங்கள் இருக்கிறதா?", reassure:"அதிக நேரம் எடுக்க மாட்டோம். மிகச் சுருக்கமாக சொல்கிறேன்—இரண்டு நிமிடங்கள் தருவீர்களா?", decline:"பரவாயில்லை. இது Woxza AI Assistant. நேரம் கிடைக்கும்போது Woxza டெமோவை மீண்டும் முயற்சி செய்யலாம். நன்றி." },
  te:{ ask:"Woxza మీ వ్యాపారానికి ఎలా సహాయం చేస్తుందో క్లుప్తంగా చెప్పడానికి మీకు రెండు నిమిషాలు సమయం ఉందా?", reassure:"ఎక్కువ సమయం తీసుకోము. చాలా క్లుప్తంగా చెబుతాను—రెండు నిమిషాలు ఇస్తారా?", decline:"పరవాలేదు. ఇది Woxza AI Assistant. మీకు సమయం ఉన్నప్పుడు మళ్లీ Woxza డెమో ప్రయత్నించవచ్చు. ధన్యవాదాలు." },
  ur:{ ask:"کیا آپ کے پاس دو منٹ ہیں تاکہ میں مختصراً بتا سکوں کہ Woxza آپ کے کاروبار میں کیسے مدد کر سکتا ہے؟", reassure:"ہم زیادہ وقت نہیں لیں گے۔ بہت مختصراً بتاؤں گا—کیا آپ دو منٹ دیں گے؟", decline:"کوئی مسئلہ نہیں۔ یہ Woxza AI Assistant ہے۔ وقت ملنے پر آپ Woxza ڈیمو دوبارہ آزما سکتے ہیں۔ شکریہ۔" }
})

const OPENING_PERMISSION_DISCOVERY_MESSAGES = Object.freeze({
  en:"Thank you. To begin, what kind of business do you run?",
  as:"ধন্যবাদ। প্ৰথমে, আপুনি কেনে ধৰণৰ ব্যৱসায় চলায়?",
  bn:"ধন্যবাদ। শুরুতে, আপনি কী ধরনের ব্যবসা করেন?",
  gu:"આભાર. શરૂઆતમાં, તમે કયો વ્યવસાય ચલાવો છો?",
  hi:"धन्यवाद। शुरुआत में, आप किस तरह का व्यवसाय चलाते हैं?",
  kn:"ಧನ್ಯವಾದಗಳು. ಆರಂಭಕ್ಕೆ, ನೀವು ಯಾವ ರೀತಿಯ ವ್ಯವಹಾರ ನಡೆಸುತ್ತೀರಿ?",
  ml:"നന്ദി. ആദ്യം, നിങ്ങൾ ഏത് തരത്തിലുള്ള ബിസിനസാണ് നടത്തുന്നത്?",
  mr:"धन्यवाद. सुरुवातीला, तुम्ही कोणता व्यवसाय चालवता?",
  pa:"ਧੰਨਵਾਦ। ਸ਼ੁਰੂ ਕਰਨ ਲਈ, ਤੁਸੀਂ ਕਿਹੜਾ ਕਾਰੋਬਾਰ ਚਲਾਉਂਦੇ ਹੋ?",
  ta:"நன்றி. தொடங்குவதற்கு, நீங்கள் என்ன வகையான வணிகம் நடத்துகிறீர்கள்?",
  te:"ధన్యవాదాలు. ముందుగా, మీరు ఎలాంటి వ్యాపారం నిర్వహిస్తున్నారు?",
  ur:"شکریہ۔ شروع کرنے کے لیے، آپ کس قسم کا کاروبار چلاتے ہیں؟"
})

export const agentFirstGreeting = language => AGENT_FIRST_GREETINGS[language] || AGENT_FIRST_GREETINGS.en
export const openingPermissionMessage = (language, kind) => OPENING_PERMISSION_MESSAGES[language]?.[kind] || OPENING_PERMISSION_MESSAGES.en[kind]
export const openingPermissionDiscoveryMessage = language => OPENING_PERMISSION_DISCOVERY_MESSAGES[language] || OPENING_PERMISSION_DISCOVERY_MESSAGES.en
