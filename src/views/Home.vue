<template>

<main class="home">

<Hero
@start-free="scrollTo('#contact')"
@open-demo="openDemoModal"
/>

<Solutions/>

<Manifesto/>

<LiveDemo @join-waitlist="openDemoModal('waitlist')" />

<WhyVoxa @join-waitlist="openDemoModal('waitlist')" />

<Transformations/>

<IntegrationMarquee/>

<FAQ/>

<CTA
@start-free="scrollTo('#contact')"
@open-demo="openDemoModal"
/>

<DemoModal
:is-open="showDemoModal"
:mode="demoMode"
:initial-email="prefilledEmail"
@close="closeDemoModal"
/>

<WaitlistPopup
:is-open="showWaitlistPopup"
@close="closeWaitlistPopup"
@join="openWaitlistFromPopup"
/>

</main>

</template>

<script setup>

import { onMounted, onUnmounted, ref } from "vue"
import { useMotion } from "@/composables/useMotion"

import Hero from "@/components/sections/Hero.vue"
import IntegrationMarquee from "@/components/sections/IntegrationMarquee.vue"
import LiveDemo from "@/components/sections/LiveDemo.vue"
import Manifesto from "@/components/sections/Manifesto.vue"
import WhyVoxa from "@/components/sections/WhyVoxa.vue"
import Solutions from "@/components/sections/Solutions.vue"
import Transformations from "@/components/sections/Transformations.vue"
import FAQ from "@/components/sections/FAQ.vue"
import CTA from "@/components/sections/CTA.vue"

import DemoModal from "@/components/DemoModal.vue"
import WaitlistPopup from "@/components/WaitlistPopup.vue"

const showDemoModal=ref(false)
const showWaitlistPopup=ref(false)
const prefilledEmail=ref("")
let waitlistPopupTimer
const waitlistPopupSeenKey="woxza:waitlist-popup-seen"

const demoMode=ref("waitlist")

useMotion()

const openDemoModal=(eventOrIntent="waitlist")=>{

const intent=
typeof eventOrIntent==="string"
?eventOrIntent
:eventOrIntent?.detail?.intent||"waitlist"

demoMode.value=intent

showDemoModal.value=true

}

const closeDemoModal=()=>{
showDemoModal.value=false
prefilledEmail.value=""
}

const closeWaitlistPopup=()=>{
showWaitlistPopup.value=false
}

const openWaitlistFromPopup=(email)=>{
prefilledEmail.value=email
closeWaitlistPopup()
openDemoModal("waitlist")
}

const scrollTo=(selector)=>{

const el=document.querySelector(selector)

if(el){

el.scrollIntoView({

behavior:"smooth"

})

}

}

onMounted(()=>{

window.addEventListener("woxza:open-demo",openDemoModal)

if(!window.sessionStorage.getItem(waitlistPopupSeenKey)){

waitlistPopupTimer=window.setTimeout(()=>{

window.sessionStorage.setItem(waitlistPopupSeenKey,"true")
showWaitlistPopup.value=true

},15000)

}

})

onUnmounted(()=>{

window.removeEventListener("woxza:open-demo",openDemoModal)
window.clearTimeout(waitlistPopupTimer)

})

</script>

<style scoped>

.home{

background:#ffffff;

display:flex;

flex-direction:column;

overflow-x:hidden;

}

</style>
