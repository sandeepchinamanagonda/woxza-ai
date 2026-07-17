export const APPOINTMENT_TYPES = new Set(["salon", "movie", "doctor"])

const COPY = {
  en:{ invalidType:"This demo handles salon, movie, or doctor appointments only. Which would you prefer?", askDate:"Certainly. What date would you prefer?", askTime:"What time would you prefer?", askName:"May I have your name for the appointment details?", readback:d=>`Please confirm: a ${d.type} appointment on ${d.date} at ${d.time}, under the name ${d.name}. Is that correct?`, clarify:"Please say yes to confirm these details, or no to start again.", restart:"Certainly. Let us start again. Would you like a salon, movie, or doctor appointment?", confirmed:d=>`Your simulated ${d.type} appointment details for ${d.date} at ${d.time}, under ${d.name}, are confirmed for this demo.` },
  es:{ invalidType:"Esta demostración solo gestiona citas de salón, cine o médico. ¿Cuál prefiere?", askDate:"Por supuesto. ¿Qué fecha prefiere?", askTime:"¿Qué hora prefiere?", askName:"¿Podría decirme su nombre para los datos de la cita?", readback:d=>`Confirme, por favor: una cita de ${d.type} el ${d.date} a las ${d.time}, a nombre de ${d.name}. ¿Es correcto?`, clarify:"Diga sí para confirmar estos datos o no para comenzar de nuevo.", restart:"Por supuesto. Empecemos de nuevo. ¿Desea una cita de salón, cine o médico?", confirmed:d=>`Los datos simulados de su cita de ${d.type} para el ${d.date} a las ${d.time}, a nombre de ${d.name}, quedan confirmados para esta demostración.` },
  hi:{ invalidType:"यह डेमो केवल सैलून, मूवी या डॉक्टर की अपॉइंटमेंट संभालता है जी। आप इनमें से क्या चाहेंगे जी?", askDate:"निश्चित रूप से जी। आप किस तारीख की अपॉइंटमेंट चाहेंगे जी?", askTime:"आप किस समय की अपॉइंटमेंट चाहेंगे जी?", askName:"कृपया अपॉइंटमेंट के विवरण के लिए अपना नाम बताइए जी।", readback:d=>`कृपया पुष्टि कीजिए जी: ${d.name} के नाम पर ${d.date} को ${d.time} बजे ${d.type} अपॉइंटमेंट। क्या यह सही है जी?`, clarify:"कृपया इन विवरणों की पुष्टि के लिए हाँ जी कहिए, या दोबारा शुरू करने के लिए नहीं कहिए जी।", restart:"निश्चित रूप से जी। फिर से शुरू करते हैं जी। आप सैलून, मूवी या डॉक्टर की अपॉइंटमेंट में से क्या चाहेंगे जी?", confirmed:d=>`${d.name} के नाम पर ${d.date} को ${d.time} बजे की आपकी सिम्युलेटेड ${d.type} अपॉइंटमेंट का विवरण इस डेमो के लिए पुष्टि हो गया है जी।` },
  te:{ invalidType:"ఈ డెమోలో సెలూన్, మూవీ లేదా డాక్టర్ అపాయింట్‌మెంట్ మాత్రమే అందుబాటులో ఉన్నాయి అండి. మీకు ఏది కావాలి అండి?", askDate:"తప్పకుండా అండి. మీకు ఏ తేదీ కావాలి అండి?", askTime:"మీకు ఏ సమయం కావాలి అండి?", askName:"అపాయింట్‌మెంట్ వివరాల కోసం దయచేసి మీ పేరు చెప్పండి అండి.", readback:d=>`దయచేసి నిర్ధారించండి అండి: ${d.name} పేరుతో ${d.date} తేదీన ${d.time} సమయానికి ${d.type} అపాయింట్‌మెంట్. ఈ వివరాలు సరైనవేనా అండి?`, clarify:"ఈ వివరాలను నిర్ధారించడానికి అవును అండి అని, మళ్లీ ప్రారంభించడానికి కాదు అండి అని చెప్పండి.", restart:"తప్పకుండా అండి. మళ్లీ ప్రారంభిద్దాం అండి. మీకు సెలూన్, మూవీ లేదా డాక్టర్ అపాయింట్‌మెంట్‌లో ఏది కావాలి అండి?", confirmed:d=>`${d.name} పేరుతో ${d.date} తేదీన ${d.time} సమయానికి మీ సిమ్యులేటెడ్ ${d.type} అపాయింట్‌మెంట్ వివరాలు ఈ డెమో కోసం నిర్ధారించబడ్డాయి అండి.` },
  ta:{ invalidType:"இந்த டெமோ சலூன், திரைப்படம் அல்லது மருத்துவர் முன்பதிவுகளை மட்டுமே கையாளும். எதை விரும்புகிறீர்கள்?", askDate:"நிச்சயமாக. எந்தத் தேதியை விரும்புகிறீர்கள்?", askTime:"எந்த நேரத்தை விரும்புகிறீர்கள்?", askName:"முன்பதிவு விவரங்களுக்காக உங்கள் பெயரைச் சொல்லுங்கள்.", readback:d=>`தயவுசெய்து உறுதிப்படுத்துங்கள்: ${d.name} பெயரில் ${d.date} அன்று ${d.time} மணிக்கு ${d.type} முன்பதிவு. இது சரியா?`, clarify:"இந்த விவரங்களை உறுதிப்படுத்த ஆம் என்று சொல்லுங்கள், அல்லது மீண்டும் தொடங்க இல்லை என்று சொல்லுங்கள்.", restart:"நிச்சயமாக. மீண்டும் தொடங்கலாம். சலூன், திரைப்படம் அல்லது மருத்துவர் முன்பதிவில் எதை விரும்புகிறீர்கள்?", confirmed:d=>`${d.name} பெயரில் ${d.date} அன்று ${d.time} மணிக்கான உங்கள் மாதிரி ${d.type} முன்பதிவு விவரங்கள் இந்த டெமோவிற்காக உறுதிப்படுத்தப்பட்டுள்ளன.` },
  kn:{ invalidType:"ಈ ಡೆಮೋ ಸಲೂನ್, ಸಿನಿಮಾ ಅಥವಾ ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳನ್ನು ಮಾತ್ರ ನಿರ್ವಹಿಸುತ್ತದೆ. ನೀವು ಯಾವುದನ್ನು ಬಯಸುತ್ತೀರಿ?", askDate:"ಖಂಡಿತವಾಗಿ. ನೀವು ಯಾವ ದಿನಾಂಕವನ್ನು ಬಯಸುತ್ತೀರಿ?", askTime:"ನೀವು ಯಾವ ಸಮಯವನ್ನು ಬಯಸುತ್ತೀರಿ?", askName:"ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿವರಗಳಿಗಾಗಿ ದಯವಿಟ್ಟು ನಿಮ್ಮ ಹೆಸರನ್ನು ತಿಳಿಸಿ.", readback:d=>`ದಯವಿಟ್ಟು ದೃಢೀಕರಿಸಿ: ${d.name} ಹೆಸರಿನಲ್ಲಿ ${d.date} ರಂದು ${d.time} ಗಂಟೆಗೆ ${d.type} ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್. ಇದು ಸರಿಯೇ?`, clarify:"ಈ ವಿವರಗಳನ್ನು ದೃಢೀಕರಿಸಲು ಹೌದು ಎಂದು ಹೇಳಿ, ಅಥವಾ ಮತ್ತೆ ಪ್ರಾರಂಭಿಸಲು ಇಲ್ಲ ಎಂದು ಹೇಳಿ.", restart:"ಖಂಡಿತವಾಗಿ. ಮತ್ತೆ ಪ್ರಾರಂಭಿಸೋಣ. ನೀವು ಸಲೂನ್, ಸಿನಿಮಾ ಅಥವಾ ವೈದ್ಯರ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ನಲ್ಲಿ ಯಾವುದನ್ನು ಬಯಸುತ್ತೀರಿ?", confirmed:d=>`${d.name} ಹೆಸರಿನಲ್ಲಿ ${d.date} ರಂದು ${d.time} ಗಂಟೆಗೆ ನಿಮ್ಮ ಸಿಮ್ಯುಲೇಟೆಡ್ ${d.type} ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ವಿವರಗಳನ್ನು ಈ ಡೆಮೋಗಾಗಿ ದೃಢೀಕರಿಸಲಾಗಿದೆ.` },
  ml:{ invalidType:"ഈ ഡെമോ സലൂൺ, സിനിമ, അല്ലെങ്കിൽ ഡോക്ടർ അപ്പോയിന്റ്മെന്റുകൾ മാത്രമാണ് കൈകാര്യം ചെയ്യുന്നത്. ഏതാണ് വേണ്ടത്?", askDate:"തീർച്ചയായും. ഏത് തീയതിയാണ് വേണ്ടത്?", askTime:"ഏത് സമയമാണ് വേണ്ടത്?", askName:"അപ്പോയിന്റ്മെന്റ് വിവരങ്ങൾക്കായി ദയവായി പേര് പറയാമോ?", readback:d=>`ദയവായി സ്ഥിരീകരിക്കുക: ${d.name} എന്ന പേരിൽ ${d.date} തീയതി ${d.time} സമയത്ത് ${d.type} അപ്പോയിന്റ്മെന്റ്. ഇത് ശരിയാണോ?`, clarify:"ഈ വിവരങ്ങൾ സ്ഥിരീകരിക്കാൻ അതെ എന്നും വീണ്ടും തുടങ്ങാൻ ഇല്ല എന്നും പറയുക.", restart:"തീർച്ചയായും. നമുക്ക് വീണ്ടും തുടങ്ങാം. സലൂൺ, സിനിമ, അല്ലെങ്കിൽ ഡോക്ടർ അപ്പോയിന്റ്മെന്റിൽ ഏതാണ് വേണ്ടത്?", confirmed:d=>`${d.name} എന്ന പേരിൽ ${d.date} തീയതി ${d.time} സമയത്തേക്കുള്ള സിമുലേറ്റഡ് ${d.type} അപ്പോയിന്റ്മെന്റ് വിവരങ്ങൾ ഈ ഡെമോയ്ക്കായി സ്ഥിരീകരിച്ചു.` },
  mr:{ invalidType:"हा डेमो फक्त सलून, चित्रपट किंवा डॉक्टरांच्या अपॉइंटमेंट हाताळतो. आपण कोणती निवडाल?", askDate:"नक्कीच. आपण कोणती तारीख पसंत कराल?", askTime:"आपण कोणती वेळ पसंत कराल?", askName:"अपॉइंटमेंटच्या तपशीलांसाठी कृपया आपले नाव सांगाल का?", readback:d=>`कृपया पुष्टी करा: ${d.name} यांच्या नावावर ${d.date} रोजी ${d.time} वाजता ${d.type} अपॉइंटमेंट. हे बरोबर आहे का?`, clarify:"या तपशीलांची पुष्टी करण्यासाठी होय म्हणा किंवा पुन्हा सुरू करण्यासाठी नाही म्हणा.", restart:"नक्कीच. पुन्हा सुरू करूया. आपल्याला सलून, चित्रपट किंवा डॉक्टरांची अपॉइंटमेंट हवी आहे?", confirmed:d=>`${d.name} यांच्या नावावर ${d.date} रोजी ${d.time} वाजताची सिम्युलेटेड ${d.type} अपॉइंटमेंट माहिती या डेमोसाठी पुष्ट झाली आहे.` },
  gu:{ invalidType:"આ ડેમો માત્ર સલૂન, મૂવી અથવા ડૉક્ટરની એપોઇન્ટમેન્ટ સંભાળે છે. આપ કઈ પસંદ કરશો?", askDate:"ચોક્કસ. આપ કઈ તારીખ પસંદ કરશો?", askTime:"આપ કયો સમય પસંદ કરશો?", askName:"એપોઇન્ટમેન્ટની વિગતો માટે કૃપા કરીને આપનું નામ જણાવશો?", readback:d=>`કૃપા કરીને ખાતરી કરો: ${d.name}ના નામે ${d.date}ના રોજ ${d.time} વાગ્યે ${d.type} એપોઇન્ટમેન્ટ. શું આ સાચું છે?`, clarify:"આ વિગતોની ખાતરી કરવા હા કહો અથવા ફરી શરૂ કરવા ના કહો.", restart:"ચોક્કસ. ફરી શરૂ કરીએ. આપને સલૂન, મૂવી અથવા ડૉક્ટરની એપોઇન્ટમેન્ટમાંથી કઈ જોઈએ છે?", confirmed:d=>`${d.name}ના નામે ${d.date}ના રોજ ${d.time} વાગ્યાની આપની સિમ્યુલેટેડ ${d.type} એપોઇન્ટમેન્ટ વિગતો આ ડેમો માટે નિશ્ચિત થઈ છે.` },
  bn:{ invalidType:"এই ডেমোটি শুধু স্যালন, সিনেমা বা ডাক্তারের অ্যাপয়েন্টমেন্ট পরিচালনা করে। আপনি কোনটি চান?", askDate:"অবশ্যই। আপনি কোন তারিখ চান?", askTime:"আপনি কোন সময় চান?", askName:"অ্যাপয়েন্টমেন্টের বিবরণের জন্য অনুগ্রহ করে আপনার নাম বলবেন?", readback:d=>`অনুগ্রহ করে নিশ্চিত করুন: ${d.name}-এর নামে ${d.date} তারিখে ${d.time} সময়ে ${d.type} অ্যাপয়েন্টমেন্ট। এটি কি সঠিক?`, clarify:"এই বিবরণ নিশ্চিত করতে হ্যাঁ বলুন, অথবা আবার শুরু করতে না বলুন।", restart:"অবশ্যই। আবার শুরু করি। আপনি স্যালন, সিনেমা বা ডাক্তারের অ্যাপয়েন্টমেন্টের মধ্যে কোনটি চান?", confirmed:d=>`${d.name}-এর নামে ${d.date} তারিখে ${d.time} সময়ের আপনার সিমুলেটেড ${d.type} অ্যাপয়েন্টমেন্টের বিবরণ এই ডেমোর জন্য নিশ্চিত হয়েছে।` },
  pa:{ invalidType:"ਇਹ ਡੇਮੋ ਸਿਰਫ਼ ਸੈਲੂਨ, ਫ਼ਿਲਮ ਜਾਂ ਡਾਕਟਰ ਦੀ ਅਪਾਇੰਟਮੈਂਟ ਸੰਭਾਲਦਾ ਹੈ। ਤੁਸੀਂ ਕਿਹੜੀ ਚਾਹੁੰਦੇ ਹੋ?", askDate:"ਜ਼ਰੂਰ। ਤੁਸੀਂ ਕਿਹੜੀ ਤਾਰੀਖ ਚਾਹੁੰਦੇ ਹੋ?", askTime:"ਤੁਸੀਂ ਕਿਹੜਾ ਸਮਾਂ ਚਾਹੁੰਦੇ ਹੋ?", askName:"ਅਪਾਇੰਟਮੈਂਟ ਦੇ ਵੇਰਵਿਆਂ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਨਾਮ ਦੱਸੋ।", readback:d=>`ਕਿਰਪਾ ਕਰਕੇ ਪੁਸ਼ਟੀ ਕਰੋ: ${d.name} ਦੇ ਨਾਮ ਉੱਤੇ ${d.date} ਨੂੰ ${d.time} ਵਜੇ ${d.type} ਅਪਾਇੰਟਮੈਂਟ। ਕੀ ਇਹ ਸਹੀ ਹੈ?`, clarify:"ਇਨ੍ਹਾਂ ਵੇਰਵਿਆਂ ਦੀ ਪੁਸ਼ਟੀ ਲਈ ਹਾਂ ਕਹੋ ਜਾਂ ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਨਹੀਂ ਕਹੋ।", restart:"ਜ਼ਰੂਰ। ਦੁਬਾਰਾ ਸ਼ੁਰੂ ਕਰੀਏ। ਤੁਸੀਂ ਸੈਲੂਨ, ਫ਼ਿਲਮ ਜਾਂ ਡਾਕਟਰ ਦੀ ਅਪਾਇੰਟਮੈਂਟ ਵਿੱਚੋਂ ਕਿਹੜੀ ਚਾਹੁੰਦੇ ਹੋ?", confirmed:d=>`${d.name} ਦੇ ਨਾਮ ਉੱਤੇ ${d.date} ਨੂੰ ${d.time} ਵਜੇ ਤੁਹਾਡੀ ਸਿਮੂਲੇਟ ਕੀਤੀ ${d.type} ਅਪਾਇੰਟਮੈਂਟ ਦੇ ਵੇਰਵੇ ਇਸ ਡੇਮੋ ਲਈ ਪੁਸ਼ਟ ਹੋ ਗਏ ਹਨ।` },
  as:{ invalidType:"এই ডেমোৱে কেৱল ছেলুন, চিনেমা বা ডাক্তৰৰ এপইণ্টমেণ্ট পৰিচালনা কৰে। আপুনি কোনটো বিচাৰে?", askDate:"নিশ্চয়। আপুনি কোন তাৰিখ বিচাৰে?", askTime:"আপুনি কোন সময় বিচাৰে?", askName:"এপইণ্টমেণ্টৰ বিৱৰণৰ বাবে অনুগ্ৰহ কৰি আপোনাৰ নাম ক’বনে?", readback:d=>`অনুগ্ৰহ কৰি নিশ্চিত কৰক: ${d.name}ৰ নামত ${d.date} তাৰিখে ${d.time} বজাত ${d.type} এপইণ্টমেণ্ট। এইটো শুদ্ধ নে?`, clarify:"এই বিৱৰণ নিশ্চিত কৰিবলৈ হয় কওক, অথবা পুনৰ আৰম্ভ কৰিবলৈ নহয় কওক।", restart:"নিশ্চয়। পুনৰ আৰম্ভ কৰোঁ। আপুনি ছেলুন, চিনেমা বা ডাক্তৰৰ এপইণ্টমেণ্টৰ ভিতৰত কোনটো বিচাৰে?", confirmed:d=>`${d.name}ৰ নামত ${d.date} তাৰিখে ${d.time} বজাত আপোনাৰ ছিমুলেটেড ${d.type} এপইণ্টমেণ্টৰ বিৱৰণ এই ডেমোৰ বাবে নিশ্চিত কৰা হৈছে।` },
  ur:{ invalidType:"یہ ڈیمو صرف سیلون، فلم یا ڈاکٹر کی اپائنٹمنٹ سنبھالتا ہے جی۔ آپ ان میں سے کیا چاہیں گے جی؟", askDate:"ضرور جی۔ آپ کس تاریخ کی اپائنٹمنٹ چاہیں گے جی؟", askTime:"آپ کس وقت کی اپائنٹمنٹ چاہیں گے جی؟", askName:"براہ کرم اپائنٹمنٹ کی تفصیلات کے لیے اپنا نام بتائیے جی۔", readback:d=>`براہ کرم تصدیق کیجیے جی: ${d.name} کے نام پر ${d.date} کو ${d.time} بجے ${d.type} اپائنٹمنٹ۔ کیا یہ درست ہے جی؟`, clarify:"براہ کرم ان تفصیلات کی تصدیق کے لیے ہاں جی کہیں، یا دوبارہ شروع کرنے کے لیے نہیں کہیں جی۔", restart:"ضرور جی۔ دوبارہ شروع کرتے ہیں جی۔ آپ سیلون، فلم یا ڈاکٹر کی اپائنٹمنٹ میں سے کیا چاہیں گے جی؟", confirmed:d=>`${d.name} کے نام پر ${d.date} کو ${d.time} بجے کی آپ کی سیمولیٹڈ ${d.type} اپائنٹمنٹ کی تفصیلات اس ڈیمو کے لیے تصدیق شدہ ہیں جی۔` }
}

