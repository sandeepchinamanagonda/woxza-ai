import { computed, ref } from "vue"

const STORAGE_KEY = "woxza-language"
const supportedLanguages = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ" }
]

const translations = {
  hi: {
    "Solutions": "समाधान", "About": "हमारे बारे में", "Why Woxza": "Woxza क्यों", "Demo": "डेमो", "Approach": "तरीका", "FAQ": "सामान्य प्रश्न",
    "Join Waitlist": "वेटलिस्ट में शामिल हों", "Join the Waitlist": "वेटलिस्ट में शामिल हों", "Get a Demo": "डेमो प्राप्त करें", "Learn More →": "और जानें →",
    "AI voice agent platform": "AI वॉइस एजेंट प्लेटफ़ॉर्म", "Never miss a call": "कोई कॉल न छोड़ें", "24/7 AI availability": "24/7 AI उपलब्धता", "Understand intent": "इरादा समझें", "Human-like conversations": "इंसान जैसी बातचीत", "Take action": "कार्रवाई करें", "Book, update, notify & more": "बुक करें, अपडेट करें, सूचित करें और बहुत कुछ", "Speak every language": "हर भाषा बोलें", "Multilingual by default": "डिफ़ॉल्ट रूप से बहुभाषी",
    "AI voice agents that": "AI वॉइस एजेंट जो", "answer calls, understand": "कॉल का जवाब दें, समझें", "customers and ": "ग्राहकों को और ", "get": "काम", "work done": "पूरा करें", "Every call answered": "हर कॉल का जवाब", "Every customer": "हर ग्राहक", "understood Every": "समझा गया, हर", "step handled": "कदम संभाला गया", "One platform for": "एक प्लेटफ़ॉर्म", "every conversation": "हर बातचीत के लिए", "your business needs": "आपके व्यवसाय की ज़रूरतों के लिए", "completed": "पूरा",
    "Woxza answers every call, understands intent and takes action so your team can focus on what matters": "Woxza हर कॉल का जवाब देता है, इरादा समझता है और कार्रवाई करता है ताकि आपकी टीम महत्वपूर्ण काम पर ध्यान दे सके।", "From the first hello to the finished task, Woxza keeps every customer conversation moving forward": "पहले नमस्ते से लेकर काम पूरा होने तक, Woxza हर ग्राहक बातचीत को आगे बढ़ाता है।", "Many conversations move your business and Woxza connects them, understands them and completes the work behind them": "कई बातचीत आपके व्यवसाय को चलाती हैं और Woxza उन्हें जोड़ता, समझता और उनके पीछे का काम पूरा करता है।",
    "First name": "पहला नाम", "Last name": "उपनाम", "Business name": "व्यवसाय का नाम", "Your name": "आपका नाम", "Phone number": "फ़ोन नंबर", "Name": "नाम", "Enter your email": "अपना ईमेल दर्ज करें", "Select your role": "अपनी भूमिका चुनें", "Select industry": "उद्योग चुनें", "Select company size": "कंपनी का आकार चुनें", "Select one or more": "एक या अधिक चुनें", "Close modal": "मॉडल बंद करें", "Close navigation menu": "नेविगेशन मेनू बंद करें", "Open navigation menu": "नेविगेशन मेनू खोलें",
    "Accounts receivable": "प्राप्य खाते", "Payment reminder": "भुगतान अनुस्मारक", "Invoice workflow": "चालान कार्यप्रवाह", "Listening": "सुन रहे हैं", "Woxza is speaking": "Woxza बोल रहा है", "Caller": "कॉल करने वाला", "Payments": "भुगतान", "Appointment": "अपॉइंटमेंट", "Restaurant": "रेस्तरां", "Distribution": "वितरण", "Doctor appointment": "डॉक्टर अपॉइंटमेंट", "Restaurant reservation": "रेस्तरां आरक्षण", "Medical distribution": "चिकित्सा वितरण", "Appointment confirmed": "अपॉइंटमेंट पक्का", "Patient form sent": "मरीज़ का फ़ॉर्म भेजा गया", "Table reserved": "टेबल आरक्षित", "Birthday note added": "जन्मदिन नोट जोड़ा गया", "Transfer order confirmed": "ट्रांसफर ऑर्डर पक्का", "Tracking scheduled": "ट्रैकिंग तय", "Payment plan recorded": "भुगतान योजना दर्ज", "Finance team notified": "वित्त टीम को सूचना", "Hi Maya, invoice 1048 for $1,840 is due today, would you like help arranging payment?": "नमस्ते माया, $1,840 का चालान 1048 आज देय है। क्या आपको भुगतान की व्यवस्था में मदद चाहिए?", "We can pay $1,000 on Friday and the balance next Tuesday": "हम शुक्रवार को $1,000 और शेष राशि अगले मंगलवार को दे सकते हैं।", "Certainly, I can record both dates and create two secure payment links": "ज़रूर, मैं दोनों तारीखें दर्ज करके दो सुरक्षित भुगतान लिंक बना सकता हूँ।", "Please do, and send the confirmation to our finance team": "कृपया करें और पुष्टि हमारी वित्त टीम को भेजें।", "Done, both payment dates are recorded and the secure links have been sent to your finance team": "हो गया, दोनों भुगतान तारीखें दर्ज हैं और सुरक्षित लिंक आपकी वित्त टीम को भेज दिए गए हैं।", "Submit": "जमा करें", "Continue": "जारी रखें", "Back": "वापस", "Next": "अगला", "Done": "पूर्ण", "Loading...": "लोड हो रहा है...", "Close": "बंद करें", "Privacy Policy": "गोपनीयता नीति", "Terms of Service": "सेवा की शर्तें", "Contact us": "हमसे संपर्क करें", "All rights reserved.": "सर्वाधिकार सुरक्षित।"
  },
  te: {
    "Solutions": "పరిష్కారాలు", "About": "మా గురించి", "Why Woxza": "Woxza ఎందుకు", "Demo": "డెమో", "Approach": "విధానం", "FAQ": "తరచుగా అడిగే ప్రశ్నలు",
    "Join Waitlist": "వెయిట్‌లిస్ట్‌లో చేరండి", "Join the Waitlist": "వెయిట్‌లిస్ట్‌లో చేరండి", "Get a Demo": "డెమో పొందండి", "Learn More →": "మరింత తెలుసుకోండి →",
    "AI voice agent platform": "AI వాయిస్ ఏజెంట్ ప్లాట్‌ఫారమ్", "Never miss a call": "ఏ కాల్‌ను మిస్ చేయవద్దు", "24/7 AI availability": "24/7 AI అందుబాటు", "Understand intent": "ఉద్దేశాన్ని అర్థం చేసుకోండి", "Human-like conversations": "మనిషిలా సంభాషణలు", "Take action": "చర్య తీసుకోండి", "Book, update, notify & more": "బుక్ చేయండి, అప్‌డేట్ చేయండి, తెలియజేయండి మరియు మరిన్ని", "Speak every language": "ప్రతి భాషలో మాట్లాడండి", "Multilingual by default": "డిఫాల్ట్‌గా బహుభాషా",
    "AI voice agents that": "AI వాయిస్ ఏజెంట్లు", "answer calls, understand": "కాల్స్‌కు సమాధానం ఇచ్చి, అర్థం చేసుకుని", "customers and ": "కస్టమర్లకు మరియు ", "get": "పని", "work done": "పూర్తి చేస్తాయి", "Every call answered": "ప్రతి కాల్‌కు సమాధానం", "Every customer": "ప్రతి కస్టమర్", "understood Every": "అర్థమయ్యారు, ప్రతి", "step handled": "దశ నిర్వహించబడుతుంది", "One platform for": "ఒకే ప్లాట్‌ఫారమ్", "every conversation": "ప్రతి సంభాషణ కోసం", "your business needs": "మీ వ్యాపార అవసరాల కోసం", "completed": "పూర్తయింది",
    "Woxza answers every call, understands intent and takes action so your team can focus on what matters": "Woxza ప్రతి కాల్‌కు సమాధానం ఇస్తుంది, ఉద్దేశాన్ని అర్థం చేసుకుని చర్య తీసుకుంటుంది; మీ బృందం ముఖ్యమైన పనిపై దృష్టి పెట్టవచ్చు.", "From the first hello to the finished task, Woxza keeps every customer conversation moving forward": "మొదటి హలో నుండి పని పూర్తయ్యే వరకు, Woxza ప్రతి కస్టమర్ సంభాషణను ముందుకు నడిపిస్తుంది.", "Many conversations move your business and Woxza connects them, understands them and completes the work behind them": "అనేక సంభాషణలు మీ వ్యాపారాన్ని నడిపిస్తాయి; Woxza వాటిని కలుపుతుంది, అర్థం చేసుకుంటుంది మరియు వాటి వెనుక పనిని పూర్తి చేస్తుంది.",
    "First name": "మొదటి పేరు", "Last name": "ఇంటి పేరు", "Business name": "వ్యాపార పేరు", "Your name": "మీ పేరు", "Phone number": "ఫోన్ నంబర్", "Name": "పేరు", "Enter your email": "మీ ఇమెయిల్ నమోదు చేయండి", "Select your role": "మీ పాత్రను ఎంచుకోండి", "Select industry": "పరిశ్రమను ఎంచుకోండి", "Select company size": "కంపెనీ పరిమాణాన్ని ఎంచుకోండి", "Select one or more": "ఒకటి లేదా అంతకంటే ఎక్కువ ఎంచుకోండి", "Close modal": "మోడల్‌ను మూసివేయండి", "Close navigation menu": "నావిగేషన్ మెనూను మూసివేయండి", "Open navigation menu": "నావిగేషన్ మెనూను తెరవండి",
    "Accounts receivable": "స్వీకరించవలసిన ఖాతాలు", "Payment reminder": "చెల్లింపు గుర్తుచేయింపు", "Invoice workflow": "ఇన్‌వాయిస్ వర్క్‌ఫ్లో", "Listening": "వింటోంది", "Woxza is speaking": "Woxza మాట్లాడుతోంది", "Caller": "కాలర్", "Payments": "చెల్లింపులు", "Appointment": "అపాయింట్‌మెంట్", "Restaurant": "రెస్టారెంట్", "Distribution": "పంపిణీ", "Doctor appointment": "డాక్టర్ అపాయింట్‌మెంట్", "Restaurant reservation": "రెస్టారెంట్ రిజర్వేషన్", "Medical distribution": "వైద్య పంపిణీ", "Appointment confirmed": "అపాయింట్‌మెంట్ నిర్ధారించబడింది", "Patient form sent": "రోగి ఫారమ్ పంపబడింది", "Table reserved": "టేబుల్ రిజర్వ్ చేయబడింది", "Birthday note added": "పుట్టినరోజు గమనిక జోడించబడింది", "Transfer order confirmed": "బదిలీ ఆర్డర్ నిర్ధారించబడింది", "Tracking scheduled": "ట్రాకింగ్ షెడ్యూల్ చేయబడింది", "Payment plan recorded": "చెల్లింపు ప్రణాళిక నమోదు చేయబడింది", "Finance team notified": "ఫైనాన్స్ బృందానికి తెలియజేయబడింది", "Hi Maya, invoice 1048 for $1,840 is due today, would you like help arranging payment?": "హాయ్ మాయా, $1,840కి ఇన్‌వాయిస్ 1048 ఈరోజు చెల్లించాల్సి ఉంది. చెల్లింపు ఏర్పాటు చేయడంలో సహాయం కావాలా?", "We can pay $1,000 on Friday and the balance next Tuesday": "మేము శుక్రవారం $1,000 మరియు మిగిలిన మొత్తాన్ని వచ్చే మంగళవారం చెల్లించగలం.", "Certainly, I can record both dates and create two secure payment links": "తప్పకుండా, నేను రెండు తేదీలను నమోదు చేసి రెండు సురక్షిత చెల్లింపు లింక్‌లను సృష్టించగలను.", "Please do, and send the confirmation to our finance team": "దయచేసి చేయండి, నిర్ధారణను మా ఫైనాన్స్ బృందానికి పంపండి.", "Done, both payment dates are recorded and the secure links have been sent to your finance team": "పూర్తయింది, రెండు చెల్లింపు తేదీలు నమోదు చేయబడ్డాయి మరియు సురక్షిత లింక్‌లు మీ ఫైనాన్స్ బృందానికి పంపబడ్డాయి.", "Submit": "సమర్పించండి", "Continue": "కొనసాగించండి", "Back": "వెనుకకు", "Next": "తదుపరి", "Done": "పూర్తయింది", "Loading...": "లోడ్ అవుతోంది...", "Close": "మూసివేయండి", "Privacy Policy": "గోప్యతా విధానం", "Terms of Service": "సేవా నిబంధనలు", "Contact us": "మమ్మల్ని సంప్రదించండి", "All rights reserved.": "అన్ని హక్కులు ప్రత్యేకించబడ్డాయి।"
  },
  ta: {
    "Solutions": "தீர்வுகள்", "About": "எங்களைப் பற்றி", "Why Woxza": "Woxza ஏன்", "Demo": "டெமோ", "Approach": "அணுகுமுறை", "FAQ": "அடிக்கடி கேட்கப்படும் கேள்விகள்",
    "Join Waitlist": "காத்திருப்புப் பட்டியலில் சேரவும்", "Join the Waitlist": "காத்திருப்புப் பட்டியலில் சேரவும்", "Get a Demo": "டெமோ பெறுங்கள்", "Learn More →": "மேலும் அறிக →",
    "AI voice agent platform": "AI குரல் முகவர் தளம்", "Never miss a call": "எந்த அழைப்பையும் தவறவிடாதீர்கள்", "24/7 AI availability": "24/7 AI கிடைக்கும்", "Understand intent": "நோக்கத்தைப் புரிந்துகொள்ளுங்கள்", "Human-like conversations": "மனிதனைப் போன்ற உரையாடல்கள்", "Take action": "நடவடிக்கை எடுங்கள்", "Book, update, notify & more": "பதிவு செய்யுங்கள், புதுப்பியுங்கள், அறிவியுங்கள் மற்றும் பல", "Speak every language": "ஒவ்வொரு மொழியிலும் பேசுங்கள்", "Multilingual by default": "இயல்பாகவே பன்மொழி",
    "AI voice agents that": "AI குரல் முகவர்கள்", "answer calls, understand": "அழைப்புகளுக்குப் பதிலளித்து, புரிந்துகொண்டு", "customers and ": "வாடிக்கையாளர்களை மற்றும் ", "get": "வேலையை", "work done": "முடிக்கின்றன", "Every call answered": "ஒவ்வொரு அழைப்புக்கும் பதில்", "Every customer": "ஒவ்வொரு வாடிக்கையாளரும்", "understood Every": "புரிந்துகொள்ளப்படுகிறார், ஒவ்வொரு", "step handled": "படி கையாளப்படுகிறது", "One platform for": "ஒரே தளம்", "every conversation": "ஒவ்வொரு உரையாடலுக்கும்", "your business needs": "உங்கள் வணிகத் தேவைகளுக்கு", "completed": "நிறைவு",
    "Woxza answers every call, understands intent and takes action so your team can focus on what matters": "Woxza ஒவ்வொரு அழைப்புக்கும் பதிலளித்து, நோக்கத்தைப் புரிந்து நடவடிக்கை எடுக்கிறது; உங்கள் குழு முக்கியமானவற்றில் கவனம் செலுத்தலாம்.", "From the first hello to the finished task, Woxza keeps every customer conversation moving forward": "முதல் வணக்கம் முதல் பணி முடியும் வரை, Woxza ஒவ்வொரு வாடிக்கையாளர் உரையாடலையும் முன்னோக்கி நகர்த்துகிறது.", "Many conversations move your business and Woxza connects them, understands them and completes the work behind them": "பல உரையாடல்கள் உங்கள் வணிகத்தை நகர்த்துகின்றன; Woxza அவற்றை இணைத்து, புரிந்துகொண்டு, பின்னால் உள்ள வேலையை முடிக்கிறது.",
    "First name": "முதல் பெயர்", "Last name": "கடைசி பெயர்", "Business name": "வணிகப் பெயர்", "Your name": "உங்கள் பெயர்", "Phone number": "தொலைபேசி எண்", "Name": "பெயர்", "Enter your email": "உங்கள் மின்னஞ்சலை உள்ளிடவும்", "Select your role": "உங்கள் பொறுப்பைத் தேர்ந்தெடுக்கவும்", "Select industry": "தொழில்துறையைத் தேர்ந்தெடுக்கவும்", "Select company size": "நிறுவன அளவைத் தேர்ந்தெடுக்கவும்", "Select one or more": "ஒன்று அல்லது பலவற்றைத் தேர்ந்தெடுக்கவும்", "Close modal": "சாளரத்தை மூடவும்", "Close navigation menu": "வழிசெலுத்தல் பட்டியை மூடவும்", "Open navigation menu": "வழிசெலுத்தல் பட்டியைத் திறக்கவும்",
    "Accounts receivable": "பெற வேண்டிய கணக்குகள்", "Payment reminder": "கட்டண நினைவூட்டல்", "Invoice workflow": "விலைப்பட்டியல் பணிப்பாய்வு", "Listening": "கேட்கிறது", "Woxza is speaking": "Woxza பேசுகிறது", "Caller": "அழைப்பாளர்", "Payments": "கட்டணங்கள்", "Appointment": "சந்திப்பு", "Restaurant": "உணவகம்", "Distribution": "விநியோகம்", "Doctor appointment": "மருத்துவர் சந்திப்பு", "Restaurant reservation": "உணவக முன்பதிவு", "Medical distribution": "மருத்துவ விநியோகம்", "Appointment confirmed": "சந்திப்பு உறுதி செய்யப்பட்டது", "Patient form sent": "நோயாளி படிவம் அனுப்பப்பட்டது", "Table reserved": "மேசை முன்பதிவு செய்யப்பட்டது", "Birthday note added": "பிறந்தநாள் குறிப்பு சேர்க்கப்பட்டது", "Transfer order confirmed": "பரிமாற்ற ஆர்டர் உறுதி செய்யப்பட்டது", "Tracking scheduled": "கண்காணிப்பு திட்டமிடப்பட்டது", "Payment plan recorded": "கட்டணத் திட்டம் பதிவு செய்யப்பட்டது", "Finance team notified": "நிதிக் குழுவிற்கு அறிவிக்கப்பட்டது", "Hi Maya, invoice 1048 for $1,840 is due today, would you like help arranging payment?": "வணக்கம் மாயா, $1,840-க்கான விலைப்பட்டியல் 1048 இன்று செலுத்தப்பட வேண்டும். கட்டணத்தை ஏற்பாடு செய்ய உதவி வேண்டுமா?", "We can pay $1,000 on Friday and the balance next Tuesday": "வெள்ளிக்கிழமை $1,000-ஐயும் மீதியை அடுத்த செவ்வாய்க்கிழமையும் செலுத்தலாம்.", "Certainly, I can record both dates and create two secure payment links": "நிச்சயமாக, இரண்டு தேதிகளையும் பதிவு செய்து இரண்டு பாதுகாப்பான கட்டண இணைப்புகளை உருவாக்க முடியும்.", "Please do, and send the confirmation to our finance team": "தயவுசெய்து செய்யுங்கள்; உறுதிப்படுத்தலை எங்கள் நிதிக் குழுவிற்கு அனுப்புங்கள்.", "Done, both payment dates are recorded and the secure links have been sent to your finance team": "முடிந்தது, இரண்டு கட்டணத் தேதிகளும் பதிவு செய்யப்பட்டு பாதுகாப்பான இணைப்புகள் உங்கள் நிதிக் குழுவிற்கு அனுப்பப்பட்டன.", "Submit": "சமர்ப்பிக்கவும்", "Continue": "தொடரவும்", "Back": "பின்", "Next": "அடுத்து", "Done": "முடிந்தது", "Loading...": "ஏற்றப்படுகிறது...", "Close": "மூடவும்", "Privacy Policy": "தனியுரிமைக் கொள்கை", "Terms of Service": "சேவை விதிமுறைகள்", "Contact us": "எங்களைத் தொடர்புகொள்ளவும்", "All rights reserved.": "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை."
  }
}

