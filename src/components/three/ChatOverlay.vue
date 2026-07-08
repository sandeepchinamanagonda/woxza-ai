<template>

<div class="overlay">

    <!-- Ambient Background -->

    <div class="ambient">

        <div class="ring ring1"></div>

        <div class="ring ring2"></div>

        <div class="ring ring3"></div>

    </div>

    <!-- Glass Card -->

    <div class="card">

        <!-- HEADER -->

        <div class="card-header">

            <div class="agent">

                <div class="avatar">

                    V

                </div>

                <div>

                    <small>

                        AI VOICE AGENT

                    </small>

                    <h3>

                        {{ currentScenario.title }}

                    </h3>

                    <span>

                        {{ currentScenario.subtitle }}

                    </span>

                </div>

            </div>

            <div class="status">

                <div

                    class="status-dot"

                    :class="{ active: isSpeaking }"

                ></div>

                <span>

                    {{ isSpeaking ? "Speaking" : "Listening" }}

                </span>

                <div

                    v-if="isSpeaking"

                    class="voice-wave"

                >

                    <span></span>

                    <span></span>

                    <span></span>

                    <span></span>

                    <span></span>

                    <span></span>

                    <span></span>

                </div>

            </div>

        </div>

        <div class="call-progress">

            <span
                :style="{ width: `${scenarioProgress}%` }"
            ></span>

        </div>

        <!-- CHAT -->

        <div

            class="chat"

            ref="chatContainer"

        >

            <transition-group

                name="message"

                tag="div"

            >

                <div

                    v-for="(message,index) in visibleMessages"

                    :key="index"

                    class="bubble"

                    :class="message.sender"

                >

                    <small>

                        {{ message.sender }}

                    </small>

                    <p>

                        {{ message.text }}

                    </p>

                </div>

            </transition-group>

            <div

                v-if="typing"

                class="typing"

            >

                <span></span>

                <span></span>

                <span></span>

            </div>

            <transition

                name="success"

            >

                <div

                    v-if="showSuccess"

                    class="success-card"

                >

                    <div class="success-header">

    <div class="success-icon">
        ✓
    </div>

    <div>

        <small>
            {{ currentScenario.successLabel }}
        </small>

        <strong>
            {{ currentScenario.successTitle }}
        </strong>

    </div>

</div>

<div class="booking-grid">

    <div class="booking-item">
        <small>Details</small>
        <strong>{{ currentScenario.details.title }}</strong>
    </div>

    <div class="booking-item">
        <small>Time</small>
        <strong>{{ currentScenario.details.time }}</strong>
    </div>

    <div class="booking-item">
        <small>Status</small>
        <strong>{{ currentScenario.details.extra }}</strong>
    </div>

</div>

<div class="success-tags">

    <span
        v-for="item in currentScenario.success"
        :key="item"
    >
        ✓ {{ item }}
    </span>

</div>

</div>

            </transition>

</div>

<div class="success-strip">

    <span
        v-for="(item,index) in currentScenario.success"
        :key="item"
        :class="{ active: showSuccess || index < visibleMessages.length - 1 }"
    >
        <b>✓</b>
        {{ item }}
    </span>

</div>

<div class="navigation">

    <button
        v-for="(item,index) in scenarios"
        :key="item.id"
        @click="changeScenario(index)"
        :class="{ active:index===scenarioIndex }"
    >
        {{ item.short }}
    </button>

</div>

</div>

</div>

</template>

<script setup>

import {
ref,
computed,
watch,
nextTick,
onMounted,
onUnmounted
}
from "vue"

/* ===========================================================
SCENARIOS
=========================================================== */

