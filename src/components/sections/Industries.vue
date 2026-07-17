<template>

<section id="industries" class="industries">

<div class="grid-bg"></div>

<div class="glow glow-left"></div>

<div class="glow glow-right"></div>

<div class="container-custom">

<!-- ================= Heading ================= -->

<div class="heading">

<div class="eyebrow">

INDUSTRIES

</div>

<h2>

AI built for

<span>every industry.</span>

</h2>

<p>

Woxza adapts to the way your industry works.
automating workflows, enhancing customer
experiences and driving real business impact.

</p>

</div>

<!-- ================= Top Features ================= -->

<div class="top-features">

<div class="feature">

<div class="feature-icon">

🤖

</div>

<div>

<strong>

Purpose-built AI

</strong>

<small>

Tailored to industry needs

</small>

</div>

</div>

<div class="feature">

<div class="feature-icon">

📈

</div>

<div>

<strong>

Proven impact

</strong>

<small>

Measurable business results

</small>

</div>

</div>

<div class="feature">

<div class="feature-icon">

🛡️

</div>

<div>

<strong>

Enterprise ready

</strong>

<small>

Secure, reliable & scalable

</small>

</div>

</div>

</div>

<!-- ================= Slider ================= -->

<div class="slider-wrapper">

<button

class="arrow left"

@click="prev"

>

←

</button>

<div class="cards">

<div

v-for="(industry,index) in visibleIndustries"

:key="industry.title"

class="card"

:class="{

active:index===3

}"

>

<div class="icon">

{{ industry.icon }}

</div>

<h3>

{{ industry.title }}

</h3>

<p class="headline">

{{ industry.headline }}

</p>

<ul>

<li

v-for="item in industry.features"

:key="item"

>

<span>

✓

</span>

{{ item }}

</li>

</ul>

<div class="tag">

{{ industry.tag }}

</div>

</div>

</div>

<button

class="arrow right"

@click="next"

>

→

</button>

</div>

<!-- ================= Dots ================= -->

<div class="dots">

<span

v-for="(_,i) in industries"

:key="i"

:class="{

active:i===current

}"

></span>

</div>

<!-- ================= Footer ================= -->

<div class="bottom">

🏢 Trusted by businesses across 20+ industries worldwide

</div>

</div>

</section>

</template>

<script setup>

import { computed, ref } from "vue"

const current = ref(3)

/* ===========================
INDUSTRIES
=========================== */

const industries = [

{
icon:"✈️",
title:"Travel",
headline:"Deliver seamless journeys from booking to arrival.",

features:[
"Booking assistance",
"Cancellations & changes",
"Itinerary updates",
"Travel support"
],

tag:"BOOKING & SUPPORT"
},

{
icon:"💼",
title:"Professional Services",
headline:"Convert more enquiries into clients.",

features:[
"Lead qualification",
"Consultation booking",
"Client follow-ups",
"Document collection"
],

tag:"CLIENT ENGAGEMENT"
},

{
icon:"🏥",
title:"Healthcare",
headline:"Never miss a patient call.",

features:[
"Appointment scheduling",
"Patient FAQs & triage",
"Prescription & report updates",
"Multilingual patient support"
],

tag:"PATIENT ACCESS"
},

{
icon:"🎓",
title:"Education",
headline:"Support every learner from enquiry to enrollment.",

features:[
"Admission enquiries",
"Course recommendations",
"Interview scheduling",
"Fee & application reminders"
],

tag:"STUDENT ENROLLMENT"
},

{
icon:"🛍️",
title:"Retail",
headline:"Turn every shopper into a returning customer.",

features:[
"Product enquiries",
"Order tracking",
"Returns & exchanges",
"Personalized recommendations"
],

tag:"CUSTOMER SUPPORT"
},

{
icon:"🏭",
title:"Manufacturing",
headline:"Keep operations moving without missed calls.",

features:[
"Supplier coordination",
"Inventory enquiries",
"Service requests",
"Dispatch & order updates"
],

tag:"OPERATIONS SUPPORT"
},

{
icon:"🏢",
title:"Enterprise",
headline:"Automate conversations across every department.",

features:[
"IT helpdesk",
"HR employee support",
"Internal workflows",
"Customer service automation"
],

tag:"BUSINESS OPERATIONS"
},

{
icon:"🏦",
title:"Finance",
headline:"Deliver secure banking conversations 24/7.",

features:[
"Account enquiries",
"Loan pre-qualification",
"Appointment booking",
"Payment reminders"
],

tag:"CUSTOMER BANKING"
}

]

/* ===========================
VISIBLE 7 CARDS
=========================== */

