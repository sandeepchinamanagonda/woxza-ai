// Fixed call-start copy is intentionally separate from the model prompt. These
// are delivery-critical messages, so they must be available even before the
// conversation model has received its first caller turn.
const AGENT_FIRST_GREETINGS = Object.freeze({
  en:"Hello, I’m Woxza’s AI assistant. Thanks for trying our demo. What business do you run?",
  as:"হাই, মই Woxza-ৰ AI অ্যাসিস্টেণ্ট। আমাৰ ডেমো ট্ৰাই কৰাৰ বাবে থেংকচ। আপুনি কি বিজনেছ চলায়?",
  bn:"হাই, আমি Woxza-র AI অ্যাসিস্ট্যান্ট। আমাদের ডেমো ট্রাই করার জন্য থ্যাংকস। আপনি কী বিজনেস করেন?",
  gu:"હાય, હું Woxza નો AI આસિસ્ટન્ટ છું. અમારો ડેમો ટ્રાય કરવા બદલ થેંક્સ. તમે કયો બિઝનેસ ચલાવો છો?",
  hi:"हाय, मैं Woxza का AI असिस्टेंट हूं। हमारा डेमो ट्राई करने के लिए थैंक्स। आप कौन सा बिजनेस चलाते हैं?",
  kn:"ಹಾಯ್, ನಾನು Woxza ಯ AI ಅಸಿಸ್ಟೆಂಟ್. ನಮ್ಮ ಡೆಮೊ ಟ್ರೈ ಮಾಡಿದ್ದಕ್ಕೆ ಥ್ಯಾಂಕ್ಸ್. ನೀವು ಯಾವ ಬಿಸಿನೆಸ್ ನಡೆಸ್ತಿದೀರಾ?",
  ml:"ഹായ്, ഞാൻ Woxza-യുടെ AI അസിസ്റ്റന്റ് ആണ്. ഞങ്ങളുടെ ഡെമോ ട്രൈ ചെയ്തതിന് നന്ദി. നിങ്ങൾ എന്ത് ബിസിനസ്സാണ് നടത്തുന്നത്?",
  mr:"हाय, मी Woxza चा AI असिस्टंट आहे. आमचा डेमो ट्राय केल्याबद्दल थँक्स. तुम्ही कोणता बिझनेस करता?",
  pa:"ਹਾਏ, ਮੈਂ Woxza ਦਾ AI ਅਸਿਸਟੈਂਟ ਹਾਂ। ਸਾਡਾ ਡੈਮੋ ਟਰਾਈ ਕਰਨ ਲਈ ਥੈਂਕਸ। ਤੁਸੀਂ ਕਿਹੜਾ ਬਿਜ਼ਨਸ ਚਲਾਉਂਦੇ ਹੋ?",
  ta:"ஹாய், நான் Woxza-வோட AI அசிஸ்டன்ட். எங்க டெமோவை ட்ரை பண்ணதுக்கு நன்றி. நீங்க என்ன பிசினஸ் நடத்துறீங்க?",
  te:"హాయ్, నేను Woxza యొక్క AI అసిస్టెంట్‌ని. మా డెమో ట్రై చేసినందుకు థాంక్స్. మీరు ఏ బిజినెస్ నడుపుతున్నారు?",
  ur:"ہائے، میں Woxza کا AI اسسٹنٹ ہوں۔ ہمارا ڈیمو ٹرائی کرنے کا شکریہ۔ آپ کونسا بزنس چلاتے ہیں؟"
})

export const agentFirstGreeting = language => AGENT_FIRST_GREETINGS[language] || AGENT_FIRST_GREETINGS.en
