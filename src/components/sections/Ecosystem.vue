<template>

<section
id="ecosystem"
class="ecosystem"
:class="{ visible }"
>

<div class="background-grid"></div>

<div class="background-glow glow-one"></div>
<div class="background-glow glow-two"></div>

<div class="container-custom">

<!-- =========================
Heading
========================= -->

<div class="heading">

<div class="eyebrow">

WOXZA ECOSYSTEM

</div>

<h2>

One AI

<span>

Intelligence Layer.

</span>

</h2>

<p>

Every capability communicates with another,

creating one connected AI operating system

for your organization.

</p>

</div>

<!-- =========================
Stage
========================= -->

<div
ref="stage"
class="ecosystem-stage"
:style="{ '--scroll-progress': scrollProgress }"
>

<!-- Orbit -->

<div class="orbit orbit-one"></div>
<div class="orbit orbit-two"></div>
<div class="orbit orbit-three"></div>

<!-- Core -->

<div class="core">

<div class="pulse pulse-one"></div>
<div class="pulse pulse-two"></div>

<div class="core-card">

<small>

AI CORE

</small>

<h3>

WOXZA

</h3>

<span>

Connected Intelligence

</span>

</div>

</div>

<!-- LEFT -->

<div class="left-column">

<div class="service-card">

<div class="service-icon">

<Bot aria-hidden="true" />

</div>

<h4>

AI Employees

</h4>

<p>

Autonomous digital workers that answer,

qualify and execute tasks.

</p>

</div>

<div class="service-card">

<div class="service-icon">

<ChartNoAxesCombined aria-hidden="true" />

</div>

<h4>

Analytics

</h4>

<p>

Real-time business intelligence

and conversation insights.

</p>

</div>

</div>

<!-- RIGHT -->

<div class="right-column">

<div class="service-card">

<div class="service-icon">

<ContactRound aria-hidden="true" />

</div>

<h4>

CRM

</h4>

<p>

Customer records synchronized

automatically.

</p>

</div>

<div class="service-card">

<div class="service-icon">

<CalendarDays aria-hidden="true" />

</div>

<h4>

Calendar

</h4>

<p>

Meetings, reminders and scheduling

handled automatically.

</p>

</div>

</div>

<!-- TOP -->

<div class="node top">

<div class="node-icon">

<AudioLines aria-hidden="true" />

</div>

<span>

Voice AI

</span>

</div>

<!-- RIGHT -->

<div class="node right">

<div class="node-icon">

<Bot aria-hidden="true" />

</div>

<span>

Agents

</span>

</div>

<!-- BOTTOM -->

<div class="node bottom">

<div class="node-icon">

<Workflow aria-hidden="true" />

</div>

<span>

Automation

</span>

</div>

<!-- LEFT -->

<div class="node left">

<div class="node-icon">

<BookOpen aria-hidden="true" />

</div>

<span>

Knowledge

</span>

</div>

</div>

</div>

</section>

</template>

<script setup>

import {
ref,
onMounted,
onUnmounted
} from "vue"
import { AudioLines, BookOpen, Bot, CalendarDays, ChartNoAxesCombined, ContactRound, Workflow } from "lucide-vue-next"

/* ===========================================
REFERENCES
=========================================== */

const stage = ref(null)

/* ===========================================
PARALLAX
=========================================== */

const mouseX = ref(0)
const mouseY = ref(0)
const scrollProgress = ref(0)

let frame = 0

function handleMouse(e){

if(!stage.value) return

const rect = stage.value.getBoundingClientRect()

mouseX.value =
((e.clientX-rect.left)/rect.width-.5)*18

mouseY.value =
((e.clientY-rect.top)/rect.height-.5)*18

stage.value.style.setProperty(

"--mx",

`${mouseX.value}px`

)

stage.value.style.setProperty(

"--my",

`${mouseY.value}px`

)

}

/* ===========================================
SCROLL REVEAL
=========================================== */

const visible = ref(false)

let observer

function updateScrollProgress(){

frame = 0

if(!stage.value) return

const rect = stage.value.getBoundingClientRect()
const travel = window.innerHeight + rect.height
const raw = (window.innerHeight - rect.top) / travel

scrollProgress.value = Math.min(
1,
Math.max(0,raw)
).toFixed(3)

}

function requestProgressUpdate(){

if(frame) return

frame = requestAnimationFrame(updateScrollProgress)

}

/* ===========================================
FLOATING DATA
=========================================== */

