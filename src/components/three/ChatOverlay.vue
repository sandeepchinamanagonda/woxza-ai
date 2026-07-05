<template>
  <div class="voice-demo" :class="`scenario-${scenario.id}`" :style="{ '--scenario': scenario.color, '--scenario-soft': scenario.soft }">
    <div class="voice-field" :class="{ speaking: isVoxaSpeaking }" aria-hidden="true">
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

    <article class="call-card">
      <header>
        <div class="call-identity">
          <span class="scenario-icon">{{ scenario.icon }}</span>
          <div><small>{{ scenario.eyebrow }}</small><h2>{{ scenario.title }}</h2><span class="scenario-tag">{{ scenario.tag }}</span></div>
        </div>
        <span class="call-status" :class="{ active: isVoxaSpeaking }"><i />{{ isVoxaSpeaking ? 'Voxa is speaking' : 'Listening' }}</span>
      </header>

      <div class="transcript">
        <div
          v-for="(message, index) in visibleMessages"
          :key="`${scenario.id}-${index}`"
          class="message"
          :class="[message.speaker.toLowerCase(), { current: index === visibleMessages.length - 1 }]"
        >
          <span><b v-if="message.speaker === 'Voxa'" class="mini-bars"><i /><i /><i /></b>{{ message.speaker }}</span>
          <p>{{ message.text }}</p>
        </div>
      </div>

      <footer>
        <div><span v-for="outcome in scenario.outcomes" :key="outcome">✓ {{ outcome }}</span></div>
        <b>◖◗</b>
      </footer>
    </article>

    <div class="scenario-nav">
      <div class="progress"><i :style="{ width: `${((scenarioIndex + 1) / scenarios.length) * 100}%` }" /></div>
      <div class="scenario-buttons">
        <button v-for="(item, index) in scenarios" :key="item.id" :class="{ active: index === scenarioIndex }" @click="selectScenario(index)">
          <b>{{ item.icon }}</b><span>{{ item.short }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue"

const sharedStyle = { color: "#14264d", soft: "#eef1f5" }

const scenarioSets = {
  india: [
    { ...sharedStyle, id: "clinic", icon: "▣", short: "Appointment", eyebrow: "Hyderabad care desk", title: "Doctor appointment", tag: "Live calendar", messages: [
      { speaker: "Caller", text: "Namaste. My daughter has had a fever since morning. Is a paediatrician available in Hyderabad today?" },
      { speaker: "Voxa", text: "Dr. Ananya Rao can see her at the Jubilee Hills clinic at 4:15 PM. Shall I book it?" },
      { speaker: "Caller", text: "Yes, please. Send the patient form to me on WhatsApp too." },
      { speaker: "Voxa", text: "Done. The appointment is confirmed and the form is on your WhatsApp." }
    ], outcomes: ["Visit confirmed", "WhatsApp sent"] },
    { ...sharedStyle, id: "restaurant", icon: "♨", short: "Restaurant", eyebrow: "Delhi guest services", title: "Restaurant reservation", tag: "Menu and tables", messages: [
      { speaker: "Caller", text: "Do you have paneer tikka and a rooftop table at Connaught Place tonight?" },
      { speaker: "Voxa", text: "Yes, paneer tikka is available and I found a rooftop table at 7:30 PM." },
      { speaker: "Caller", text: "Please book it for four. We are celebrating my mother’s birthday." },
      { speaker: "Voxa", text: "Your table is booked. I also asked the restaurant to arrange a small birthday cake." }
    ], outcomes: ["Menu checked", "Table booked"] },
    { ...sharedStyle, id: "distribution", icon: "◇", short: "Distribution", eyebrow: "North India operations", title: "Medical distribution", tag: "Inventory linked", messages: [
      { speaker: "Caller", text: "Our Delhi hospital needs 60 infusion sets by Monday morning. Can you check nearby stock?" },
      { speaker: "Voxa", text: "Yes. Gurugram has 42 sets and Noida has 18. Both can reach the hospital by 9 AM Monday." },
      { speaker: "Caller", text: "Please combine them and use our priority contract." },
      { speaker: "Voxa", text: "Done. Transfer order VOX 2841 is confirmed. I will WhatsApp the tracking details after pickup." }
    ], outcomes: ["Two depots allocated", "Priority order raised"] },
    { ...sharedStyle, id: "payment", icon: "↗", short: "Payments", eyebrow: "Accounts receivable", title: "Payment reminder", tag: "Invoice workflow", messages: [
      { speaker: "Voxa", text: "Hi Priya. Invoice 1048 for ₹1,52,000 is due today. Would you like help arranging payment?" },
      { speaker: "Caller", text: "We can pay ₹1,00,000 on Friday and the balance next Tuesday." },
      { speaker: "Voxa", text: "Certainly. I can record both dates and create two secure payment links." },
      { speaker: "Caller", text: "Please do, and send the confirmation to our finance team on WhatsApp." }
    ], outcomes: ["Payment plan recorded", "Finance notified"] }
  ],
  us: [
    { ...sharedStyle, id: "clinic", icon: "▣", short: "Appointment", eyebrow: "New York care desk", title: "Doctor appointment", tag: "Live calendar", messages: [
      { speaker: "Caller", text: "My daughter has had a fever since this morning. Is a pediatrician available in New York today?" },
      { speaker: "Voxa", text: "Dr. Patel can see her at the Midtown clinic at 4:15 PM. Would you like me to book it?" },
      { speaker: "Caller", text: "Yes, please. Send the patient form to my phone too." },
      { speaker: "Voxa", text: "Done. The appointment is confirmed and the form has been sent to your phone." }
    ], outcomes: ["Visit confirmed", "Patient form sent"] },
    { ...sharedStyle, id: "restaurant", icon: "♨", short: "Restaurant", eyebrow: "Dallas guest services", title: "Restaurant reservation", tag: "Menu and tables", messages: [
      { speaker: "Caller", text: "Do you have a vegan main and a patio table in Dallas tonight?" },
      { speaker: "Voxa", text: "Yes. The roasted cauliflower steak is available and I found a patio table at 7:30 PM." },
      { speaker: "Caller", text: "Please reserve it for three. We are celebrating a birthday." },
      { speaker: "Voxa", text: "Your table is reserved. I also added a birthday note for the host." }
    ], outcomes: ["Menu checked", "Table reserved"] },
    { ...sharedStyle, id: "distribution", icon: "◇", short: "Distribution", eyebrow: "Texas order operations", title: "Medical distribution", tag: "Inventory linked", messages: [
      { speaker: "Caller", text: "Our Dallas hospital needs 60 infusion sets by Monday morning. Can you check nearby stock?" },
      { speaker: "Voxa", text: "Yes. Fort Worth has 42 sets and Plano has 18. Both can reach Dallas by 9 AM Monday." },
      { speaker: "Caller", text: "Please combine them and use our priority contract." },
      { speaker: "Voxa", text: "Done. Transfer order VOX 2841 is confirmed. I will send tracking details after pickup." }
    ], outcomes: ["Two depots allocated", "Priority order raised"] },
    { ...sharedStyle, id: "payment", icon: "↗", short: "Payments", eyebrow: "Accounts receivable", title: "Payment reminder", tag: "Invoice workflow", messages: [
      { speaker: "Voxa", text: "Hi Maya. Invoice 1048 for $1,840 is due today. Would you like help arranging payment?" },
      { speaker: "Caller", text: "We can pay $1,000 on Friday and the balance next Tuesday." },
      { speaker: "Voxa", text: "Certainly. I can record both dates and create two secure payment links." },
      { speaker: "Caller", text: "Please do, and send the confirmation to our finance team." }
    ], outcomes: ["Payment plan recorded", "Finance notified"] }
  ]
}

const market = ref("us")
const scenarios = computed(() => scenarioSets[market.value])

const scenarioIndex = ref(0)
const messageCount = ref(1)
const scenario = computed(() => scenarios.value[scenarioIndex.value])
const visibleMessages = computed(() => scenario.value.messages.slice(0, messageCount.value))
const currentMessage = computed(() => visibleMessages.value[visibleMessages.value.length - 1])
const isVoxaSpeaking = computed(() => currentMessage.value?.speaker === "Voxa")
const barHeights = [18, 34, 54, 72, 42, 62, 30, 48, 22]

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
      scenarioIndex.value = (scenarioIndex.value + 1) % scenarios.value.length
      restartTimers()
    }, 850)
  }, 1900)
}

