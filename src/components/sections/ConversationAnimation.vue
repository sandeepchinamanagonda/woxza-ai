<template>
  <section class="voice-experience" :class="{ embedded }" aria-labelledby="voice-experience-title">
    <header class="section-heading">
      <span>VOXA IN CONVERSATION</span>
      <h2 id="voice-experience-title">One call. Every language.<br />Work completed instantly.</h2>
      <p>Watch Voxa listen, understand, respond and take action while the customer is still on the line.</p>
    </header>

    <div class="call-console">
      <div class="console-glow"></div>

      <header class="console-bar">
        <div class="live-status"><i></i><strong>LIVE CALL</strong><span>Secure connection</span></div>
        <nav class="language-tabs" aria-label="Conversation languages">
          <button
            v-for="(item,index) in conversations"
            :key="item.code"
            type="button"
            :class="{ active:index === conversationIndex }"
            @click="selectConversation(index)"
          ><span :lang="item.code">{{ item.short }}</span></button>
        </nav>
        <div class="call-time"><PhoneCall /> <span>{{ formattedTime }}</span></div>
      </header>

      <div class="call-layout">
        <aside class="caller-panel" :class="{ speaking: phase === 'caller' }">
          <div class="portrait-wrap">
            <span class="portrait-ring"></span>
            <div class="portrait">
              <svg viewBox="0 0 120 120" fill="none" aria-hidden="true">
                <path d="M60 19c-21 0-35 15.5-35 37 0 15.5 6.8 24.9 15.8 31.8V102h38.4V87.8C88.2 80.9 95 71.5 95 56c0-21.5-14-37-35-37Z" fill="#DCEAFF"/>
                <path d="M39 53c4-12.5 12-19 23.5-19 10.6 0 18.4 5.2 23.5 15" stroke="#8DB8F2" stroke-width="3" stroke-linecap="round"/>
                <circle cx="48" cy="58" r="3" fill="#143D77"/><circle cx="73" cy="58" r="3" fill="#143D77"/>
                <path d="M60 61v10l5 2" stroke="#5E8FCF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                <path class="portrait-mouth" d="M50 81c6 4 13 4 20 0" stroke="#1E5AA8" stroke-width="3" stroke-linecap="round"/>
              </svg>
              <span class="speech-rays" aria-hidden="true"><i></i><i></i><i></i></span>
            </div>
          </div>
          <div><span>CALLER</span><strong>Customer</strong><small>{{ phase === 'caller' ? 'Speaking now' : 'On the line' }}</small></div>
          <div class="caller-wave" aria-hidden="true"><i v-for="n in 13" :key="n" :style="{ '--n':n }"></i></div>
        </aside>

        <main class="conversation-panel" aria-live="polite">
          <div class="conversation-status">
            <span :lang="currentConversation.code">{{ currentConversation.language }}</span>
            <div><i :class="phase"></i>{{ phaseLabel }}</div>
          </div>

          <Transition name="conversation-swap" mode="out-in">
            <div :key="`${currentConversation.code}-${phase}`" class="conversation-content">
              <article class="utterance caller-utterance" :class="{ subdued: phase !== 'caller' }">
                <span>CALLER</span>
                <p :lang="currentConversation.code">{{ currentConversation.question }}</p>
                <small>{{ currentConversation.questionTranslation }}</small>
              </article>

              <div v-if="phase === 'understanding'" class="understanding-state">
                <div class="ai-thinking"><i></i><i></i><i></i></div>
                <span><strong>Understanding intent</strong><small>Checking context and connected systems</small></span>
              </div>

              <article v-if="phase === 'responding' || phase === 'completed'" class="utterance voxa-utterance">
                <div class="voxa-label"><span class="voxa-mark"><AudioLines /></span><span>VOXA AI</span><i v-if="phase === 'responding'">Responding</i></div>
                <p :lang="currentConversation.code">{{ currentConversation.answer }}</p>
                <small>{{ currentConversation.answerTranslation }}</small>
                <Transition name="completion-pop">
                  <div v-if="phase === 'completed'" class="completion-note">
                    <CheckCircle2 /> <span><strong>{{ currentConversation.actions.length }} workflows completed</strong><small>Everything is already updated</small></span>
                  </div>
                </Transition>
              </article>
            </div>
          </Transition>
        </main>

        <aside class="execution-panel">
          <header><span>EXECUTION LOG</span><i :class="{ active:phase === 'completed' }"></i></header>
          <p class="execution-intro">What Voxa completes behind the conversation.</p>

          <TransitionGroup v-if="phase === 'completed'" name="task-reveal" tag="div" class="task-list">
            <article v-for="(action,index) in currentConversation.actions" :key="action.label" :style="{ '--delay':`${index * 110}ms` }">
              <span class="task-icon"><component :is="action.icon" /></span>
              <div><strong>{{ action.label }}</strong><small>{{ action.detail }}</small></div>
              <Check />
            </article>
          </TransitionGroup>

          <div v-else class="execution-waiting">
            <span><i></i><i></i><i></i></span>
            <strong>{{ phase === 'caller' ? 'Listening for the request' : phase === 'understanding' ? 'Preparing the right actions' : 'Actions ready to run' }}</strong>
            <small>Updates appear only after Voxa completes them.</small>
          </div>
        </aside>
      </div>

      <footer class="console-progress">
        <div v-for="(step,index) in steps" :key="step.key" :class="{ active:step.key === phase, complete:index < phaseIndex }">
          <span><Check v-if="index < phaseIndex" /><i v-else></i></span>
          <strong>{{ step.label }}</strong>
        </div>
      </footer>
    </div>
  </section>
