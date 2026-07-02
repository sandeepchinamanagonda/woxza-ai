<template>

<section class="why">

<div class="container-custom">

<div class="intro">

<span>

WHY VOXA

</span>

<h2>

Technology changes.

Good systems evolve.

Great experiences remain.

</h2>

</div>

<div class="principles">

<article>

<div class="index">

01

</div>

<div>

<h3>

Human First

</h3>

<p>

Every interaction is designed to feel natural,
helpful and genuinely conversational—not robotic.

</p>

</div>

</article>

<article>

<div class="index">

02

</div>

<div>

<h3>

Built to Scale

</h3>

<p>

From one workflow to enterprise-wide AI
employees, every solution is designed to grow.

</p>

</div>

</article>

<article>

<div class="index">

03

</div>

<div>

<h3>

Designed for Trust

</h3>

<p>

Reliable architecture, transparent automation
and secure deployment from day one.

</p>

</div>

</article>

</div>

</div>

</section>

</template>

<script setup>

</script>

<style scoped>

.why{

position:relative;

padding:180px 0;

overflow:hidden;

background:

radial-gradient(
circle at top left,
rgba(var(--voxa-accent-rgb),.14),
transparent 35%
),

radial-gradient(
circle at bottom right,
rgba(var(--voxa-accent-rgb),.08),
transparent 45%
),

linear-gradient(
180deg,
var(--voxa-blue) 0%,
var(--voxa-blue-2) 100%
);

isolation:isolate;

}

.intro{

max-width:900px;

margin-bottom:120px;

}

.intro span{

display:inline-block;

margin-bottom:20px;

font-size:12px;

letter-spacing:.28em;

text-transform:uppercase;

font-weight:600;

color:var(--voxa-accent-soft);

}

.intro h2{

font-size:clamp(58px,6vw,92px);

line-height:.95;

max-width:850px;

}

.principles{

display:flex;

flex-direction:column;

}

article{

display:grid;

grid-template-columns:120px 1fr;

gap:70px;

padding:55px 0;

border-top:1px solid rgba(255,255,255,.08);

}

article:last-child{

border-bottom:1px solid rgba(255,255,255,.08);

}

.index{

font-size:18px;

font-weight:700;

letter-spacing:.25em;

color:var(--voxa-accent);

}

article h3{

font-size:38px;

margin-bottom:18px;

}

article p{

font-size:18px;

line-height:1.9;

max-width:650px;

color:#A6AFBC;

}
/* ==========================================================
BACKGROUND
========================================================== */

.why{

overflow:hidden;

}

.why::before{

content:"";

position:absolute;

inset:0;

pointer-events:none;

background-image:

linear-gradient(
rgba(255,255,255,.035) 1px,
transparent 1px
),

linear-gradient(
90deg,
rgba(255,255,255,.035) 1px,
transparent 1px
);

background-size:46px 46px;

opacity:.55;

animation:none;

}

.why::after{

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

rgba(var(--voxa-accent-rgb),.10),

transparent 72%

);

filter:blur(120px);

pointer-events:none;

}

/* ==========================================================
INTRO
========================================================== */

.intro{

position:relative;

z-index:2;

animation:none;

}

.intro h2{

text-wrap:balance;

}

/* ==========================================================
ROWS
========================================================== */

.principles{

position:relative;

z-index:2;

}

article{

position:relative;

transition:

transform .45s cubic-bezier(.22,1,.36,1);

overflow:hidden;

}

article::before{

content:"";

position:absolute;

left:0;

top:0;

width:100%;

height:1px;

background:var(--voxa-accent);

transform:scaleX(0);

transform-origin:left center;

transition:
transform .45s cubic-bezier(.22,1,.36,1),
opacity .35s ease;

}

article:hover{

transform:translateX(10px);

}

article:hover::before{

transform:scaleX(1);

box-shadow:

0 0 18px rgba(var(--voxa-accent-rgb),.35);

}

/* ==========================================================
NUMBER
========================================================== */

.index{

transition:.35s;

text-shadow:

0 0 18px rgba(var(--voxa-accent-rgb),.2);

}

article:hover .index{

transform:translateX(6px);

color:var(--voxa-accent-soft);

text-shadow:

0 0 35px rgba(var(--voxa-accent-rgb),.45);

}

/* ==========================================================
TITLE
========================================================== */

article h3{

display:inline-block;

position:relative;

transition:.35s;

}

article h3::after{

content:"";

position:absolute;

left:0;

bottom:-8px;

width:100%;

height:2px;

background:var(--voxa-accent);

transform:scaleX(0);

transform-origin:left center;

transition:transform .35s ease;

}

article:hover h3{

color:var(--voxa-accent);

}

article:hover h3::after{

transform:scaleX(1);

}

/* ==========================================================
TEXT
========================================================== */

article p{

transition:.35s;

}

article:hover p{

color:#E4EAF3;

}

/* ==========================================================
REVEAL
========================================================== */

article:nth-child(1){

animation:none;

}

article:nth-child(2){

animation:none;

}

article:nth-child(3){

animation:none;

}
/* ==========================================================
VERTICAL ACCENT
========================================================== */

article{

isolation:isolate;

}

article::after{

content:"";

position:absolute;

left:42px;

top:50%;

transform:translateY(-50%) scaleY(0);

transform-origin:center top;

width:2px;

height:70%;

background:

linear-gradient(
180deg,
var(--voxa-accent),
transparent
);

transition:
transform .45s cubic-bezier(.22,1,.36,1),
opacity .35s ease;

opacity:.8;

}

article:hover::after{

transform:translateY(-50%) scaleY(1);

box-shadow:

0 0 24px rgba(var(--voxa-accent-rgb),.45);

}