const TYPE_LABELS = {
  en:{ salon:"salon", movie:"movie", doctor:"doctor" }, es:{ salon:"salón", movie:"cine", doctor:"médico" },
  hi:{ salon:"सैलून", movie:"मूवी", doctor:"डॉक्टर" }, te:{ salon:"సెలూన్", movie:"మూవీ", doctor:"డాక్టర్" },
  ta:{ salon:"சலூன்", movie:"திரைப்பட", doctor:"மருத்துவர்" }, kn:{ salon:"ಸಲೂನ್", movie:"ಸಿನಿಮಾ", doctor:"ವೈದ್ಯರ" },
  ml:{ salon:"സലൂൺ", movie:"സിനിമ", doctor:"ഡോക്ടർ" }, mr:{ salon:"सलून", movie:"चित्रपट", doctor:"डॉक्टरांची" },
  gu:{ salon:"સલૂન", movie:"મૂવી", doctor:"ડૉક્ટરની" }, bn:{ salon:"স্যালন", movie:"সিনেমা", doctor:"ডাক্তারের" },
  pa:{ salon:"ਸੈਲੂਨ", movie:"ਫ਼ਿਲਮ", doctor:"ਡਾਕਟਰ ਦੀ" }, as:{ salon:"ছেলুন", movie:"চিনেমা", doctor:"ডাক্তৰৰ" },
  ur:{ salon:"سیلون", movie:"فلم", doctor:"ڈاکٹر کی" }
}