const scenarios=[

{
id:"restaurant",
short:"Restaurant",

title:"Restaurant Reservation",

subtitle:"Menu • Table • Booking",

successLabel:"Reservation Status",

successTitle:"Reservation Confirmed",

details:{
title:"Bella Italia",
time:"7:30 PM",
extra:"4 Guests"
},

success:[
"Table Booked",
"WhatsApp Sent",
"Email Confirmation"
],

messages:[

{
sender:"Caller",
text:"Hi, I'd like to reserve a rooftop table for tonight."
},

{
sender:"Voxa",
text:"Absolutely. Bella Italia has availability at 7:30 PM."
},

{
sender:"Caller",
text:"Perfect. Please reserve it for four guests."
},

{
sender:"Voxa",
text:"Done. Your reservation has been confirmed."
}

]

},

{

id:"clinic",

short:"Healthcare",

title:"Doctor Appointment",

subtitle:"Appointments • Calendar",

successLabel:"Appointment",

successTitle:"Appointment Confirmed",

details:{
title:"Dr. Ananya Rao",
time:"4:15 PM",
extra:"Room 204"
},

success:[
"Appointment Booked",
"Reminder Sent",
"Calendar Updated"
],

messages:[

{
sender:"Caller",
text:"Can I schedule a pediatric appointment today?"
},

{
sender:"Voxa",
text:"Yes. Dr. Ananya Rao is available at 4:15 PM."
},

{
sender:"Caller",
text:"Book that slot please."
},

{
sender:"Voxa",
text:"Done. The appointment has been confirmed."
}

]

},

{

id:"support",

short:"Support",

title:"Customer Support",

subtitle:"Returns • Orders",

successLabel:"Support",

successTitle:"Replacement Scheduled",

details:{
title:"Order #18291",
time:"Tomorrow",
extra:"Priority"
},

success:[
"Replacement Created",
"Customer Updated",
"Ticket Closed"
],

messages:[

{
sender:"Caller",
text:"My package arrived damaged."
},

{
sender:"Voxa",
text:"I'm sorry. I'll arrange a replacement immediately."
},

{
sender:"Caller",
text:"Please deliver tomorrow."
},

{
sender:"Voxa",
text:"Done. A replacement is already on the way."
}

]

},

{

id:"payments",

short:"Payments",

title:"Invoice Assistance",

subtitle:"Billing",

successLabel:"Invoice",

successTitle:"Invoice Sent",

details:{
title:"Invoice #1048",
time:"₹1,52,000",
extra:"Receipt Ready"
},

success:[
"Invoice Generated",
"Email Sent",
"Receipt Attached"
],

messages:[

{
sender:"Caller",
text:"Could you email my latest invoice?"
},

{
sender:"Voxa",
text:"Certainly. I found your latest invoice."
},

{
sender:"Caller",
text:"Please send it."
},

{
sender:"Voxa",
text:"Done. The invoice has been sent."
}

]

}

]

/* ===========================================================
STATE
=========================================================== */

const scenarioIndex=ref(0)

const messageIndex=ref(0)

const visibleMessages=ref([])

const typing=ref(false)

const showSuccess=ref(false)

const isSpeaking=ref(false)

const chatContainer=ref(null)

const currentScenario=computed(()=>{

return scenarios[scenarioIndex.value]

})

const insightMap={
restaurant:{
intent:"Reservation",
confidence:"98%",
action:"Book table"
},
clinic:{
intent:"Appointment",
confidence:"97%",
action:"Update calendar"
},
support:{
intent:"Replacement",
confidence:"96%",
action:"Create ticket"
},
payments:{
intent:"Invoice",
confidence:"99%",
action:"Send email"
}
}

const currentInsight=computed(()=>{

return insightMap[currentScenario.value.id]

})

const scenarioProgress=computed(()=>{

const total=currentScenario.value.messages.length+1

return Math.min(
100,
Math.round(((visibleMessages.value.length+(showSuccess.value?1:0))/total)*100)
)

})

let messageTimer

let scenarioTimer

/* ===========================================================
MESSAGE PLAYBACK
=========================================================== */

function playScenario(){

clearInterval(messageTimer)

visibleMessages.value=[]

messageIndex.value=0

typing.value=false

showSuccess.value=false

isSpeaking.value=false

nextMessage()

}

function nextMessage(){

const messages=currentScenario.value.messages

if(messageIndex.value>=messages.length){

showSuccess.value=true

isSpeaking.value=false

return

}

const message=messages[messageIndex.value]

typing.value=true

isSpeaking.value=true

const typingDuration=

message.sender==="Voxa"

?1200

:700

setTimeout(async()=>{

typing.value=false

visibleMessages.value.push(message)

messageIndex.value++

isSpeaking.value=

message.sender==="Voxa"

await nextTick()

scrollChat()

messageTimer=

setTimeout(()=>{

nextMessage()

},1500)

},typingDuration)

}

