<template>

<section
    id="capabilities"
    class="capabilities"
>

    <div class="grid-bg"></div>

    <div class="glow glow-left"></div>

    <div class="glow glow-right"></div>

    <div class="container-custom">

        <div class="heading">

            <span>

                CAPABILITIES

            </span>

            <h2>

                AI capabilities
                designed for
                modern business.

            </h2>

            <p>

                Every solution works together inside one
                intelligent ecosystem to automate,
                assist and accelerate your business.

            </p>

        </div>

        <CoverFlow

            :items="capabilities"

        />

    </div>

</section>

</template>

<script setup>

import CoverFlow from "@/components/ui/CoverFlow.vue"

const capabilities=[

{

icon:"✨",

title:"Enterprise AI",

description:"Connect Voice AI, workflows and intelligent agents into one scalable platform."

},

{

icon:"🎙️",

title:"Voice AI",

description:"Natural conversations, multilingual support and always-on customer engagement."

},

{

icon:"⚡",

title:"Automation",

description:"Automate repetitive business processes and integrate every tool."

},

{

icon:"🧠",

title:"Knowledge AI",

description:"Search documents, SOPs and company knowledge using natural language."

},

{

icon:"🤖",

title:"AI Agents",

description:"Autonomous AI employees capable of executing complex business tasks."

}

]

</script>

<style scoped>

.capabilities{

position:relative;

padding:180px 0;

overflow:hidden;

background:

radial-gradient(circle at top left,
rgba(var(--voxa-accent-rgb),.10),
transparent 35%),

radial-gradient(circle at bottom right,
rgba(15,23,42,.05),
transparent 45%),

linear-gradient(
180deg,
var(--voxa-white),
var(--voxa-soft)
);

}

.grid-bg{

position:absolute;

inset:0;

background-image:

linear-gradient(rgba(15,23,42,.045) 1px,transparent 1px),

linear-gradient(90deg,rgba(15,23,42,.045) 1px,transparent 1px);

background-size:46px 46px;

opacity:.45;

}

.glow{

position:absolute;

border-radius:50%;

filter:blur(130px);

pointer-events:none;

}

.glow-left{

width:650px;

height:650px;

left:-250px;

top:-200px;

background:rgba(var(--voxa-accent-rgb),.15);

}

.glow-right{

width:700px;

height:700px;

right:-260px;

bottom:-250px;

background:rgba(var(--voxa-accent-rgb),.08);

}

.container-custom{

position:relative;

z-index:2;

max-width:1700px;

margin:auto;

}

.heading{

max-width:760px;

margin:auto;

text-align:center;

margin-bottom:70px;

}

.heading span{

display:inline-flex;

padding:10px 18px;

border-radius:999px;

background:rgba(var(--voxa-accent-rgb),.12);

border:1px solid rgba(var(--voxa-accent-rgb),.22);

font-size:12px;

letter-spacing:.25em;

font-weight:700;

color:var(--voxa-accent);

margin-bottom:24px;

}

.heading h2{

font-size:clamp(58px,6vw,88px);

line-height:.95;

letter-spacing:-.05em;

color:var(--voxa-blue);

margin-bottom:24px;

}

.heading p{

max-width:620px;

margin:auto;

font-size:19px;

line-height:1.9;

color:#64748b;

}
.heading{

animation:none;

}

@keyframes fadeUp{

from{

opacity:0;

transform:translateY(30px);

}

to{

opacity:1;

transform:translateY(0);

}

}

@media(max-width:1200px){

.capabilities{

padding:150px 0;

}

.heading h2{

font-size:64px;

}

}

@media(max-width:900px){

.capabilities{

padding:120px 0;

}

.heading{

width:min(92%,700px);

margin-bottom:50px;

}

.heading h2{

font-size:48px;

}

.heading p{

font-size:17px;

}

}

@media(max-width:600px){

.capabilities{

padding:90px 0;

}

.heading h2{

font-size:38px;

line-height:1;

}

.heading p{

font-size:15px;

}

.heading span{

font-size:11px;

}

}

</style>
