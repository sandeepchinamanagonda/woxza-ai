// Fixed call-start copy is intentionally separate from the model prompt. These
// are delivery-critical messages, so they must be available even before the
// conversation model has received its first caller turn.
const AGENT_FIRST_GREETINGS = Object.freeze({
  en:"Hello, I am Woxza AI Assistant. How are you today? And what business do you run?",
  as:"নমস্কাৰ, মই Woxza AI Assistant। আজি আপুনি কেনে আছে? আৰু আপুনি কি ব্যৱসায় চলায়?",
  bn:"হ্যালো, আমি Woxza AI Assistant। আজ আপনি কেমন আছেন? আর আপনি কী ব্যবসা চালান?",
  gu:"હેલો, હું Woxza AI Assistant છું. આજે તમે કેમ છો? અને તમે કયો વ્યવસાય ચલાવો છો?",
  hi:"नमस्ते, मैं Woxza AI Assistant हूं। आज आप कैसे हैं? और आप कौन सा व्यवसाय चलाते हैं?",
  kn:"ನಮಸ್ಕಾರ, ನಾನು Woxza AI Assistant. ಇಂದು ನೀವು ಹೇಗಿದ್ದೀರಿ? ಮತ್ತು ನೀವು ಯಾವ ವ್ಯವಹಾರ ನಡೆಸುತ್ತೀರಿ?",
  ml:"ഹലോ, ഞാൻ Woxza AI Assistant ആണ്. ഇന്ന് നിങ്ങൾക്ക് സുഖമാണോ? നിങ്ങൾ ഏത് ബിസിനസാണ് നടത്തുന്നത്?",
  mr:"नमस्कार, मी Woxza AI Assistant आहे. आज तुम्ही कसे आहात? आणि तुम्ही कोणता व्यवसाय चालवता?",
  pa:"ਸਤ ਸ੍ਰੀ ਅਕਾਲ, ਮੈਂ Woxza AI Assistant ਹਾਂ। ਅੱਜ ਤੁਸੀਂ ਕਿਵੇਂ ਹੋ? ਅਤੇ ਤੁਸੀਂ ਕਿਹੜਾ ਕਾਰੋਬਾਰ ਚਲਾਉਂਦੇ ਹੋ?",
  ta:"வணக்கம், நான் Woxza AI Assistant. இன்று நீங்கள் எப்படி இருக்கிறீர்கள்? நீங்கள் என்ன வணிகம் நடத்துகிறீர்கள்?",
  te:"హలో, నేను Woxza AI Assistantని. ఈరోజు మీరు ఎలా ఉన్నారు? మరియు మీరు ఏ వ్యాపారాన్ని నిర్వహిస్తున్నారు?",
  ur:"ہیلو، میں Woxza AI Assistant ہوں۔ آج آپ کیسے ہیں؟ اور آپ کون سا کاروبار چلاتے ہیں؟"
})

export const agentFirstGreeting = language => AGENT_FIRST_GREETINGS[language] || AGENT_FIRST_GREETINGS.en