const metrics = ref({

conversations:"24.8M",

calls:"96.4%",

automation:"18K",

uptime:"99.99%"

})

/* ===========================================
LIFECYCLE
=========================================== */

onMounted(()=>{

if(!stage.value) return

observer = new IntersectionObserver(

(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

visible.value=true

requestProgressUpdate()

}

})

},

{

threshold:.25

}

)

observer.observe(stage.value)

window.addEventListener(

"mousemove",

handleMouse

)

window.addEventListener(

"scroll",

requestProgressUpdate,

{ passive:true }

)

window.addEventListener(

"resize",

requestProgressUpdate,

{ passive:true }

)

requestProgressUpdate()

})

onUnmounted(()=>{

observer?.disconnect()

window.removeEventListener(

"mousemove",

handleMouse

)

window.removeEventListener(

"scroll",

requestProgressUpdate

)

window.removeEventListener(

"resize",

requestProgressUpdate

)

if(frame){

cancelAnimationFrame(frame)

}

})

</script>

<style scoped>

/* ==========================================================
SECTION
========================================================== */

.ecosystem{

position:relative;

padding:180px 0;

overflow:hidden;

background:

linear-gradient(
180deg,
#F8FAFD 0%,
#F2F6FC 100%
);

isolation:isolate;

}

/* ==========================================================
BACKGROUND GRID
========================================================== */

.background-grid{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(20,38,77,.045) 1px,transparent 1px),

linear-gradient(
90deg,
rgba(20,38,77,.045) 1px,
transparent 1px
);

background-size:52px 52px;

pointer-events:none;

opacity:.6;

}

/* ==========================================================
GLOWS
========================================================== */

.background-glow{

position:absolute;

border-radius:50%;

filter:blur(140px);

animation:blobFloat 18s ease-in-out infinite alternate;

}

.glow-one{

width:700px;

height:700px;

left:-220px;

top:-180px;

background:rgba(37,99,235,.12);

}

.glow-two{

width:720px;

height:720px;

right:-240px;

bottom:-260px;

background:rgba(96,165,250,.10);

animation-delay:5s;

}

/* ==========================================================
CONTAINER
========================================================== */

.container-custom{

position:relative;

z-index:5;

max-width:1500px;

margin:auto;

padding:0 40px;

}

/* ==========================================================
HEADING
========================================================== */

.heading{

text-align:center;

max-width:760px;

margin:auto;

margin-bottom:120px;

opacity:0;

transform:translateY(40px);

transition:1s cubic-bezier(.22,1,.36,1);

}

.ecosystem.visible .heading{

opacity:1;

transform:none;

}

.eyebrow{

display:inline-flex;

padding:10px 20px;

border-radius:999px;

background:#EAF2FF;

border:1px solid rgba(37,99,235,.14);

font-size:11px;

font-weight:700;

letter-spacing:.25em;

color:#2563EB;

margin-bottom:26px;

}

.heading h2{

font-size:clamp(62px,6vw,92px);

line-height:.93;

letter-spacing:-.05em;

font-weight:700;

color:#0F172A;

margin-bottom:24px;

}

.heading h2 span{

display:block;

color:#2563EB;

}

.heading p{

max-width:650px;

margin:auto;

font-size:20px;

line-height:1.9;

color:#667085;

}

/* ==========================================================
STAGE
========================================================== */

.ecosystem-stage{

position:relative;

height:900px;

display:flex;

justify-content:center;

align-items:center;

--mx:0px;

--my:0px;

--scroll-progress:0;

opacity:0;

transform:
translateY(50px)
scale(.96);

transition:
opacity .9s cubic-bezier(.22,1,.36,1),
transform .9s cubic-bezier(.22,1,.36,1);

will-change:transform,opacity;

}

.ecosystem.visible .ecosystem-stage{

opacity:1;

transform:
translateY(0)
scale(1);

}

/* ==========================================================
ORBITS
========================================================== */

.orbit{

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

border-radius:50%;

border:1px solid rgba(37,99,235,.12);

animation:orbitRotate linear infinite;

pointer-events:none;

}

.orbit-one{

width:340px;

height:340px;

animation-duration:40s;

}

.orbit-two{

width:520px;

height:520px;

animation-duration:60s;

animation-direction:reverse;

}

.orbit-three{

width:700px;

height:700px;

opacity:.45;

animation-duration:80s;

}

.ecosystem.visible .orbit-one{

transform:
translate(-50%,-50%)
scale(calc(.88 + (var(--scroll-progress) * .12)));

}