const AFFIRMATIVE = {
  en:/^(?:yes|yes please|confirm|confirmed|correct|that is correct)$/i, es:/^(?:sí|si|confirmar|correcto)$/iu,
  hi:/^(?:हाँ|हां|हाँ जी|हां जी|पुष्टि|कन्फर्म|yes)$/iu, te:/^(?:అవును|అవును అండి|నిర్ధారించండి|కన్ఫర్మ్|yes)$/iu,
  ta:/^(?:ஆம்|ஆமாம்|உறுதிப்படுத்து|yes)$/iu, kn:/^(?:ಹೌದು|ದೃಢೀಕರಿಸಿ|yes)$/iu,
  ml:/^(?:അതെ|സ്ഥിരീകരിക്കുക|yes)$/iu, mr:/^(?:होय|पुष्टी करा|yes)$/iu, gu:/^(?:હા|ખાતરી કરો|yes)$/iu,
  bn:/^(?:হ্যাঁ|নিশ্চিত করুন|yes)$/iu, pa:/^(?:ਹਾਂ|ਪੁਸ਼ਟੀ ਕਰੋ|yes)$/iu, as:/^(?:হয়|নিশ্চিত কৰক|yes)$/iu,
  ur:/^(?:ہاں|ہاں جی|تصدیق|کنفرم|yes)$/iu
}