/* ==========================================================
GLASS HIGHLIGHT
========================================================== */

article>div:last-child{

position:relative;

padding:10px 0;

}

article>div:last-child::before{

content:"";

position:absolute;

left:-40px;

top:50%;

transform:translateY(-50%);

width:120px;

height:120px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(var(--voxa-accent-rgb),.08),

transparent 72%

);

opacity:0;

transition:.45s;

pointer-events:none;

}

article:hover>div:last-child::before{

opacity:1;

}

/* ==========================================================
AMBIENT LIGHT
========================================================== */

.intro::after{

content:"";

position:absolute;

right:-120px;

top:-120px;

width:220px;

height:220px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(var(--voxa-accent-rgb),.14),

transparent 72%

);

filter:blur(40px);

pointer-events:none;

}

/* ==========================================================
RESPONSIVE
========================================================== */

@media(max-width:992px){

.why{

padding:130px 0;

}

.intro{

margin-bottom:80px;

}

article{

grid-template-columns:80px 1fr;

gap:40px;

}

article h3{

font-size:32px;

}

article p{

font-size:17px;

max-width:100%;

}

}

@media(max-width:768px){

.why{

padding:90px 0;

}

.intro{

margin-bottom:60px;

}

.intro h2{

font-size:clamp(40px,11vw,58px);

line-height:1;

}

article{

grid-template-columns:1fr;

gap:18px;

padding:36px 0;

}

.index{

font-size:14px;

}

article h3{

font-size:28px;

margin-bottom:14px;

}

article p{

font-size:16px;

line-height:1.8;

}

article::after{

display:none;

}

article:hover{

transform:translateX(6px);

}

}

@media(max-width:480px){

.why{

padding:70px 0;

}

.intro h2{

font-size:34px;

}

article{

padding:28px 0;

}

article h3{

font-size:24px;

}

article p{

font-size:15px;

line-height:1.75;

}

}

/* ==========================================================
POLISH
========================================================== */

.intro h2{

text-wrap:balance;

}

article p{

text-wrap:pretty;

}

article h3{

text-wrap:balance;

}
/* ==========================================================
ANIMATED DIVIDER
========================================================== */

.principles{

position:relative;

}

.principles::before{

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

}

.principles::after{

content:"";

position:absolute;

left:-30%;

top:0;

width:30%;

height:1px;

background:

linear-gradient(
90deg,
transparent,
var(--voxa-accent),
transparent
);

animation:none;

}
/* ==========================================================
GLASS SWEEP
========================================================== */

article{

overflow:hidden;

}

article>div:last-child::after{

content:"";

position:absolute;

top:-180%;

left:-70%;

width:60%;

height:350%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.06),

transparent

);

transform:rotate(18deg);

animation:none;

opacity:.55;

}
/* ==========================================================
HOVER DEPTH
========================================================== */

article{

border-radius:22px;

}

article:hover{

background:

linear-gradient(

90deg,

rgba(var(--voxa-accent-rgb),.04),

transparent

);

}

article:hover{

box-shadow:

0 18px 60px rgba(0,0,0,.22);

}

/* ==========================================================
AMBIENT GLOW
========================================================== */

article:hover{

filter:

drop-shadow(0 0 24px rgba(var(--voxa-accent-rgb),.08));

}

/* ==========================================================
STAGGER
========================================================== */

article:nth-child(1){

animation-delay:.1s;

}

article:nth-child(2){

animation-delay:.25s;

}

article:nth-child(3){

animation-delay:.4s;

}

/* ==========================================================
PREMIUM DETAILS
========================================================== */

article{

backface-visibility:hidden;

transform:translateZ(0);

}

.index{

user-select:none;

}

.intro span{

position:relative;

}

.intro span::after{

content:"";

position:absolute;

left:calc(100% + 18px);

top:50%;

transform:translateY(-50%);

width:70px;

height:1px;

background:

linear-gradient(
90deg,
var(--voxa-accent),
transparent
);

}

article h3{

letter-spacing:-.03em;

}

article p{

opacity:.92;

}
/* ==========================================================
ACCESSIBILITY
========================================================== */

article:focus-within{

outline:2px solid var(--voxa-accent);

outline-offset:8px;

}

::selection{

background:rgba(var(--voxa-accent-rgb),.24);

color:white;

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

scroll-behavior:auto !important;

}

}

/* ==========================================================
PERFORMANCE
========================================================== */

.why,
.intro,
.principles,
article{

will-change:transform;

}

.why::before,
.why::after{

contain:paint;

}

article{

contain:layout paint;

}

/* ==========================================================
PREMIUM TYPOGRAPHY
========================================================== */

.intro h2{

text-wrap:balance;

}

article h3{

text-wrap:balance;

}

article p{

text-wrap:pretty;

}

/* ==========================================================
MICRO INTERACTIONS
========================================================== */

article{

transition:

transform .45s cubic-bezier(.22,1,.36,1),

background .35s ease,

box-shadow .35s ease;

}

.index{

transition:

transform .35s ease,

color .35s ease,

text-shadow .35s ease;

}

article h3{

transition:

color .35s ease,

transform .35s ease;

}

article:hover h3{

transform:translateX(6px);

}

article p{

transition:

color .35s ease,

opacity .35s ease;

}

article:hover p{

opacity:1;

}

/* ==========================================================
POLISH
========================================================== */

.why{

isolation:isolate;

}

.intro{

position:relative;

z-index:5;

}

.principles{

position:relative;

z-index:5;

}

article{

position:relative;

z-index:5;

backface-visibility:hidden;

transform:translateZ(0);

}

.index{

user-select:none;

}

.intro span{

color:var(--voxa-accent-soft);

}

/* ==========================================================
END
========================================================== */

</style>