/* Full-page Telugu copy for the marketing sections and overlays.  Keeping this
 * alongside the UI dictionary makes text change together with the locale. */
Object.assign(translations.te, {
  "Retail": "రిటైల్", "Manufacturing": "తయారీ", "Travel": "ప్రయాణం", "Enterprise": "ఎంటర్‌ప్రైజ్", "Turn every shopper into a returning customer": "ప్రతి కొనుగోలుదారుని తిరిగి వచ్చే కస్టమర్‌గా మార్చండి", "Keep operations moving without missed calls": "మిస్సైన కాల్స్ లేకుండా కార్యకలాపాలను కొనసాగించండి", "Automate conversations across every department": "ప్రతి విభాగంలోని సంభాషణలను ఆటోమేట్ చేయండి", "Product enquiries": "ఉత్పత్తి విచారణలు", "Order tracking": "ఆర్డర్ ట్రాకింగ్", "Returns and exchanges": "రిటర్న్స్ మరియు మార్పిడులు", "Personalized recommendations": "వ్యక్తిగత సిఫార్సులు", "Supplier coordination": "సరఫరాదారుల సమన్వయం", "Inventory enquiries": "ఇన్వెంటరీ విచారణలు", "Service requests": "సేవ అభ్యర్థనలు", "Dispatch and order updates": "డిస్పాచ్ మరియు ఆర్డర్ అప్‌డేట్‌లు", "IT helpdesk": "IT సహాయ కేంద్రం", "HR employee support": "HR ఉద్యోగి సహాయం", "Internal workflows": "అంతర్గత వర్క్‌ఫ్లోలు", "Customer service automation": "కస్టమర్ సేవ ఆటోమేషన్", "BUSINESS OPERATIONS": "వ్యాపార కార్యకలాపాలు", "CUSTOMER SUPPORT": "కస్టమర్ మద్దతు", "OPERATIONS SUPPORT": "కార్యకలాపాల మద్దతు", "Previous": "మునుపటి", "Trusted by businesses across 20+ industries worldwide": "ప్రపంచవ్యాప్తంగా 20కి పైగా పరిశ్రమల వ్యాపారాల నమ్మకం పొందింది",
  "JOIN THE WOXZA WAITLIST": "WOXZA వెయిట్‌లిస్ట్‌లో చేరండి", "Be first to put every call to work.": "ప్రతి కాల్‌ను ఉపయోగకరంగా మార్చడంలో ముందుండండి.", "Get early access to Woxza and product updates as we open the platform.": "మేము ప్లాట్‌ఫారమ్‌ను ప్రారంభిస్తున్నప్పుడు Woxza మరియు ఉత్పత్తి నవీకరణలకు ముందస్తు యాక్సెస్ పొందండి.", "Join the waitlist →": "వెయిట్‌లిస్ట్‌లో చేరండి →", "By joining, you agree to receive occasional Woxza updates. You can unsubscribe anytime.": "చేరడం ద్వారా, అప్పుడప్పుడు Woxza నవీకరణలను స్వీకరించడానికి మీరు అంగీకరిస్తారు. ఎప్పుడైనా సభ్యత్వాన్ని రద్దు చేయవచ్చు.", "Close waitlist popup": "వెయిట్‌లిస్ట్ పాప్‌అప్‌ను మూసివేయండి",
  "OUR MANIFESTO": "మా దృక్పథం", "Built for the people who answer the calls, and the people waiting on the other end": "కాల్‌లకు సమాధానం ఇచ్చే వారి కోసం, మరోవైపు వేచి ఉన్న వారి కోసం నిర్మించబడింది", "No one should have to choose which customer gets heard": "ఏ కస్టమర్ మాట వినాలనే ఎంపిక ఎవరూ చేయాల్సిన అవసరం లేదు", "There was one desk, one phone, and one person trying to be everywhere at once": "ఒక డెస్క్, ఒక ఫోన్, ఒకేసారి అన్ని చోట్ల ఉండేందుకు ప్రయత్నిస్తున్న ఒక వ్యక్తి ఉండేవారు", "Every ring asked for something, an appointment, an answer, a little reassurance, and when the day got busy, someone had to wait, sometimes that person never called back": "ప్రతి రింగ్ ఒక అభ్యర్థనను, అపాయింట్‌మెంట్‌ను, సమాధానాన్ని లేదా కొంత భరోసాను కోరేది. రోజు బిజీగా ఉన్నప్పుడు ఎవరో వేచి ఉండాల్సి వచ్చేది; కొన్నిసార్లు వారు తిరిగి కాల్ చేయరు.", "Woxza gives a business room to breathe and welcomes the customer a thousand kilometers away with the same patience as the person next door, and it listens, helps, and follows through, even when the team is already giving everything they have": "Woxza వ్యాపారానికి ఊపిరి పీల్చుకునే అవకాశం ఇస్తుంది; వెయ్యి కిలోమీటర్ల దూరంలోని కస్టమర్‌ను పక్కింటి వ్యక్తిలాగే ఓపికతో ఆహ్వానిస్తుంది. బృందం ఇప్పటికే తమ శాయశక్తులా పనిచేస్తున్నప్పటికీ ఇది వింటుంది, సహాయపడుతుంది, పని పూర్తి చేస్తుంది.", "The people behind the business get something back too, time to solve the hard problem, time to sit with a customer who needs more than a quick answer, and time to do the work only they can do": "వ్యాపారం వెనుక ఉన్నవారికి కూడా సమయం తిరిగి లభిస్తుంది—కష్టమైన సమస్యలను పరిష్కరించడానికి, త్వరిత సమాధానం కంటే ఎక్కువ అవసరమైన కస్టమర్‌తో మాట్లాడడానికి, వారు మాత్రమే చేయగల పనిని చేయడానికి.", "Being there for everyone once felt impossible, now it can simply be how the business runs": "ఒకప్పుడు అందరికీ అందుబాటులో ఉండడం అసాధ్యంగా అనిపించేది; ఇప్పుడు అదే వ్యాపారం పనిచేసే విధానం కావచ్చు.",
  "LIVE CALL DEMO": "లైవ్ కాల్ డెమో", "See how every call can feel effortless.": "ప్రతి కాల్ ఎంత సులభంగా అనిపించగలదో చూడండి.", "Choose a scenario and Woxza will call your phone with a two-minute live demo.": "ఒక సందర్భాన్ని ఎంచుకోండి; Woxza మీ ఫోన్‌కు రెండు నిమిషాల లైవ్ డెమో కాల్ చేస్తుంది.", "Your number stays private": "మీ నంబర్ గోప్యంగా ఉంటుంది", "Under 2 minutes": "2 నిమిషాల కంటే తక్కువ", "Try Woxza live": "Woxzaని లైవ్‌గా ప్రయత్నించండి", "We’ll call you in seconds": "మేము క్షణాల్లో మీకు కాల్ చేస్తాము", "Language": "భాష", "Call type": "కాల్ రకం", "Order taking": "ఆర్డర్ స్వీకరణ", "I agree to receive this demo call from Woxza.": "Woxza నుండి ఈ డెమో కాల్ స్వీకరించడానికి నేను అంగీకరిస్తున్నాను.", "Call me now": "ఇప్పుడే నాకు కాల్ చేయండి", "Carrier rates may apply. Up to 3 calls per number every 24 hours.": "క్యారియర్ ఛార్జీలు వర్తించవచ్చు. ప్రతి నంబర్‌కు ప్రతి 24 గంటలకు గరిష్ఠంగా 3 కాల్స్.",
  "Acts during the call": "కాల్ సమయంలో చర్య తీసుకుంటుంది", "Voxa books appointments, updates records and triggers the next workflow while the customer is still speaking—not hours after the call ends.": "కస్టమర్ మాట్లాడుతుండగానే Voxa అపాయింట్‌మెంట్‌లను బుక్ చేస్తుంది, రికార్డులను నవీకరిస్తుంది మరియు తదుపరి వర్క్‌ఫ్లోను ప్రారంభిస్తుంది—కాల్ ముగిసిన గంటల తర్వాత కాదు.", "Build agents without developers": "డెవలపర్లు లేకుండానే ఏజెంట్లను నిర్మించండి", "Launch specialised agents yourself.": "ప్రత్యేక ఏజెంట్లను మీరే ప్రారంభించండి.", "Real-time business data": "రియల్-టైమ్ వ్యాపార డేటా", "Every answer uses what is true now.": "ప్రతి సమాధానం ఇప్పుడు నిజమైన సమాచారాన్ని ఉపయోగిస్తుంది.", "Fits your existing systems": "మీ ప్రస్తుత సిస్టమ్‌లకు సరిపోతుంది", "Your stack stays connected.": "మీ టెక్నాలజీ స్టాక్ అనుసంధానంగా ఉంటుంది.", "No missed calls or follow-ups": "మిస్సైన కాల్స్ లేదా ఫాలో-అప్‌లు లేవు", "Every caller keeps moving.": "ప్రతి కాలర్‌కు పని ముందుకు సాగుతుంది.", "The next step happens immediately.": "తదుపరి దశ వెంటనే జరుగుతుంది.", "Gets smarter with every miss": "ప్రతి లోటుతో మరింత తెలివిగా మారుతుంది", "Gaps become permanent improvements.": "లోటులు శాశ్వత మెరుగుదలలుగా మారతాయి.", "Setup": "సెటప్", "Live Data": "లైవ్ డేటా", "Integrations": "ఇంటిగ్రేషన్లు", "Availability": "అందుబాటు", "Automation": "ఆటోమేషన్", "Learning": "నేర్చుకోవడం", "Encrypted": "ఎన్‌క్రిప్ట్ చేయబడింది", "DPDP compliant": "DPDP అనుగుణం", "Isolated data": "విడిగా ఉన్న డేటా",
  "Transformation, delivered": "రూపాంతరం, అమలు చేయబడింది", "What changes when Voxa gets to work": "Voxa పని ప్రారంభించినప్పుడు ఏమి మారుతుంది", "Three everyday workflows, transformed from loose conversations into clear action.": "రోజువారీ మూడు వర్క్‌ఫ్లోలు—సాధారణ సంభాషణల నుండి స్పష్టమైన చర్యలుగా మారాయి.", "FRONT DESK": "ఫ్రంట్ డెస్క్", "OPERATIONS": "కార్యకలాపాలు", "REVENUE": "ఆదాయం", "Every call ends with a confirmed action": "ప్రతి కాల్ నిర్ధారిత చర్యతో ముగుస్తుంది", "Clear ownership for every request": "ప్రతి అభ్యర్థనకు స్పష్టమైన బాధ్యత", "Follow up while customer intent is fresh": "కస్టమర్ ఉద్దేశం తాజాగా ఉన్నప్పుడే ఫాలో-అప్ చేయండి",
  "FREQUENTLY ASKED QUESTIONS": "తరచుగా అడిగే ప్రశ్నలు", "Everything you need to know": "మీరు తెలుసుకోవాల్సిన ప్రతిదీ", "Answers to the questions businesses ask before launching a Woxza Voice AI solution.": "Woxza వాయిస్ AI పరిష్కారాన్ని ప్రారంభించే ముందు వ్యాపారాలు అడిగే ప్రశ్నలకు సమాధానాలు.", "Can the AI integrate with our existing software?": "AI మా ప్రస్తుత సాఫ్ట్‌వేర్‌తో అనుసంధానించగలదా?", "Can the AI answer questions about my business?": "AI నా వ్యాపారం గురించి ప్రశ్నలకు సమాధానం ఇవ్వగలదా?", "EARLY ACCESS": "ముందస్తు యాక్సెస్", "Ready to put Woxza on your phones?": "మీ ఫోన్‌లలో Woxzaని ఉంచడానికి సిద్ధంగా ఉన్నారా?", "Join the waitlist for early access, or talk with sales if you already know which calls and workflows you want Woxza to handle": "ముందస్తు యాక్సెస్ కోసం వెయిట్‌లిస్ట్‌లో చేరండి లేదా Woxza నిర్వహించాల్సిన కాల్స్, వర్క్‌ఫ్లోలు మీకు ఇప్పటికే తెలిస్తే సేల్స్‌తో మాట్లాడండి.",
  "Building voice AI that answers calls, books appointments, updates systems and keeps every customer conversation moving": "కాల్స్‌కు సమాధానం ఇచ్చే, అపాయింట్‌మెంట్‌లను బుక్ చేసే, సిస్టమ్‌లను నవీకరించే మరియు ప్రతి కస్టమర్ సంభాషణను ముందుకు నడిపించే వాయిస్ AIని నిర్మిస్తున్నాము", "LET'S TALK": "మాట్లాడుకుందాం", "Start a conversation with Woxza": "Woxzaతో సంభాషణ ప్రారంభించండి", "Call us": "మాకు కాల్ చేయండి", "Email us": "మాకు ఇమెయిల్ చేయండి", "Company": "కంపెనీ", "Services": "సేవలు", "Programs": "ప్రోగ్రామ్‌లు", "Resources": "వనరులు", "Waitlist": "వెయిట్‌లిస్ట్", "Insights": "అవగాహనలు", "Legal": "చట్టపరమైన", "Privacy": "గోప్యత", "Terms": "నిబంధనలు", "Connect": "కనెక్ట్ అవ్వండి", "© 2026 Woxza, all rights reserved": "© 2026 Woxza, అన్ని హక్కులు ప్రత్యేకించబడ్డాయి", "Voice AI Platform • Waitlist Access • Customer Automation": "వాయిస్ AI ప్లాట్‌ఫారమ్ • వెయిట్‌లిస్ట్ యాక్సెస్ • కస్టమర్ ఆటోమేషన్"
})