const visibleIndustries = computed(()=>{

const result=[]

for(let i=-3;i<=3;i++){

const index=

(current.value+i+industries.length)

%

industries.length

result.push(industries[index])

}

return result

})

/* ===========================
SLIDER
=========================== */

function next(){

current.value=

(current.value+1)

%

industries.length

}

function prev(){

current.value=

(current.value-1+industries.length)

%

industries.length

}

</script>

<style scoped>

/* ==========================================================
SECTION
========================================================== */

.industries{

position:relative;

padding:170px 0;

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

/* ==========================================================
BACKGROUND
========================================================== */

.grid-bg{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),

linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);

background-size:48px 48px;

opacity:.45;

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

left:-240px;

top:-220px;

background:rgba(59,130,246,.14);

}

.glow-right{

width:700px;

height:700px;

right:-240px;

bottom:-240px;

background:rgba(59,130,246,.08);

}

/* ==========================================================
CONTAINER
========================================================== */

.container-custom{

position:relative;

z-index:5;

max-width:1700px;

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

margin-bottom:70px;

}

.eyebrow{

display:inline-flex;

padding:10px 18px;

border-radius:999px;

background:rgba(59,130,246,.12);

border:1px solid rgba(59,130,246,.22);

font-size:11px;

font-weight:700;

letter-spacing:.25em;

color:#BFDBFE;

margin-bottom:24px;

}

.heading h2{

margin:0;

font-size:clamp(58px,5vw,82px);

line-height:.94;

letter-spacing:-.05em;

color:white;

}

.heading h2 span{

display:block;

color:#60A5FA;

}

.heading p{

max-width:650px;

margin:28px auto 0;

font-size:18px;

line-height:1.8;

color:#CBD5E1;

}

/* ==========================================================
TOP FEATURES
========================================================== */

.top-features{

display:grid;

grid-template-columns:repeat(3,1fr);

gap:22px;

max-width:1200px;

margin:70px auto;

}

.feature{

display:flex;

align-items:center;

gap:18px;

padding:24px;

background:rgba(255,255,255,.04);

border:1px solid rgba(255,255,255,.08);

border-radius:22px;

backdrop-filter:blur(20px);

transition:.35s;

}

.feature:hover{

transform:translateY(-5px);

border-color:#2563EB;

}

.feature-icon{

width:58px;

height:58px;

display:flex;

align-items:center;

justify-content:center;

border-radius:18px;

background:#2563EB;

font-size:24px;

flex-shrink:0;

}

.feature strong{

display:block;

color:white;

font-size:16px;

margin-bottom:6px;

}

.feature small{

color:#94A3B8;

font-size:13px;

}

/* ==========================================================
SLIDER
========================================================== */

.slider-wrapper{

display:grid;

grid-template-columns:70px 1fr 70px;

align-items:center;

gap:26px;

margin-top:70px;

}

.cards{

display:grid;

grid-template-columns:repeat(7,1fr);

gap:22px;

align-items:stretch;

}

/* ==========================================================
ARROWS
========================================================== */

.arrow{

width:60px;

height:60px;

border:none;

border-radius:50%;

background:white;

font-size:22px;

cursor:pointer;

transition:.3s;

box-shadow:

0 15px 35px rgba(0,0,0,.15);

}

.arrow:hover{

background:#2563EB;

color:white;

transform:translateY(-4px);

}

/* ==========================================================
CARDS
========================================================== */

.card{

position:relative;

display:flex;

flex-direction:column;

background:#FFFFFF;

border-radius:24px;

padding:24px;

height:390px;

border:1px solid #E7ECF4;

box-shadow:

0 18px 45px rgba(15,23,42,.08);

transition:

all .35s cubic-bezier(.22,1,.36,1);

overflow:hidden;

}

/* Blue Top Accent */

.card::before{

content:"";

position:absolute;

top:0;

left:0;

right:0;

height:4px;

background:linear-gradient(

90deg,

#2563EB,

#60A5FA

);

opacity:0;

transition:.35s;

}

.card:hover{

transform:translateY(-8px);

box-shadow:

0 30px 80px rgba(37,99,235,.18);

}

.card:hover::before{

opacity:1;

}

/* ===========================
ACTIVE CARD
=========================== */

.card.active{

transform:translateY(-12px);

border-color:#2563EB;

box-shadow:

0 40px 90px rgba(37,99,235,.22);

}

.card.active::before{

opacity:1;

}

/* ===========================
ICON
=========================== */

