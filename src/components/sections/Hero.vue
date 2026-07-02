<template>

<section id="hero" class="hero">

    <div class="hero-grid-bg"></div>

    <div class="hero-gradient"></div>

    <div class="hero-container">

        <!-- ================= LEFT ================= -->

        <div class="hero-content">

            <span class="eyebrow">

                VOICE AI WAITLIST

            </span>

            <h1>

                AI systems

                that quietly

                transform

                <span>business.</span>

            </h1>

            <p>

                Voxa answers customer calls, qualifies enquiries,
                books appointments and updates your systems without
                adding another manual workflow.

            </p>

            <div class="hero-buttons">

                <a
                    href="#contact"
                    class="btn-primary"
                    @click.prevent="$emit('open-demo','waitlist')"
                >

                    Join the Waitlist

                </a>

                <a
                    href="#contact"
                    class="btn-secondary"
                    @click.prevent="$emit('open-demo','sales')"
                >

                    Call Sales

                </a>

            </div>

            <div class="hero-stats">

                <div>

                    <strong>

                        Voice AI

                    </strong>

                    <span>

                        Human conversations

                    </span>

                </div>

                <div>

                    <strong>

                        AI Agents

                    </strong>

                    <span>

                        Autonomous workflows

                    </span>

                </div>

                <div>

                    <strong>

                        Automation

                    </strong>

                    <span>

                        Connected operations

                    </span>

                </div>

            </div>

            <div class="scroll">

                <div class="mouse">

                    <span></span>

                </div>

                <small>

                    Scroll to explore

                </small>

            </div>

        </div>

        <!-- ================= RIGHT ================= -->

        <div class="hero-visual">

            <Scene />

            <ChatOverlay />

        </div>

    </div>

</section>

</template>

<script setup>

import Scene from "@/components/three/Scene.vue"

import ChatOverlay from "@/components/three/ChatOverlay.vue"

defineEmits(["open-demo"])

</script>

<style scoped>
.hero{

position:relative;

min-height:100vh;

display:flex;

align-items:center;

overflow:hidden;

background:
linear-gradient(
180deg,
var(--voxa-white) 0%,
var(--voxa-soft) 100%
);

padding:120px 0 80px;

isolation:isolate;

}

/* ===========================
BACKGROUND
=========================== */

.hero-grid-bg{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(var(--voxa-accent-rgb),.04) 1px,transparent 1px),

linear-gradient(90deg,rgba(var(--voxa-accent-rgb),.04) 1px,transparent 1px);

background-size:60px 60px;

mask-image:

radial-gradient(circle,#000 72%,transparent);

opacity:.55;

animation:none;

}

.hero-gradient{

position:absolute;

inset:0;

background:

radial-gradient(

circle at 78% 22%,

rgba(var(--voxa-accent-rgb),.18),

transparent 36%

),

radial-gradient(

circle at 18% 82%,

rgba(var(--voxa-accent-rgb),.10),

transparent 42%

);

pointer-events:none;

}

/* ===========================
MAIN CONTAINER
=========================== */

.hero-container{

position:relative;

z-index:10;

width:min(1880px,96vw);

margin:auto;

display:grid;

grid-template-columns:

46%

54%;

align-items:center;

column-gap:10px;

min-height:88vh;

}

/* ===========================
LEFT
=========================== */

.hero-content{

width:100%;

max-width:760px;

padding-right:30px;

}

.eyebrow{

display:flex;

align-items:center;

gap:14px;

margin-bottom:28px;

font-size:12px;

font-weight:700;

letter-spacing:.35em;

text-transform:uppercase;

color:var(--voxa-accent-2);

}

.eyebrow::before{

content:"";

width:44px;

height:2px;

background:var(--voxa-accent-2);

}

.hero-content h1{

font-size:clamp(74px,7vw,122px);

line-height:.88;

letter-spacing:-.06em;

font-weight:700;

color:#101828;

margin-bottom:28px;

}

.hero-content h1 span{

color:var(--voxa-accent);

}

.hero-content p{

font-size:21px;

line-height:1.95;

color:#667085;

max-width:610px;

margin-bottom:48px;

}

/* ===========================
BUTTONS
=========================== */

.hero-buttons{

display:flex;

gap:18px;

margin-bottom:56px;

}

.btn-primary{

display:flex;

align-items:center;

justify-content:center;

height:62px;

padding:0 36px;

border-radius:999px;

background:var(--voxa-accent);

color:white;

text-decoration:none;

font-weight:700;

box-shadow:

0 22px 60px rgba(var(--voxa-accent-rgb),.22);

transition:.35s;

}

.btn-primary:hover{

transform:translateY(-3px);

background:var(--voxa-accent-2);

}

.btn-secondary{

display:flex;

align-items:center;

justify-content:center;

height:62px;

padding:0 36px;

border-radius:999px;

background:white;

border:1px solid rgba(var(--voxa-accent-rgb),.16);

text-decoration:none;

font-weight:700;

color:#101828;

transition:.35s;

}

.btn-secondary:hover{

background:var(--voxa-soft);

border-color:var(--voxa-accent);

transform:translateY(-3px);

}
/* ==========================================
STATS
========================================== */

.hero-stats{

display:flex;

align-items:center;

gap:54px;

margin-bottom:60px;

}