Object.assign(translations.hi, {
  "Woxza answers every call, understands intent, and takes action so your team can focus on what matters.": "Woxza हर कॉल का जवाब देता है, इरादा समझता है और कार्रवाई करता है, ताकि आपकी टीम महत्वपूर्ण काम पर ध्यान दे सके।",
  "From the first hello to the finished task, Woxza keeps every customer conversation moving forward.": "पहले नमस्ते से काम पूरा होने तक, Woxza हर ग्राहक बातचीत को आगे बढ़ाता है।",
  "Many conversations move your business. Woxza connects them, understands them, and completes the work behind them.": "कई बातचीत आपके व्यवसाय को चलाती हैं। Woxza उन्हें जोड़ता है, समझता है और उनके पीछे का काम पूरा करता है।",
  "Purpose-built AI": "उद्देश्य के लिए बना AI", "Tailored to industry needs": "उद्योग की ज़रूरतों के अनुरूप", "Proven impact": "सिद्ध प्रभाव", "Measurable business results": "मापने योग्य व्यावसायिक परिणाम", "Enterprise ready": "एंटरप्राइज़ के लिए तैयार", "Secure, reliable & scalable": "सुरक्षित, भरोसेमंद और विस्तार योग्य"
})

Object.assign(translations.te, {
  "Woxza answers every call, understands intent, and takes action so your team can focus on what matters.": "Woxza ప్రతి కాల్‌కు సమాధానం ఇచ్చి, ఉద్దేశాన్ని అర్థం చేసుకుని చర్య తీసుకుంటుంది; మీ బృందం ముఖ్యమైన పనిపై దృష్టి పెట్టవచ్చు.",
  "From the first hello to the finished task, Woxza keeps every customer conversation moving forward.": "మొదటి హలో నుంచి పని పూర్తయ్యే వరకు Woxza ప్రతి కస్టమర్ సంభాషణను ముందుకు నడిపిస్తుంది.",
  "Many conversations move your business. Woxza connects them, understands them, and completes the work behind them.": "అనేక సంభాషణలు మీ వ్యాపారాన్ని నడిపిస్తాయి. Woxza వాటిని కలుపుతుంది, అర్థం చేసుకుంటుంది, వాటి వెనుక పనిని పూర్తి చేస్తుంది.",
  "Purpose-built AI": "ప్రత్యేక అవసరాలకు రూపొందిన AI", "Tailored to industry needs": "పరిశ్రమ అవసరాలకు అనుగుణంగా", "Proven impact": "నిరూపిత ప్రభావం", "Measurable business results": "కొలవగల వ్యాపార ఫలితాలు", "Enterprise ready": "ఎంటర్‌ప్రైజ్‌కు సిద్ధం", "Secure, reliable & scalable": "సురక్షితమైన, నమ్మదగిన మరియు విస్తరించగల"
})

