<template>
  <div class="chat-overlay">
    <Transition name="bubble">
      <div v-if="step >= 0" class="bubble bubble-1 user">
        <div class="avatar">U</div>
        <div class="content">
          Can you answer customer calls?
        </div>
      </div>
    </Transition>

    <Transition name="bubble">
      <div v-if="step >= 1" class="bubble bubble-2 ai">
        <div class="avatar ai-avatar">AI</div>
        <div class="content">
          Yes. I answer calls, qualify leads and automatically book appointments.
        </div>
      </div>
    </Transition>

    <Transition name="bubble">
      <div v-if="step >= 2" class="bubble bubble-3 user">
        <div class="avatar">U</div>
        <div class="content">
          Can you update our CRM?
        </div>
      </div>
    </Transition>

    <Transition name="bubble">
      <div v-if="step >= 3" class="bubble bubble-4 ai">
        <div class="avatar ai-avatar">AI</div>
        <div class="content">
          CRM updated. Follow-up scheduled. Calendar synced.
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue"

const step = ref(-1)

let interval
let timers = []

function play() {

  step.value = -1

  timers.forEach(clearTimeout)
  timers = []

  for (let i = 0; i < 4; i++) {

    timers.push(

      setTimeout(() => {

        step.value = i

      }, i * 1500)

    )

  }

}

onMounted(() => {

  play()

  interval = setInterval(play, 9000)

})

onBeforeUnmount(() => {

  clearInterval(interval)

  timers.forEach(clearTimeout)

})
</script>

<style scoped>

.chat-overlay{

position:absolute;

inset:0;

pointer-events:none;

z-index:30;

}

/* ---------- Bubble ---------- */

.bubble{

position:absolute;

display:flex;

gap:14px;

align-items:flex-start;

max-width:320px;

padding:18px;

border-radius:22px;

background:rgba(255,255,255,.95);

border:1px solid rgba(59,130,246,.08);

backdrop-filter:blur(20px);

box-shadow:0 20px 50px rgba(15,23,42,.08);

}

/* ---------- Positions ---------- */

.bubble-1{

top:8%;

left:-5%;

}

.bubble-2{

top:18%;

right:-8%;

}

.bubble-3{

bottom:20%;

left:-8%;

}

.bubble-4{

bottom:8%;

right:-5%;

}

/* ---------- Avatar ---------- */

.avatar{

width:42px;

height:42px;

border-radius:50%;

display:flex;

align-items:center;

justify-content:center;

font-size:13px;

font-weight:700;

background:#EEF4FF;

color:#2563EB;

flex-shrink:0;

}

.ai-avatar{

background:#2563EB;

color:white;

}

/* ---------- Text ---------- */

.content{

font-size:15px;

line-height:1.75;

color:#374151;

}

/* ---------- Animation ---------- */

.bubble-enter-active,

.bubble-leave-active{

transition:all .6s cubic-bezier(.22,1,.36,1);

}

.bubble-enter-from,

.bubble-leave-to{

opacity:0;

transform:translateY(25px) scale(.9);

}

.bubble-enter-to,

.bubble-leave-from{

opacity:1;

transform:translateY(0) scale(1);

}

/* ---------- Floating ---------- */

.bubble-1{

animation:float1 7s ease-in-out infinite;

}

.bubble-2{

animation:float2 8s ease-in-out infinite;

}

.bubble-3{

animation:float3 7s ease-in-out infinite;

}

.bubble-4{

animation:float4 8s ease-in-out infinite;

}

@keyframes float1{

0%,100%{transform:translateY(0)}

50%{transform:translateY(-10px)}

}

@keyframes float2{

0%,100%{transform:translateY(0)}

50%{transform:translateY(-14px)}

}

@keyframes float3{

0%,100%{transform:translateY(0)}

50%{transform:translateY(-8px)}

}

@keyframes float4{

0%,100%{transform:translateY(0)}

50%{transform:translateY(-12px)}

}

@media(max-width:1200px){

.chat-overlay{

display:none;

}

}

</style>