<template>
<section id="about" class="features-section">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="section-header">

<span class="eyebrow">
CAPABILITIES
</span>

<h2>
Everything your
<br>
AI workforce needs.
</h2>

<p>
Powerful building blocks that work together to automate,
assist and accelerate every part of your business.
</p>

</div>

<div class="features-grid">

<FeatureCard
v-for="(feature,index) in features"
:key="index"
:number="index+1"
:title="feature.title"
:description="feature.description"
:icon="feature.icon"
/>

</div>

</div>

</section>
</template>

<script setup>
import { ref } from "vue"
import FeatureCard from "@/components/FeatureCard.vue"

const features=ref([
{
title:"AI Employees",
description:"Digital employees capable of handling conversations, operations and repetitive business tasks.",
icon:"M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
},
{
title:"Enterprise Security",
description:"Privacy-first architecture with enterprise compliance and governance.",
icon:"M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
},
{
title:"Workflow Automation",
description:"Connect AI with existing workflows and eliminate repetitive manual work.",
icon:"M13 10V3L4 14h7v7l9-11h-7z"
},
{
title:"Business Analytics",
description:"Transform every interaction into measurable business intelligence.",
icon:"M9 17v-6m4 6V7m4 10V4"
},
{
title:"Omnichannel AI",
description:"Deploy across voice, chat, CRM, email and messaging platforms.",
icon:"M3 5a2 2 0 012-2h3l2 5-2 1a11 11 0 005 5l1-2 5 2v3a2 2 0 01-2 2h-1"
},
{
title:"Scale Infinitely",
description:"Grow your AI workforce without increasing operational complexity.",
icon:"M5 12l5 5L20 7"
}
])
</script>

<style scoped>

.features-section{
position:relative;
padding:180px 0;
background:#fff;
overflow:hidden;
}

.grid-bg{
position:absolute;
inset:0;
background-image:
linear-gradient(rgba(15,23,42,.04) 1px,transparent 1px),
linear-gradient(90deg,rgba(15,23,42,.04) 1px,transparent 1px);
background-size:46px 46px;
opacity:.55;
animation:none;
}

.glow{
position:absolute;
border-radius:50%;
filter:blur(110px);
pointer-events:none;
}

.glow-left{
width:520px;
height:520px;
left:-200px;
top:-160px;
background:rgba(59,130,246,.16);
}

.glow-right{
width:560px;
height:560px;
right:-220px;
bottom:-180px;
background:rgba(15,23,42,.08);
}

.section-header{
max-width:760px;
margin:auto;
margin-bottom:90px;
text-align:center;
position:relative;
z-index:2;
}

.eyebrow{
display:inline-flex;
padding:8px 16px;
border-radius:999px;
background:white;
border:1px solid rgba(15,23,42,.08);
font-size:12px;
font-weight:700;
letter-spacing:.22em;
color:#64748b;
margin-bottom:22px;
}

.section-header h2{
font-size:clamp(58px,6vw,82px);
line-height:.95;
letter-spacing:-.05em;
margin-bottom:24px;
color:#0f172a;
}

.section-header p{
max-width:620px;
margin:auto;
font-size:19px;
line-height:1.8;
color:#64748b;
}

.features-grid{
position:relative;
z-index:2;
display:grid;
grid-template-columns:repeat(3,1fr);
gap:28px;
}
@media(max-width:1100px){

.features-grid{
grid-template-columns:repeat(2,1fr);
}

}

@media(max-width:768px){

.features-section{
padding:110px 0;
}

.features-grid{
grid-template-columns:1fr;
}

.section-header{
margin-bottom:60px;
}

.section-header h2{
font-size:44px;
}

.section-header p{
font-size:16px;
}

}

</style>