.ecosystem.visible .orbit-two{

transform:
translate(-50%,-50%)
scale(calc(.84 + (var(--scroll-progress) * .16)));

}

.ecosystem.visible .orbit-three{

transform:
translate(-50%,-50%)
scale(calc(.80 + (var(--scroll-progress) * .20)));

}

/* ==========================================================
AI CORE
========================================================== */

.core{

position:absolute;

left:50%;

top:50%;

transform:

translate(-50%,-50%)

translate(

calc(var(--mx) * .25),

calc(var(--my) * .25)

);

width:220px;

height:220px;

display:flex;

justify-content:center;

align-items:center;

z-index:30;

transition:

transform .25s ease;

opacity:0;

filter:blur(10px);

}

.ecosystem.visible .core{

opacity:1;

filter:blur(0);

transition:
opacity .8s cubic-bezier(.22,1,.36,1),
filter .8s cubic-bezier(.22,1,.36,1),
transform .25s ease;

}

/* ==========================================================
CORE CARD
========================================================== */

.core-card{

position:relative;

width:180px;

height:180px;

border-radius:50%;

background:rgba(255,255,255,.94);

backdrop-filter:blur(20px);

border:1px solid rgba(37,99,235,.16);

display:flex;

flex-direction:column;

justify-content:center;

align-items:center;

box-shadow:

0 25px 80px rgba(37,99,235,.18);

z-index:20;

animation:

coreFloat 6s ease-in-out infinite;

}

.core-card small{

font-size:11px;

letter-spacing:.28em;

font-weight:700;

color:#2563EB;

margin-bottom:10px;

}

.core-card h3{

margin:0;

font-size:42px;

font-weight:700;

color:#101828;

}

.core-card span{

margin-top:10px;

font-size:14px;

color:#667085;

}

/* ==========================================================
PULSE
========================================================== */

.pulse{

position:absolute;

border-radius:50%;

border:2px solid rgba(37,99,235,.18);

width:220px;

height:220px;

animation:pulseRing 3.5s infinite;

}

.pulse-two{

animation-delay:1.75s;

}

/* ==========================================================
KEYFRAMES
========================================================== */

@keyframes orbitRotate{

from{

transform:

translate(-50%,-50%)

rotate(0deg);

}

to{

transform:

translate(-50%,-50%)

rotate(360deg);

}

}

@keyframes pulseRing{

0%{

transform:scale(1);

opacity:.6;

}

100%{

transform:scale(1.65);

opacity:0;

}

}

@keyframes coreFloat{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(-12px);

}

}

@keyframes blobFloat{

0%{

transform:translateY(0);

}

100%{

transform:translateY(40px);

}

}

/* ==========================================================
NODES
========================================================== */

.node{

position:absolute;

display:flex;

align-items:center;

gap:14px;

padding:18px 24px;

background:rgba(255,255,255,.92);

backdrop-filter:blur(18px);

border:1px solid rgba(37,99,235,.12);

border-radius:22px;

box-shadow:

0 15px 40px rgba(15,23,42,.08);

transition:

all .45s cubic-bezier(.22,1,.36,1);

cursor:pointer;

z-index:20;

animation:nodeFloat 6s ease-in-out infinite;

opacity:0;

filter:blur(8px);

}

.ecosystem.visible .node{

opacity:1;

filter:blur(0);

}

/* Different floating timings */

.top{

top:80px;

left:50%;

transform:translateX(-50%);

animation-delay:0s;

}

.right{

right:140px;

top:50%;

transform:translateY(-50%);

animation-delay:1.4s;

}

.bottom{

bottom:80px;

left:50%;

transform:translateX(-50%);

animation-delay:2.8s;

}

.left{

left:140px;

top:50%;

transform:translateY(-50%);

animation-delay:4.2s;

}

.ecosystem.visible .top{

transition-delay:.2s;

}

.ecosystem.visible .right{

transition-delay:.34s;

}

.ecosystem.visible .bottom{

transition-delay:.48s;

}

.ecosystem.visible .left{

transition-delay:.62s;

}

/* ==========================================================
NODE ICON
========================================================== */

.node-icon{

width:52px;

height:52px;

display:flex;

justify-content:center;

align-items:center;

border-radius:16px;

background:#EEF4FF;

font-size:24px;

transition:.35s;

flex-shrink:0;

}

.node span{

font-size:16px;

font-weight:700;

color:#101828;

}

/* ==========================================================
NODE HOVER
========================================================== */

