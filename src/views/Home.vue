<template>

<main class="home">

<PageLoader/>

<Hero
@start-free="scrollTo('#contact')"
@open-demo="showDemoModal=true"
/>

<Manifesto/>

<Capabilities/>

<WhyVoxa/>

<Ecosystem/>

<Solutions/>

<Transformations/>

<Approach/>

<FAQ/>

<CTA
@start-free="scrollTo('#contact')"
@open-demo="showDemoModal=true"
/>

<DemoModal
:is-open="showDemoModal"
@close="showDemoModal=false"
/>

</main>

</template>

<script setup>

import { ref } from "vue"

import { useReveal } from "@/composables/useReveal"
import { useMagnetic } from "@/composables/useMagnetic"
import { useParallax } from "@/composables/useParallax"
import { useCursorGlow } from "@/composables/useCursorGlow"
import { useParticles } from "@/composables/useParticles"

import Hero from "@/components/sections/Hero.vue"
import Manifesto from "@/components/sections/Manifesto.vue"
import Capabilities from "@/components/sections/Capabilities.vue"
import WhyVoxa from "@/components/sections/WhyVoxa.vue"
import Ecosystem from "@/components/sections/Ecosystem.vue"
import Solutions from "@/components/sections/Solutions.vue"
import Transformations from "@/components/sections/Transformations.vue"
import Approach from "@/components/sections/Approach.vue"
import FAQ from "@/components/sections/FAQ.vue"
import CTA from "@/components/sections/CTA.vue"

import DemoModal from "@/components/DemoModal.vue"
import PageLoader from "@/components/PageLoader.vue"

const showDemoModal=ref(false)

useReveal()
useMagnetic()
useParallax()
useCursorGlow()
useParticles()

const scrollTo=(selector)=>{

const el=document.querySelector(selector)

if(el){

el.scrollIntoView({

behavior:"smooth"

})

}

}

</script>

<style scoped>

.home{

background:#ffffff;

display:flex;

flex-direction:column;

overflow-x:hidden;

}

</style>