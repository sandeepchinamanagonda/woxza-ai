<template>

<section class="transformations">

<div class="container-custom">

<div class="heading">

<span>

REAL TRANSFORMATIONS

</span>

<h2>

See how AI
changes
the way
business works.

</h2>

<p>

Every automation begins with a problem.
Here's how intelligent systems transform
daily operations across different industries.

</p>

</div>

<!-- CARD 1 -->

<article class="story">

<div class="before">

<small>

BEFORE

</small>

<ul>

<li>Missed customer calls</li>

<li>Manual appointment booking</li>

<li>Slow response times</li>

<li>Limited working hours</li>

</ul>

</div>

<div class="middle">

<div class="arrow">

↓

</div>

<div class="core">

Voxa AI Receptionist

</div>

</div>

<div class="after">

<small>

AFTER

</small>

<ul>

<li>24/7 phone support</li>

<li>Instant booking</li>

<li>Zero missed enquiries</li>

<li>Natural conversations</li>

</ul>

</div>

</article>

<!-- CARD 2 -->

<article class="story">

<div class="before">

<small>

BEFORE

</small>

<ul>

<li>Employees copying data</li>

<li>Spreadsheet errors</li>

<li>Manual reporting</li>

<li>Disconnected tools</li>

</ul>

</div>

<div class="middle">

<div class="arrow">

↓

</div>

<div class="core">

Workflow Automation

</div>

</div>

<div class="after">

<small>

AFTER

</small>

<ul>

<li>Connected applications</li>

<li>Automatic workflows</li>

<li>Real-time reporting</li>

<li>Hours saved daily</li>

</ul>

</div>

</article>

</div>

</section>

</template>

<script setup>

</script>

<style scoped>

.transformations{

position:relative;

padding:190px 0;

overflow:hidden;

background:

radial-gradient(
circle at top left,
rgba(var(--voxa-accent-rgb),.10),
transparent 35%
),

radial-gradient(
circle at bottom right,
rgba(15,23,42,.05),
transparent 45%
),

linear-gradient(
180deg,
var(--voxa-white) 0%,
var(--voxa-soft) 100%
);

isolation:isolate;

}

.heading{

max-width:820px;

margin:auto;

text-align:center;

margin-bottom:120px;

}

.heading span{

display:inline-block;

margin-bottom:22px;

font-size:12px;

letter-spacing:.3em;

text-transform:uppercase;

font-weight:600;

color:var(--voxa-accent);

}

.heading h2{

font-size:clamp(58px,6vw,92px);

line-height:.95;

margin-bottom:28px;

color:var(--voxa-blue);

}

.heading p{

font-size:20px;

line-height:1.9;

max-width:650px;

margin:auto;

color:#64748b;

}

.story{

display:grid;

grid-template-columns:1fr 220px 1fr;

gap:60px;

align-items:center;

padding:70px 0;

border-top:1px solid rgba(15,23,42,.08);

}

.story:last-child{

border-bottom:1px solid rgba(15,23,42,.08);

}

.before,
.after{

padding:40px;

border-radius:24px;

background:rgba(255,255,255,.8);

border:1px solid rgba(15,23,42,.08);

box-shadow:0 20px 60px rgba(15,23,42,.08);

}

.middle{

display:flex;

flex-direction:column;

align-items:center;

justify-content:center;

gap:24px;

}

.arrow{

font-size:42px;

color:var(--voxa-accent);

}

.core{

padding:16px 24px;

border-radius:999px;

background:var(--voxa-accent);

border:1px solid var(--voxa-accent);

color:white;

font-weight:600;

}

.before small,
.after small{

display:block;

margin-bottom:24px;

letter-spacing:.25em;

font-size:12px;

font-weight:700;

color:var(--voxa-accent);

}

.before ul,
.after ul{

list-style:none;

display:flex;

flex-direction:column;

gap:18px;

}

.before li,
.after li{

font-size:17px;

color:#334155;

position:relative;

padding-left:28px;

}

.before li::before{

content:"−";

position:absolute;

left:0;

color:#FF7A7A;

font-weight:700;

}

.after li::before{

content:"+";

position:absolute;

left:0;

color:#5BFFB2;

font-weight:700;

}
/* ==========================================================
BACKGROUND
========================================================== */

.transformations{

isolation:isolate;

}

.transformations::before{

content:"";

position:absolute;

inset:0;

pointer-events:none;

background-image:

linear-gradient(
rgba(15,23,42,.045) 1px,
transparent 1px
),

linear-gradient(
90deg,
rgba(15,23,42,.045) 1px,
transparent 1px
);

background-size:46px 46px;

opacity:.55;

animation:none;

}

.transformations::after{

content:"";

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:1100px;

height:1100px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(var(--voxa-accent-rgb),.08),

transparent 72%

);

filter:blur(120px);

pointer-events:none;

}

/* ==========================================================
STORY
========================================================== */

.story{

position:relative;

transition:

transform .45s cubic-bezier(.22,1,.36,1),

padding .35s ease;

}

.story:hover{

transform:translateY(-8px);

}

