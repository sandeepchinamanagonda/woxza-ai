<template>
  <div class="voice-demo" :class="`scenario-${scenario.id}`" :style="{ '--scenario': scenario.color, '--scenario-soft': scenario.soft }">
    <div class="voice-field" :class="{ speaking: isWoxzaSpeaking }" aria-hidden="true">
      <div class="halo halo-one" />
      <div class="halo halo-two" />
      <div class="voice-orb">
        <div class="voice-bars">
          <i v-for="(height, index) in barHeights" :key="index" :style="{ height: `${height}px`, animationDelay: `${index * -90}ms` }" />
        </div>
      </div>
      <svg viewBox="0 0 800 360" preserveAspectRatio="none">
        <path d="M0 190 C88 190 88 140 176 140 S264 238 352 238 440 108 528 108 616 212 800 166" />
        <path d="M0 214 C120 214 120 174 240 174 S360 226 480 226 600 154 800 188" />
      </svg>
    </div>

    <article class="call-card notranslate" data-no-translate :lang="scenario.language" translate="no">
      <header>
        <div class="call-identity">
          <span class="scenario-icon"><component :is="scenario.icon" /></span>
          <div><small>{{ scenario.eyebrow }}</small><h2>{{ scenario.title }}</h2><span class="scenario-tag">{{ scenario.tag }}</span></div>
        </div>
        <div class="call-presence">
          <div ref="languageMenu" class="demo-language">
            <button type="button" class="demo-language__trigger" :aria-expanded="isLanguageMenuOpen" aria-label="Choose live example language" @click.stop="isLanguageMenuOpen = !isLanguageMenuOpen">
              <Languages aria-hidden="true" /><span>{{ activeLanguageLabel }}</span><ChevronDown aria-hidden="true" />
            </button>
            <div v-if="isLanguageMenuOpen" class="demo-language__menu" role="menu">
              <button type="button" role="menuitem" :class="{ selected: !demoLanguage }" @click="setDemoLanguage('')"><Check aria-hidden="true" />Use website language <small>({{ pageLanguageLabel }})</small></button>
              <button v-for="item in languages" :key="item.code" type="button" role="menuitem" :class="{ selected: demoLanguage === item.code }" @click="setDemoLanguage(item.code)"><Check aria-hidden="true" />{{ item.nativeLabel }}</button>
            </div>
          </div>
          <span class="call-status" :class="{ active: isWoxzaSpeaking }"><i />{{ isWoxzaSpeaking ? scenario.ui.speaking : scenario.ui.listening }}</span>
          <span class="status-wave" :class="{ active: isWoxzaSpeaking }" aria-hidden="true">
            <i v-for="(height, index) in statusWaveHeights" :key="index" :style="{ height: `${height}px`, animationDelay: `${index * -75}ms` }" />
          </span>
        </div>
      </header>

      <div ref="transcriptElement" class="transcript" :lang="scenario.language">
        <div
          v-for="(message, index) in visibleMessages"
          :key="`${scenario.id}-${index}`"
          class="message"
          :class="[message.role.toLowerCase(), { current: index === visibleMessages.length - 1 }]"
        >
          <span><b v-if="message.role === 'Woxza'" class="mini-bars"><i /><i /><i /></b>{{ message.speaker }}</span>
          <p>{{ message.text }}</p>
        </div>
      </div>

      <CompletionConfirm
        v-if="isComplete"
        :key="`${scenario.id}-${scenarioIndex}-${scenario.language}`"
        :label="completionLabel"
        :duration="scenario.completionDuration"
        :duration-label="scenario.durationLabel"
      />

      <footer>
        <div><span v-for="outcome in scenario.outcomes" :key="outcome">{{ outcome }}</span></div>
        <b>◖◗</b>
      </footer>
    </article>

    <div class="scenario-nav">
      <div class="progress"><i :style="{ width: `${((scenarioIndex + 1) / scenarios.length) * 100}%` }" /></div>
      <div class="scenario-buttons">
        <button v-for="(item, index) in scenarios" :key="item.id" :class="{ active: index === scenarioIndex }" @click="selectScenario(index)">
          <b><component :is="item.icon" /></b><span>{{ item.short }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue"
import { CalendarCheck, Check, ChevronDown, CreditCard, Languages, PackageCheck, Utensils } from "lucide-vue-next"
import CompletionConfirm from "@/components/CompletionConfirm.vue"
import { useI18n } from "@/composables/useI18n"

const sharedStyle = { color: "#14264d", soft: "#eef1f5" }
const { language: pageLanguage, languages } = useI18n()
const demoLanguage = ref("")
const isLanguageMenuOpen = ref(false)
const languageMenu = ref(null)

const scenarioSets = {
  india: [
    { ...sharedStyle, id: "clinic", language: "en", icon: CalendarCheck, completionDuration: 1200, short: "Appointment", eyebrow: "Hyderabad care desk", title: "Doctor appointment", tag: "Live calendar", messages: [
      { speaker: "Caller", text: "Namaste, my daughter has had a fever since morning, is a paediatrician available in Hyderabad today?" },
      { speaker: "Woxza", text: "Doctor Ananya Rao can see her at the Jubilee Hills clinic at 4:15 PM, shall I book it?" },
      { speaker: "Caller", text: "Yes, please send the patient form to me on WhatsApp too" },
      { speaker: "Woxza", text: "Done, the appointment is confirmed and the form is on your WhatsApp" }
    ], outcomes: ["Appointment confirmed", "Patient form sent"] },
    { ...sharedStyle, id: "restaurant", language: "te", icon: Utensils, completionDuration: 1750, short: "Restaurant", eyebrow: "Delhi guest services", title: "Restaurant reservation", tag: "Menu and tables", messages: [
      { speaker: "Caller", text: "ఈ రాత్రి కనాట్ ప్లేస్‌లో పనీర్ టిక్కా, రూఫ్‌టాప్ టేబుల్ దొరుకుతుందా?" },
      { speaker: "Woxza", text: "అవును. పనీర్ టిక్కా అందుబాటులో ఉంది. రాత్రి 7:30కి రూఫ్‌టాప్ టేబుల్ ఉంది." },
      { speaker: "Caller", text: "నలుగురికి బుక్ చేయండి. మా అమ్మ పుట్టినరోజు కోసం కేక్ కూడా కావాలి." },
      { speaker: "Woxza", text: "అయింది. టేబుల్ బుక్ చేశాను, పుట్టినరోజు కేక్ అభ్యర్థనను కూడా జోడించాను." }
    ], outcomes: ["Table booked", "Birthday request added"] },
    { ...sharedStyle, id: "distribution", language: "hi", icon: PackageCheck, completionDuration: 2400, short: "Distribution", eyebrow: "North India operations", title: "Medical distribution", tag: "Inventory linked", messages: [
      { speaker: "Caller", text: "दिल्ली के हमारे अस्पताल को सोमवार सुबह तक 60 इन्फ्यूज़न सेट चाहिए। क्या पास का स्टॉक देख सकते हैं?" },
      { speaker: "Woxza", text: "हाँ। गुरुग्राम में 42 और नोएडा में 18 सेट उपलब्ध हैं। दोनों सोमवार सुबह 9 बजे तक पहुँच सकते हैं।" },
      { speaker: "Caller", text: "कृपया इन्हें मिलाकर हमारे प्राथमिकता वाले अनुबंध से भेज दीजिए।" },
      { speaker: "Woxza", text: "हो गया। ट्रांसफर ऑर्डर VOX 2841 की पुष्टि हो गई है। पिकअप के बाद मैं ट्रैकिंग विवरण WhatsApp कर दूँगा।" }
    ], outcomes: ["Transfer order confirmed", "Tracking scheduled"] },
    { ...sharedStyle, id: "payment", language: "ta", icon: CreditCard, completionDuration: 1550, short: "Payments", eyebrow: "Accounts receivable", title: "Payment reminder", tag: "Invoice workflow", messages: [
      { speaker: "Woxza", text: "வணக்கம் பிரியா. ₹1,52,000-க்கான விலைப்பட்டியல் 1048 இன்று செலுத்தப்பட வேண்டும். கட்டணத்தை ஏற்பாடு செய்ய உதவவா?" },
      { speaker: "Caller", text: "வெள்ளிக்கிழமை ₹1,00,000 செலுத்துகிறோம்; மீதத்தை அடுத்த செவ்வாய்க்கிழமை செலுத்தலாம்." },
      { speaker: "Woxza", text: "சரி. இரண்டு கட்டண தேதிகளையும் பதிவு செய்து பாதுகாப்பான கட்டண இணைப்புகளை உருவாக்குகிறேன்." },
      { speaker: "Caller", text: "ஆம், தயவுசெய்து உறுதிப்படுத்தலை எங்கள் நிதிக் குழுவுக்கு WhatsApp-ல் அனுப்புங்கள்." },
      { speaker: "Woxza", text: "முடிந்தது. இரண்டு கட்டண தேதிகளும் பதிவு செய்யப்பட்டன; இணைப்புகள் நிதிக் குழுவுக்கு அனுப்பப்பட்டுள்ளன." }
    ], outcomes: ["Payment plan recorded", "Finance team notified"] }
  ],
  us: [
    { ...sharedStyle, id: "clinic", icon: CalendarCheck, completionDuration: 1300, short: "Appointment", eyebrow: "New York care desk", title: "Doctor appointment", tag: "Live calendar", messages: [
      { speaker: "Caller", text: "My daughter has had a fever since this morning, is a pediatrician available in New York today?" },
      { speaker: "Woxza", text: "Doctor Patel can see her at the Midtown clinic at 4:15 PM, would you like me to book it?" },
      { speaker: "Caller", text: "Yes, please send the patient form to my phone too" },
      { speaker: "Woxza", text: "Done, the appointment is confirmed and the form has been sent to your phone" }
    ], outcomes: ["Appointment confirmed", "Patient form sent"] },
    { ...sharedStyle, id: "restaurant", icon: Utensils, completionDuration: 1650, short: "Restaurant", eyebrow: "Dallas guest services", title: "Restaurant reservation", tag: "Menu and tables", messages: [
      { speaker: "Caller", text: "Do you have a vegan main and a patio table in Dallas tonight?" },
      { speaker: "Woxza", text: "Yes, the roasted cauliflower steak is available and I found a patio table at 7:30 PM" },
      { speaker: "Caller", text: "Please reserve it for three, we are celebrating a birthday" },
      { speaker: "Woxza", text: "Your table is reserved, and I also added a birthday note for the host" }
    ], outcomes: ["Table reserved", "Birthday note added"] },
    { ...sharedStyle, id: "distribution", icon: PackageCheck, completionDuration: 2250, short: "Distribution", eyebrow: "Texas order operations", title: "Medical distribution", tag: "Inventory linked", messages: [
      { speaker: "Caller", text: "Our Dallas hospital needs 60 infusion sets by Monday morning, can you check nearby stock?" },
      { speaker: "Woxza", text: "Yes, Fort Worth has 42 sets and Plano has 18, both can reach Dallas by 9 AM Monday" },
      { speaker: "Caller", text: "Please combine them and use our priority contract" },
      { speaker: "Woxza", text: "Done, transfer order VOX 2841 is confirmed, and I will send tracking details after pickup" }
    ], outcomes: ["Transfer order confirmed", "Tracking scheduled"] },
    { ...sharedStyle, id: "payment", icon: CreditCard, completionDuration: 1450, short: "Payments", eyebrow: "Accounts receivable", title: "Payment reminder", tag: "Invoice workflow", messages: [
      { speaker: "Woxza", text: "Hi Maya, invoice 1048 for $1,840 is due today, would you like help arranging payment?" },
      { speaker: "Caller", text: "We can pay $1,000 on Friday and the balance next Tuesday" },
      { speaker: "Woxza", text: "Certainly, I can record both dates and create two secure payment links" },
      { speaker: "Caller", text: "Please do, and send the confirmation to our finance team" },
      { speaker: "Woxza", text: "Done, both payment dates are recorded and the secure links have been sent to your finance team" }
    ], outcomes: ["Payment plan recorded", "Finance team notified"] }
  ]
}

// Live examples intentionally use this fixed multilingual sequence, independent of
// the language selected for the rest of the website.
const market = ref("india")
const scenarios = computed(() => scenarioSets[market.value])

// Each complete pass through the four live examples advances to the next row.
// This remains independent of the website's selected language.
const languagePatterns = [
  ["en", "te", "hi", "ta"],
  ["te", "ta", "en", "hi"],
  ["hi", "en", "te", "ta"],
  ["ta", "hi", "ta", "te"]
]

const liveDialogues = {
  clinic: {
    en: [
      { speaker: "Caller", text: "My daughter has had a fever since morning. Is a paediatrician available in Hyderabad today?" },
      { speaker: "Woxza", text: "Dr Ananya Rao is available at the Jubilee Hills clinic at 4:15 p.m. Shall I book it?" },
      { speaker: "Caller", text: "Yes, please send the patient form on WhatsApp too." },
      { speaker: "Woxza", text: "Done. The appointment is confirmed, and the form has been sent on WhatsApp." }
    ],
    te: [
      { speaker: "Caller", text: "నా కుమార్తెకు ఉదయం నుంచి జ్వరం ఉంది. హైదరాబాద్‌లో ఈ రోజు పిల్లల డాక్టర్ అందుబాటులో ఉన్నారా?" },
      { speaker: "Woxza", text: "డాక్టర్ అనన్య రావు జూబ్లీ హిల్స్ క్లినిక్‌లో సాయంత్రం 4:15కి అందుబాటులో ఉన్నారు. బుక్ చేయాలా?" },
      { speaker: "Caller", text: "అవును, పేషెంట్ ఫారమ్‌ను WhatsApp‌లో కూడా పంపండి." },
      { speaker: "Woxza", text: "అయింది. అపాయింట్‌మెంట్ నిర్ధారించబడింది, ఫారమ్‌ను WhatsApp‌లో పంపాను." }
    ],
    hi: [
      { speaker: "Caller", text: "मेरी बेटी को सुबह से बुखार है। क्या हैदराबाद में आज बच्चों के डॉक्टर उपलब्ध हैं?" },
      { speaker: "Woxza", text: "डॉ. अनन्या राव जुबली हिल्स क्लिनिक में शाम 4:15 बजे उपलब्ध हैं। क्या मैं बुक कर दूँ?" },
      { speaker: "Caller", text: "हाँ, कृपया मरीज़ का फॉर्म WhatsApp पर भी भेज दीजिए।" },
      { speaker: "Woxza", text: "हो गया। अपॉइंटमेंट की पुष्टि हो गई है और फॉर्म WhatsApp पर भेज दिया गया है।" }
    ],
    ta: [
      { speaker: "Caller", text: "என் மகளுக்கு காலை முதல் காய்ச்சல் உள்ளது. இன்று ஹைதராபாத்தில் குழந்தைகள் மருத்துவர் கிடைப்பாரா?" },
      { speaker: "Woxza", text: "டாக்டர் அனன்யா ராவ் ஜூபிலி ஹில்ஸ் கிளினிக்கில் மாலை 4:15க்கு உள்ளார். முன்பதிவு செய்யவா?" },
      { speaker: "Caller", text: "ஆம், நோயாளி படிவத்தையும் WhatsApp-ல் அனுப்புங்கள்." },
      { speaker: "Woxza", text: "முடிந்தது. முன்பதிவு உறுதிசெய்யப்பட்டது; படிவமும் WhatsApp-ல் அனுப்பப்பட்டது." }
    ]
  },
  restaurant: {
    en: [
      { speaker: "Caller", text: "Do you have paneer tikka and a rooftop table at Connaught Place tonight?" },
      { speaker: "Woxza", text: "Yes. Paneer tikka is available, and I found a rooftop table at 7:30 p.m." },
      { speaker: "Caller", text: "Please book it for four. It is my mother's birthday, so we need a cake too." },
      { speaker: "Woxza", text: "Done. Your table is booked, and I have added a birthday-cake request." }
    ],
    te: [
      { speaker: "Caller", text: "ఈ రాత్రి కనాట్ ప్లేస్‌లో పనీర్ టిక్కా, రూఫ్‌టాప్ టేబుల్ దొరుకుతుందా?" },
      { speaker: "Woxza", text: "అవును. పనీర్ టిక్కా అందుబాటులో ఉంది. రాత్రి 7:30కి రూఫ్‌టాప్ టేబుల్ ఉంది." },
      { speaker: "Caller", text: "నలుగురికి బుక్ చేయండి. మా అమ్మ పుట్టినరోజు కోసం కేక్ కూడా కావాలి." },
      { speaker: "Woxza", text: "అయింది. టేబుల్ బుక్ చేశాను, పుట్టినరోజు కేక్ అభ్యర్థనను కూడా జోడించాను." }
    ],
    hi: [
      { speaker: "Caller", text: "क्या आज रात कनॉट प्लेस में पनीर टिक्का और रूफटॉप टेबल मिल सकती है?" },
      { speaker: "Woxza", text: "हाँ। पनीर टिक्का उपलब्ध है और रात 7:30 बजे के लिए रूफटॉप टेबल है।" },
      { speaker: "Caller", text: "चार लोगों के लिए बुक कर दीजिए। मेरी माँ का जन्मदिन है, केक भी चाहिए।" },
      { speaker: "Woxza", text: "हो गया। टेबल बुक हो गई है और जन्मदिन के केक का अनुरोध भी जोड़ दिया गया है।" }
    ],
    ta: [
      { speaker: "Caller", text: "இன்று இரவு கன்னாட் பிளேஸில் பனீர் டிக்காவும் ரூஃப்டாப் டேபிளும் கிடைக்குமா?" },
      { speaker: "Woxza", text: "ஆம். பனீர் டிக்கா உள்ளது; இரவு 7:30க்கு ரூஃப்டாப் டேபிள் கிடைக்கிறது." },
      { speaker: "Caller", text: "நால்வருக்கு முன்பதிவு செய்யுங்கள். என் அம்மாவின் பிறந்தநாள்; கேக்கும் வேண்டும்." },
      { speaker: "Woxza", text: "முடிந்தது. டேபிள் முன்பதிவு செய்யப்பட்டு, பிறந்தநாள் கேக் கோரிக்கையும் சேர்க்கப்பட்டது." }
    ]
  },
  distribution: {
    en: [
      { speaker: "Caller", text: "Our Delhi hospital needs 60 infusion sets by Monday morning. Can you check nearby stock?" },
      { speaker: "Woxza", text: "Yes. Gurugram has 42 sets and Noida has 18; both can arrive by 9 a.m. Monday." },
      { speaker: "Caller", text: "Please combine them and use our priority contract." },
      { speaker: "Woxza", text: "Done. Transfer order VOX 2841 is confirmed, and tracking will be sent after pickup." }
    ],
    te: [
      { speaker: "Caller", text: "మా ఢిల్లీ ఆసుపత్రికి సోమవారం ఉదయం వరకు 60 ఇన్ఫ్యూషన్ సెట్లు కావాలి. దగ్గర్లో స్టాక్ చూడగలరా?" },
      { speaker: "Woxza", text: "అవును. గురుగ్రామ్‌లో 42, నోయిడాలో 18 సెట్లు ఉన్నాయి. రెండూ సోమవారం ఉదయం 9 గంటలకల్లా చేరతాయి." },
      { speaker: "Caller", text: "వాటిని కలిపి మా ప్రాధాన్య ఒప్పందం ద్వారా పంపండి." },
      { speaker: "Woxza", text: "అయింది. ట్రాన్స్‌ఫర్ ఆర్డర్ VOX 2841 నిర్ధారించబడింది; పికప్ తర్వాత ట్రాకింగ్ పంపుతాను." }
    ],
    hi: [
      { speaker: "Caller", text: "दिल्ली के हमारे अस्पताल को सोमवार सुबह तक 60 इन्फ्यूज़न सेट चाहिए। क्या पास का स्टॉक देख सकते हैं?" },
      { speaker: "Woxza", text: "हाँ। गुरुग्राम में 42 और नोएडा में 18 सेट उपलब्ध हैं। दोनों सोमवार सुबह 9 बजे तक पहुँच सकते हैं।" },
      { speaker: "Caller", text: "कृपया इन्हें मिलाकर हमारे प्राथमिकता वाले अनुबंध से भेज दीजिए।" },
      { speaker: "Woxza", text: "हो गया। ट्रांसफर ऑर्डर VOX 2841 की पुष्टि हो गई है। पिकअप के बाद ट्रैकिंग भेज दी जाएगी।" }
    ],
    ta: [
      { speaker: "Caller", text: "எங்கள் டெல்லி மருத்துவமனைக்கு திங்கள்கிழமை காலை 60 இன்ஃப்யூஷன் செட்கள் தேவை. அருகிலுள்ள இருப்பை பார்க்க முடியுமா?" },
      { speaker: "Woxza", text: "ஆம். குருகிராமில் 42, நொய்டாவில் 18 செட்கள் உள்ளன. இரண்டும் திங்கள் காலை 9 மணிக்குள் சேரும்." },
      { speaker: "Caller", text: "அவற்றை ஒன்றாக இணைத்து எங்கள் முன்னுரிமை ஒப்பந்தத்தில் அனுப்புங்கள்." },
      { speaker: "Woxza", text: "முடிந்தது. VOX 2841 பரிமாற்ற ஆணை உறுதிசெய்யப்பட்டது; பிக்கப்புக்குப் பிறகு டிராக்கிங் அனுப்பப்படும்." }
    ]
  },
  payment: {
    en: [
      { speaker: "Woxza", text: "Hi Priya. Invoice 1048 for ₹1,52,000 is due today. Would you like help arranging payment?" },
      { speaker: "Caller", text: "We can pay ₹1,00,000 on Friday and the balance next Tuesday." },
      { speaker: "Woxza", text: "Certainly. I can record both dates and create two secure payment links." },
      { speaker: "Caller", text: "Please do, and send the confirmation to our finance team on WhatsApp." },
      { speaker: "Woxza", text: "Done. Both payment dates are recorded, and the links have been sent to your finance team." }
    ],
    te: [
      { speaker: "Woxza", text: "నమస్తే ప్రియా. ₹1,52,000కు సంబంధించిన ఇన్వాయిస్ 1048 ఈ రోజు చెల్లించాలి. చెల్లింపుకు సహాయం కావాలా?" },
      { speaker: "Caller", text: "శుక్రవారం ₹1,00,000, మిగిలినది వచ్చే మంగళవారం చెల్లిస్తాము." },
      { speaker: "Woxza", text: "సరే. రెండు తేదీలను నమోదు చేసి రెండు సురక్షిత చెల్లింపు లింకులు సృష్టిస్తాను." },
      { speaker: "Caller", text: "అవును, నిర్ధారణను మా ఫైనాన్స్ బృందానికి WhatsApp‌లో పంపండి." },
      { speaker: "Woxza", text: "అయింది. రెండు చెల్లింపు తేదీలు నమోదు చేశాను; లింకులు ఫైనాన్స్ బృందానికి పంపబడ్డాయి." }
    ],
    hi: [
      { speaker: "Woxza", text: "नमस्ते प्रिया। ₹1,52,000 का इनवॉइस 1048 आज देय है। क्या भुगतान की व्यवस्था में मदद चाहिए?" },
      { speaker: "Caller", text: "हम शुक्रवार को ₹1,00,000 और बाकी अगले मंगलवार को दे सकते हैं।" },
      { speaker: "Woxza", text: "ज़रूर। मैं दोनों तारीखें दर्ज करके दो सुरक्षित भुगतान लिंक बना देता हूँ।" },
      { speaker: "Caller", text: "कृपया पुष्टि हमारी वित्त टीम को WhatsApp पर भेज दीजिए।" },
      { speaker: "Woxza", text: "हो गया। दोनों भुगतान तिथियाँ दर्ज हो गई हैं और लिंक आपकी वित्त टीम को भेज दिए गए हैं।" }
    ],
    ta: [
      { speaker: "Woxza", text: "வணக்கம் பிரியா. ₹1,52,000-க்கான விலைப்பட்டியல் 1048 இன்று செலுத்தப்பட வேண்டும். கட்டணத்தை ஏற்பாடு செய்ய உதவவா?" },
      { speaker: "Caller", text: "வெள்ளிக்கிழமை ₹1,00,000 செலுத்துகிறோம்; மீதத்தை அடுத்த செவ்வாய்க்கிழமை செலுத்தலாம்." },
      { speaker: "Woxza", text: "சரி. இரண்டு கட்டண தேதிகளையும் பதிவு செய்து பாதுகாப்பான கட்டண இணைப்புகளை உருவாக்குகிறேன்." },
      { speaker: "Caller", text: "ஆம், உறுதிப்படுத்தலை எங்கள் நிதிக் குழுவுக்கு WhatsApp-ல் அனுப்புங்கள்." },
      { speaker: "Woxza", text: "முடிந்தது. இரண்டு கட்டண தேதிகளும் பதிவு செய்யப்பட்டன; இணைப்புகள் நிதிக் குழுவுக்கு அனுப்பப்பட்டுள்ளன." }
    ]
  }
}

const liveHeadings = {
  clinic: {
    en: { eyebrow: "Hyderabad care desk", title: "Doctor appointment", tag: "Live calendar" },
    te: { eyebrow: "హైదరాబాద్ కేర్ డెస్క్", title: "డాక్టర్ అపాయింట్‌మెంట్", tag: "లైవ్ క్యాలెండర్" },
    hi: { eyebrow: "हैदराबाद केयर डेस्क", title: "डॉक्टर अपॉइंटमेंट", tag: "लाइव कैलेंडर" },
    ta: { eyebrow: "ஹைதராபாத் உதவி மையம்", title: "மருத்துவர் முன்பதிவு", tag: "நேரடி நாட்காட்டி" }
  },
  restaurant: {
    en: { eyebrow: "Delhi guest services", title: "Restaurant reservation", tag: "Menu and tables" },
    te: { eyebrow: "ఢిల్లీ అతిథి సేవలు", title: "రెస్టారెంట్ రిజర్వేషన్", tag: "మెనూ మరియు టేబుల్స్" },
    hi: { eyebrow: "दिल्ली अतिथि सेवाएँ", title: "रेस्तरां आरक्षण", tag: "मेनू और टेबल" },
    ta: { eyebrow: "டெல்லி விருந்தினர் சேவை", title: "உணவக முன்பதிவு", tag: "மெனு மற்றும் மேசைகள்" }
  },
  distribution: {
    en: { eyebrow: "North India operations", title: "Medical distribution", tag: "Inventory linked" },
    te: { eyebrow: "ఉత్తర భారత ఆపరేషన్స్", title: "మెడికల్ పంపిణీ", tag: "ఇన్వెంటరీ అనుసంధానం" },
    hi: { eyebrow: "उत्तर भारत परिचालन", title: "चिकित्सा वितरण", tag: "इन्वेंटरी से जुड़ा" },
    ta: { eyebrow: "வட இந்திய செயல்பாடுகள்", title: "மருத்துவ விநியோகம்", tag: "இருப்புடன் இணைக்கப்பட்டது" }
  },
  payment: {
    en: { eyebrow: "Accounts receivable", title: "Payment reminder", tag: "Invoice workflow" },
    te: { eyebrow: "రాబడుల ఖాతాలు", title: "చెల్లింపు రిమైండర్", tag: "ఇన్వాయిస్ వర్క్‌ఫ్లో" },
    hi: { eyebrow: "प्राप्य खाते", title: "भुगतान अनुस्मारक", tag: "इनवॉइस वर्कफ़्लो" },
    ta: { eyebrow: "பெறவேண்டிய கணக்குகள்", title: "கட்டண நினைவூட்டல்", tag: "விலைப்பட்டியல் பணிப்பாய்வு" }
  }
}

// Everything displayed inside the live card belongs to its conversation language.
// It deliberately does not inherit the language selected for the surrounding page.
const liveUi = {
  en: { caller: "Caller", listening: "Listening", speaking: "Woxza is speaking", duration: "s to complete" },
  te: { caller: "కస్టమర్", listening: "వింటోంది", speaking: "Woxza మాట్లాడుతోంది", duration: " సెకన్లలో పూర్తయింది" },
  hi: { caller: "कॉलर", listening: "सुन रहा है", speaking: "Woxza बोल रहा है", duration: " सेकंड में पूरा हुआ" },
  ta: { caller: "அழைப்பாளர்", listening: "கேட்கிறது", speaking: "Woxza பேசுகிறது", duration: " வினாடிகளில் முடிந்தது" }
}

const liveResults = {
  clinic: {
    en: ["Appointment confirmed", "Appointment confirmed", "Patient form sent"],
    te: ["అపాయింట్‌మెంట్ నిర్ధారించబడింది", "అపాయింట్‌మెంట్ నిర్ధారించబడింది", "పేషెంట్ ఫారమ్ పంపబడింది"],
    hi: ["अपॉइंटमेंट की पुष्टि हुई", "अपॉइंटमेंट की पुष्टि हुई", "मरीज़ का फॉर्म भेज दिया गया"],
    ta: ["முன்பதிவு உறுதிசெய்யப்பட்டது", "முன்பதிவு உறுதிசெய்யப்பட்டது", "நோயாளி படிவம் அனுப்பப்பட்டது"]
  },
  restaurant: {
    en: ["Table booked", "Table booked", "Birthday request added"],
    te: ["టేబుల్ బుక్ అయింది", "టేబుల్ బుక్ అయింది", "పుట్టినరోజు అభ్యర్థన జోడించబడింది"],
    hi: ["टेबल बुक हो गई", "टेबल बुक हो गई", "जन्मदिन का अनुरोध जोड़ा गया"],
    ta: ["மேசை முன்பதிவு செய்யப்பட்டது", "மேசை முன்பதிவு செய்யப்பட்டது", "பிறந்தநாள் கோரிக்கை சேர்க்கப்பட்டது"]
  },
  distribution: {
    en: ["Transfer order confirmed", "Transfer order confirmed", "Tracking scheduled"],
    te: ["బదిలీ ఆర్డర్ నిర్ధారించబడింది", "బదిలీ ఆర్డర్ నిర్ధారించబడింది", "ట్రాకింగ్ షెడ్యూల్ చేయబడింది"],
    hi: ["ट्रांसफर ऑर्डर की पुष्टि हुई", "ट्रांसफर ऑर्डर की पुष्टि हुई", "ट्रैकिंग निर्धारित की गई"],
    ta: ["பரிமாற்ற ஆணை உறுதிசெய்யப்பட்டது", "பரிமாற்ற ஆணை உறுதிசெய்யப்பட்டது", "டிராக்கிங் திட்டமிடப்பட்டது"]
  },
  payment: {
    en: ["Payment plan recorded", "Payment plan recorded", "Finance team notified"],
    te: ["చెల్లింపు ప్రణాళిక నమోదు చేయబడింది", "చెల్లింపు ప్రణాళిక నమోదు చేయబడింది", "ఫైనాన్స్ బృందానికి తెలియజేయబడింది"],
    hi: ["भुगतान योजना दर्ज की गई", "भुगतान योजना दर्ज की गई", "वित्त टीम को सूचित किया गया"],
    ta: ["கட்டணத் திட்டம் பதிவு செய்யப்பட்டது", "கட்டணத் திட்டம் பதிவு செய்யப்பட்டது", "நிதிக் குழுவுக்கு அறிவிக்கப்பட்டது"]
  }
}

const scenarioIndex = ref(0)
const messageCount = ref(1)
const activeLanguage = computed(() => demoLanguage.value || pageLanguage.value)
const languageByCode = computed(() => Object.fromEntries(languages.map((item) => [item.code, item])))
const pageLanguageLabel = computed(() => languageByCode.value[pageLanguage.value]?.nativeLabel || "English")
const activeLanguageLabel = computed(() => demoLanguage.value ? languageByCode.value[demoLanguage.value]?.nativeLabel : pageLanguageLabel.value)
const scenario = computed(() => {
  const source = scenarios.value[scenarioIndex.value]
  const language = activeLanguage.value
  const ui = liveUi[language]
  const result = liveResults[source.id][language]
  return {
    ...source,
    language,
    ui,
    ...liveHeadings[source.id][language],
    outcomes: result.slice(1),
    completionLabel: result[0],
    durationLabel: `${(source.completionDuration / 1000).toFixed(1)}${ui.duration}`,
    messages: liveDialogues[source.id][language].map((message) => ({
      ...message,
      role: message.speaker,
      speaker: message.speaker === "Caller" ? ui.caller : "Woxza"
    }))
  }
})
const visibleMessages = computed(() => scenario.value.messages.slice(0, messageCount.value))
const currentMessage = computed(() => visibleMessages.value[visibleMessages.value.length - 1])
const isWoxzaSpeaking = computed(() => currentMessage.value?.role === "Woxza")
const isComplete = computed(() => messageCount.value === scenario.value.messages.length)
const completionLabel = computed(() => scenario.value.completionLabel)
const transcriptElement = ref(null)
const barHeights = [18, 34, 54, 72, 42, 62, 30, 48, 22]
const statusWaveHeights = [4, 9, 14, 7, 5, 12, 18, 9, 5, 11, 7, 4]

let messageTimer
let scenarioTimer

const restartTimers = () => {
  window.clearInterval(messageTimer)
  window.clearTimeout(scenarioTimer)
  messageCount.value = 1
  messageTimer = window.setInterval(() => {
    if (messageCount.value < scenario.value.messages.length) {
      messageCount.value += 1
      return
    }
    window.clearInterval(messageTimer)
    scenarioTimer = window.setTimeout(() => {
      const nextScenario = (scenarioIndex.value + 1) % scenarios.value.length
      scenarioIndex.value = nextScenario
      restartTimers()
    }, 2800)
  }, 1900)
}

watch(messageCount, async () => {
  await nextTick()
  if (!transcriptElement.value) return
  transcriptElement.value.scrollTo({
    top: transcriptElement.value.scrollHeight,
    behavior: "smooth"
  })
})

const selectScenario = (index) => { scenarioIndex.value = index; restartTimers() }
const setDemoLanguage = (code) => { demoLanguage.value = code; isLanguageMenuOpen.value = false }
const closeLanguageMenu = (event) => {
  if (!languageMenu.value?.contains(event.target)) isLanguageMenuOpen.value = false
}
watch(activeLanguage, () => restartTimers())
onMounted(() => { document.addEventListener("click", closeLanguageMenu); restartTimers() })
onUnmounted(() => { document.removeEventListener("click", closeLanguageMenu); window.clearInterval(messageTimer); window.clearTimeout(scenarioTimer) })
</script>

<style scoped>
.voice-demo { position: absolute; inset: 0; display: grid; place-items: center; color: #11152b; transition: color .35s ease; }
.voice-field { position: absolute; inset: -5% -12% -2% -8%; overflow: hidden; border-radius: 47% 53% 44% 56%; opacity: .92; transition: opacity .35s ease; }
.voice-field::before { content: ""; position: absolute; inset: 7%; border-radius: 48% 52% 44% 56%; background: conic-gradient(from 30deg, rgba(20,38,77,.06), transparent 28%, rgba(20,38,77,.24) 51%, transparent 76%, rgba(20,38,77,.08)); filter: blur(3px); }
.halo { position: absolute; left: 49%; top: 49%; border: 1px solid color-mix(in srgb, var(--scenario) 36%, transparent); border-radius: 50%; transform: translate(-50%, -50%); }
.halo-one { width: 510px; height: 510px; }.halo-two { width: 660px; height: 660px; opacity: .5; }
.voice-orb { position: absolute; left: 49%; top: 49%; width: 560px; height: 560px; display: grid; place-items: center; border-radius: 49% 51% 45% 55%; transform: translate(-50%, -50%); background: radial-gradient(circle at 35% 29%, #fff 0 3%, transparent 9%), radial-gradient(circle at 38% 36%, rgba(20,38,77,.22), transparent 34%), linear-gradient(145deg, rgba(20,38,77,.44), rgba(238,241,245,.9) 52%, rgba(20,38,77,.18) 100%); box-shadow: inset -60px -80px 120px rgba(20,38,77,.18), 0 42px 120px rgba(20,38,77,.3); }
.voice-bars { display: flex; align-items: center; gap: 8px; height: 88px; opacity: .48; }.voice-bars i { width: 6px; border-radius: 8px; background: color-mix(in srgb, var(--scenario) 75%, white); transform: scaleY(.34); }
.voice-field > svg { position: absolute; inset: 25% 0 auto; width: 100%; height: 46%; overflow: visible; }.voice-field path { fill: none; stroke: color-mix(in srgb, var(--scenario) 53%, white); stroke-width: 2; stroke-dasharray: 9 10; opacity: .6; vector-effect: non-scaling-stroke; }
.voice-field.speaking { opacity: 1; filter: saturate(1.18); }.voice-field.speaking .voice-orb { animation: orb 1.7s ease-in-out infinite; }.voice-field.speaking .halo { animation: halo 1.8s ease-out infinite; }.voice-field.speaking .halo-two { animation-delay: .55s; }.voice-field.speaking .voice-bars i { animation: bars .78s ease-in-out infinite alternate; }.voice-field.speaking path { animation: line 2.8s linear infinite; }

.call-card { position: relative; z-index: 4; width: min(550px, 88%); padding: 22px; overflow: hidden; border: 1px solid rgba(255,255,255,.92); border-radius: 28px; background: color-mix(in srgb, var(--scenario-soft) 13%, rgba(255,255,255,.9)); box-shadow: 0 38px 90px color-mix(in srgb, var(--scenario) 19%, rgba(46,54,112,.13)), inset 0 1px 0 rgba(255,255,255,.9); backdrop-filter: blur(28px); transform: translateY(-18px); transition: background .35s ease, border-radius .35s ease, box-shadow .35s ease; }
.call-card::after { content: ""; position: absolute; inset: 0 34px auto; z-index: 2; height: 2px; border-radius: 999px; background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--scenario) 72%, white), transparent); opacity: .72; pointer-events: none; }
.call-card::before { content: ""; position: absolute; inset: 0; z-index: -1; opacity: .34; pointer-events: none; transition: background .35s ease; }
.call-card header { display: flex; align-items: center; justify-content: space-between; padding: 2px 2px 19px; border-bottom: 1px solid #e8ebf4; }
.call-identity { display: flex; align-items: center; gap: 13px; }.scenario-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 14px; color: #fff; background: var(--scenario); box-shadow: 0 10px 22px color-mix(in srgb, var(--scenario) 30%, transparent); }.scenario-icon svg { width:21px; height:21px; stroke-width:1.9; }
.call-identity small { display: block; margin-bottom: 4px; color: #8b93a9; font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }.call-identity h2 { margin: 0; color: #11152b; font-size: 17px; line-height: 1.1; letter-spacing: -.02em; }.scenario-tag { display: inline-flex; margin-top: 6px; padding: 3px 7px; border-radius: 999px; color: var(--scenario); background: color-mix(in srgb, var(--scenario) 9%, white); font-size: 8px; font-weight: 800; }
.call-presence { display: grid; justify-items: end; gap: 8px; flex: 0 0 auto; }
.demo-language { position: relative; z-index: 8; }
.demo-language__trigger { display: inline-flex; align-items: center; gap: 5px; min-height: 27px; padding: 0 9px; border: 1px solid rgba(20,38,77,.11); border-radius: 999px; color: #68738d; background: rgba(255,255,255,.8); font: inherit; font-size: 9px; font-weight: 780; cursor: pointer; }
.demo-language__trigger svg:first-child { width: 12px; height: 12px; color: var(--scenario); stroke-width: 2; }.demo-language__trigger svg:last-child { width: 11px; height: 11px; color: #8a94a9; }
.demo-language__menu { position: absolute; top: calc(100% + 7px); right: 0; width: 178px; padding: 5px; border: 1px solid #e3e8f2; border-radius: 12px; background: #fff; box-shadow: 0 14px 34px rgba(20,38,77,.17); }
.demo-language__menu button { width: 100%; display: grid; grid-template-columns: 14px 1fr; align-items: center; gap: 7px; padding: 8px; border: 0; border-radius: 8px; color: #52607a; background: transparent; font: inherit; font-size: 10px; font-weight: 720; text-align: left; cursor: pointer; }.demo-language__menu button:hover, .demo-language__menu button.selected { color: #14264d; background: #f0f5ff; }.demo-language__menu button svg { width: 13px; height: 13px; color: #2f6bf2; opacity: 0; }.demo-language__menu button.selected svg { opacity: 1; }.demo-language__menu small { color: #8a94a9; font-size: 9px; font-weight: 600; }
.call-status { display: flex; align-items: center; gap: 8px; padding: 8px 11px; border: 1px solid rgba(20,38,77,.07); border-radius: 999px; color: #727c94; background: rgba(255,255,255,.62); font-size: 10px; font-weight: 780; white-space: nowrap; }.call-status i { width: 7px; height: 7px; border-radius: 50%; background: #aab1c5; }.call-status.active { color: var(--scenario); background: color-mix(in srgb, var(--scenario) 6%, white); }.call-status.active i { background: var(--scenario); box-shadow: 0 0 0 6px color-mix(in srgb, var(--scenario) 12%, transparent); animation: signal 1.4s ease-in-out infinite; }
.status-wave { height: 19px; display: flex; align-items: center; gap: 3px; padding-right: 5px; opacity: .22; }
.status-wave i { width: 2px; min-height: 3px; border-radius: 3px; background: var(--scenario); transform: scaleY(.55); transform-origin: center; }
.status-wave.active { opacity: .9; }
.status-wave.active i { animation: status-wave .7s ease-in-out infinite alternate; }
.transcript { height: clamp(255px, 31vh, 294px); padding: 14px 3px 12px 0; display: flex; flex-direction: column; justify-content: flex-start; gap: 8px; overflow-x: hidden; overflow-y: auto; scrollbar-width: none; scroll-behavior: smooth; }
.transcript::-webkit-scrollbar { display: none; }
.message { max-width: 88%; padding: 12px 14px; border-radius: 15px; animation: arrive .35s cubic-bezier(.2,.8,.2,1) both; }.message > span { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; color: #818aa2; font-size: 9px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }.message p { margin: 0; color: #3d4660; font-size: 13px; line-height: 1.45; }
.message.caller { align-self: flex-end; border: 1px solid #e5e8f2; border-bottom-right-radius: 5px; background: rgba(251,252,255,.96); }.message.woxza { align-self: flex-start; border-bottom-left-radius: 5px; background: color-mix(in srgb, var(--scenario) 10%, white); }.message.woxza > span { color: var(--scenario); }.message.current { box-shadow: 0 7px 18px rgba(49,57,116,.07); }
.mini-bars { display: inline-flex; align-items: center; gap: 2px; height: 10px; }.mini-bars i { width: 2px; height: 5px; border-radius: 2px; background: currentColor; }.mini-bars i:nth-child(2) { height: 9px; }.message.current.woxza .mini-bars i { animation: mini .55s ease-in-out infinite alternate; }
.scenario-body { height: clamp(282px, 34vh, 325px); padding: 14px 0 12px; }
.scenario-body > div { height: 100%; }
.scenario-body [class*="line"], .scenario-body [class*="board"], .scenario-body [class*="card"], .scenario-body [class*="ticket"], .scenario-body [class*="result"], .scenario-body [class*="route"], .scenario-body [class*="confirm"], .scenario-body [class*="sheet"], .scenario-body [class*="timeline"], .scenario-body [class*="link"], .stock-query { opacity: .12; transform: translateY(8px); transition: opacity .35s ease, transform .35s ease; }
.scenario-body .revealed { opacity: 1; transform: translateY(0); }

/* Clinic: scheduling interface */
.clinic-flow { display: grid; grid-template-rows: auto 1fr auto auto; gap: 9px; }
.request-line, .approval-line { display: flex; align-items: center; justify-content: space-between; padding: 9px 11px; border-radius: 10px; color: #65708a; background: #f7f9fd; font-size: 9px; }.request-line strong, .approval-line strong { color: #2f3854; font-size: 10px; }
.schedule-board { display: grid; grid-template-columns: 68px 1fr; gap: 12px; padding: 12px; border: 1px solid rgba(37,99,235,.13); border-radius: 13px; background: rgba(234,242,255,.58); }
.calendar-date { display: grid; place-content: center; text-align: center; border-radius: 11px; color: white; background: #2563eb; }.calendar-date b { font-size: 24px; }.calendar-date small { font-size: 7px; text-transform: uppercase; }
.schedule-slots { display: flex; flex-direction: column; justify-content: center; gap: 9px; }.schedule-slots > small { color: #7e899f; font-size: 8px; font-weight: 800; text-transform: uppercase; }.schedule-slots > div { display: flex; gap: 6px; }.schedule-slots span { padding: 7px 8px; border: 1px solid #dce3f2; border-radius: 8px; color: #778198; background: white; font-size: 8px; font-weight: 750; }.schedule-slots .selected { color: white; border-color: #2563eb; background: #2563eb; }
.workflow-confirm { display: flex; align-items: center; gap: 10px; padding: 10px 11px; border-radius: 11px; }.workflow-confirm > i { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 50%; color: white; background: #2563eb; font-style: normal; }.workflow-confirm small, .workflow-confirm strong, .workflow-confirm span { display: block; }.workflow-confirm small { color: #2563eb; font-size: 8px; font-weight: 800; text-transform: uppercase; }.workflow-confirm strong { margin-top: 2px; color: #28324d; font-size: 10px; }.workflow-confirm span { color: #818ba1; font-size: 8px; }.clinic-confirm { background: #edf4ff; }

/* Restaurant: menu card and physical reservation ticket */
.restaurant-flow { display: grid; grid-template-rows: auto 1fr auto auto; gap: 9px; }
.menu-question { padding: 10px 12px; border-left: 3px solid #2563eb; border-radius: 4px 12px 12px 4px; background: #f5f8ff; }.menu-question span, .menu-question strong { display: block; }.menu-question span { color: #7c879e; font-size: 8px; font-weight: 800; text-transform: uppercase; }.menu-question strong { margin-top: 4px; color: #303a56; font-size: 10px; }
.dish-card { display: grid; grid-template-columns: 42px 1fr auto; align-items: center; gap: 11px; padding: 12px; border: 1px solid rgba(37,99,235,.12); border-radius: 17px; background: white; box-shadow: 0 10px 26px rgba(15,23,42,.05); }.dish-icon { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 50%; color: white; background: #2563eb; font-size: 17px; }.dish-card small, .dish-card strong, .dish-card span { display: block; }.dish-card small { color: #8b94a8; font-size: 7px; text-transform: uppercase; }.dish-card strong { margin: 3px 0; color: #202a45; font-size: 12px; }.dish-card > b { color: #0f172a; font-size: 13px; }.available-dot { color: #2563eb; font-size: 8px; font-weight: 750; }
.guest-request { display: flex; justify-content: space-between; padding: 8px 11px; border-radius: 9px; color: #68748c; background: #f7f9fd; font-size: 9px; }.guest-request strong { color: #27314b; }
.reservation-ticket { position: relative; display: grid; grid-template-columns: 1.3fr .7fr .7fr; align-items: center; gap: 9px; padding: 10px 13px; overflow: hidden; border-radius: 10px; color: white; background: #0f172a; }.reservation-ticket::before, .reservation-ticket::after { content: ""; position: absolute; width: 12px; height: 12px; top: 50%; border-radius: 50%; background: white; transform: translateY(-50%); }.reservation-ticket::before { left: -6px; }.reservation-ticket::after { right: -6px; }.reservation-ticket small, .reservation-ticket strong { display: block; }.reservation-ticket small { font-size: 7px; opacity: .65; text-transform: uppercase; }.reservation-ticket strong { margin-top: 3px; font-size: 10px; }.reservation-ticket > span { padding-left: 9px; border-left: 1px dashed rgba(255,255,255,.3); font-size: 8px; }.reservation-ticket > i { display: none; }

/* Distribution: warehouse inventory and fulfillment route */
.distribution-flow { display: grid; grid-template-rows: auto 1fr auto auto; gap: 9px; font-family: var(--font-primary); }
.stock-query { display: grid; grid-template-columns: 1fr auto; align-items: center; padding: 10px 12px; border: 1px solid #dce4f1; border-radius: 7px; background: white; }.stock-query span, .stock-query strong { display: block; }.stock-query span { color: #8791a4; font-size: 7px; text-transform: uppercase; }.stock-query strong { margin-top: 3px; color: #26314b; font-size: 10px; }.stock-query b { grid-column: 2; grid-row: 1 / 3; color: #2563eb; font-size: 16px; }
.warehouse-result { display: grid; grid-template-columns: 1fr 1.4fr auto; align-items: center; gap: 14px; padding: 12px; border-radius: 8px; color: white; background: #0f172a; }.warehouse-result small, .warehouse-result strong, .warehouse-result span { display: block; }.warehouse-result small { font-size: 7px; opacity: .65; text-transform: uppercase; }.warehouse-result strong { display: inline; margin-right: 4px; font-size: 24px; }.warehouse-result span { display: inline; font-size: 8px; opacity: .75; }.warehouse-result > b { font-size: 9px; }.stock-meter { display: flex; align-items: end; gap: 4px; height: 38px; }.stock-meter i { flex: 1; border-radius: 2px 2px 0 0; background: #2563eb; }.stock-meter i:nth-child(1) { height: 35%; }.stock-meter i:nth-child(2) { height: 65%; }.stock-meter i:nth-child(3) { height: 90%; }.stock-meter i:nth-child(4) { height: 70%; }.stock-meter i:nth-child(5) { height: 48%; }
.fulfillment-route { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px dashed #cad7ec; border-radius: 7px; }.fulfillment-route span { display: flex; align-items: center; gap: 5px; color: #536079; font-size: 8px; font-weight: 750; }.fulfillment-route i { display: grid; width: 19px; height: 19px; place-items: center; border-radius: 50%; color: white; background: #2563eb; font-size: 6px; font-style: normal; }.fulfillment-route b { color: #9aa4b6; }
.distribution-confirm { background: #eaf2ff; }

/* Payments: invoice and collection timeline */
.payment-flow { display: grid; grid-template-rows: 1fr auto auto auto; gap: 9px; }
.invoice-sheet { display: flex; align-items: center; justify-content: space-between; padding: 15px 16px; border-top: 4px solid #2563eb; border-radius: 5px 5px 12px 12px; color: #0f172a; background: white; box-shadow: 0 10px 28px rgba(15,23,42,.06); }.invoice-sheet small, .invoice-sheet strong { display: block; }.invoice-sheet small { color: #7f8a9f; font-size: 8px; font-weight: 800; text-transform: uppercase; }.invoice-sheet strong { margin-top: 4px; font-size: 24px; }.invoice-sheet > span { padding: 6px 9px; border-radius: 99px; color: #2563eb; background: #eaf2ff; font-size: 8px; font-weight: 800; }
.payment-call { display: flex; justify-content: space-between; padding: 9px 11px; border-radius: 9px; color: #7d879b; background: #f4f7fc; font-size: 8px; }.payment-call strong { color: #29344f; font-size: 9px; }
.collection-timeline { display: grid; grid-template-columns: auto 1fr auto 1fr auto; align-items: start; gap: 6px; padding: 10px; }.collection-timeline > div { display: grid; justify-items: center; gap: 4px; color: #8b95a9; font-size: 7px; text-align: center; }.collection-timeline > div i { display: grid; width: 22px; height: 22px; place-items: center; border: 1px solid #cdd6e5; border-radius: 50%; font-style: normal; }.collection-timeline > div.done { color: #2563eb; }.collection-timeline > div.done i { color: white; border-color: #2563eb; background: #2563eb; }.collection-timeline > b { height: 1px; margin-top: 11px; background: #cfd8e8; }
.secure-link { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 9px; padding: 9px 10px; border: 1px solid #d8e2f2; border-radius: 9px; background: #f8faff; }.secure-link > span { display: grid; width: 28px; height: 28px; place-items: center; border-radius: 8px; color: white; background: #2563eb; }.secure-link small, .secure-link strong { display: block; }.secure-link small { color: #8b95a8; font-size: 7px; text-transform: uppercase; }.secure-link strong { margin-top: 2px; color: #2e3852; font-size: 8px; }.secure-link > b { color: #2563eb; font-size: 8px; }
.call-card footer { display: flex; align-items: center; justify-content: space-between; padding-top: 15px; border-top: 1px solid #e8ebf4; color: #9aa2b6; }.call-card footer > div { display: flex; flex-wrap: wrap; gap: 7px; }.call-card footer span { padding: 6px 9px; border: 1px solid #e2e6f0; border-radius: 99px; color: #5f6881; background: rgba(255,255,255,.72); font-size: 9px; font-weight: 740; }.call-card footer b { letter-spacing: -3px; }
.scenario-nav { position: absolute; z-index: 6; left: 7%; right: 7%; bottom: 2%; }.progress { display: none; }.scenario-buttons { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }.scenario-buttons button { position: relative; display: flex; align-items: center; gap: 6px; padding: 9px 13px; border: 1px solid rgba(20,38,77,.09); border-radius: 999px; color: #858da4; background: rgba(255,255,255,.76); font-size: 9px; font-weight: 720; cursor: pointer; box-shadow: 0 8px 18px rgba(20,38,77,.04); }.scenario-buttons button:not(:last-child)::after { content: "›"; position: absolute; right: -10px; color: #14264d; font-size: 18px; font-weight: 500; }.scenario-buttons button.active { color: #fff; border-color: #14264d; background: #14264d; box-shadow: 0 10px 24px rgba(20,38,77,.25); }.scenario-buttons b { display:grid; place-items:center; }.scenario-buttons b svg { width:13px; height:13px; stroke-width:1.9; }

/* Every call type has its own visual system, not just a new accent color. */
.scenario-clinic .call-card::before { background-image: linear-gradient(90deg, transparent 94%, color-mix(in srgb, var(--scenario) 9%, transparent) 94%), linear-gradient(transparent 94%, color-mix(in srgb, var(--scenario) 9%, transparent) 94%); background-size: 28px 28px; }
.scenario-clinic .scenario-detail > span { border-radius: 8px; box-shadow: inset 0 8px 0 rgba(255,255,255,.16); }

.scenario-restaurant .call-card { border-radius: 34px 34px 22px 22px; background: color-mix(in srgb, var(--scenario-soft) 38%, rgba(255,255,255,.84)); }
.scenario-restaurant .call-card::before { background: radial-gradient(circle at 10px 100%, transparent 9px, rgba(255,255,255,.32) 10px) 0 100% / 20px 20px repeat-x; }
.scenario-restaurant .message { border-radius: 20px 20px 20px 7px; }.scenario-restaurant .message.caller { border-radius: 20px 20px 7px 20px; }.scenario-restaurant .scenario-detail { border-style: dashed; }

.scenario-distribution .call-card { border-radius: 18px; border-color: color-mix(in srgb, var(--scenario) 24%, white); }
.scenario-distribution .call-card::before { background-image: linear-gradient(color-mix(in srgb, var(--scenario) 8%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--scenario) 8%, transparent) 1px, transparent 1px); background-size: 24px 24px; }
.scenario-distribution .message { border-radius: 9px; border-left: 3px solid color-mix(in srgb, var(--scenario) 60%, white); }.scenario-distribution .scenario-detail { border-radius: 8px; }

.scenario-payment .call-card { border-radius: 24px 24px 8px 8px; border-top: 4px solid var(--scenario); }
.scenario-payment .call-card::before { background: linear-gradient(90deg, transparent 0 73%, color-mix(in srgb, var(--scenario) 7%, transparent) 73% 100%); }
.scenario-payment .message.woxza { border-left: 3px solid var(--scenario); border-radius: 5px 16px 16px 5px; }.scenario-payment .message.caller { border-radius: 16px 5px 5px 16px; }.scenario-payment .scenario-detail > span { border-radius: 50%; }

@keyframes orb { 0%,100% { transform: translate(-50%,-50%) scale(1); border-radius: 49% 51% 45% 55%; } 50% { transform: translate(-50%,-50%) scale(1.035); border-radius: 54% 46% 55% 45%; } }
@keyframes halo { 0% { transform: translate(-50%,-50%) scale(.9); opacity: .85; } 100% { transform: translate(-50%,-50%) scale(1.13); opacity: 0; } }
@keyframes bars { from { transform: scaleY(.35); } to { transform: scaleY(1); } }
@keyframes status-wave { from { transform: scaleY(.38); } to { transform: scaleY(1); } }
@keyframes line { to { stroke-dashoffset: -76; } } @keyframes arrive { from { opacity: 0; transform: translateY(9px) scale(.98); } } @keyframes mini { to { transform: scaleY(1.6); } } @keyframes signal { 50% { opacity: .45; transform: scale(.82); } }

@media (max-width: 1120px) { .call-card { width: min(490px, 90%); }.scenario-buttons button span { display: none; } }
@media (max-height: 820px) and (min-width: 861px) {
  .call-card { width: min(500px, 88%); padding: 17px 18px; transform: translateY(-8px); }
  .call-card header { padding-bottom: 10px; }
  .call-presence { gap: 4px; }
  .status-wave { height: 14px; }
  .transcript { height: clamp(220px, 31vh, 248px); padding: 11px 3px 9px 0; gap: 7px; }
  .message { padding: 9px 12px; }
  .message > span { margin-bottom: 3px; }
  .message p { font-size: 12px; line-height: 1.38; }
  .call-card footer { padding-top: 11px; }
  .scenario-nav { bottom: 0; }
  .scenario-buttons button { padding: 8px 11px; }
}
@media (max-width: 540px) {
  .voice-field { inset: 0 -12%; }.voice-orb { width: 335px; height: 335px; }.halo-one { width: 400px; height: 400px; }.halo-two { width: 500px; height: 500px; }
  .call-card { width: calc(100% - 28px); padding: 17px; border-radius: 23px; transform: translateY(-12px); }.call-card header { align-items: flex-start; }.call-status { max-width: 92px; text-align: right; }.status-wave { display: none; }.transcript { height: 320px; }.message { max-width: 94%; }.message p { font-size: 12px; }
  .scenario-nav { bottom: 0; }.scenario-buttons { gap: 9px; }.scenario-buttons button { width: 36px; height: 36px; justify-content: center; padding: 0; border-radius: 50%; }
}

@media (prefers-reduced-motion: reduce) { .voice-demo *, .voice-demo *::before, .voice-demo *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; } }
</style>