</template>

<script setup>
import { computed,onBeforeUnmount,onMounted,ref,watch } from "vue"
import { AudioLines,CalendarCheck,Check,CheckCircle2,ContactRound,DatabaseZap,MailCheck,MessageSquareCheck,PackageCheck,PhoneCall } from "lucide-vue-next"

const conversations = [
  { code:"en",short:"EN",language:"English",capabilitySequence:[3,1,4,2],question:"Can I move my appointment to Friday afternoon?",questionTranslation:"",answer:"Absolutely. I’ve moved it to Friday at 3:30 PM and sent your confirmation.",answerTranslation:"",actions:[{ icon:CalendarCheck,label:"Calendar updated",detail:"Friday · 3:30 PM confirmed" },{ icon:MailCheck,label:"Email sent",detail:"Confirmation delivered" }] },
  { code:"hi",short:"हिं",language:"हिन्दी",capabilitySequence:[3,0,4,2],question:"मेरा ऑर्डर कब पहुँचेगा?",questionTranslation:"When will my order arrive?",answer:"आपका ऑर्डर भेज दिया गया है और कल शाम तक पहुँच जाएगा।",answerTranslation:"Your order has been dispatched and will arrive by tomorrow evening.",actions:[{ icon:PackageCheck,label:"Order located",detail:"Shipment status verified" },{ icon:MessageSquareCheck,label:"SMS update sent",detail:"Tracking link delivered" }] },
  { code:"te",short:"తె",language:"తెలుగు",capabilitySequence:[3,1,4,2],question:"రేపు ఉదయం సర్వీస్ బుక్ చేయగలరా?",questionTranslation:"Can you book a service for tomorrow morning?",answer:"తప్పకుండా. రేపు ఉదయం 10 గంటలకు సర్వీస్ బుక్ చేశాను.",answerTranslation:"Certainly. Your service is booked for tomorrow at 10 AM.",actions:[{ icon:CalendarCheck,label:"Service booked",detail:"Tomorrow · 10:00 AM" },{ icon:ContactRound,label:"CRM updated",detail:"Request assigned to service" }] },
  { code:"ta",short:"த",language:"தமிழ்",capabilitySequence:[3,5,4,2],question:"இந்தப் பொருள் மீண்டும் எப்போது கிடைக்கும்?",questionTranslation:"When will this product be available again?",answer:"அடுத்த செவ்வாய்க்கிழமை கிடைக்கும். உங்களுக்காக முன்னுரிமை அறிவிப்பை அமைத்துள்ளேன்.",answerTranslation:"It returns next Tuesday. I’ve created a priority notification for you.",actions:[{ icon:DatabaseZap,label:"Inventory checked",detail:"Restock · Next Tuesday" },{ icon:MailCheck,label:"Alert created",detail:"Priority notification active" }] }
]