.story::before{

content:"";

position:absolute;

left:0;

right:0;

top:0;

height:1px;

background:

linear-gradient(

90deg,

transparent,

rgba(var(--voxa-accent-rgb),.25),

transparent

);

transition:.4s;

}

.story:hover::before{

background:

linear-gradient(

90deg,

transparent,

var(--voxa-accent),

transparent

);

box-shadow:

0 0 18px rgba(var(--voxa-accent-rgb),.35);

}

/* ==========================================================
CARDS
========================================================== */

.before,
.after{

position:relative;

overflow:hidden;

transition:

transform .45s cubic-bezier(.22,1,.36,1),

border-color .35s ease,

background .35s ease,

box-shadow .35s ease;

}

.before:hover,
.after:hover{

transform:translateY(-6px);

border-color:var(--voxa-accent);

background:

linear-gradient(

180deg,

rgba(var(--voxa-accent-rgb),.08),

rgba(255,255,255,.92)

);

box-shadow:

0 25px 70px rgba(15,23,42,.10),

0 0 40px rgba(var(--voxa-accent-rgb),.10);

}

.before::after,
.after::after{

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

rgba(255,255,255,.08),

transparent

);

transform:rotate(20deg);

animation:none;

}
/* ==========================================================
CENTER
========================================================== */

.core{

transition:.35s;

box-shadow:

0 0 30px rgba(var(--voxa-accent-rgb),.15);

}

.story:hover .core{

transform:scale(1.05);

background:var(--voxa-accent);

box-shadow:

0 0 45px rgba(var(--voxa-accent-rgb),.35);

}

.arrow{

animation:none;

}
@keyframes bounceArrow{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(8px);

}

}
/* ==========================================================
REVEAL ANIMATIONS
========================================================== */

.heading{

animation:none;

}

.story:nth-child(2){

animation:none;

}

.story:nth-child(3){

animation:none;

}

/* ==========================================================
CONNECTOR
========================================================== */

.middle{

position:relative;

}

.middle::before{

content:"";

position:absolute;

top:-80px;

bottom:-80px;

left:50%;

width:2px;

transform:translateX(-50%);

background:

linear-gradient(

180deg,

transparent,

rgba(var(--voxa-accent-rgb),.35),

transparent

);

}

.middle::after{

content:"";

position:absolute;

left:50%;

top:-40px;

width:8px;

height:8px;

border-radius:50%;

background:var(--voxa-accent);

transform:translateX(-50%);

box-shadow:

0 0 18px rgba(var(--voxa-accent-rgb),.55);

animation:none;

}
/* ==========================================================
LIST ITEMS
========================================================== */

.before li,
.after li{

transition:

transform .35s ease,

color .35s ease,

opacity .35s ease;

}

.before:hover li{

transform:translateX(6px);

color:var(--voxa-blue);

}

.after:hover li{

transform:translateX(6px);

color:var(--voxa-blue);

}

.before li::before,
.after li::before{

transition:.35s;

}

.after:hover li::before{

color:#6DFFBC;

text-shadow:

0 0 16px rgba(109,255,188,.5);

}

.before:hover li::before{

color:#FF9393;

text-shadow:

0 0 16px rgba(255,147,147,.4);

}

/* ==========================================================
BACKGROUND LIGHTS
========================================================== */

.before::before{

content:"";

position:absolute;

left:-40px;

top:-40px;

width:140px;

height:140px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(255,90,90,.08),

transparent 70%

);

filter:blur(30px);

opacity:0;

transition:.4s;

}

.after::before{

content:"";

position:absolute;

right:-40px;

bottom:-40px;

width:140px;

height:140px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(91,255,178,.08),

transparent 70%

);

filter:blur(30px);

opacity:0;

transition:.4s;

}

.before:hover::before,
.after:hover::before{

opacity:1;

}

/* ==========================================================
CORE GLOW
========================================================== */

.story:hover .arrow{

color:#8EB4FF;

text-shadow:

0 0 18px rgba(var(--voxa-accent-rgb),.45);

}

.story:hover .middle::before{

background:

linear-gradient(

180deg,

transparent,

var(--voxa-accent),

transparent

);

box-shadow:

0 0 18px rgba(var(--voxa-accent-rgb),.3);

}
/* ==========================================================
LARGE DESKTOP
========================================================== */

@media (max-width:1280px){

.story{

grid-template-columns:1fr 180px 1fr;

gap:45px;

}

.heading{

max-width:720px;

}

.heading h2{

font-size:clamp(52px,6vw,78px);

}

.before,
.after{

padding:34px;

}

}

/* ==========================================================
TABLET
========================================================== */

@media (max-width:992px){

.transformations{

padding:140px 0;

}

.heading{

margin-bottom:90px;

}

.heading h2{

font-size:clamp(46px,8vw,66px);

}

.heading p{

font-size:18px;

}

.story{

grid-template-columns:1fr;

gap:34px;

padding:60px 0;

}

.middle{

flex-direction:row;

justify-content:flex-start;

}

.middle::before{

display:none;

}

.middle::after{

display:none;

}

.arrow{

transform:rotate(-90deg);

}

.before,
.after{

padding:30px;

}

}