const selectScenario = (index) => { scenarioIndex.value = index; restartTimers() }
const detectMarket = () => {
  const locale = navigator.language || ""
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""
  market.value = /(^|-)IN$/i.test(locale) || /^Asia\/(Kolkata|Calcutta)$/i.test(timeZone) ? "india" : "us"
}

onMounted(() => { detectMarket(); restartTimers() })
onUnmounted(() => { window.clearInterval(messageTimer); window.clearTimeout(scenarioTimer) })
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

.call-card { position: relative; z-index: 4; width: min(520px, 84%); padding: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,.84); border-radius: 26px; background: color-mix(in srgb, var(--scenario-soft) 18%, rgba(255,255,255,.82)); box-shadow: 0 30px 76px color-mix(in srgb, var(--scenario) 17%, rgba(46,54,112,.12)); backdrop-filter: blur(24px); transform: translateY(-18px); transition: background .35s ease, border-radius .35s ease, box-shadow .35s ease; }
.call-card::before { content: ""; position: absolute; inset: 0; z-index: -1; opacity: .34; pointer-events: none; transition: background .35s ease; }
.call-card header { display: flex; align-items: center; justify-content: space-between; padding: 2px 2px 19px; border-bottom: 1px solid #e8ebf4; }
.call-identity { display: flex; align-items: center; gap: 13px; }.scenario-icon { display: grid; width: 44px; height: 44px; place-items: center; border-radius: 14px; color: #fff; background: var(--scenario); font-size: 20px; box-shadow: 0 10px 22px color-mix(in srgb, var(--scenario) 30%, transparent); }
.call-identity small { display: block; margin-bottom: 4px; color: #8b93a9; font-size: 9px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }.call-identity h2 { margin: 0; color: #11152b; font-size: 17px; line-height: 1.1; letter-spacing: -.02em; }.scenario-tag { display: inline-flex; margin-top: 6px; padding: 3px 7px; border-radius: 999px; color: var(--scenario); background: color-mix(in srgb, var(--scenario) 9%, white); font-size: 8px; font-weight: 800; }
.call-status { display: flex; align-items: center; gap: 7px; color: #858da3; font-size: 10px; font-weight: 750; }.call-status i { width: 7px; height: 7px; border-radius: 50%; background: #aab1c5; }.call-status.active { color: var(--scenario); }.call-status.active i { background: var(--scenario); box-shadow: 0 0 0 6px color-mix(in srgb, var(--scenario) 12%, transparent); animation: signal 1.4s ease-in-out infinite; }
.transcript { height: clamp(282px, 34vh, 325px); padding: 14px 0 12px; display: flex; flex-direction: column; justify-content: flex-start; gap: 8px; overflow: hidden; }
.message { max-width: 88%; padding: 12px 14px; border-radius: 15px; animation: arrive .35s cubic-bezier(.2,.8,.2,1) both; }.message > span { display: flex; align-items: center; gap: 6px; margin-bottom: 5px; color: #818aa2; font-size: 9px; font-weight: 850; letter-spacing: .1em; text-transform: uppercase; }.message p { margin: 0; color: #3d4660; font-size: 13px; line-height: 1.45; }
.message.caller { align-self: flex-end; border: 1px solid #e5e8f2; border-bottom-right-radius: 5px; background: rgba(251,252,255,.96); }.message.voxa { align-self: flex-start; border-bottom-left-radius: 5px; background: color-mix(in srgb, var(--scenario) 10%, white); }.message.voxa > span { color: var(--scenario); }.message.current { box-shadow: 0 7px 18px rgba(49,57,116,.07); }
.mini-bars { display: inline-flex; align-items: center; gap: 2px; height: 10px; }.mini-bars i { width: 2px; height: 5px; border-radius: 2px; background: currentColor; }.mini-bars i:nth-child(2) { height: 9px; }.message.current.voxa .mini-bars i { animation: mini .55s ease-in-out infinite alternate; }
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
.distribution-flow { display: grid; grid-template-rows: auto 1fr auto auto; gap: 9px; font-family: "IBM Plex Sans", sans-serif; }
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
.scenario-nav { position: absolute; z-index: 6; left: 7%; right: 7%; bottom: 2%; }.progress { display: none; }.scenario-buttons { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; }.scenario-buttons button { position: relative; display: flex; align-items: center; gap: 6px; padding: 9px 13px; border: 1px solid rgba(20,38,77,.09); border-radius: 999px; color: #858da4; background: rgba(255,255,255,.76); font-size: 9px; font-weight: 720; cursor: pointer; box-shadow: 0 8px 18px rgba(20,38,77,.04); }.scenario-buttons button:not(:last-child)::after { content: "›"; position: absolute; right: -10px; color: #14264d; font-size: 18px; font-weight: 500; }.scenario-buttons button.active { color: #fff; border-color: #14264d; background: #14264d; box-shadow: 0 10px 24px rgba(20,38,77,.25); }.scenario-buttons b { font-size: 12px; }

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
.scenario-payment .message.voxa { border-left: 3px solid var(--scenario); border-radius: 5px 16px 16px 5px; }.scenario-payment .message.caller { border-radius: 16px 5px 5px 16px; }.scenario-payment .scenario-detail > span { border-radius: 50%; }

@keyframes orb { 0%,100% { transform: translate(-50%,-50%) scale(1); border-radius: 49% 51% 45% 55%; } 50% { transform: translate(-50%,-50%) scale(1.035); border-radius: 54% 46% 55% 45%; } }
@keyframes halo { 0% { transform: translate(-50%,-50%) scale(.9); opacity: .85; } 100% { transform: translate(-50%,-50%) scale(1.13); opacity: 0; } }
@keyframes bars { from { transform: scaleY(.35); } to { transform: scaleY(1); } }
@keyframes line { to { stroke-dashoffset: -76; } } @keyframes arrive { from { opacity: 0; transform: translateY(9px) scale(.98); } } @keyframes mini { to { transform: scaleY(1.6); } } @keyframes signal { 50% { opacity: .45; transform: scale(.82); } }

@media (max-width: 1120px) { .call-card { width: min(490px, 90%); }.scenario-buttons button span { display: none; } }
@media (max-height: 820px) and (min-width: 861px) {
  .call-card { width: min(500px, 88%); padding: 17px 18px; transform: translateY(-8px); }
  .call-card header { padding-bottom: 13px; }
  .transcript { height: clamp(238px, 36vh, 276px); padding: 11px 0 9px; gap: 7px; }
  .message { padding: 9px 12px; }
  .message > span { margin-bottom: 3px; }
  .message p { font-size: 12px; line-height: 1.38; }
  .call-card footer { padding-top: 11px; }
  .scenario-nav { bottom: 0; }
  .scenario-buttons button { padding: 8px 11px; }
}
@media (max-width: 540px) {
  .voice-field { inset: 0 -12%; }.voice-orb { width: 335px; height: 335px; }.halo-one { width: 400px; height: 400px; }.halo-two { width: 500px; height: 500px; }
  .call-card { width: calc(100% - 28px); padding: 17px; border-radius: 23px; transform: translateY(-12px); }.call-card header { align-items: flex-start; }.call-status { max-width: 72px; text-align: right; }.transcript { height: 320px; }.message { max-width: 94%; }.message p { font-size: 12px; }
  .scenario-nav { bottom: 0; }.scenario-buttons { gap: 9px; }.scenario-buttons button { width: 36px; height: 36px; justify-content: center; padding: 0; border-radius: 50%; }
}

@media (prefers-reduced-motion: reduce) { .voice-demo *, .voice-demo *::before, .voice-demo *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; } }
</style>
