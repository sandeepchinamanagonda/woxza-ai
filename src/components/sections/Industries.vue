<template>

<section id="industries" class="industries">

    <div class="grid-bg"></div>

    <div class="glow glow-left"></div>

    <div class="glow glow-right"></div>

    <div class="container-custom">

        <div class="heading">

            <span>

                INDUSTRIES

            </span>

            <h2>

                AI built for
                every industry.

            </h2>

            <p>

                Purpose-built intelligence designed to automate
                workflows, enhance customer experiences and
                accelerate business growth.

            </p>

        </div>

        <div class="controls">

            <button @click="prev">

                ←

            </button>

            <button @click="next">

                →

            </button>

        </div>

        <div class="coverflow">

            <div

                v-for="(industry,index) in industries"

                :key="industry.title"

                class="card"

                :style="cardStyle(index)"

            >

                <div class="number">

                    {{ String(index+1).padStart(2,'0') }}

                </div>

                <div class="icon">

                    {{ industry.icon }}

                </div>

                <h3>

                    {{ industry.title }}

                </h3>

                <p>

                    {{ industry.description }}

                </p>

                <div class="bottom">

                    <span>

                        {{ industry.label }}

                    </span>

                    <button>

                        →

                    </button>

                </div>

            </div>

        </div>

    </div>

</section>

</template>
<script setup>

import { ref } from "vue"

const active = ref(2)

const industries = [

{
icon:"❤️",
title:"Healthcare",
label:"Healthcare",
description:"AI receptionists, appointment booking and multilingual patient support."
},

{
icon:"🎓",
title:"Education",
label:"Education",
description:"Admissions, enquiries and intelligent student assistance."
},

{
icon:"🏦",
title:"Finance",
label:"Finance",
description:"Customer onboarding, verification and secure AI assistants."
},

{
icon:"🏢",
title:"Enterprise",
label:"Enterprise",
description:"Internal copilots, workflow automation and employee support."
},

{
icon:"🛍️",
title:"Retail",
label:"Retail",
description:"Shopping assistants and personalized recommendations."
},

{
icon:"🏭",
title:"Manufacturing",
label:"Industry",
description:"Operations monitoring and predictive automation."
},

{
icon:"✈️",
title:"Travel",
label:"Travel",
description:"Bookings, itinerary management and multilingual voice AI."
},

{
icon:"💼",
title:"Professional",
label:"Business",
description:"Law firms, agencies and consulting powered by AI."
}

]

function next(){

active.value=(active.value+1)%industries.length

}

function prev(){

active.value=(active.value-1+industries.length)%industries.length

}

function cardStyle(index){

const total=industries.length

let offset=index-active.value

if(offset>total/2) offset-=total
if(offset<-total/2) offset+=total

const angle=offset*22

const radius=820

const x=Math.sin(angle*Math.PI/180)*radius

const z=Math.cos(angle*Math.PI/180)*radius-radius

const scale=1-Math.abs(offset)*0.08

const opacity=Math.max(.18,1-Math.abs(offset)*0.16)

return{

transform:`

translateX(${x}px)

translateZ(${z}px)

rotateY(${-angle}deg)

scale(${scale})

`,

opacity,

zIndex:100-Math.abs(offset)

}

}

</script>
<style scoped>

.industries{

position:relative;

padding:180px 0;

overflow:hidden;

background:

radial-gradient(circle at top left,
rgba(59,130,246,.14),
transparent 35%),

radial-gradient(circle at bottom right,
rgba(59,130,246,.08),
transparent 45%),

linear-gradient(
180deg,
#0F172A 0%,
#162238 100%
);

isolation:isolate;

}

/* ======================
BACKGROUND
====================== */

.grid-bg{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),

linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);

background-size:46px 46px;

opacity:.45;

animation:none;

pointer-events:none;

}

.glow{

position:absolute;

border-radius:50%;

filter:blur(140px);

pointer-events:none;

}

.glow-left{

width:700px;

height:700px;

left:-250px;

top:-220px;

background:rgba(59,130,246,.14);

}

.glow-right{

width:700px;

height:700px;

right:-260px;

bottom:-260px;

background:rgba(59,130,246,.08);

}

/* ======================
LAYOUT
====================== */