const NEGATIVE = {
  en:/^(?:no|no thanks|incorrect|start again)$/i, es:/^(?:no|incorrecto)$/iu, hi:/^(?:नहीं|नही|नहीं जी|no)$/iu,
  te:/^(?:కాదు|వద్దు|కాదు అండి|no)$/iu, ta:/^(?:இல்லை|வேண்டாம்|no)$/iu, kn:/^(?:ಇಲ್ಲ|ಬೇಡ|no)$/iu,
  ml:/^(?:ഇല്ല|വേണ്ട|no)$/iu, mr:/^(?:नाही|नको|no)$/iu, gu:/^(?:ના|નહીં|no)$/iu, bn:/^(?:না|নয়|no)$/iu,
  pa:/^(?:ਨਹੀਂ|ਨਾ|no)$/iu, as:/^(?:নহয়|নালাগে|no)$/iu, ur:/^(?:نہیں|نہیں جی|no)$/iu
}

const clean = value => String(value || "").trim().replace(/\s+/g, " ").slice(0, 120)
const copyFor = language => COPY[language] || COPY.en
const displayDetails = (details, language) => ({ ...details, type:TYPE_LABELS[language]?.[details.type] || details.type })

export function classifyAppointmentConfirmation(text, language="en") {
  const value = clean(text).replace(/[.!?،।]+$/u, "").trim()
  if (AFFIRMATIVE[language]?.test(value)) return "affirmative"
  if (NEGATIVE[language]?.test(value)) return "negative"
  return "unclear"
}