const steps = [{ key:"caller",label:"Listening" },{ key:"understanding",label:"Understanding" },{ key:"responding",label:"Responding" },{ key:"completed",label:"Completed" }]
const phaseDurations = [2900,1700,3300,5200]
const props = defineProps({ embedded:{ type:Boolean,default:false } })
const emit = defineEmits(["capability-active"])
const embedded = computed(() => props.embedded)
const conversationIndex = ref(0)
const phaseIndex = ref(0)
const elapsed = ref(0)
const currentConversation = computed(() => conversations[conversationIndex.value])
const phase = computed(() => steps[phaseIndex.value].key)
const phaseLabel = computed(() => ({ caller:"Caller speaking",understanding:"Voxa is understanding",responding:"Voxa responding",completed:"Work completed" })[phase.value])
const activeCapability = computed(() => currentConversation.value.capabilitySequence[phaseIndex.value])
const formattedTime = computed(() => `00:${String(elapsed.value).padStart(2,"0")}`)
let phaseTimer
let clockTimer

const scheduleNext = () => {
  window.clearTimeout(phaseTimer)
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { phaseIndex.value = 3; return }
  phaseTimer = window.setTimeout(() => {
    if (phaseIndex.value < steps.length - 1) phaseIndex.value += 1
    else { phaseIndex.value = 0; conversationIndex.value = (conversationIndex.value + 1) % conversations.length }
    scheduleNext()
  },phaseDurations[phaseIndex.value])
}

const selectConversation = index => { conversationIndex.value = index; phaseIndex.value = 0; elapsed.value = 0; scheduleNext() }

watch(activeCapability,value => emit("capability-active",value),{ immediate:true })

onMounted(() => { scheduleNext(); clockTimer = window.setInterval(() => { elapsed.value = (elapsed.value + 1) % 60 },1000) })
onBeforeUnmount(() => { window.clearTimeout(phaseTimer); window.clearInterval(clockTimer) })
</script>