.hero-stats div{

display:flex;

flex-direction:column;

gap:8px;

}

.hero-stats strong{

font-size:19px;

font-weight:700;

color:#101828;

}

.hero-stats span{

font-size:15px;

color:#667085;

}

/* ==========================================
SCROLL
========================================== */

.scroll{

display:flex;

align-items:center;

gap:18px;

margin-top:12px;

}

.mouse{

width:30px;

height:48px;

border-radius:999px;

border:2px solid var(--voxa-accent-2);

display:flex;

justify-content:center;

padding-top:8px;

}

.mouse span{

width:5px;

height:10px;

border-radius:99px;

background:var(--voxa-accent-2);

animation:none;

}

.scroll small{

font-size:12px;

font-weight:700;

letter-spacing:.3em;

text-transform:uppercase;

color:#667085;

}

/* ==========================================
RIGHT SIDE
========================================== */

.hero-visual{

position:relative;

width:100%;

height:920px;

display:flex;

justify-content:center;

align-items:center;

overflow:visible;

isolation:isolate;

filter:drop-shadow(0 70px 140px rgba(var(--voxa-accent-rgb),.12));

animation:none;

}

/* Scene */

.hero-visual > :first-child{

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:720px;

height:720px;

z-index:5;

}

/* Chat Overlay */

.hero-visual > :nth-child(2){

position:absolute;

inset:0;

z-index:60;

pointer-events:none;

}

/* Floating Cards */

.hero-visual > :nth-child(3){

position:absolute;

inset:0;

z-index:30;

pointer-events:none;

}

/* Main Glow */

.hero-visual::before{

content:"";

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:720px;
height:720px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(var(--voxa-accent-rgb),.12),

transparent 72%

);

filter:blur(110px);

pointer-events:none;

z-index:0;

}

/* Ring */

.hero-visual::after{

content:"";

position:absolute;

left:50%;

top:50%;

transform:

translate(-50%,-50%);

width:620px;
height:620px;

border-radius:50%;

border:1px solid rgba(var(--voxa-accent-rgb),.08);

pointer-events:none;

}
/* ==========================================
ENTRY ANIMATION
========================================== */

.hero-content>*{

opacity:0;

transform:

translateY(40px);

animation:

heroReveal

.9s

cubic-bezier(.22,1,.36,1)

forwards;

}

.hero-content>*:nth-child(1){

animation-delay:.15s;

}

.hero-content>*:nth-child(2){

animation-delay:.35s;

}

.hero-content>*:nth-child(3){

animation-delay:.55s;

}

.hero-content>*:nth-child(4){

animation-delay:.75s;

}

.hero-content>*:nth-child(5){

animation-delay:.95s;

}

.hero-content>*:nth-child(6){

animation-delay:1.15s;

}

/* ==========================================
KEYFRAMES
========================================== */
@keyframes heroReveal{

from{

opacity:0;

transform:

translateY(40px);

}

to{

opacity:1;

transform:

translateY(0);

}

}
@keyframes sceneFloat{

0%,100%{

transform:

translateY(0);

}

50%{

transform:

translateY(-12px);

}

}
@keyframes scrollMove{

0%{

transform:

translateY(0);

opacity:1;

}

100%{

transform:

translateY(14px);

opacity:0;

}

}
/* ==========================================
RESPONSIVE
========================================== */

@media(max-width:1500px){

.hero-container{

width:95%;

grid-template-columns:

1fr

1fr;

gap:40px;

}

.hero-visual{

height:860px;

}

}

@media(max-width:1200px){

.hero{

padding:140px 0 100px;

}

.hero-container{

grid-template-columns:1fr;

gap:90px;

}

.hero-content{

margin:auto;

max-width:760px;

text-align:center;

padding-right:0;

}

.hero-buttons{

justify-content:center;

}

.hero-stats{

justify-content:center;

}

.hero-visual{

width:100%;

height:760px;

max-width:900px;

margin:auto;

}

}

@media(max-width:768px){

.hero{

padding:110px 0 80px;

}

.hero-content h1{

font-size:54px;

line-height:1;

}

.hero-content p{

font-size:17px;

}

.hero-buttons{

flex-direction:column;

}

.btn-primary,

.btn-secondary{

width:100%;

}

.hero-stats{

flex-direction:column;

gap:24px;

text-align:center;

}

.hero-visual{

height:560px;

}

.hero-visual > :first-child{

width:540px;

height:540px;

}

.hero-visual::before{

width:540px;

height:540px;

}

.hero-visual::after{

width:470px;

height:470px;

}

}

@media(max-width:480px){

.hero{

padding:100px 0 60px;

}

.hero-content h1{

font-size:42px;

}

.hero-content p{

font-size:15px;

}

.hero-visual{

height:420px;

}

.hero-visual > :first-child{

width:420px;

height:420px;

}

.hero-visual::before{

width:420px;

height:420px;

}

.hero-visual::after{

width:360px;

height:360px;

}

.hero-stats{

display:none;

}

}

/* ==========================================
FINAL
========================================== */

.hero h1{

text-wrap:balance;

}

.hero p{

text-wrap:pretty;

}

.hero-content,

.hero-visual{

position:relative;

z-index:5;

}

.btn-primary,

.btn-secondary{

backface-visibility:hidden;

}
</style>