.icon{

width:52px;

height:52px;

display:flex;

align-items:center;

justify-content:center;

border-radius:16px;

background:#EEF4FF;

font-size:24px;

margin-bottom:22px;

transition:.35s;

}

.card.active .icon,

.card:hover .icon{

background:#2563EB;

color:white;

transform:rotate(-6deg);

}

/* ===========================
TITLE
=========================== */

.card h3{

font-size:21px;

font-weight:700;

line-height:1.2;

letter-spacing:-.02em;

margin:0;

margin-bottom:14px;

color:#14264D;

}

/* ===========================
HEADLINE
=========================== */

.headline{

font-size:14px;

line-height:1.7;

color:#667085;

margin:0 0 22px;

min-height:54px;

}

/* ===========================
FEATURE LIST
=========================== */

.card ul{

list-style:none;

padding:0;

margin:0;

display:flex;

flex-direction:column;

gap:12px;

flex:1;

}

.card li{

display:flex;

align-items:flex-start;

gap:10px;

font-size:13px;

line-height:1.5;

color:#344054;

}

.card li span{

display:flex;

align-items:center;

justify-content:center;

width:20px;

height:20px;

border-radius:50%;

background:#DBEAFE;

color:#2563EB;

font-size:11px;

font-weight:700;

flex-shrink:0;

margin-top:1px;

}

/* ===========================
BOTTOM TAG
=========================== */

.tag{

margin-top:auto;

display:inline-flex;

align-items:center;

justify-content:center;

align-self:flex-start;

padding:10px 14px;

border-radius:999px;

background:#EEF4FF;

border:1px solid #BFDBFE;

font-size:10px;

font-weight:700;

letter-spacing:.14em;

text-transform:uppercase;

color:#2563EB;

transition:.35s;

}

.card.active .tag,

.card:hover .tag{

background:#2563EB;

color:white;

border-color:#2563EB;

}

/* ==========================================================
DOTS
========================================================== */

.dots{

display:flex;

justify-content:center;

align-items:center;

gap:10px;

margin-top:45px;

}

.dots span{

width:8px;

height:8px;

border-radius:50%;

background:rgba(255,255,255,.25);

transition:.35s;

cursor:pointer;

}

.dots span.active{

width:34px;

border-radius:999px;

background:#3B82F6;

box-shadow:

0 0 20px rgba(59,130,246,.35);

}

/* ==========================================================
BOTTOM
========================================================== */

.bottom{

display:flex;

justify-content:center;

align-items:center;

margin-top:32px;

color:#CBD5E1;

font-size:15px;

font-weight:500;

gap:14px;

}

.bottom::before,

.bottom::after{

content:"";

width:90px;

height:1px;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.18),

transparent

);

}

/* ==========================================================
CARD SHINE
========================================================== */

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

rgba(255,255,255,.45),

transparent

);

transform:skewX(-20deg);

transition:1.1s;

pointer-events:none;

}

.card:hover::after{

left:150%;

}

/* ==========================================================
ANIMATIONS
========================================================== */

.card{

opacity:0;

animation:cardFade .65s ease forwards;

}

.card:nth-child(1){animation-delay:.05s;}
.card:nth-child(2){animation-delay:.10s;}
.card:nth-child(3){animation-delay:.15s;}
.card:nth-child(4){animation-delay:.20s;}
.card:nth-child(5){animation-delay:.25s;}
.card:nth-child(6){animation-delay:.30s;}
.card:nth-child(7){animation-delay:.35s;}

@keyframes cardFade{

from{

opacity:0;

transform:translateY(30px);

}

to{

opacity:1;

transform:translateY(0);

}

}

.heading{

animation:fadeUp .7s ease;

}

@keyframes fadeUp{

from{

opacity:0;

transform:translateY(20px);

}

to{

opacity:1;

transform:translateY(0);

}

}

/* ==========================================================
3D CAROUSEL EFFECT
========================================================== */

.cards{

perspective:2200px;

transform-style:preserve-3d;

}

/* Default cards */

.card{

transform:scale(.92);

opacity:.82;

filter:blur(.2px);

}

/* Left side */

.card:nth-child(1){

transform:
translateY(28px)
scale(.82);

opacity:.45;

}

.card:nth-child(2){

transform:
translateY(18px)
scale(.88);

opacity:.70;

}

.card:nth-child(3){

transform:
translateY(8px)
scale(.95);

opacity:.92;

}

/* ===========================
CENTER CARD
=========================== */

.card:nth-child(4){

transform:

translateY(-16px)

scale(1.08);

opacity:1;

z-index:20;

box-shadow:

0 45px 120px rgba(37,99,235,.22);

}