/* ===========================================================
SCENARIO CHANGE
=========================================================== */

function changeScenario(index){

scenarioIndex.value=index

playScenario()

}

/* ===========================================================
AUTO SCROLL
=========================================================== */

function scrollChat(){

if(!chatContainer.value)return

chatContainer.value.scrollTo({

top:chatContainer.value.scrollHeight,

behavior:"smooth"

})

}

/* ===========================================================
WATCH
=========================================================== */

watch(

visibleMessages,

()=>{

nextTick(()=>{

scrollChat()

})

},

{

deep:true

}

)

/* ===========================================================
LIFECYCLE
=========================================================== */

onMounted(()=>{

playScenario()

scenarioTimer=

setInterval(()=>{

scenarioIndex.value=

(scenarioIndex.value+1)

%

scenarios.length

playScenario()

},12000)

})

onUnmounted(()=>{

clearTimeout(messageTimer)

clearInterval(scenarioTimer)

})

</script>

<style scoped>

/* ==========================================================
OVERLAY
========================================================== */

.overlay{

position:absolute;

inset:0;

display:grid;

place-items:center;

overflow:hidden;

isolation:isolate;

}

/* ==========================================================
BACKGROUND
========================================================== */

.ambient{

position:absolute;

inset:0;

overflow:hidden;

pointer-events:none;

}

.ring{

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

border-radius:50%;

border:1px solid rgba(59,130,246,.12);

}

.ring1{

width:520px;

height:520px;

animation:ring 10s linear infinite;

}

.ring2{

width:720px;

height:720px;

animation:ring 10s linear infinite 2.5s;

}

.ring3{

width:920px;

height:920px;

animation:ring 10s linear infinite 5s;

}

/* ==========================================================
CARD
========================================================== */

.card{

position:relative;

z-index:5;

width:min(560px,92%);

padding:28px;

border-radius:34px;

background:

rgba(255,255,255,.82);

backdrop-filter:blur(24px);

-webkit-backdrop-filter:blur(24px);

border:1px solid rgba(255,255,255,.7);

box-shadow:

0 40px 90px rgba(15,23,42,.12);

overflow:hidden;

animation:floatCard 8s ease-in-out infinite;

}

/* top gradient */

.card::before{

content:"";

position:absolute;

top:0;

left:0;

right:0;

height:5px;

background:

linear-gradient(

90deg,

#2563EB,

#60A5FA,

#2563EB

);

}

/* glass shine */

.card::after{

content:"";

position:absolute;

top:0;

left:-120%;

width:45%;

height:100%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.55),

transparent

);

transform:skewX(-20deg);

transition:1.4s;

pointer-events:none;

}

.card:hover::after{

left:140%;

}

.card:hover{

transform:

translateY(-8px)

rotateX(2deg)

rotateY(-2deg);

transition:.45s;

}

/* ==========================================================
HEADER
========================================================== */

.card-header{

display:flex;

justify-content:space-between;

align-items:flex-start;

padding-bottom:22px;

border-bottom:1px solid #EEF2F7;

}

.call-progress{

height:4px;

margin:0 -2px;

background:rgba(226,232,240,.72);

border-radius:999px;

overflow:hidden;

}