<style scoped>
.voice-experience{padding:118px 28px 138px;background:#fff;color:#0b1d38;overflow:hidden}.section-heading{width:min(900px,100%);margin:0 auto 58px;text-align:center}.section-heading>span{color:#3b82f6;font-size:10px;font-weight:800;letter-spacing:.25em}.section-heading h2{margin:17px 0 0;font-size:clamp(39px,4.8vw,68px);line-height:.99;letter-spacing:-.052em;text-wrap:balance}.section-heading p{max-width:690px;margin:22px auto 0;color:#687991;font-size:15px;line-height:1.7}
.call-console{position:relative;width:min(1320px,100%);margin:auto;overflow:hidden;border:1px solid rgba(96,165,250,.2);border-radius:34px;background:linear-gradient(145deg,#07172f,#0a2246 62%,#0c2b58);box-shadow:0 38px 100px rgba(11,31,65,.2);color:#fff}.call-console::before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(147,197,253,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(147,197,253,.035) 1px,transparent 1px);background-size:48px 48px;pointer-events:none}.console-glow{position:absolute;width:520px;height:520px;right:14%;top:-360px;border-radius:50%;background:#2874ff;filter:blur(100px);opacity:.18}
.console-bar{position:relative;z-index:2;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:25px;padding:21px 26px;border-bottom:1px solid rgba(255,255,255,.09);background:rgba(3,15,35,.38)}.live-status,.call-time{display:flex;align-items:center;gap:9px}.live-status i{width:8px;height:8px;border-radius:50%;background:#4ade80;box-shadow:0 0 0 5px rgba(74,222,128,.1)}.live-status strong{font-size:10px;letter-spacing:.14em}.live-status span{color:#7990b1;font-size:10px}.language-tabs{display:flex;padding:4px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(255,255,255,.035)}.language-tabs button{min-width:42px;padding:7px 10px;border:0;border-radius:999px;color:#7890b4;background:transparent;font:inherit;font-size:10px;font-weight:750;cursor:pointer;transition:.25s}.language-tabs button.active{color:#fff;background:#2469dc;box-shadow:0 5px 16px rgba(37,99,235,.3)}.call-time{justify-content:flex-end;color:#9db8dd;font-size:11px;font-variant-numeric:tabular-nums}.call-time svg{width:15px}
.call-layout{position:relative;z-index:1;display:grid;grid-template-columns:190px minmax(0,1fr) 275px;gap:20px;min-height:530px;padding:26px}.caller-panel,.conversation-panel,.execution-panel{border:1px solid rgba(148,190,244,.12);border-radius:24px;background:rgba(8,29,60,.62);backdrop-filter:blur(12px)}.caller-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:26px 18px;text-align:center}.portrait-wrap{position:relative;display:grid;width:126px;height:126px;place-items:center}.portrait-ring{position:absolute;inset:0;border:1px solid rgba(111,169,249,.36);border-radius:50%;box-shadow:0 0 45px rgba(37,99,235,.13)}.portrait{position:relative;width:94px;height:94px;border-radius:50%;background:linear-gradient(145deg,#eaf3ff,#c9e0ff);box-shadow:0 16px 35px rgba(0,0,0,.2)}.portrait svg{width:100%;height:100%}.speech-rays{position:absolute;left:68px;top:50%;width:52px;height:52px;transform:translateY(-50%)}.speech-rays i{position:absolute;top:50%;left:0;border:2px solid transparent;border-right-color:#69a8ff;border-radius:50%;opacity:0;transform:translateY(-50%) scale(.6)}.speech-rays i:nth-child(1){width:17px;height:17px}.speech-rays i:nth-child(2){width:31px;height:31px}.speech-rays i:nth-child(3){width:46px;height:46px}.caller-panel.speaking .speech-rays i{animation:speech 1.25s ease-out infinite}.caller-panel.speaking .speech-rays i:nth-child(2){animation-delay:.17s}.caller-panel.speaking .speech-rays i:nth-child(3){animation-delay:.34s}.caller-panel.speaking .portrait-ring{animation:portrait-pulse 1.7s ease-in-out infinite}.caller-panel.speaking .portrait-mouth{animation:mouth .45s ease-in-out infinite alternate;transform-origin:center}.caller-panel>div:nth-child(2){display:flex;flex-direction:column;margin-top:17px}.caller-panel>div:nth-child(2)>span{color:#669ef1;font-size:8px;font-weight:800;letter-spacing:.18em}.caller-panel strong{margin-top:6px;font-size:17px}.caller-panel small{margin-top:5px;color:#7890b1;font-size:10px}.caller-wave{display:flex;height:38px;align-items:center;gap:3px;margin-top:25px}.caller-wave i{width:2px;height:calc(4px + var(--n) * .75px);border-radius:9px;background:#4789ed;animation:bar .7s calc(var(--n) * -.06s) ease-in-out infinite alternate}.caller-panel:not(.speaking) .caller-wave i{animation-play-state:paused;opacity:.22;transform:scaleY(.25)}
.conversation-panel{padding:27px}.conversation-status{display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;border-bottom:1px solid rgba(255,255,255,.08)}.conversation-status>span{padding:6px 9px;border:1px solid rgba(107,159,235,.18);border-radius:999px;color:#9fc4f7;background:rgba(59,130,246,.08);font-size:9px;font-weight:750;letter-spacing:.09em}.conversation-status>div{display:flex;align-items:center;gap:7px;color:#7288a8;font-size:9px}.conversation-status i{width:7px;height:7px;border-radius:50%;background:#4e8ff0}.conversation-status i.understanding{animation:status-pulse 1s infinite}.conversation-status i.responding{background:#a78bfa}.conversation-status i.completed{background:#4ade80}.conversation-content{padding-top:23px}.utterance{position:relative;padding:20px;border-radius:18px}.utterance>span{color:#6ea6f5;font-size:8px;font-weight:800;letter-spacing:.17em}.utterance p{margin:10px 0 0;font-size:clamp(20px,2vw,28px);font-weight:580;line-height:1.34;letter-spacing:-.025em}.utterance>small{display:block;margin-top:8px;color:#7890b0;font-size:11px;line-height:1.5}.caller-utterance{border:1px solid rgba(127,170,228,.12);background:rgba(255,255,255,.035);transition:.3s}.caller-utterance.subdued{opacity:.38;transform:scale(.985);transform-origin:left top}.understanding-state{display:flex;align-items:center;gap:14px;margin-top:18px;padding:18px;border:1px solid rgba(96,165,250,.16);border-radius:17px;background:rgba(37,99,235,.08)}.ai-thinking{display:flex;gap:4px}.ai-thinking i{width:6px;height:6px;border-radius:50%;background:#7db1fa;animation:thinking .8s infinite alternate}.ai-thinking i:nth-child(2){animation-delay:.15s}.ai-thinking i:nth-child(3){animation-delay:.3s}.understanding-state span{display:flex;flex-direction:column}.understanding-state strong{font-size:11px}.understanding-state small{margin-top:4px;color:#7890b0;font-size:9px}.voxa-utterance{margin-top:17px;border:1px solid rgba(81,137,224,.35);background:linear-gradient(135deg,rgba(29,78,216,.19),rgba(76,29,149,.12));box-shadow:0 18px 40px rgba(0,0,0,.13)}.voxa-label{display:flex;align-items:center;gap:9px}.voxa-mark{display:grid;width:29px;height:29px;place-items:center;border-radius:9px;color:#fff;background:linear-gradient(145deg,#246ee8,#8258e8)}.voxa-mark svg{width:15px}.voxa-label>span:nth-child(2){color:#bdd6fa;font-size:8px;font-weight:800;letter-spacing:.16em}.voxa-label i{margin-left:auto;color:#a5bdf0;font-size:8px;font-style:normal}.completion-note{display:flex;align-items:center;gap:10px;margin-top:17px;padding:10px 12px;border:1px solid rgba(74,222,128,.16);border-radius:13px;color:#83e7a7;background:rgba(34,197,94,.08)}.completion-note>svg{width:18px}.completion-note span{display:flex;flex-direction:column}.completion-note strong{font-size:10px}.completion-note small{margin-top:3px;color:#779b8a;font-size:8px}
.execution-panel{padding:22px}.execution-panel>header{display:flex;align-items:center;justify-content:space-between}.execution-panel>header span{color:#8da8cb;font-size:8px;font-weight:800;letter-spacing:.18em}.execution-panel>header i{width:7px;height:7px;border-radius:50%;background:#31527e}.execution-panel>header i.active{background:#4ade80;box-shadow:0 0 0 5px rgba(74,222,128,.08)}.execution-intro{margin:14px 0 20px;color:#607896;font-size:10px;line-height:1.55}.task-list{display:grid;gap:10px}.task-list article{display:grid;grid-template-columns:38px minmax(0,1fr) 15px;align-items:center;gap:10px;padding:12px;border:1px solid rgba(119,169,236,.16);border-radius:15px;background:rgba(255,255,255,.045);animation:task-in .5s var(--delay) cubic-bezier(.22,1,.36,1) both}.task-icon{display:grid;width:36px;height:36px;place-items:center;border-radius:11px;color:#80b7ff;background:rgba(59,130,246,.13)}.task-icon svg{width:16px}.task-list article>div{min-width:0}.task-list strong,.task-list small{display:block}.task-list strong{font-size:11px}.task-list small{margin-top:4px;overflow:hidden;color:#7188a8;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.task-list article>svg{width:14px;color:#4ade80}.execution-waiting{display:flex;min-height:250px;flex-direction:column;align-items:center;justify-content:center;padding:20px;border:1px dashed rgba(125,170,230,.15);border-radius:18px;text-align:center}.execution-waiting>span{display:flex;gap:5px;margin-bottom:16px}.execution-waiting>span i{width:6px;height:6px;border-radius:50%;background:#3d6eae;animation:thinking 1s infinite alternate}.execution-waiting>span i:nth-child(2){animation-delay:.2s}.execution-waiting>span i:nth-child(3){animation-delay:.4s}.execution-waiting strong{font-size:11px}.execution-waiting small{max-width:170px;margin-top:7px;color:#5f7593;font-size:9px;line-height:1.5}
.console-progress{position:relative;z-index:2;display:grid;grid-template-columns:repeat(4,1fr);padding:0 26px 24px}.console-progress>div{position:relative;display:flex;align-items:center;gap:9px;padding-top:21px;border-top:1px solid rgba(255,255,255,.09);color:#526b8d}.console-progress>div::after{content:"";position:absolute;left:0;top:-1px;width:0;height:1px;background:#4f91f3;transition:width .4s}.console-progress>div.active::after,.console-progress>div.complete::after{width:100%}.console-progress>div.active{color:#c8ddfa}.console-progress>div.complete{color:#7ea6dd}.console-progress>div>span{display:grid;width:20px;height:20px;place-items:center;border:1px solid #294c79;border-radius:50%}.console-progress>div.active>span{border-color:#4f91f3;box-shadow:0 0 16px rgba(59,130,246,.25)}.console-progress>div.complete>span{border-color:#2f7add;color:#66a4f7;background:rgba(37,99,235,.12)}.console-progress svg{width:11px}.console-progress i{width:5px;height:5px;border-radius:50%;background:currentColor}.console-progress strong{font-size:9px;letter-spacing:.04em}
.conversation-swap-enter-active,.conversation-swap-leave-active{transition:opacity .3s ease,transform .3s ease}.conversation-swap-enter-from{opacity:0;transform:translateY(8px)}.conversation-swap-leave-to{opacity:0;transform:translateY(-6px)}.completion-pop-enter-active{transition:.4s cubic-bezier(.22,1,.36,1)}.completion-pop-enter-from{opacity:0;transform:translateY(8px) scale(.97)}
[lang="hi"],[lang="te"],[lang="ta"]{font-family:"Nirmala UI","Noto Sans Devanagari","Noto Sans Telugu","Noto Sans Tamil",system-ui,sans-serif;letter-spacing:normal}
@keyframes speech{0%{opacity:0;transform:translateY(-50%) scale(.55)}35%{opacity:.9}100%{opacity:0;transform:translateY(-50%) scale(1.12) translateX(8px)}}@keyframes portrait-pulse{50%{box-shadow:0 0 0 12px rgba(59,130,246,.04),0 0 50px rgba(59,130,246,.18)}}@keyframes mouth{from{transform:scaleY(.65)}to{transform:scaleY(1.25)}}@keyframes bar{from{transform:scaleY(.25);opacity:.35}to{transform:scaleY(1);opacity:1}}@keyframes thinking{from{transform:translateY(2px);opacity:.35}to{transform:translateY(-2px);opacity:1}}@keyframes status-pulse{50%{box-shadow:0 0 0 6px rgba(78,143,240,.08)}}@keyframes task-in{from{opacity:0;transform:translateX(15px) scale(.97)}to{opacity:1;transform:none}}
.console-glow{width:760px;height:520px;right:0;top:-280px;border-radius:0;background:radial-gradient(ellipse at center,rgba(40,116,255,.3),transparent 66%);filter:none;opacity:.72}.caller-panel,.conversation-panel,.execution-panel{background:rgba(8,29,60,.86);backdrop-filter:none}
.voice-experience.embedded{padding:0;background:transparent;overflow:visible}.embedded .section-heading{display:none}.embedded .call-console{width:100%;border-color:rgba(96,165,250,.28);border-radius:25px;box-shadow:0 24px 60px rgba(6,23,51,.2)}.embedded .execution-panel{border-color:rgba(111,169,249,.25);background:#071a38}.embedded .execution-panel>header span{color:#b7d3fa}.embedded .execution-intro{color:#8fa8c9}
.embedded .console-bar{grid-template-columns:1fr auto;padding:16px}.embedded .language-tabs{grid-column:1/-1;grid-row:2;justify-content:center}.embedded .call-time{grid-column:2;grid-row:1}.embedded .live-status span{display:none}.embedded .call-layout{grid-template-columns:112px minmax(0,1fr);gap:12px;min-height:0;padding:12px}.embedded .caller-panel{padding:16px 10px}.embedded .portrait-wrap{width:78px;height:78px}.embedded .portrait{width:60px;height:60px}.embedded .speech-rays{left:42px;transform:translateY(-50%) scale(.65)}.embedded .caller-wave{margin-top:14px}.embedded .conversation-panel{padding:17px}.embedded .utterance{padding:15px}.embedded .utterance p{font-size:18px}.embedded .execution-panel{grid-column:1/-1;padding:16px}.embedded .execution-intro{margin:9px 0 12px}.embedded .execution-waiting{min-height:90px}.embedded .task-list{grid-template-columns:repeat(2,1fr)}.embedded .console-progress{padding:0 14px 15px}.embedded .console-progress>div{justify-content:center}.embedded .console-progress strong{display:none}
.voice-experience.embedded,.embedded .call-console{width:100%;height:100%;min-height:0}.embedded .call-console{display:flex;flex-direction:column}.embedded .call-layout{grid-template-rows:minmax(300px,1fr) 178px;flex:1;height:0;overflow:hidden}.embedded .caller-panel,.embedded .conversation-panel{min-height:0;overflow:hidden}.embedded .execution-panel{height:178px;min-height:178px;overflow:hidden}.embedded .execution-waiting{min-height:95px}.embedded .console-progress{flex:0 0 50px}
@media(max-width:1050px){.call-layout{grid-template-columns:155px minmax(0,1fr)}.execution-panel{grid-column:1/-1}.execution-waiting{min-height:130px}.task-list{grid-template-columns:repeat(2,1fr)}}
@media(max-width:1024px){.voice-experience.embedded,.embedded .call-console{height:auto}.embedded .call-layout{height:auto;grid-template-rows:auto}.embedded .execution-panel{height:auto;min-height:0}.embedded .console-progress{flex:auto}}
@media(max-width:720px){.voice-experience{padding:90px 15px 110px}.section-heading{margin-bottom:38px}.console-bar{grid-template-columns:1fr auto;padding:17px}.live-status span{display:none}.language-tabs{grid-column:1/-1;grid-row:2;justify-content:center}.call-time{grid-column:2;grid-row:1}.call-layout{grid-template-columns:1fr;padding:14px;min-height:0}.caller-panel{flex-direction:row;justify-content:flex-start;gap:14px;padding:16px;text-align:left}.portrait-wrap{width:74px;height:74px;flex:0 0 74px}.portrait{width:58px;height:58px}.speech-rays{left:41px;transform:translateY(-50%) scale(.65)}.caller-panel>div:nth-child(2){margin:0}.caller-wave{margin:0 0 0 auto}.conversation-panel,.execution-panel{padding:17px}.utterance{padding:16px}.utterance p{font-size:19px}.caller-utterance.subdued{display:none}.execution-waiting{min-height:120px}.task-list{grid-template-columns:1fr}.console-progress{padding:0 14px 16px}.console-progress>div{justify-content:center}.console-progress strong{display:none}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
</style>