/* ===========================
RIGHT SIDE
=========================== */

.card:nth-child(5){

transform:
translateY(8px)
scale(.95);

opacity:.92;

}

.card:nth-child(6){

transform:
translateY(18px)
scale(.88);

opacity:.70;

}

.card:nth-child(7){

transform:
translateY(28px)
scale(.82);

opacity:.45;

}

/* ==========================================================
ACTIVE CARD
========================================================== */

.card.active{

border:2px solid #2563EB;

background:white;

}

/* ==========================================================
ICON
========================================================== */

.card:nth-child(4) .icon{

background:#2563EB;

color:white;

box-shadow:

0 18px 40px rgba(37,99,235,.30);

}

/* ==========================================================
TAG
========================================================== */

.card:nth-child(4) .tag{

background:#2563EB;

color:white;

border-color:#2563EB;

}

/* ==========================================================
SMOOTH TRANSITIONS
========================================================== */

.card{

transition:

transform .65s cubic-bezier(.22,1,.36,1),

opacity .55s,

box-shadow .45s,

filter .45s;

}

/* ==========================================================
ARROWS
========================================================== */

.arrow{

display:flex;

align-items:center;

justify-content:center;

font-size:22px;

font-weight:700;

}

.arrow:hover{

transform:

translateY(-3px)

scale(1.08);

}

/* ==========================================================
FEATURE HOVER
========================================================== */

.card li{

transition:.25s;

}

.card:hover li{

transform:translateX(5px);

}

/* ==========================================================
SUBTLE FLOAT
========================================================== */

.card:nth-child(4){

animation:centerFloat 5s ease-in-out infinite;

}

@keyframes centerFloat{

0%{

transform:

translateY(-16px)

scale(1.08);

}

50%{

transform:

translateY(-22px)

scale(1.08);

}

100%{

transform:

translateY(-16px)

scale(1.08);

}

}

/* ==========================================================
PREMIUM POLISH
========================================================== */

.card{

backdrop-filter:blur(14px);

-webkit-backdrop-filter:blur(14px);

}

/* Glass Reflection */

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

rgba(255,255,255,.45),

transparent

);

transform:skewX(-20deg);

transition:1.1s ease;

pointer-events:none;

}

.card:hover::after{

left:140%;

}

/* Better icon */

.icon{

box-shadow:

0 10px 24px rgba(37,99,235,.14);

}

/* Better tag */

.tag{

white-space:nowrap;

}

/* Typography */

.card h3{

text-wrap:balance;

}

.headline{

text-wrap:balance;

}

/* Better bullets */

.card li{

line-height:1.55;

}

/* Smooth scrolling */

html{

scroll-behavior:smooth;

}

/* ==========================================================
RESPONSIVE
========================================================== */

@media(max-width:1500px){

.cards{

grid-template-columns:repeat(5,1fr);

}

.card:nth-child(1),

.card:nth-child(7){

display:none;

}

}

@media(max-width:1200px){

.top-features{

grid-template-columns:1fr;

max-width:620px;

}

.cards{

grid-template-columns:repeat(3,1fr);

}

.card:nth-child(1),

.card:nth-child(2),

.card:nth-child(6),

.card:nth-child(7){

display:none;

}

.slider-wrapper{

grid-template-columns:60px 1fr 60px;

}

}

@media(max-width:768px){

.industries{

padding:100px 0;

}

.container-custom{

padding:0 20px;

}

.heading h2{

font-size:42px;

}

.heading p{

font-size:16px;

}

.cards{

grid-template-columns:1fr;

}

.card{

display:flex !important;

height:auto;

min-height:390px;

transform:none !important;

opacity:1 !important;

}

.card:not(.active){

display:none !important;

}

.slider-wrapper{

grid-template-columns:50px 1fr 50px;

gap:12px;

}

.arrow{

width:48px;

height:48px;

font-size:18px;

}

.bottom{

font-size:14px;

text-align:center;

padding:0 20px;

}

.bottom::before,

.bottom::after{

display:none;

}

}

@media(max-width:480px){

.heading h2{

font-size:34px;

}

.card{

padding:22px;

border-radius:22px;

}

.icon{

width:48px;

height:48px;

font-size:20px;

}

.card h3{

font-size:18px;

}

.headline{

font-size:14px;

}

.card li{

font-size:13px;

}

.tag{

font-size:10px;

padding:8px 12px;

}

}

/* ==========================================================
REDUCED MOTION
========================================================== */

@media(prefers-reduced-motion:reduce){

*,

*::before,

*::after{

animation:none !important;

transition:none !important;

}

}

</style>