Object.assign(translations.ta, {
  "Woxza answers every call, understands intent, and takes action so your team can focus on what matters.": "Woxza ஒவ்வொரு அழைப்பிற்கும் பதிலளித்து, நோக்கத்தைப் புரிந்து நடவடிக்கை எடுக்கிறது; உங்கள் குழு முக்கியமானவற்றில் கவனம் செலுத்தலாம்.",
  "From the first hello to the finished task, Woxza keeps every customer conversation moving forward.": "முதல் வணக்கம் முதல் பணி முடியும் வரை, Woxza ஒவ்வொரு வாடிக்கையாளர் உரையாடலையும் முன்னோக்கி நகர்த்துகிறது.",
  "Many conversations move your business. Woxza connects them, understands them, and completes the work behind them.": "பல உரையாடல்கள் உங்கள் வணிகத்தை நகர்த்துகின்றன. Woxza அவற்றை இணைத்து, புரிந்துகொண்டு, பின்னால் உள்ள வேலையை முடிக்கிறது.",
  "Purpose-built AI": "நோக்கத்திற்காக உருவாக்கப்பட்ட AI", "Tailored to industry needs": "துறை தேவைகளுக்கேற்ப", "Proven impact": "நிரூபிக்கப்பட்ட தாக்கம்", "Measurable business results": "அளவிடக்கூடிய வணிக முடிவுகள்", "Enterprise ready": "நிறுவனத்திற்குத் தயாரானது", "Secure, reliable & scalable": "பாதுகாப்பான, நம்பகமான, விரிவாக்கக்கூடியது"
})