export function createAppointmentBookingState() {
  return { status:"awaiting_type", details:{ type:"", date:"", time:"", name:"" }, confirmed:false, error:null }
}

export function transitionAppointmentBooking(state, { action, type, value, callerText, language="en" } = {}) {
  const copy = copyFor(language)
  const fail = (error, sayExactly) => ({ ok:false, error, state:state.status, sayExactly })
  const set = (field, expectedState, nextState, nextCopy) => {
    const normalized = clean(value)
    if (state.status !== expectedState) return fail("invalid_transition", responseForAppointmentState(state, language))
    if (!normalized) return fail(`missing_${field}`, responseForAppointmentState(state, language))
    state.details[field] = normalized
    state.status = nextState
    state.error = null
    return { ok:true, state:state.status, details:{ ...state.details }, sayExactly:typeof nextCopy === "function" ? nextCopy(displayDetails(state.details, language)) : nextCopy }
  }

  if (action === "set_type") {
    if (state.status !== "awaiting_type") return fail("invalid_transition", responseForAppointmentState(state, language))
    const normalizedType = clean(type).toLowerCase()
    if (!APPOINTMENT_TYPES.has(normalizedType)) return fail("invalid_appointment_type", copy.invalidType)
    state.details = { type:normalizedType, date:"", time:"", name:"" }
    state.status = "awaiting_date"
    state.confirmed = false
    return { ok:true, state:state.status, details:{ ...state.details }, sayExactly:copy.askDate }
  }
  if (action === "set_date") return set("date", "awaiting_date", "awaiting_time", copy.askTime)
  if (action === "set_time") return set("time", "awaiting_time", "awaiting_name", copy.askName)
  if (action === "set_name") return set("name", "awaiting_name", "awaiting_confirmation", copy.readback)
  if (action === "confirm") {
    if (state.status !== "awaiting_confirmation") return fail("invalid_transition", responseForAppointmentState(state, language))
    const confirmation = classifyAppointmentConfirmation(callerText, language)
    if (confirmation === "unclear") return fail("ambiguous_confirmation", copy.clarify)
    if (confirmation === "negative") {
      state.status = "awaiting_type"
      state.details = { type:"", date:"", time:"", name:"" }
      state.confirmed = false
      return { ok:true, state:state.status, details:{ ...state.details }, sayExactly:copy.restart }
    }
    state.status = "confirmed"
    state.confirmed = true
    return { ok:true, state:state.status, details:{ ...state.details }, sayExactly:copy.confirmed(displayDetails(state.details, language)) }
  }
  return fail("unknown_action", responseForAppointmentState(state, language))
}

export function responseForAppointmentState(state, language="en") {
  const copy = copyFor(language)
  if (state.status === "awaiting_type") return copy.invalidType
  if (state.status === "awaiting_date") return copy.askDate
  if (state.status === "awaiting_time") return copy.askTime
  if (state.status === "awaiting_name") return copy.askName
  if (state.status === "awaiting_confirmation") return copy.readback(displayDetails(state.details, language))
  if (state.status === "confirmed") return copy.confirmed(displayDetails(state.details, language))
  return copy.restart
}

export const APPOINTMENT_TEMPLATE_LANGUAGES = Object.freeze(Object.keys(COPY))
