<template>

<div class="cf-wrapper">

    <button
        class="cf-arrow left"
        @click="previous"
    >
        ←
    </button>

    <div
        ref="stage"
        class="cf-stage"
    >

        <div

            v-for="(item,index) in items"

            :key="index"

            class="cf-card"

            :ref="el => cardRefs[index]=el"

        >

            <div class="cf-icon">

                {{ item.icon }}

            </div>

            <h3>

                {{ item.title }}

            </h3>

            <p>

                {{ item.description }}

            </p>

            <span>

                Learn More →

            </span>

        </div>

    </div>

    <button
        class="cf-arrow right"
        @click="next"
    >
        →
    </button>

</div>

</template>
<script setup>

import { ref, onMounted, nextTick } from "vue"
import { gsap } from "gsap"

const props = defineProps({

    items:{
        type:Array,
        required:true
    }

})

const stage = ref(null)
const cardRefs = []

const active = ref(0)

const radius = 650
const angleStep = 28

let isAnimating = false

function updateCards(){

    if(isAnimating) return

    isAnimating = true

    const total = props.items.length

    cardRefs.forEach((card,index)=>{

        if(!card) return

        let offset = index-active.value

        if(offset>total/2) offset-=total
        if(offset<-total/2) offset+=total

        const angle = offset*angleStep

        const rad = angle*Math.PI/180

        const x = Math.sin(rad)*radius

        const z = Math.cos(rad)*radius-radius

        const scale = Math.max(.55,1-Math.abs(offset)*.12)

        const opacity = Math.max(.18,1-Math.abs(offset)*.18)

        gsap.to(card,{

            duration:.9,

            ease:"power3.inOut",

            x,

            z,

            rotationY:-angle,

            scale,

            opacity,

            filter:`blur(${Math.abs(offset)*1.4}px)`,

            zIndex:100-Math.abs(offset)

        })

    })

    gsap.delayedCall(.9,()=>{

        isAnimating=false

    })

}

function next(){

    active.value=(active.value+1)%props.items.length

    updateCards()

}

function previous(){

    active.value--

    if(active.value<0){

        active.value=props.items.length-1

    }

    updateCards()

}

let startX=0

function pointerDown(e){

    startX=e.clientX

}

function pointerUp(e){

    const diff=e.clientX-startX

    if(Math.abs(diff)<40) return

    if(diff>0){

        previous()

    }else{

        next()

    }

}

onMounted(async()=>{

    await nextTick()

    updateCards()

    stage.value.addEventListener("pointerdown",pointerDown)

    stage.value.addEventListener("pointerup",pointerUp)

})

</script>
<style scoped>

.cf-wrapper{

position:relative;

width:100%;

height:760px;

display:flex;

align-items:center;

justify-content:center;

overflow:hidden;

}

.cf-stage{

position:relative;

width:100%;

height:100%;

display:flex;

align-items:center;

justify-content:center;

perspective:2600px;

transform-style:preserve-3d;

}

/* 3D Ring */

.cf-stage::before{

content:"";

position:absolute;

left:50%;

top:52%;

transform:

translate(-50%,-50%)

rotateX(82deg);

width:1200px;

height:1200px;

border-radius:50%;

border:1px solid rgba(37,99,235,.08);

pointer-events:none;

}

/* Cards */

.cf-card{

position:absolute;

width:620px;

min-height:430px;

padding:48px;

display:flex;

flex-direction:column;

background:#ffffff;

border-radius:36px;

border:1px solid #E5E7EB;

box-shadow:

0 30px 80px rgba(15,23,42,.12);

transform-style:preserve-3d;

backface-visibility:hidden;

will-change:transform;

overflow:hidden;

}

/* Top Accent */

.cf-card::before{

content:"";

position:absolute;

left:0;

right:0;

top:0;

height:4px;

background:

linear-gradient(

90deg,

#60A5FA,

#2563EB,

#60A5FA

);

opacity:0;

transition:.35s;

}

.cf-card:hover::before{

opacity:1;

}

/* Shine */

.cf-card::after{

content:"";

position:absolute;

top:-180%;

left:-70%;

width:60%;

height:340%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.45),

transparent

);

transform:rotate(18deg);

animation:shine 8s linear infinite;

}

.cf-card:hover{

box-shadow:

0 55px 120px rgba(37,99,235,.18);

}

/* Icon */

.cf-icon{

width:84px;

height:84px;

border-radius:24px;

display:flex;

align-items:center;

justify-content:center;

background:#EEF4FF;

font-size:34px;

margin-bottom:34px;

transition:.35s;

}

.cf-card:hover .cf-icon{

transform:

rotate(-8deg)

scale(1.08);

background:#DBEAFE;

}

/* Title */

.cf-card h3{

font-size:42px;

line-height:1.05;

font-weight:700;

color:#101828;

margin-bottom:22px;

}

/* Body */

.cf-card p{

font-size:18px;

line-height:1.9;

color:#667085;

margin-bottom:auto;

}

/* Link */

.cf-card span{

margin-top:36px;

font-size:16px;

font-weight:700;

color:#2563EB;

}

/* Navigation */

.cf-arrow{

position:absolute;

top:50%;

transform:translateY(-50%);

width:64px;

height:64px;

border:none;

border-radius:50%;

background:white;

font-size:22px;

cursor:pointer;

z-index:999;

box-shadow:

0 18px 40px rgba(15,23,42,.15);

transition:.35s;

}

.cf-arrow:hover{

background:#2563EB;

color:white;

transform:

translateY(-50%)

scale(1.08);

}

.left{

left:20px;

}

.right{

right:20px;

}

/* Shine Animation */

@keyframes shine{

0%{

left:-70%;

}

100%{

left:180%;

}

}

/* Tablet */

@media(max-width:992px){

.cf-wrapper{

height:620px;

}

.cf-card{

width:88vw;

min-height:380px;

padding:34px;

}

.cf-card h3{

font-size:32px;

}

.cf-card p{

font-size:16px;

}

}

/* Mobile */

@media(max-width:600px){

.cf-wrapper{

height:560px;

}

.cf-card{

width:92vw;

padding:24px;

border-radius:24px;

}

.cf-card h3{

font-size:28px;

}

.cf-card p{

font-size:15px;

}

.cf-arrow{

width:52px;

height:52px;

font-size:18px;

}

}

</style>