.node:hover{

transform:

translateY(-10px)

scale(1.05);

border-color:#2563EB;

box-shadow:

0 25px 70px rgba(37,99,235,.18);

}

.node:hover .node-icon{

background:#2563EB;

color:white;

transform:rotate(-6deg);

}

/* ==========================================================
LEFT COLUMN
========================================================== */

.left-column{

position:absolute;

left:0;

top:50%;

transform:translateY(-50%);

display:flex;

flex-direction:column;

gap:26px;

}

/* ==========================================================
RIGHT COLUMN
========================================================== */

.right-column{

position:absolute;

right:0;

top:50%;

transform:translateY(-50%);

display:flex;

flex-direction:column;

gap:26px;

}

/* ==========================================================
SERVICE CARDS
========================================================== */

.service-card{

width:270px;

padding:28px;

background:rgba(255,255,255,.94);

backdrop-filter:blur(20px);

border:1px solid rgba(37,99,235,.10);

border-radius:24px;

box-shadow:

0 15px 45px rgba(15,23,42,.08);

transition:

all .4s cubic-bezier(.22,1,.36,1);

animation:cardFloat 7s ease-in-out infinite;

opacity:0;

filter:blur(8px);

will-change:transform,opacity;

}

.ecosystem.visible .service-card{

opacity:1;

filter:blur(0);

}

.left-column .service-card:nth-child(1){

animation-delay:.6s;

transition-delay:.18s;

}

.left-column .service-card:nth-child(2){

animation-delay:2.2s;

transition-delay:.34s;

}

.right-column .service-card:nth-child(1){

animation-delay:1.2s;

transition-delay:.26s;

}

.right-column .service-card:nth-child(2){

animation-delay:3.4s;

transition-delay:.42s;

}

/* ==========================================================
SERVICE ICON
========================================================== */

.service-icon{

width:58px;

height:58px;

display:flex;

align-items:center;

justify-content:center;

background:#EEF4FF;

border-radius:18px;

font-size:26px;

margin-bottom:18px;

transition:.35s;

}

.service-card h4{

margin:0 0 12px;

font-size:22px;

font-weight:700;

color:#101828;

}

.service-card p{

margin:0;

font-size:15px;

line-height:1.8;

color:#667085;

}

/* ==========================================================
SERVICE HOVER
========================================================== */

.service-card:hover{

transform:

translateY(-10px)

scale(1.03);

border-color:#2563EB;

box-shadow:

0 30px 80px rgba(37,99,235,.16);

}

.service-card:hover .service-icon{

background:#2563EB;

color:white;

transform:rotate(-6deg);

}

/* ==========================================================
FLOATING
========================================================== */

@keyframes nodeFloat{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(-10px);

}

}

@keyframes cardFloat{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(-8px);

}

}

/* ==========================================================
CONNECTOR LINES
========================================================== */

.ecosystem-stage::before{

content:"";

position:absolute;

left:50%;

top:50%;

width:620px;

height:620px;

transform:
translate(-50%,-50%)
scale(calc(.72 + (var(--scroll-progress) * .28)));

pointer-events:none;

background:

linear-gradient(rgba(37,99,235,.12),rgba(37,99,235,.12)) center/2px 100% no-repeat,

linear-gradient(90deg,rgba(37,99,235,.12),rgba(37,99,235,.12)) center/100% 2px no-repeat;

z-index:1;

opacity:calc(.15 + (var(--scroll-progress) * .85));

}

/* ==========================================================
DATA PARTICLES
========================================================== */

.ecosystem-stage::after{

content:"";

position:absolute;

left:50%;

top:50%;

width:12px;

height:12px;

border-radius:50%;

background:#3B82F6;

transform:translate(-50%,-50%);

box-shadow:

0 0 25px rgba(59,130,246,.55),

0 0 60px rgba(59,130,246,.30);

animation:dataFlow 6s linear infinite;

z-index:50;

opacity:calc(.35 + (var(--scroll-progress) * .65));

}

@keyframes dataFlow{

0%{

transform:

translate(-50%,-50%)

translateY(-310px);

}

25%{

transform:

translate(-50%,-50%)

translateX(310px);

}

50%{

transform:

translate(-50%,-50%)

translateY(310px);

}

75%{

transform:

translate(-50%,-50%)

translateX(-310px);

}

100%{

transform:

translate(-50%,-50%)

translateY(-310px);

}

}

/* ==========================================================
PARALLAX
========================================================== */

