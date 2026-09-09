// The opening permission flow is backend-owned. It deliberately returns
// named actions only; wording and TTS delivery remain separate so a language
// model can never accidentally skip consent or continue after a decline.
const text = value => String(value || "").trim()

export const OPENING_PERMISSION_STATES = Object.freeze({
  AWAITING_FIRST_REPLY:"awaiting_first_reply",
  PERMISSION_PENDING:"permission_pending",
  REASSURANCE_PENDING:"reassurance_pending",
  GRANTED:"granted",
  DECLINED:"declined"
})

// These recognise only high-confidence answers. The later embedding route
// shadows unfamiliar or code-mixed wording; it must not turn uncertainty into
// permission until calibrated and explicitly activated.
const affirmative = /(?:^|\s)(?:yes|yeah|yep|sure|okay|ok|go ahead|tell me|i have (?:two minutes|a couple of minutes|time)|i(?:'m| am) free|you have (?:two minutes|a couple of minutes)|అవును|అవునా|చెప్పండి|సరే|హా|నాకు రెండు నిమిషాలు సమయం ఉంది|సమయం ఉంది|వినగలను|हाँ|हां|जी हाँ|मेरे पास दो मिनट हैं|समय है|बताइए|ஆம்|சரி|எனக்கு இரண்டு நிமிடம் இருக்கிறது|சொல்லுங்கள்|ಹೌದು|ಸರಿ|ನನಗೆ ಎರಡು ನಿಮಿಷ ಸಮಯ ಇದೆ|ಹೇಳಿ|അതെ|ശരി|എനിക്ക് രണ്ട് മിനിറ്റ് സമയമുണ്ട്|പറയൂ|હા|બરાબર|મારી પાસે બે મિનિટ છે|હા જી|হ্যাঁ|ঠিক আছে|আমার দুই মিনিট সময় আছে|জি|ਹਾਂ|ਹਾਂ ਜੀ|ਠੀਕ ਹੈ|ਮੇਰੇ ਕੋਲ ਦੋ ਮਿੰਟ ਹਨ|جی ہاں|ہاں|ٹھیک ہے|میرے پاس دو منٹ ہیں)(?:\s|[!?.]|$)/iu
const decline = /(?:^|\s)(?:no|nope|not now|no thanks|not interested|busy|call later|later|don't|do not|వద్దు|అక్కర్లేదు|ఇప్పుడు కాదు|బిజీగా|బిజీ|తర్వాత|లేదు|नहीं|नही|अभी नहीं|बाद में|व्यस्त|வேண்டாம்|இப்போது வேண்டாம்|பிறகு|பிஸி|ಬೇಡ|ಈಗ ಬೇಡ|ನಂತರ|ಬಿಸಿ|ವ್ಯಸ್ತ|വേണ്ട|ഇപ്പോൾ വേണ്ട|പിന്നീട്|തിരക്കാണ്|નહીં|હમણાં નહીં|પછી|વ્યસ્ત|না|এখন না|পরে|ব্যস্ত|না|ਨਹੀਂ|ਬਾਅਦ ਵਿੱਚ|ਵਿਅਸਤ|نہیں|ابھی نہیں|بعد میں|مصروف)(?:\s|$)/iu
const uncertain = /(?:^|\s)(?:maybe|may be|may not|not sure|i don't know|dont know|perhaps|might be|we'll see|we will see|చూద్దాం|ఏమో|తెలియదు|బహుశా|शायद|पता नहीं|देखते हैं|ஒருவேளை|தெரியவில்லை|பார்ப்போம்|ಬಹುಶಃ|ಗೊತ್ತಿಲ್ಲ|ನೋಡೋಣ|ഒരുപക്ഷേ|അറിയില്ല|നോക്കാം|કદાચ|ખબર નથી|જોઈશું|হয়তো|জানি না|দেখি|ਸ਼ਾਇਦ|ਪਤਾ ਨਹੀਂ|ਦੇਖਾਂਗੇ|شاید|پتہ نہیں|دیکھتے ہیں)(?:\s|$)/iu

export const classifyOpeningPermissionReply = callerText => {
  const source = text(callerText)
  if (!source) return { decision:"uncertain", reason:"empty" }
  if (decline.test(source)) return { decision:"declined", reason:"clear_decline" }
  if (affirmative.test(source)) return { decision:"granted", reason:"clear_affirmative" }
  if (uncertain.test(source)) return { decision:"uncertain", reason:"clear_uncertainty" }
  return { decision:"unrecognized", reason:"needs_semantic_review" }
}

export function createOpeningPermissionController({ initialState=OPENING_PERMISSION_STATES.AWAITING_FIRST_REPLY }={}) {
  let state = initialState
  const transition = (action, nextState, reason) => {
    state = nextState
    return { action, state, reason }
  }
  return {
    state:() => state,
    restore(nextState) {
      if (!Object.values(OPENING_PERMISSION_STATES).includes(nextState)) throw new Error("Invalid opening permission state")
      state = nextState
    },
    handle(callerText) {
      const classified = classifyOpeningPermissionReply(callerText)
      if (state === OPENING_PERMISSION_STATES.AWAITING_FIRST_REPLY) {
        if (classified.decision === "declined") return transition("close_declined", OPENING_PERMISSION_STATES.DECLINED, classified.reason)
        return transition("ask_permission", OPENING_PERMISSION_STATES.PERMISSION_PENDING, "first_caller_reply")
      }
      if (state === OPENING_PERMISSION_STATES.PERMISSION_PENDING) {
        if (classified.decision === "granted") return transition("grant_permission", OPENING_PERMISSION_STATES.GRANTED, classified.reason)
        if (classified.decision === "declined") return transition("close_declined", OPENING_PERMISSION_STATES.DECLINED, classified.reason)
        // A recognised uncertainty gets one reassurance. Unrecognised wording
        // currently follows the same safe path while its embedding decision is
        // observed in shadow mode; it never becomes a grant by inference.
        return transition("reassure_permission", OPENING_PERMISSION_STATES.REASSURANCE_PENDING, classified.reason)
      }
      if (state === OPENING_PERMISSION_STATES.REASSURANCE_PENDING) {
        if (classified.decision === "granted") return transition("grant_permission", OPENING_PERMISSION_STATES.GRANTED, classified.reason)
        return transition("close_after_reassurance", OPENING_PERMISSION_STATES.DECLINED, classified.reason)
      }
      return { action:"no_action", state, reason:"terminal_opening_state" }
    },
    // Semantic routing is permitted to resolve only language the deterministic
    // controller did not understand. Clear consent, refusal, and uncertainty
    // always remain deterministic control-plane decisions.
    handleHighConfidenceSemanticAction(callerText, action) {
      const classified = classifyOpeningPermissionReply(callerText)
      if (classified.decision !== "unrecognized") return this.handle(callerText)
      const transitions = {
        [OPENING_PERMISSION_STATES.AWAITING_FIRST_REPLY]: {
          ask_permission:["ask_permission", OPENING_PERMISSION_STATES.PERMISSION_PENDING],
          close_declined:["close_declined", OPENING_PERMISSION_STATES.DECLINED]
        },
        [OPENING_PERMISSION_STATES.PERMISSION_PENDING]: {
          grant_permission:["grant_permission", OPENING_PERMISSION_STATES.GRANTED],
          close_declined:["close_declined", OPENING_PERMISSION_STATES.DECLINED],
          reassure_permission:["reassure_permission", OPENING_PERMISSION_STATES.REASSURANCE_PENDING]
        },
        [OPENING_PERMISSION_STATES.REASSURANCE_PENDING]: {
          grant_permission:["grant_permission", OPENING_PERMISSION_STATES.GRANTED],
          close_declined:["close_after_reassurance", OPENING_PERMISSION_STATES.DECLINED]
        }
      }
      const selected = transitions[state]?.[action]
      if (!selected) return this.handle(callerText)
      return transition(selected[0], selected[1], "high_confidence_semantic_action")
    }
  }
}