.container-custom{

position:relative;

z-index:5;

max-width:1700px;

margin:auto;

}

.heading{

max-width:760px;

margin:auto;

text-align:center;

margin-bottom:60px;

}

.heading span{

display:inline-flex;

padding:10px 18px;

border-radius:999px;

background:rgba(59,130,246,.12);

border:1px solid rgba(59,130,246,.25);

font-size:12px;

font-weight:700;

letter-spacing:.25em;

color:#BFDBFE;

margin-bottom:24px;

}

.heading h2{

font-size:clamp(58px,6vw,90px);

line-height:.95;

color:white;

margin-bottom:22px;

letter-spacing:-.05em;

}

.heading p{

font-size:20px;

line-height:1.8;

max-width:620px;

margin:auto;

color:#CBD5E1;

}

/* ======================
BUTTONS
====================== */

.controls{

display:flex;

justify-content:center;

gap:18px;

margin-bottom:70px;

}

.controls button{

width:62px;

height:62px;

border:none;

border-radius:50%;

background:white;

font-size:22px;

cursor:pointer;

box-shadow:

0 18px 40px rgba(0,0,0,.15);

transition:.35s;

}

.controls button:hover{

background:#2563EB;

color:white;

transform:translateY(-6px);

}

/* ======================
3D STAGE
====================== */

.coverflow{

position:relative;

height:720px;

width:100%;

display:flex;

justify-content:center;

align-items:center;

perspective:3200px;

transform-style:preserve-3d;

overflow:visible;

}

.coverflow::before{

content:"";

position:absolute;

left:50%;

top:50%;

transform:

translate(-50%,-50%)

rotateX(82deg);

width:1050px;

height:1050px;

border-radius:50%;

border:1px solid rgba(59,130,246,.08);

}

/* ======================
CARDS
====================== */

.card{

position:absolute;

width:620px;

min-height:430px;

padding:46px;

border-radius:36px;

background:white;

border:1px solid #E5E7EB;

box-shadow:

0 40px 100px rgba(15,23,42,.12);

transition:

transform .85s cubic-bezier(.22,1,.36,1),

opacity .7s,

filter .7s,

box-shadow .5s;

backface-visibility:hidden;

transform-style:preserve-3d;

overflow:hidden;

}

.card:hover{

box-shadow:

0 60px 130px rgba(37,99,235,.18);

}

.number{

font-size:13px;

font-weight:700;

letter-spacing:.35em;

color:#94A3B8;

margin-bottom:22px;

}

.icon{

width:76px;

height:76px;

display:flex;

align-items:center;

justify-content:center;

border-radius:24px;

background:#EEF4FF;

font-size:34px;

margin-bottom:30px;

transition:.35s;

}

.card:hover .icon{

transform:scale(1.08) rotate(-6deg);

background:#DBEAFE;

}

.card h3{

font-size:42px;

color:#101828;

margin-bottom:22px;

line-height:1.05;

}

.card p{

font-size:18px;

line-height:1.85;

color:#667085;

margin-bottom:40px;

}

.bottom{

display:flex;

justify-content:space-between;

align-items:center;

margin-top:auto;

}

.bottom span{

font-size:15px;

font-weight:700;

color:#2563EB;

}

.bottom button{

width:52px;

height:52px;

border:none;

border-radius:50%;

background:#EEF4FF;

color:#2563EB;

font-size:18px;

cursor:pointer;

transition:.35s;

}

.bottom button:hover{

background:#2563EB;

color:white;

transform:translateX(4px);

}

/* ======================
ANIMATIONS
====================== */
/* ======================
RESPONSIVE
====================== */

@media(max-width:992px){

.industries{

padding:130px 0;

}

.coverflow{

height:560px;

}

.card{

width:86vw;

min-height:380px;

padding:34px;

}

.heading h2{

font-size:52px;

}

}

@media(max-width:768px){

.industries{

padding:90px 0;

}

.heading h2{

font-size:40px;

line-height:1;

}

.heading p{

font-size:16px;

}

.card{

width:92vw;

padding:26px;

border-radius:26px;

}

.card h3{

font-size:30px;

}

.card p{

font-size:15px;

}

.coverflow{

height:500px;

}

}

</style>