.left-column{

transform:

translateY(-50%)

translate(

calc((var(--mx)*-.25) + ((1 - var(--scroll-progress)) * -70px)),

calc((var(--my)*-.25) + ((1 - var(--scroll-progress)) * 26px))

);

transition:.18s;

}

.right-column{

transform:

translateY(-50%)

translate(

calc((var(--mx)*.25) + ((1 - var(--scroll-progress)) * 70px)),

calc((var(--my)*.25) + ((1 - var(--scroll-progress)) * 26px))

);

transition:.18s;

}

.top{

transform:

translateX(-50%)

translate(

calc(var(--mx)*.15),

calc((var(--my)*-.15) + ((1 - var(--scroll-progress)) * -46px))

);

transition:.18s;

}

.bottom{

transform:

translateX(-50%)

translate(

calc(var(--mx)*-.15),

calc((var(--my)*.15) + ((1 - var(--scroll-progress)) * 46px))

);

transition:.18s;

}

.left{

transform:

translateY(-50%)

translate(

calc((var(--mx)*-.18) + ((1 - var(--scroll-progress)) * -46px)),

calc(var(--my)*.18)

);

transition:.18s;

}

.right{

transform:

translateY(-50%)

translate(

calc((var(--mx)*.18) + ((1 - var(--scroll-progress)) * 46px)),

calc(var(--my)*-.18)

);

transition:.18s;

}

/* ==========================================================
AMBIENT LIGHT
========================================================== */

.core::before{

content:"";

position:absolute;

width:520px;

height:520px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(37,99,235,.08),

transparent 70%

);

filter:blur(70px);

animation:ambientGlow 8s ease-in-out infinite;

z-index:-1;

}

@keyframes ambientGlow{

0%,100%{

transform:scale(1);

opacity:.45;

}

50%{

transform:scale(1.18);

opacity:.75;

}

}

/* ==========================================================
NODE GLOW
========================================================== */

.node::before{

content:"";

position:absolute;

inset:-2px;

border-radius:22px;

background:

linear-gradient(

135deg,

rgba(37,99,235,.18),

transparent,

rgba(37,99,235,.12)

);

opacity:0;

transition:.35s;

z-index:-1;

}

.node:hover::before{

opacity:1;

}

/* ==========================================================
SERVICE GLOW
========================================================== */

.service-card::before{

content:"";

position:absolute;

inset:-2px;

border-radius:24px;

background:

linear-gradient(

135deg,

rgba(37,99,235,.14),

transparent,

rgba(37,99,235,.08)

);

opacity:0;

transition:.35s;

z-index:-1;

}

.service-card:hover::before{

opacity:1;

}


/* ==========================================================
PREMIUM GLASS
========================================================== */

.service-card,
.node,
.core-card{

backdrop-filter:blur(24px);
-webkit-backdrop-filter:blur(24px);

}

/* ==========================================================
CURSOR SHINE
========================================================== */

.service-card::after,
.node::after{

content:"";

position:absolute;

top:0;

left:-130%;

width:45%;

height:100%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.65),

transparent

);

transform:skewX(-18deg);

transition:1.2s;

pointer-events:none;

}

.service-card:hover::after,
.node:hover::after{

left:160%;

}

/* ==========================================================
LIVE BADGES
========================================================== */

.service-card h4::after{

content:" LIVE";

font-size:10px;

font-weight:700;

padding:4px 8px;

margin-left:10px;

border-radius:999px;

background:#ECFDF3;

color:#16A34A;

letter-spacing:.12em;

}

/* ==========================================================
ICON PULSE
========================================================== */

.service-icon,
.node-icon{

animation:iconPulse 4s ease-in-out infinite;

}

.service-card:nth-child(2) .service-icon{

animation-delay:1s;

}

.node:nth-of-type(2) .node-icon{

animation-delay:1.5s;

}

.node:nth-of-type(3) .node-icon{

animation-delay:2s;

}

.node:nth-of-type(4) .node-icon{

animation-delay:2.5s;

}

@keyframes iconPulse{

0%,100%{

transform:scale(1);

}

50%{

transform:scale(1.08);

}

}

/* ==========================================================
NOISE
========================================================== */

.ecosystem::after{

content:"";

position:absolute;

inset:0;

pointer-events:none;

opacity:.03;

background-image:

radial-gradient(circle at 20% 30%,black 1px,transparent 1px),
radial-gradient(circle at 80% 60%,black 1px,transparent 1px),
radial-gradient(circle at 40% 80%,black 1px,transparent 1px);

background-size:90px 90px;

}

/* ==========================================================
BETTER SHADOWS
========================================================== */

