<template>

<section id="ecosystem" class="ecosystem">

    <div class="grid-bg"></div>

    <div class="container-custom">

        <div class="heading">

            <span class="eyebrow">

                VOXA ECOSYSTEM

            </span>

            <h2>

                One AI
                Intelligence
                Layer.

            </h2>

            <p>

                Every capability communicates with another,
                creating one connected AI operating system
                for your organization.

            </p>

        </div>

        <div class="ecosystem-stage">

            <div class="ring ring-1"></div>

            <div class="ring ring-2"></div>

            <div class="ring ring-3"></div>

            <div class="connector vertical"></div>

            <div class="connector horizontal"></div>

            <!-- CENTER -->

            <div class="core">

                <div class="pulse"></div>

                <div class="pulse pulse2"></div>

                <div class="core-card">

                    <small>

                        AI CORE

                    </small>

                    <h3>

                        VOXA

                    </h3>

                    <span>

                        Connected Intelligence

                    </span>

                </div>

            </div>

            <!-- TOP -->

            <div class="node top">

                <div class="icon">

                    🎙️

                </div>

                <strong>

                    Voice AI

                </strong>

            </div>

            <!-- RIGHT -->

            <div class="node right">

                <div class="icon">

                    🤖

                </div>

                <strong>

                    Agents

                </strong>

            </div>

            <!-- BOTTOM -->

            <div class="node bottom">

                <div class="icon">

                    ⚙️

                </div>

                <strong>

                    Automation

                </strong>

            </div>

            <!-- LEFT -->

            <div class="node left">

                <div class="icon">

                    📚

                </div>

                <strong>

                    Knowledge

                </strong>

            </div>

            <!-- LEFT COLUMN -->

            <div class="service voice">

                <h4>

                    AI Employees

                </h4>

                <p>

                    Autonomous digital workers.

                </p>

            </div>

            <div class="service analytics">

                <h4>

                    Analytics

                </h4>

                <p>

                    Real-time insights.

                </p>

            </div>

            <!-- RIGHT COLUMN -->

            <div class="service crm">

                <h4>

                    CRM

                </h4>

                <p>

                    Customer intelligence.

                </p>

            </div>

            <div class="service calendar">

                <h4>

                    Calendar

                </h4>

                <p>

                    Meeting automation.

                </p>

            </div>

        </div>

    </div>

</section>

</template>

<script setup>

</script>

<style scoped>

.ecosystem{

position:relative;

padding:180px 0;

background:#F8FBFF;

overflow:hidden;

}

.grid-bg{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),

linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px);

background-size:48px 48px;

opacity:.55;

}

.container-custom{

position:relative;

z-index:2;

}

.heading{

max-width:760px;

margin:auto;

text-align:center;

margin-bottom:120px;

}

.eyebrow{

display:inline-flex;

padding:10px 22px;

border-radius:999px;

background:#EEF5FF;

font-size:12px;

font-weight:700;

letter-spacing:.25em;

color:#2563EB;

margin-bottom:30px;

}

.heading h2{

font-size:clamp(62px,7vw,96px);

line-height:.95;

letter-spacing:-.05em;

font-weight:700;

color:#101828;

margin-bottom:26px;

}

.heading p{

font-size:20px;

line-height:1.9;

color:#667085;

max-width:640px;

margin:auto;

}

.ecosystem-stage{

position:relative;

height:900px;

display:flex;

align-items:center;

justify-content:center;

}
/* ==========================
   AI CORE
========================== */

.core{

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:220px;

height:220px;

display:flex;

align-items:center;

justify-content:center;

z-index:30;

}

.core-card{

position:relative;

width:180px;

height:180px;

border-radius:50%;

background:rgba(255,255,255,.95);

border:1px solid rgba(59,130,246,.15);

backdrop-filter:blur(30px);

display:flex;

flex-direction:column;

justify-content:center;

align-items:center;

box-shadow:

0 30px 80px rgba(59,130,246,.18);

}

.core-card small{

font-size:11px;

letter-spacing:.3em;

text-transform:uppercase;

color:#3B82F6;

margin-bottom:12px;

}

.core-card h3{

font-size:48px;

font-weight:700;

color:#101828;

margin-bottom:10px;

}

.core-card span{

font-size:14px;

color:#667085;

}

.pulse{

position:absolute;

width:220px;

height:220px;

border-radius:50%;

border:2px solid rgba(59,130,246,.18);

animation:pulse 4s infinite;

}

.pulse2{

animation-delay:2s;

}

/* ==========================
   RINGS
========================== */

.ring{

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

border-radius:50%;

border:1px solid rgba(59,130,246,.15);

animation:rotate 30s linear infinite;

}

.ring-1{

width:340px;

height:340px;

}

.ring-2{

width:500px;

height:500px;

animation-direction:reverse;

animation-duration:42s;

}