// Industry carousel: values must exactly match the source strings in
// Industries.vue (including punctuation) because this dictionary is key based.
Object.assign(translations.te, {
  "Professional Services": "వృత్తిపరమైన సేవలు", "Healthcare": "ఆరోగ్య సంరక్షణ", "Education": "విద్య", "Finance": "ఆర్థిక సేవలు",
  "Deliver seamless journeys from booking to arrival.": "బుకింగ్ నుంచి చేరుకునే వరకు సాఫీ ప్రయాణ అనుభవాన్ని అందించండి.",
  "Booking assistance": "బుకింగ్ సహాయం", "Cancellations & changes": "రద్దులు మరియు మార్పులు", "Itinerary updates": "ప్రయాణ ప్రణాళిక నవీకరణలు", "Travel support": "ప్రయాణ సహాయం", "BOOKING & SUPPORT": "బుకింగ్ మరియు సహాయం",
  "Convert more enquiries into clients.": "మరిన్ని విచారణలను కస్టమర్లుగా మార్చండి.",
  "Lead qualification": "లీడ్ అర్హత నిర్ధారణ", "Consultation booking": "సంప్రదింపుల బుకింగ్", "Client follow-ups": "క్లయింట్ ఫాలో-అప్‌లు", "Document collection": "పత్రాల సేకరణ", "CLIENT ENGAGEMENT": "క్లయింట్ అనుసంధానం",
  "Never miss a patient call.": "రోగి కాల్‌ను ఎప్పుడూ మిస్ అవ్వకండి.",
  "Appointment scheduling": "అపాయింట్‌మెంట్ షెడ్యూలింగ్", "Patient FAQs & triage": "రోగి ప్రశ్నలు మరియు ప్రాధాన్యత నిర్ధారణ", "Prescription & report updates": "ప్రిస్క్రిప్షన్ మరియు రిపోర్ట్ నవీకరణలు", "Multilingual patient support": "బహుభాషా రోగి సహాయం", "PATIENT ACCESS": "రోగి ప్రాప్యత",
  "Support every learner from enquiry to enrollment.": "విచారణ నుంచి నమోదు వరకు ప్రతి విద్యార్థికి సహాయం చేయండి.",
  "Admission enquiries": "ప్రవేశ విచారణలు", "Course recommendations": "కోర్సు సిఫార్సులు", "Interview scheduling": "ఇంటర్వ్యూ షెడ్యూలింగ్", "Fee & application reminders": "ఫీజు మరియు దరఖాస్తు గుర్తింపులు", "STUDENT ENROLLMENT": "విద్యార్థి నమోదు",
  "Turn every shopper into a returning customer.": "ప్రతి కొనుగోలుదారుని మళ్లీ వచ్చే కస్టమర్‌గా మార్చండి.",
  "Product enquiries": "ఉత్పత్తి విచారణలు", "Order tracking": "ఆర్డర్ ట్రాకింగ్", "Returns & exchanges": "రిటర్న్‌లు మరియు మార్పిడులు", "Personalized recommendations": "వ్యక్తిగత సిఫార్సులు", "CUSTOMER SUPPORT": "కస్టమర్ సహాయం",
  "Keep operations moving without missed calls.": "మిస్సైన కాల్స్ లేకుండా కార్యకలాపాలను కొనసాగించండి.",
  "Supplier coordination": "సరఫరాదారుల సమన్వయం", "Inventory enquiries": "ఇన్వెంటరీ విచారణలు", "Service requests": "సేవ అభ్యర్థనలు", "Dispatch & order updates": "డిస్పాచ్ మరియు ఆర్డర్ నవీకరణలు", "OPERATIONS SUPPORT": "కార్యకలాపాల సహాయం",
  "Automate conversations across every department.": "ప్రతి విభాగంలోని సంభాషణలను ఆటోమేట్ చేయండి.",
  "IT helpdesk": "IT సహాయ కేంద్రం", "HR employee support": "HR ఉద్యోగి సహాయం", "Internal workflows": "అంతర్గత వర్క్‌ఫ్లోలు", "Customer service automation": "కస్టమర్ సేవ ఆటోమేషన్", "BUSINESS OPERATIONS": "వ్యాపార కార్యకలాపాలు",
  "Deliver secure banking conversations 24/7.": "24/7 సురక్షిత బ్యాంకింగ్ సంభాషణలను అందించండి.",
  "Account enquiries": "ఖాతా విచారణలు", "Loan pre-qualification": "రుణ ముందస్తు అర్హత", "Appointment booking": "అపాయింట్‌మెంట్ బుకింగ్", "Payment reminders": "చెల్లింపు గుర్తింపులు", "CUSTOMER BANKING": "కస్టమర్ బ్యాంకింగ్"
})