.call-progress span{

display:block;

height:100%;

width:0;

border-radius:inherit;

background:
linear-gradient(90deg,#2563EB,#60A5FA,#22C55E);

box-shadow:
0 0 18px rgba(37,99,235,.28);

transition:width .55s cubic-bezier(.22,1,.36,1);

}

.agent{

display:flex;

align-items:center;

gap:14px;

}

.avatar{

width:56px;

height:56px;

border-radius:16px;

display:grid;

place-items:center;

background:#14264D;

color:white;

font-size:22px;

font-weight:700;

box-shadow:

0 10px 24px rgba(20,38,77,.22);

}

.agent small{

display:block;

margin-bottom:6px;

font-size:10px;

font-weight:800;

letter-spacing:.16em;

text-transform:uppercase;

color:#94A3B8;

}

.agent h3{

margin:0;

font-size:22px;

font-weight:700;

letter-spacing:-.03em;

color:#14264D;

}

.agent span{

display:inline-flex;

margin-top:7px;

padding:6px 11px;

border-radius:999px;

background:#EEF4FF;

color:#2563EB;

font-size:11px;

font-weight:700;

}
/* ==========================================================
STATUS
========================================================== */

.status{

display:flex;

align-items:center;

gap:10px;

font-size:13px;

font-weight:600;

color:#64748B;

}

.status-dot{

width:10px;

height:10px;

border-radius:50%;

background:#CBD5E1;

transition:.35s;

}

.status-dot.active{

background:#22C55E;

box-shadow:0 0 0 8px rgba(34,197,94,.15);

animation:pulse 1.5s infinite;

}

/* ==========================================================
VOICE WAVE
========================================================== */

.voice-wave{

display:flex;

align-items:flex-end;

gap:3px;

height:18px;

}

.voice-wave span{

width:3px;

border-radius:10px;

background:#2563EB;

animation:wave .8s ease-in-out infinite;

}

.voice-wave span:nth-child(1){height:7px;}
.voice-wave span:nth-child(2){height:15px;animation-delay:.08s;}
.voice-wave span:nth-child(3){height:11px;animation-delay:.16s;}
.voice-wave span:nth-child(4){height:18px;animation-delay:.24s;}
.voice-wave span:nth-child(5){height:12px;animation-delay:.32s;}
.voice-wave span:nth-child(6){height:16px;animation-delay:.40s;}
.voice-wave span:nth-child(7){height:8px;animation-delay:.48s;}

/* ==========================================================
CHAT
========================================================== */

.chat{

margin-top:24px;

display:flex;

flex-direction:column;

gap:16px;

min-height:300px;

max-height:300px;

overflow-y:auto;

padding-right:6px;

padding:18px;

border-radius:26px;

background:
linear-gradient(180deg,rgba(248,250,252,.72),rgba(255,255,255,.46));

border:1px solid rgba(226,232,240,.72);

scroll-behavior:smooth;

}

.chat::-webkit-scrollbar{

width:4px;

}

.chat::-webkit-scrollbar-thumb{

background:#CBD5E1;

border-radius:99px;

}

/* ==========================================================
MESSAGE BUBBLE
========================================================== */

.bubble{

max-width:84%;

padding:16px 18px;

border-radius:20px;

animation:messageIn .45s ease;

position:relative;

}

.bubble small{

display:block;

margin-bottom:8px;

font-size:10px;

font-weight:800;

letter-spacing:.12em;

text-transform:uppercase;

}

.bubble p{

margin:0;

font-size:15px;

line-height:1.65;

}

/* ==========================================================
CALLER
========================================================== */

.bubble.Caller{

align-self:flex-end;

background:#ffffff;

border:1px solid #E5E7EB;

border-bottom-right-radius:8px;

box-shadow:

0 10px 26px rgba(15,23,42,.05);

}

.bubble.Caller::after,
.bubble.Voxa::after{

content:"";

position:absolute;

bottom:10px;

width:10px;

height:10px;

background:inherit;

border:inherit;

transform:rotate(45deg);

}

.bubble.Caller::after{

right:-5px;

border-left:0;

border-bottom:0;

}

.bubble.Caller small{

color:#94A3B8;

}

.bubble.Caller p{

color:#334155;

}

/* ==========================================================
VOXA
========================================================== */

.bubble.Voxa{

align-self:flex-start;

background:#EEF4FF;

border-bottom-left-radius:8px;

box-shadow:
0 12px 28px rgba(37,99,235,.08);

}

.bubble.Voxa::after{

left:-5px;

border-right:0;

border-top:0;

}

.bubble.Voxa small{

color:#2563EB;

}

.bubble.Voxa p{

color:#1E3A8A;

}

/* ==========================================================
TYPING
========================================================== */

.typing{

width:72px;

padding:14px 18px;

border-radius:18px;

background:#EEF4FF;

display:flex;

gap:6px;

align-items:center;

animation:messageIn .35s ease;

box-shadow:
0 10px 24px rgba(37,99,235,.08);

}

.typing span{

width:8px;

height:8px;

border-radius:50%;

background:#3B82F6;

animation:bounce 1s infinite;

}

.typing span:nth-child(2){

animation-delay:.2s;

}

.typing span:nth-child(3){

animation-delay:.4s;

}
/* ==========================================================
SUCCESS CARD
========================================================== */

.success-card{

margin-top:18px;

padding:22px;

border-radius:24px;

background:linear-gradient(
180deg,
#F0FDF4 0%,
#ECFDF3 100%
);

border:1px solid #BBF7D0;

box-shadow:
0 18px 40px rgba(34,197,94,.12);

animation:successIn .55s ease;

position:relative;

overflow:hidden;

}

.success-card::before{

content:"";

position:absolute;

top:0;

left:0;

right:0;

height:4px;

background:linear-gradient(
90deg,
#22C55E,
#4ADE80,
#22C55E
);

}

/* ==========================================================
HEADER
========================================================== */

.success-header{

display:flex;

align-items:center;

gap:16px;

margin-bottom:20px;

}

.success-icon{

width:54px;

height:54px;

border-radius:50%;

display:flex;

align-items:center;

justify-content:center;

background:#22C55E;

color:white;

font-size:24px;

font-weight:700;

box-shadow:

0 15px 30px rgba(34,197,94,.25);

animation:successPulse 2s infinite;

}

.success-header small{

display:block;

font-size:11px;

font-weight:800;

letter-spacing:.14em;

text-transform:uppercase;

color:#16A34A;

margin-bottom:4px;

}

.success-header strong{

display:block;

font-size:19px;

font-weight:700;

color:#14532D;

line-height:1.35;

}

/* ==========================================================
BOOKING GRID
========================================================== */

.booking-grid{

display:grid;

grid-template-columns:repeat(3,1fr);

gap:14px;

margin-bottom:20px;

}

.booking-item{

background:#ffffff;

padding:14px;

border-radius:16px;

border:1px solid rgba(34,197,94,.15);

text-align:center;

transition:.3s;

}

.booking-item:hover{

transform:translateY(-3px);

box-shadow:

0 12px 24px rgba(15,23,42,.08);

}

.booking-item small{

display:block;

font-size:10px;

font-weight:700;

letter-spacing:.08em;

text-transform:uppercase;

color:#94A3B8;

margin-bottom:6px;

}

.booking-item strong{

font-size:15px;

font-weight:700;

color:#14532D;

}

/* ==========================================================
SUCCESS TAGS
========================================================== */

.success-tags{

display:flex;

flex-wrap:wrap;

gap:10px;

}

.success-tags span{

display:flex;

align-items:center;

gap:8px;

padding:10px 15px;

border-radius:999px;

background:#ffffff;

border:1px solid #BBF7D0;

font-size:12px;

font-weight:700;

color:#15803D;

opacity:0;

animation:tagAppear .5s forwards;

}

.success-tags span:nth-child(1){

animation-delay:.15s;

}

.success-tags span:nth-child(2){

animation-delay:.3s;

}

.success-tags span:nth-child(3){

animation-delay:.45s;

}

.success-tags span:hover{

background:#DCFCE7;

border-color:#22C55E;

transform:translateY(-2px);

}

/* ==========================================================
LIVE INSIGHTS
========================================================== */

.call-insights{

display:grid;

grid-template-columns:repeat(3,1fr);

gap:10px;

margin-top:16px;

padding:10px;

border-radius:22px;

background:rgba(255,255,255,.70);

border:1px solid rgba(226,232,240,.82);

box-shadow:
0 14px 34px rgba(15,23,42,.06);

}

.insight-item{

padding:12px 13px;

border-radius:16px;

background:
linear-gradient(180deg,#FFFFFF,#F8FAFC);

border:1px solid rgba(226,232,240,.75);

min-width:0;

}

.insight-item small{

display:block;

margin-bottom:5px;

font-size:9px;

font-weight:800;

letter-spacing:.12em;

text-transform:uppercase;

color:#94A3B8;

}

.insight-item strong{

display:block;

font-size:13px;

font-weight:800;

line-height:1.25;

color:#14264D;

white-space:nowrap;

overflow:hidden;

text-overflow:ellipsis;

}

/* ==========================================================
CARD FLOAT
========================================================== */

@keyframes floatCard{

0%{

transform:translateY(0);

}

50%{

transform:translateY(-10px);

}

100%{

transform:translateY(0);

}

}

/* ==========================================================
BACKGROUND RINGS
========================================================== */

@keyframes ring{

0%{

transform:translate(-50%,-50%) scale(.95);

opacity:.55;

}

50%{

transform:translate(-50%,-50%) scale(1.02);

opacity:1;

}

100%{

transform:translate(-50%,-50%) scale(.95);

opacity:.55;

}

}

/* ==========================================================
VOICE WAVE
========================================================== */

@keyframes wave{

0%,100%{

transform:scaleY(.45);

}

50%{

transform:scaleY(1.25);

}

}

/* ==========================================================
ONLINE DOT
========================================================== */

@keyframes pulse{

0%{

transform:scale(1);

box-shadow:0 0 0 0 rgba(34,197,94,.4);

}

70%{

transform:scale(1.15);

box-shadow:0 0 0 14px rgba(34,197,94,0);

}

100%{

transform:scale(1);

box-shadow:0 0 0 0 rgba(34,197,94,0);

}

}

/* ==========================================================
CHAT MESSAGE
========================================================== */

@keyframes messageIn{

from{

opacity:0;

transform:translateY(20px);

filter:blur(3px);

}

to{

opacity:1;

transform:translateY(0);

filter:blur(0);

}

}

.message-enter-active{

transition:.45s ease;

}

.message-enter-from{

opacity:0;

transform:translateY(18px);

}

.message-enter-to{

opacity:1;

transform:translateY(0);

}

.message-leave-active{

transition:.3s;

opacity:0;

}

/* ==========================================================
TYPING
========================================================== */

@keyframes bounce{

0%,80%,100%{

transform:translateY(0);

opacity:.35;

}

40%{

transform:translateY(-6px);

opacity:1;

}

}

/* ==========================================================
SUCCESS CARD
========================================================== */

@keyframes successIn{

from{

opacity:0;

transform:translateY(22px) scale(.95);

}

to{

opacity:1;

transform:translateY(0) scale(1);

}

}

.success-enter-active{

animation:successIn .55s ease;

}

.success-leave-active{

transition:.25s;

opacity:0;

}

/* ==========================================================
SUCCESS ICON
========================================================== */

@keyframes successPulse{

0%,100%{

transform:scale(1);

}

50%{

transform:scale(1.08);

}

}

/* ==========================================================
SUCCESS TAGS
========================================================== */

@keyframes tagAppear{

from{

opacity:0;

transform:translateY(12px);

}

to{

opacity:1;

transform:translateY(0);

}

}

/* ==========================================================
PARTICLES
========================================================== */

.ambient::before,

.ambient::after{

content:"";

position:absolute;

width:8px;

height:8px;

border-radius:50%;

background:#60A5FA;

opacity:.25;

animation:particle 9s linear infinite;

}

.ambient::before{

left:18%;

bottom:18%;

}

.ambient::after{

right:20%;

top:20%;

animation-delay:4s;

}

@keyframes particle{

0%{

transform:

translateY(0)

scale(.6);

opacity:0;

}

20%{

opacity:.45;

}

80%{

opacity:.45;

}

100%{

transform:

translateY(-220px)

scale(1.4);

opacity:0;

}

}

/* ==========================================================
HOVER
========================================================== */

.card{

transition:

transform .45s,

box-shadow .45s;

}

.card:hover{

transform:

translateY(-8px)

rotateX(2deg)

rotateY(-2deg);

box-shadow:

0 55px 120px rgba(15,23,42,.18);

}

.card:hover::after{

left:140%;

}
/* ==========================================================
NAVIGATION
========================================================== */

.navigation{

display:flex;

justify-content:center;

gap:12px;

margin-top:18px;

padding:6px;

border-radius:999px;

background:rgba(255,255,255,.68);

border:1px solid rgba(226,232,240,.76);

flex-wrap:wrap;

}

.navigation button{

padding:11px 17px;

border-radius:999px;

border:1px solid transparent;

background:transparent;

color:#64748B;

font-size:13px;

font-weight:700;

cursor:pointer;

transition:
all .35s ease;

box-shadow:none;

}

.navigation button:hover{

transform:translateY(-2px);

background:#F8FAFC;

box-shadow:
0 12px 24px rgba(15,23,42,.08);

}

.navigation button.active{

background:
linear-gradient(135deg,#14264D,#203B73);

color:white;

border-color:#14264D;

box-shadow:
0 12px 28px rgba(20,38,77,.25);

}

/* ==========================================================
SCROLLBAR
========================================================== */

.chat{

scrollbar-width:thin;

scrollbar-color:#CBD5E1 transparent;

}

.chat::-webkit-scrollbar{

width:6px;

}

.chat::-webkit-scrollbar-track{

background:transparent;

}

.chat::-webkit-scrollbar-thumb{

background:#CBD5E1;

border-radius:99px;

}

.chat::-webkit-scrollbar-thumb:hover{

background:#94A3B8;

}

/* ==========================================================
TABLET
========================================================== */

@media(max-width:1024px){

.card{

width:min(520px,96%);

padding:24px;

}

.chat{

max-height:290px;

min-height:290px;

}

.call-insights{

grid-template-columns:1fr;

}

.booking-grid{

grid-template-columns:1fr;

}

}

/* ==========================================================
MOBILE
========================================================== */

@media(max-width:768px){

.overlay{

padding:18px;

}

.card{

width:100%;

padding:22px;

border-radius:26px;

}

.card-header{

flex-direction:column;

align-items:flex-start;

gap:18px;

}

.status{

width:100%;

justify-content:flex-start;

}

.agent{

width:100%;

}

.avatar{

width:50px;

height:50px;

font-size:20px;

}

.agent h3{

font-size:19px;

}

.chat{

max-height:250px;

min-height:250px;

gap:14px;

}

.call-insights{

grid-template-columns:1fr;

gap:8px;

}

.insight-item{

padding:10px 12px;

}

.bubble{

max-width:94%;

padding:14px 16px;

}

.bubble p{

font-size:14px;

}

.booking-grid{

grid-template-columns:1fr;

gap:10px;

}

.success-tags{

gap:8px;

}

.success-tags span{

font-size:11px;

padding:8px 12px;

}

.navigation{

gap:8px;

border-radius:22px;

}

.navigation button{

padding:9px 14px;

font-size:12px;

}

}

/* ==========================================================
SMALL PHONES
========================================================== */

@media(max-width:420px){

.card{

padding:18px;

border-radius:22px;

}

.agent h3{

font-size:17px;

}

.agent span{

font-size:10px;

}

.avatar{

width:44px;

height:44px;

font-size:18px;

}

.success-header{

gap:12px;

}

.success-icon{

width:44px;

height:44px;

font-size:20px;

}

.success-header strong{

font-size:16px;

}

.booking-item{

padding:10px;

}

.booking-item strong{

font-size:13px;

}

}

/* ==========================================================
PREMIUM TEXT
========================================================== */

.card{

-webkit-font-smoothing:antialiased;

text-rendering:optimizeLegibility;

}

.agent h3,

.success-header strong{

letter-spacing:-.03em;

}

/* ==========================================================
REDUCED MOTION
========================================================== */

@media(prefers-reduced-motion:reduce){

*,

*::before,

*::after{

animation:none!important;

transition:none!important;

scroll-behavior:auto!important;

}

}
/* ==========================================================
PREMIUM BACKGROUND GLOW
========================================================== */

.overlay::before{

content:"";

position:absolute;

top:-280px;

right:-220px;

width:720px;

height:720px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(37,99,235,.10),

transparent 70%

);

filter:blur(100px);

pointer-events:none;

z-index:0;

}

.overlay::after{

content:"";

position:absolute;

left:-260px;

bottom:-260px;

width:640px;

height:640px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(96,165,250,.08),

transparent 72%

);

filter:blur(100px);

pointer-events:none;

z-index:0;

}

/* ==========================================================
CARD DEPTH
========================================================== */

.card{

transform-style:preserve-3d;

perspective:1000px;

}

.card:hover{

transform:

translateY(-10px)

rotateX(2deg)

rotateY(-2deg)

scale(1.01);

}

/* ==========================================================
AVATAR
========================================================== */

.avatar{

position:relative;

overflow:hidden;

}

.avatar::before{

content:"";

position:absolute;

inset:0;

background:

linear-gradient(

135deg,

rgba(255,255,255,.18),

transparent

);

pointer-events:none;

}

.avatar::after{

content:"";

position:absolute;

inset:-35%;

background:

conic-gradient(

from 0deg,

transparent,

rgba(255,255,255,.25),

transparent

);

animation:rotateGlow 6s linear infinite;

opacity:.45;

}

/* ==========================================================
STATUS
========================================================== */

.status{

padding:8px 14px;

border-radius:999px;

background:rgba(255,255,255,.72);

border:1px solid rgba(226,232,240,.8);

backdrop-filter:blur(10px);

}

/* ==========================================================
VOICE WAVE
========================================================== */

.voice-wave span{

box-shadow:

0 0 10px rgba(37,99,235,.25);

}

/* ==========================================================
CHAT BUBBLES
========================================================== */

.bubble{

transition:

transform .3s ease,

box-shadow .3s ease;

}

.bubble:hover{

transform:translateY(-2px);

box-shadow:

0 12px 24px rgba(15,23,42,.08);

}

/* ==========================================================
SUCCESS CARD
========================================================== */

.success-card{

position:relative;

}

.success-card::after{

content:"";

position:absolute;

inset:0;

border-radius:24px;

background:

linear-gradient(

135deg,

rgba(255,255,255,.22),

transparent

);

pointer-events:none;

}

/* ==========================================================
BOOKING ITEMS
========================================================== */

.booking-item{

transition:

transform .3s,

box-shadow .3s;

}

.booking-item:hover{

transform:translateY(-4px);

box-shadow:

0 16px 30px rgba(15,23,42,.08);

}

/* ==========================================================
SUCCESS TAGS
========================================================== */

.success-tags span{

transition:

all .3s ease;

}

.success-tags span:hover{

transform:translateY(-2px);

background:#DCFCE7;

}

/* ==========================================================
ROTATE GLOW
========================================================== */

@keyframes rotateGlow{

0%{

transform:rotate(0deg);

}

100%{

transform:rotate(360deg);

}

}
/* ==========================================================
FINAL POLISH
========================================================== */

.overlay{

padding:24px;

box-sizing:border-box;

}

.card{

will-change:transform;

contain:layout paint;

}

/* ==========================================================
SUCCESS CARD GLOW
========================================================== */

.success-card{

box-shadow:

0 20px 50px rgba(34,197,94,.12),

0 0 0 1px rgba(255,255,255,.55) inset;

}

/* ==========================================================
VOICE WAVE
========================================================== */

.voice-wave{

opacity:.95;

transition:opacity .3s ease;

}

.status:not(:has(.voice-wave)) .status-dot{

background:#CBD5E1;

}

/* ==========================================================
BUTTONS
========================================================== */

.navigation button{

position:relative;

overflow:hidden;

}

.navigation button::before{

content:"";

position:absolute;

top:0;

left:-120%;

width:60%;

height:100%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.35),

transparent

);

transform:skewX(-20deg);

transition:1s;

}

.navigation button:hover::before{

left:140%;

}

/* ==========================================================
CARD ENTRANCE
========================================================== */

.card{

animation:

cardIntro .8s ease,

floatCard 8s ease-in-out infinite .8s;

}

@keyframes cardIntro{

from{

opacity:0;

transform:

translateY(30px)

scale(.96);

}

to{

opacity:1;

transform:

translateY(0)

scale(1);

}

}

/* ==========================================================
FOCUS STATES
========================================================== */

.navigation button:focus-visible{

outline:none;

box-shadow:

0 0 0 3px rgba(37,99,235,.18);

}

/* ==========================================================
SMALL IMPROVEMENTS
========================================================== */

.bubble p{

word-break:break-word;

}

.booking-item strong{

display:block;

line-height:1.4;

}

.success-header strong{

line-height:1.3;

}

.success-tags{

margin-top:4px;

}

.typing{

margin-top:2px;

}

/* ==========================================================
END
========================================================== */

</style>
