<template>

<main class="home">

<Hero
@start-free="scrollTo('#contact')"
@open-demo="openDemoModal"
/>



<Solutions/>

<Manifesto/>

<LiveDemo @join-waitlist="openDemoModal('waitlist')" />

<WhyVoxa/>

<Integrations/>


<Transformations/>

<FAQ/>

<CTA
@start-free="scrollTo('#contact')"
@open-demo="openDemoModal"
/>

<DemoModal
:is-open="showDemoModal"
:mode="demoMode"
@close="showDemoModal=false"
/>

</main>

</template>

<script setup>

import { onMounted, onUnmounted, ref } from "vue"
import { useMotion } from "@/composables/useMotion"

import Hero from "@/components/sections/Hero.vue"
import LiveDemo from "@/components/sections/LiveDemo.vue"
import Manifesto from "@/components/sections/Manifesto.vue"
import WhyVoxa from "@/components/sections/WhyVoxa.vue"
import Solutions from "@/components/sections/Solutions.vue"
import Transformations from "@/components/sections/Transformations.vue"
import FAQ from "@/components/sections/FAQ.vue"
import CTA from "@/components/sections/CTA.vue"
import Integrations from "@/components/sections/Integrations.vue"

import DemoModal from "@/components/DemoModal.vue"

const showDemoModal=ref(false)

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

const scrollTo=(selector)=>{

const el=document.querySelector(selector)

if(el){

el.scrollIntoView({

behavior:"smooth"

})

}

}

onMounted(()=>{

window.addEventListener("voxa:open-demo",openDemoModal)

})

onUnmounted(()=>{

window.removeEventListener("voxa:open-demo",openDemoModal)

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