/* ==========================================================
MOBILE
========================================================== */

@media (max-width:768px){

.transformations{

padding:90px 0;

}

.heading{

margin-bottom:60px;

}

.heading h2{

font-size:clamp(38px,11vw,54px);

line-height:1;

}

.heading p{

font-size:16px;

line-height:1.8;

}

.story{

gap:26px;

padding:45px 0;

}

.before,
.after{

padding:24px;

border-radius:20px;

}

.before li,
.after li{

font-size:15px;

padding-left:22px;

}

.core{

padding:14px 20px;

font-size:14px;

}

.arrow{

font-size:30px;

}

}

/* ==========================================================
SMALL MOBILE
========================================================== */

@media (max-width:480px){

.transformations{

padding:70px 0;

}

.heading{

margin-bottom:45px;

}

.heading h2{

font-size:34px;

}

.heading p{

font-size:15px;

}

.story{

padding:36px 0;

gap:20px;

}

.before,
.after{

padding:20px;

border-radius:18px;

}

.before li,
.after li{

font-size:14px;

line-height:1.7;

}

.core{

width:100%;

text-align:center;

}

.arrow{

display:none;

}

}
/* ==========================================================
ACCESSIBILITY
========================================================== */

.story:focus-within{

outline:2px solid var(--voxa-accent);

outline-offset:8px;

border-radius:24px;

}

.before:focus-visible,
.after:focus-visible,
.core:focus-visible{

outline:2px solid var(--voxa-accent);

outline-offset:4px;

}

::selection{

background:rgba(var(--voxa-accent-rgb),.22);

color:white;

}

/* ==========================================================
REDUCED MOTION
========================================================== */

@media (prefers-reduced-motion: reduce){

*,
*::before,
*::after{

animation:none !important;

transition:none !important;

scroll-behavior:auto !important;

}

}

/* ==========================================================
PERFORMANCE
========================================================== */

.transformations,
.story,
.before,
.after,
.middle{

will-change:transform;

}

.transformations::before,
.transformations::after{

contain:paint;

}

.before,
.after{

contain:layout paint;

transform:translateZ(0);

backface-visibility:hidden;

}

/* ==========================================================
TYPOGRAPHY
========================================================== */

.heading h2{

text-wrap:balance;

}

.heading p{

text-wrap:pretty;

}

.before li,
.after li{

text-wrap:pretty;

}

.core{

white-space:nowrap;

font-weight:600;

letter-spacing:-.01em;

}

/* ==========================================================
POLISH
========================================================== */

.story{

position:relative;

z-index:5;

}

.before,
.after{

background:

linear-gradient(
180deg,
rgba(255,255,255,.94),
rgba(248,251,255,.86)
);

}

.story:hover .before{

border-color:

rgba(255,120,120,.28);

}

.story:hover .after{

border-color:

rgba(91,255,178,.30);

}

.before small{

color:#FF9C9C;

}

.after small{

color:#8CFFC6;

}

.heading{

position:relative;

z-index:5;

}
/* ==========================================================
MICRO INTERACTIONS
========================================================== */

.story{

transition:

transform .45s cubic-bezier(.22,1,.36,1),

opacity .35s ease;

}

.before,
.after{

transition:

transform .45s cubic-bezier(.22,1,.36,1),

background .35s ease,

border-color .35s ease,

box-shadow .35s ease;

}

.core{

transition:

transform .35s ease,

background .35s ease,

box-shadow .35s ease,

color .35s ease;

}

.story:hover .core{

transform:scale(1.08);

}

.story:hover .before{

transform:translateX(-6px);

}

.story:hover .after{

transform:translateX(6px);

}

/* ==========================================================
GLOW
========================================================== */

.story::after{

content:"";

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:520px;

height:220px;

border-radius:999px;

background:

radial-gradient(

circle,

rgba(var(--voxa-accent-rgb),.05),

transparent 72%

);

filter:blur(45px);

opacity:0;

transition:.45s;

pointer-events:none;

z-index:-1;

}

.story:hover::after{

opacity:1;

}

/* ==========================================================
LIST ANIMATION
========================================================== */

.before li,
.after li{

transition:

transform .3s ease,

color .3s ease;

}

.story:hover .before li:nth-child(1),
.story:hover .after li:nth-child(1){

transition-delay:.05s;

}

.story:hover .before li:nth-child(2),
.story:hover .after li:nth-child(2){

transition-delay:.10s;

}

.story:hover .before li:nth-child(3),
.story:hover .after li:nth-child(3){

transition-delay:.15s;

}

.story:hover .before li:nth-child(4),
.story:hover .after li:nth-child(4){

transition-delay:.20s;

}

/* ==========================================================
PREMIUM DETAILS
========================================================== */

.transformations{

isolation:isolate;

}

.story{

backface-visibility:hidden;

transform:translateZ(0);

}

.before,
.after{

overflow:hidden;

}

.core{

background:

linear-gradient(

180deg,

var(--voxa-accent),

var(--voxa-accent-2)

);

}

.heading span{

color:var(--voxa-accent);

}

/* ==========================================================
END
========================================================== */

</style>