// Kannada was previously selectable nowhere, which made the advertised fifth
// locale impossible to use.  Keep its UI copy in the same source dictionary
// as every other locale so missing entries are reported by `translationFor`.
translations.kn = {
  "Solutions": "ಪರಿಹಾರಗಳು", "About": "ನಮ್ಮ ಬಗ್ಗೆ", "Why Woxza": "Woxza ಏಕೆ", "Demo": "ಡೆಮೋ", "Approach": "ವಿಧಾನ", "FAQ": "ಪದೇಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು",
  "Join Waitlist": "ಕಾಯುವ ಪಟ್ಟಿಗೆ ಸೇರಿ", "Join the Waitlist": "ಕಾಯುವ ಪಟ್ಟಿಗೆ ಸೇರಿ", "Get a Demo": "ಡೆಮೋ ಪಡೆಯಿರಿ", "Learn More →": "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ →",
  "AI voice agent platform": "AI ಧ್ವನಿ ಏಜೆಂಟ್ ವೇದಿಕೆ", "Never miss a call": "ಯಾವುದೇ ಕರೆಯನ್ನು ತಪ್ಪಿಸಬೇಡಿ", "24/7 AI availability": "24/7 AI ಲಭ್ಯತೆ", "Understand intent": "ಉದ್ದೇಶವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ", "Human-like conversations": "ಮನುಷ್ಯರಂತಹ ಸಂಭಾಷಣೆಗಳು", "Take action": "ಕ್ರಮ ಕೈಗೊಳ್ಳಿ", "Book, update, notify & more": "ಬುಕ್ ಮಾಡಿ, ನವೀಕರಿಸಿ, ತಿಳಿಸಿ ಮತ್ತು ಇನ್ನಷ್ಟು", "Speak every language": "ಪ್ರತಿ ಭಾಷೆಯಲ್ಲೂ ಮಾತನಾಡಿ", "Multilingual by default": "ಪೂರ್ವನಿಯೋಜಿತವಾಗಿ ಬಹುಭಾಷಾ",
  "AI voice agents that": "AI ಧ್ವನಿ ಏಜೆಂಟ್‌ಗಳು", "answer calls, understand": "ಕರೆಗಳಿಗೆ ಉತ್ತರಿಸಿ, ಅರ್ಥಮಾಡಿಕೊಂಡು", "customers and ": "ಗ್ರಾಹಕರನ್ನು ಮತ್ತು ", "get": "ಕೆಲಸ", "work done": "ಮುಗಿಸುತ್ತವೆ", "Every call answered": "ಪ್ರತಿ ಕರೆಗೆ ಉತ್ತರ", "Every customer": "ಪ್ರತಿ ಗ್ರಾಹಕ", "understood. Every": "ಅರ್ಥವಾಗುತ್ತಾರೆ. ಪ್ರತಿ", "step handled": "ಹಂತ ನಿರ್ವಹಣೆ", "One platform for": "ಒಂದೇ ವೇದಿಕೆ", "every conversation": "ಪ್ರತಿ ಸಂಭಾಷಣೆಗೆ", "your business needs": "ನಿಮ್ಮ ವ್ಯವಹಾರದ ಅಗತ್ಯಗಳಿಗೆ", "completed": "ಪೂರ್ಣಗೊಂಡಿದೆ",
  "Woxza answers every call, understands intent, and takes action so your team can focus on what matters.": "Woxza ಪ್ರತಿ ಕರೆಗೆ ಉತ್ತರಿಸಿ, ಉದ್ದೇಶವನ್ನು ಅರ್ಥಮಾಡಿಕೊಂಡು ಕ್ರಮ ಕೈಗೊಳ್ಳುತ್ತದೆ; ನಿಮ್ಮ ತಂಡ ಮುಖ್ಯವಾದುದರ ಮೇಲೆ ಗಮನಹರಿಸಬಹುದು.", "From the first hello to the finished task, Woxza keeps every customer conversation moving forward.": "ಮೊದಲ ನಮಸ್ಕಾರದಿಂದ ಕೆಲಸ ಪೂರ್ಣಗೊಳ್ಳುವವರೆಗೆ Woxza ಪ್ರತಿಯೊಂದು ಗ್ರಾಹಕ ಸಂಭಾಷಣೆಯನ್ನು ಮುಂದಕ್ಕೆ ಕೊಂಡೊಯ್ಯುತ್ತದೆ.", "Many conversations move your business. Woxza connects them, understands them, and completes the work behind them.": "ಅನೇಕ ಸಂಭಾಷಣೆಗಳು ನಿಮ್ಮ ವ್ಯವಹಾರವನ್ನು ಮುನ್ನಡೆಸುತ್ತವೆ. Woxza ಅವುಗಳನ್ನು ಸಂಪರ್ಕಿಸಿ, ಅರ್ಥಮಾಡಿಕೊಂಡು, ಹಿಂದಿನ ಕೆಲಸವನ್ನು ಪೂರ್ಣಗೊಳಿಸುತ್ತದೆ.",
  "INDUSTRIES": "ಉದ್ಯಮಗಳು", "AI built for": "AI ನಿರ್ಮಿತ", "every industry.": "ಪ್ರತಿ ಉದ್ಯಮಕ್ಕಾಗಿ.", "Woxza adapts to the way your industry works, automating workflows, enhancing customer experiences and driving real business impact.": "ನಿಮ್ಮ ಉದ್ಯಮದ ಕಾರ್ಯವಿಧಾನಕ್ಕೆ Woxza ಹೊಂದಿಕೊಂಡು, ಕಾರ್ಯಹರಿವುಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸಿ, ಗ್ರಾಹಕ ಅನುಭವವನ್ನು ಉತ್ತಮಗೊಳಿಸಿ ನೈಜ ವ್ಯವಹಾರ ಫಲಿತಾಂಶ ನೀಡುತ್ತದೆ.", "Purpose-built AI": "ಉದ್ದೇಶಪೂರ್ವಕ AI", "Tailored to industry needs": "ಉದ್ಯಮದ ಅಗತ್ಯಗಳಿಗೆ ಹೊಂದಿಕೆ", "Proven impact": "ಸಾಬೀತಾದ ಪರಿಣಾಮ", "Measurable business results": "ಅಳೆಯಬಹುದಾದ ವ್ಯವಹಾರ ಫಲಿತಾಂಶ", "Enterprise ready": "ಎಂಟರ್‌ಪ್ರೈಸ್ ಸಿದ್ಧ", "Secure, reliable & scalable": "ಸುರಕ್ಷಿತ, ವಿಶ್ವಾಸಾರ್ಹ ಮತ್ತು ವಿಸ್ತರಿಸಬಹುದಾದ",
  "Travel": "ಪ್ರಯಾಣ", "Professional Services": "ವೃತ್ತಿಪರ ಸೇವೆಗಳು", "Healthcare": "ಆರೋಗ್ಯಸೇವೆ", "Education": "ಶಿಕ್ಷಣ", "Retail": "ಚಿಲ್ಲರೆ", "Manufacturing": "ತಯಾರಿಕೆ", "Enterprise": "ಎಂಟರ್‌ಪ್ರೈಸ್", "Finance": "ಹಣಕಾಸು", "Trusted by businesses across 20+ industries worldwide": "ವಿಶ್ವದಾದ್ಯಂತ 20ಕ್ಕೂ ಹೆಚ್ಚು ಉದ್ಯಮಗಳ ವ್ಯವಹಾರಗಳ ವಿಶ್ವಾಸ",
  "OUR MANIFESTO": "ನಮ್ಮ ಧ್ಯೇಯ", "Built for the people who answer the calls and the people waiting on the other end.": "ಕರೆಗಳಿಗೆ ಉತ್ತರಿಸುವವರಿಗಾಗಿ ಮತ್ತು ಇನ್ನೊಂದು ತುದಿಯಲ್ಲಿ ಕಾಯುವವರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ.", "WHY WE BUILT WOXZA": "ನಾವು WOXZA ಅನ್ನು ಏಕೆ ನಿರ್ಮಿಸಿದ್ದೇವೆ", "No one should have to choose which customer gets heard.": "ಯಾವ ಗ್ರಾಹಕರ ಮಾತು ಕೇಳಬೇಕು ಎಂದು ಯಾರೂ ಆಯ್ಕೆ ಮಾಡಬೇಕಾಗಿಲ್ಲ.", "There was one desk, one phone, and one person trying to be everywhere at once.": "ಒಂದು ಮೇಜು, ಒಂದು ಫೋನ್ ಮತ್ತು ಒಂದೇ ಸಮಯದಲ್ಲಿ ಎಲ್ಲೆಡೆ ಇರಲು ಪ್ರಯತ್ನಿಸುವ ಒಬ್ಬ ವ್ಯಕ್ತಿ ಇದ್ದರು.", "Every ring asked for something: an appointment, an answer, or a little reassurance. When the day got busy, someone had to wait. Sometimes, that person never called back.": "ಪ್ರತಿ ಕರೆ ಒಂದು ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್, ಉತ್ತರ ಅಥವಾ ಸ್ವಲ್ಪ ಭರವಸೆಯನ್ನು ಕೇಳುತ್ತಿತ್ತು. ದಿನ ಕಾರ್ಯನಿರತವಾದಾಗ ಯಾರಾದರೂ ಕಾಯಬೇಕಾಗುತ್ತಿತ್ತು. ಕೆಲವೊಮ್ಮೆ ಅವರು ಮತ್ತೆ ಕರೆಮಾಡುತ್ತಿರಲಿಲ್ಲ.", "Being there for everyone once felt impossible. Now, it can simply be how the business runs.": "ಒಮ್ಮೆ ಎಲ್ಲರಿಗೂ ಲಭ್ಯವಾಗಿರುವುದು ಅಸಾಧ್ಯವೆನಿಸಿತ್ತು. ಈಗ ಅದು ವ್ಯವಹಾರ ನಡೆಯುವ ವಿಧಾನವಾಗಬಹುದು.",
  "FREQUENTLY ASKED QUESTIONS": "ಪದೇಪದೇ ಕೇಳುವ ಪ್ರಶ್ನೆಗಳು", "Everything you need to know": "ನೀವು ತಿಳಿಯಬೇಕಾದ ಎಲ್ಲವೂ", "Answers to the questions businesses ask before launching a Woxza voice AI solution.": "Woxza ಧ್ವನಿ AI ಪರಿಹಾರವನ್ನು ಪ್ರಾರಂಭಿಸುವ ಮುನ್ನ ವ್ಯವಹಾರಗಳು ಕೇಳುವ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಗಳು.", "More...": "ಇನ್ನಷ್ಟು...", "Less": "ಕಡಿಮೆ"
}

