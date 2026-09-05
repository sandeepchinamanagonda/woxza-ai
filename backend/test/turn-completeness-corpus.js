// Fixed multilingual evaluation corpus. These are intentionally not safety
// rules: the interpreter must classify them semantically, including the
// Telugu fragment "నా", which is absent from the normalizer guard.
const examples = {
  en:{ complete:["pharmacy","hardware shop","yes","we take orders by phone","we miss follow-up calls"], incomplete:["my","our","I run a","and","because"], mixed:["my shop lo hardware items sell chestam","yes demo chuddam","we take calls ద్వారా orders","we run a medical shop","customers కి follow-up చేస్తాము"] },
  te:{ complete:["మెడికల్ షాప్","హార్డ్‌వేర్ షాప్","అవును","ఫోన్ కాల్స్ ద్వారా ఆర్డర్లు తీసుకుంటాము","ఫాలో అప్‌లు మిస్ అవుతాయి"], incomplete:["నా","మాది","మా","కానీ","అంటే"], mixed:["మాది hardware shop అండి","phone calls ద్వారా orders తీసుకుంటాము","మా business medical distribution","customers కి follow-up చేస్తాము","demo చూపించండి please"] },
  hi:{ complete:["मेडिकल शॉप","हार्डवेयर की दुकान","हाँ","फोन कॉल से ऑर्डर लेते हैं","फॉलो-अप छूट जाते हैं"], incomplete:["मेरा","हमारा","लेकिन","और","क्योंकि"], mixed:["मेरा hardware shop है","phone calls से orders लेते हैं","हमारा business medical distribution है","customers को follow-up करते हैं","demo दिखाइए please"] },
  ta:{ complete:["மருத்துவக் கடை","ஹார்ட்வேர் கடை","ஆம்","தொலைபேசி அழைப்பில் ஆர்டர்கள் எடுக்கிறோம்","பின்தொடர்வு தவறிவிடுகிறது"], incomplete:["என்","எங்கள்","ஆனால்","மற்றும்","ஏனெனில்"], mixed:["என் hardware shop உள்ளது","phone calls மூலம் orders எடுக்கிறோம்","எங்கள் business medical distribution","customers க்கு follow-up செய்கிறோம்","demo காட்டுங்கள் please"] }
}

export const TURN_COMPLETENESS_CORPUS = Object.entries(examples).flatMap(([language, groups]) => Object.entries(groups).flatMap(([kind, seeds]) =>
  Array.from({ length:15 }, (_, index) => ({
    id:`${language}-${kind}-${index + 1}`,
    language,
    kind,
    text:seeds[index % seeds.length],
    expected_clarity:kind === "incomplete" ? "incomplete" : "complete"
  }))
))
