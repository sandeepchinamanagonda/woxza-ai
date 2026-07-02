<template>

<section id="manifesto" class="manifesto">

    <div class="grid-bg"></div>

    <div class="glow glow-left"></div>

    <div class="glow glow-right"></div>

    <div class="container-custom">

        <div class="left">

            <span class="eyebrow">

                OUR MANIFESTO

            </span>

        </div>

        <div class="right">

            <div class="glass-card">

                <span class="section-tag">

                    WHY WE EXIST

                </span>

                <h2>

                    Technology should
                    remove friction,
                    not create it.

                </h2>

                <p>

                    We believe artificial intelligence becomes valuable
                    when it quietly integrates into everyday work.
                    Great AI should never interrupt people—it should
                    remove repetitive effort, accelerate decisions,
                    and create more time for meaningful work.

                </p>

                <p>

                    Every conversation, workflow and customer interaction
                    should feel connected. That is why every platform we
                    build is engineered around clarity, reliability,
                    scalability and long-term value rather than temporary
                    automation.

                </p>

            </div>

        </div>

    </div>

</section>

</template>

<script setup>

</script>

<style scoped>

.manifesto{

position:relative;

padding:180px 0;

overflow:hidden;

background:#0F172A;

}

.grid-bg{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),

linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);

background-size:46px 46px;

opacity:.55;

animation:gridMove 24s linear infinite;

}

.glow{

position:absolute;

border-radius:50%;

filter:blur(120px);

pointer-events:none;

}

.glow-left{

width:700px;

height:700px;

left:-260px;

top:-240px;

background:rgba(59,130,246,.14);

}

.glow-right{

width:700px;

height:700px;

right:-260px;

bottom:-260px;

background:rgba(59,130,246,.08);

}

.container-custom{

position:relative;

z-index:2;

display:grid;

grid-template-columns:260px 1fr;

gap:90px;

align-items:start;

}

.left{

position:sticky;

top:140px;

}

.eyebrow{

display:flex;

align-items:center;

gap:14px;

font-size:12px;

font-weight:700;

letter-spacing:.32em;

text-transform:uppercase;

color:#DBEAFE;

}

.eyebrow::before{

content:"";

width:44px;

height:2px;

background:#3B82F6;

}

.right{

max-width:900px;

}

.glass-card{

position:relative;

padding:70px;

border-radius:34px;

background:rgba(255,255,255,.05);

border:1px solid rgba(255,255,255,.08);

backdrop-filter:blur(24px);

box-shadow:

0 35px 80px rgba(0,0,0,.25);

overflow:hidden;

}

.glass-card::before{

content:"";

position:absolute;

top:0;

left:0;

right:0;

height:1px;

background:

linear-gradient(

90deg,

transparent,

rgba(91,140,255,.55),

transparent

);

}

.section-tag{

display:inline-flex;

padding:10px 18px;

border-radius:999px;

background:rgba(59,130,246,.12);

border:1px solid rgba(59,130,246,.22);

font-size:12px;

font-weight:700;

letter-spacing:.22em;

text-transform:uppercase;

color:#BFDBFE;

margin-bottom:28px;

}

.glass-card h2{

font-size:clamp(58px,6vw,88px);

line-height:.95;

letter-spacing:-.05em;

color:white;

margin-bottom:34px;

}

.glass-card p{

font-size:20px;

line-height:2;

color:#CBD5E1;

margin-bottom:30px;

max-width:760px;

}

.glass-card p:last-child{

margin-bottom:0;

}
.glass-card{

transition:

transform .45s cubic-bezier(.22,1,.36,1),

border-color .35s,

box-shadow .35s,

background .35s;

}

.glass-card:hover{

transform:translateY(-10px);

border-color:rgba(91,140,255,.28);

box-shadow:

0 45px 110px rgba(59,130,246,.14);

}

.glass-card::after{

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

rgba(255,255,255,.10),

transparent

);

transform:rotate(18deg);

animation:shine 8s linear infinite;

}

.glass-card h2{

transition:.35s;

}

.glass-card:hover h2{

transform:translateY(-4px);

color:#F8FAFC;

}

.glass-card p{

transition:.35s;

}

.glass-card:hover p{

color:#E2E8F0;

}

.left{

animation:fadeLeft .8s ease;

}

.right{

animation:fadeUp .9s cubic-bezier(.22,1,.36,1);

}

@keyframes fadeLeft{

from{

opacity:0;

transform:translateX(-30px);

}

to{

opacity:1;

transform:translateX(0);

}

}

@keyframes fadeUp{

from{

opacity:0;

transform:translateY(40px);

}

to{

opacity:1;

transform:translateY(0);

}

}

@keyframes shine{

0%{

left:-70%;

}

100%{

left:180%;

}

}

@keyframes gridMove{

from{

background-position:0 0;

}

to{

background-position:46px 46px;

}

}

@media(max-width:1100px){

.manifesto{

padding:140px 0;

}

.container-custom{

grid-template-columns:1fr;

gap:50px;

}

.left{

position:relative;

top:auto;

}

.glass-card{

padding:48px;

}

.glass-card h2{

font-size:clamp(46px,7vw,68px);

}

.glass-card p{

font-size:18px;

line-height:1.9;

}

}

@media(max-width:768px){

.manifesto{

padding:100px 0;

}

.container-custom{

width:92%;

}

.glass-card{

padding:30px;

border-radius:24px;

}

.glass-card h2{

font-size:40px;

line-height:1;

margin-bottom:24px;

}

.glass-card p{

font-size:16px;

line-height:1.85;

}

.eyebrow{

font-size:11px;

letter-spacing:.24em;

}

.eyebrow::before{

width:28px;

}

.section-tag{

font-size:11px;

padding:8px 14px;

}

}

@media(max-width:480px){

.manifesto{

padding:80px 0;

}

.glass-card{

padding:24px;

}

.glass-card h2{

font-size:34px;

}

.glass-card p{

font-size:15px;

}

}

.manifesto{

isolation:isolate;

}

.glass-card h2{

text-wrap:balance;

}

.glass-card p{

text-wrap:pretty;

}

.glass-card *{

backface-visibility:hidden;

}

</style>