const validLanguage = (value) => supportedLanguages.some(({ code }) => code === value)
// The language switcher is intentionally hidden from the public navigation.
// Always start in English and clear any previously saved visitor preference so
// the site cannot open in a language the visitor can no longer switch away from.
if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY)
const language = ref("en")
const originalText = new WeakMap()
const originalAttributes = new WeakMap()
const translatableAttributes = ["placeholder", "aria-label", "title"]
let observer

const translationFor = (value) => {
  const key = value.trim()
  if (language.value === "en") return key
  const translated = translations[language.value]?.[key]
  if (translated) return translated

  // Missing copy must be visible during local development instead of silently
  // blending into an otherwise translated page.
  if (import.meta.env.DEV) console.warn(`[i18n] Missing "${language.value}" translation: ${key}`)
  return translations.en?.[key] || key
}

function translateTextNode(node) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue)
  const source = originalText.get(node)
  const translated = language.value === "en" ? source.trim() : translationFor(source)
  const leading = source.match(/^\s*/)?.[0] || ""
  const trailing = source.match(/\s*$/)?.[0] || ""
  const nextValue = `${leading}${translated}${trailing}`
  if (node.nodeValue !== nextValue) node.nodeValue = nextValue
}

function translateElement(element) {
  if (["SCRIPT", "STYLE", "NOSCRIPT", "CODE"].includes(element.tagName) || element.closest("[data-no-translate]")) return
  for (const attribute of translatableAttributes) {
    if (!element.hasAttribute(attribute)) continue
    let values = originalAttributes.get(element)
    if (!values) { values = {}; originalAttributes.set(element, values) }
    if (!(attribute in values)) values[attribute] = element.getAttribute(attribute)
    const source = values[attribute]
    const nextValue = language.value === "en" ? source : translationFor(source)
    if (element.getAttribute(attribute) !== nextValue) element.setAttribute(attribute, nextValue)
  }
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE && child.nodeValue.trim()) translateTextNode(child)
    else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child)
  }
}

function translatePage() {
  if (typeof document === "undefined") return
  document.documentElement.lang = language.value
  translateElement(document.body)
}

function startPageTranslation() {
  translatePage()
  observer?.disconnect()
  observer = new MutationObserver(() => window.requestAnimationFrame(translatePage))
  observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: translatableAttributes })
}

function setLanguage(code) {
  if (!validLanguage(code)) return
  language.value = code
  window.localStorage.setItem(STORAGE_KEY, code)
  translatePage()
}

function t(value) {
  return language.value === "en" ? value : translationFor(value)
}

export function useI18n() {
  return { language, languages: supportedLanguages, languageName: computed(() => supportedLanguages.find((item) => item.code === language.value)?.nativeLabel), setLanguage, t, startPageTranslation, translatePage }
}