.service-card{

box-shadow:

0 18px 60px rgba(15,23,42,.08);

}

.service-card:hover{

box-shadow:

0 40px 120px rgba(37,99,235,.18);

}

.node{

box-shadow:

0 14px 40px rgba(15,23,42,.08);

}

.node:hover{

box-shadow:

0 28px 90px rgba(37,99,235,.18);

}

.core-card{

box-shadow:

0 30px 90px rgba(37,99,235,.18);

}

/* ==========================================================
CORE SHINE
========================================================== */

.core-card::before{

content:"";

position:absolute;

inset:0;

border-radius:50%;

background:

linear-gradient(

135deg,

rgba(255,255,255,.8),

transparent 35%

);

pointer-events:none;

}

/* ==========================================================
FLOAT SPEED DIFFERENCE
========================================================== */

.left-column .service-card:nth-child(1){

animation-duration:7s;

}

.left-column .service-card:nth-child(2){

animation-duration:8s;

}

.right-column .service-card:nth-child(1){

animation-duration:6.5s;

}

.right-column .service-card:nth-child(2){

animation-duration:9s;

}

.top{

animation-duration:5s;

}

.right{

animation-duration:6s;

}

.bottom{

animation-duration:7s;

}

.left{

animation-duration:8s;

}

/* ==========================================================
SMOOTH TEXT
========================================================== */

.ecosystem{

-webkit-font-smoothing:antialiased;
text-rendering:optimizeLegibility;

}

/* ==========================================================
RESPONSIVE
========================================================== */

@media (max-width:1400px){

.container-custom{

max-width:1200px;

}

.left{

left:90px;

}

.right{

right:90px;

}

.left-column{

left:10px;

}

.right-column{

right:10px;

}

.service-card{

width:240px;

}

}

@media (max-width:1200px){

.ecosystem{

padding:140px 0;

}

.ecosystem-stage{

height:760px;

}

.orbit-three{

display:none;

}

.left{

left:40px;

}

.right{

right:40px;

}

.service-card{

width:210px;

padding:22px;

}

.heading h2{

font-size:64px;

}

}

@media (max-width:992px){

.ecosystem{

padding:120px 0;

}

.ecosystem-stage{

display:flex;

flex-direction:column;

height:auto;

gap:36px;

padding:40px 0;

}

.orbit,

.pulse{

display:none;

}

.core{

position:relative;

left:auto;

top:auto;

transform:none !important;

margin-bottom:20px;

}

.left-column,

.right-column{

position:relative;

left:auto;

right:auto;

top:auto;

transform:none !important;

display:grid;

grid-template-columns:1fr 1fr;

gap:20px;

width:100%;

}

.node{

position:relative;

left:auto;

right:auto;

top:auto;

bottom:auto;

transform:none !important;

width:min(420px,100%);

margin:auto;

}

.service-card{

width:100%;

}

}

@media (max-width:768px){

.container-custom{

padding:0 20px;

}

.heading{

margin-bottom:70px;

}

.heading h2{

font-size:44px;

line-height:1;

}

.heading p{

font-size:16px;

}

.left-column,

.right-column{

grid-template-columns:1fr;

}

.core-card{

width:150px;

height:150px;

}

.core-card h3{

font-size:34px;

}

.node{

padding:16px 18px;

}

.node-icon{

width:46px;

height:46px;

font-size:20px;

}

.service-card{

padding:20px;

}

.service-card h4{

font-size:20px;

}

.service-card p{

font-size:14px;

}

}

@media (max-width:480px){

.heading h2{

font-size:34px;

}

.eyebrow{

font-size:10px;

padding:8px 16px;

}

.node{

flex-direction:column;

text-align:center;

gap:10px;

}

.node span{

font-size:14px;

}

.core-card{

width:130px;

height:130px;

}

.core-card h3{

font-size:28px;

}

.core-card span{

font-size:12px;

}

}

/* ==========================================================
REDUCED MOTION
========================================================== */

@media (prefers-reduced-motion:reduce){

*,
*::before,
*::after{

animation:none !important;
transition:none !important;
scroll-behavior:auto !important;

}

}

/* Shared concept-tile treatment for the legacy ecosystem cards and nodes. */
.ecosystem .node-icon,
.ecosystem .service-icon{
width:46px;
height:46px;
display:grid;
place-items:center;
border-radius:14px;
font-size:0;
}

.ecosystem .node-icon svg,
.ecosystem .service-icon svg{
width:20px;
height:20px;
stroke-width:2;
}
</style>