.ring-3{

width:660px;

height:660px;

opacity:.45;

animation-duration:60s;

}

.connector{

position:absolute;

background:linear-gradient(

to bottom,

transparent,

rgba(59,130,246,.22),

transparent

);

}

.vertical{

width:2px;

height:500px;

left:50%;

top:50%;

transform:translate(-50%,-50%);

}

.horizontal{

height:2px;

width:500px;

left:50%;

top:50%;

transform:translate(-50%,-50%);

background:linear-gradient(

to right,

transparent,

rgba(59,130,246,.22),

transparent

);

}

/* ==========================
   MAIN NODES
========================== */

.node{

position:absolute;

display:flex;

align-items:center;

gap:12px;

padding:18px 24px;

background:rgba(255,255,255,.96);

border:1px solid rgba(59,130,246,.12);

border-radius:18px;

backdrop-filter:blur(24px);

box-shadow:

0 20px 60px rgba(40,90,180,.08);

transition:.4s;

cursor:pointer;

z-index:25;

}

.node:hover{

transform:translateY(-8px) scale(1.05);

box-shadow:

0 30px 80px rgba(59,130,246,.18);

border-color:#3B82F6;

}

.icon{

width:46px;

height:46px;

border-radius:14px;

display:flex;

align-items:center;

justify-content:center;

background:#EEF5FF;

font-size:22px;

}

.node strong{

font-size:16px;

font-weight:700;

color:#101828;

}

.top{

top:90px;

left:50%;

transform:translateX(-50%);

}

.right{

right:180px;

top:50%;

transform:translateY(-50%);

}

.bottom{

bottom:90px;

left:50%;

transform:translateX(-50%);

}

.left{

left:180px;

top:50%;

transform:translateY(-50%);

}
/* ==========================
   SIDE CARDS
========================== */

.service{

position:absolute;

width:240px;

padding:28px;

border-radius:24px;

background:rgba(255,255,255,.94);

border:1px solid rgba(59,130,246,.12);

backdrop-filter:blur(24px);

box-shadow:

0 25px 70px rgba(40,90,180,.08);

transition:.4s;

}

.service:hover{

transform:translateY(-10px);

border-color:#3B82F6;

box-shadow:

0 35px 90px rgba(59,130,246,.18);

}

.service h4{

font-size:22px;

font-weight:700;

margin-bottom:10px;

color:#101828;

}

.service p{

font-size:15px;

line-height:1.8;

color:#667085;

}

.voice{

left:0;

top:140px;

}

.analytics{

left:0;

bottom:140px;

}

.crm{

right:0;

top:140px;

}

.calendar{

right:0;

bottom:140px;

}

/* ==========================
   ANIMATIONS
========================== */

.node{

animation:float 8s ease-in-out infinite;

}

.node:nth-child(2){

animation-delay:0s;

}

.node:nth-child(3){

animation-delay:1.5s;

}

.node:nth-child(4){

animation-delay:3s;

}

.node:nth-child(5){

animation-delay:4.5s;

}

.service{

animation:cardFloat 10s ease-in-out infinite;

}

.service:nth-of-type(1){

animation-delay:.5s;

}

.service:nth-of-type(2){

animation-delay:2s;

}

.service:nth-of-type(3){

animation-delay:3.5s;

}

.service:nth-of-type(4){

animation-delay:5s;

}

@keyframes float{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(-12px);

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

@keyframes pulse{

0%{

transform:scale(1);

opacity:.7;

}

100%{

transform:scale(1.55);

opacity:0;

}

}

@keyframes rotate{

from{

transform:translate(-50%,-50%) rotate(0deg);

}

to{

transform:translate(-50%,-50%) rotate(360deg);

}

}

/* ==========================
   RESPONSIVE
========================== */

@media(max-width:1200px){

.ecosystem-stage{

height:1050px;

}

.left{

left:80px;

}

.right{

right:80px;

}

.service{

width:200px;

}

}

@media(max-width:992px){

.ecosystem-stage{

height:auto;

display:flex;

flex-direction:column;

gap:40px;

padding:80px 0;

}

.ring,

.connector{

display:none;

}

.core{

position:relative;

left:auto;

top:auto;

transform:none;

margin-bottom:30px;

}

.node,

.service{

position:relative;

left:auto;

right:auto;

top:auto;

bottom:auto;

transform:none;

width:min(420px,90vw);

}

}

@media(max-width:768px){

.ecosystem{

padding:120px 0;

}

.heading{

margin-bottom:70px;

}

.heading h2{

font-size:52px;

line-height:1;

}

.heading p{

font-size:17px;

}

.core-card{

width:150px;

height:150px;

}

.core-card h3{

font-size:38px;

}

.node{

padding:16px 18px;

}

.service{

padding:22px;

}

}

</style>