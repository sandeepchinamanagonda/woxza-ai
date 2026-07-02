<template>
<section class="solutions">

<div class="bg-grid"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="heading">

<span>INDUSTRIES</span>

<h2>
AI built for
<br>
every industry.
</h2>

<p>
Purpose-built intelligence designed to automate workflows,
enhance customer experiences and accelerate business growth.
</p>

</div>

<div class="solutions-grid">

<div
v-for="(item,index) in industries"
:key="index"
class="solution-card"
>

<div class="number">
{{ String(index+1).padStart(2,"0") }}
</div>

<div class="icon">
<component :is="item.icon"/>
</div>

<h3>
{{ item.title }}
</h3>

<p>
{{ item.description }}
</p>

<div class="bottom">

<span>
{{ item.tag }}
</span>

<div class="arrow">
→
</div>

</div>

</div>

</div>

</div>

</section>
</template>

<script setup>

import{
HeartPulse,
GraduationCap,
Landmark,
Building2,
ShoppingBag,
Factory,
Plane,
Briefcase
}from"lucide-vue-next"

const industries=[

{
title:"Healthcare",
description:"AI receptionists, appointment booking and multilingual patient support.",
icon:HeartPulse,
tag:"Healthcare"
},

{
title:"Education",
description:"Admissions, enquiries and intelligent student assistance.",
icon:GraduationCap,
tag:"Education"
},

{
title:"Finance",
description:"Customer onboarding, verification and secure AI assistants.",
icon:Landmark,
tag:"Finance"
},

{
title:"Enterprise",
description:"Internal copilots, workflow automation and employee support.",
icon:Building2,
tag:"Enterprise"
},

{
title:"Retail",
description:"Shopping assistants and personalized recommendations.",
icon:ShoppingBag,
tag:"Retail"
},

{
title:"Manufacturing",
description:"Operations monitoring and predictive automation.",
icon:Factory,
tag:"Industry"
},

{
title:"Travel",
description:"Bookings, itinerary management and multilingual voice AI.",
icon:Plane,
tag:"Travel"
},

{
title:"Professional",
description:"Law firms, agencies and consulting powered by AI.",
icon:Briefcase,
tag:"Business"
}

]

</script>

<style scoped>

.solutions{
position:relative;
padding:180px 0;
background:#fff;
overflow:hidden;
}

.container-custom{
position:relative;
z-index:2;
}

.heading{
text-align:center;
max-width:760px;
margin:auto;
margin-bottom:90px;
}

.heading span{
display:inline-flex;
padding:8px 16px;
border-radius:999px;
background:#fff;
border:1px solid rgba(15,23,42,.08);
font-size:12px;
letter-spacing:.22em;
font-weight:700;
color:#64748b;
margin-bottom:24px;
}

.heading h2{
font-size:clamp(58px,6vw,82px);
line-height:.95;
letter-spacing:-.05em;
color:#0f172a;
margin-bottom:24px;
}

.heading p{
font-size:19px;
line-height:1.8;
color:#64748b;
max-width:620px;
margin:auto;
}

.solutions-grid{
display:grid;
grid-template-columns:repeat(4,1fr);
gap:28px;
}
.solution-card{
position:relative;
padding:34px;
border-radius:30px;
background:rgba(255,255,255,.72);
backdrop-filter:blur(24px);
border:1px solid rgba(15,23,42,.08);
box-shadow:0 30px 80px rgba(15,23,42,.08);
overflow:hidden;
transition:.45s cubic-bezier(.22,1,.36,1);
display:flex;
flex-direction:column;
min-height:340px;
}

.solution-card::before{
content:"";
position:absolute;
top:-150%;
left:-60%;
width:60%;
height:320%;
background:linear-gradient(
90deg,
transparent,
rgba(59,130,246,.12),
transparent
);
transform:rotate(20deg);
animation:shine 9s linear infinite;
}

.solution-card:hover{
transform:translateY(-12px);
border-color:#3b82f6;
box-shadow:
0 40px 100px rgba(15,23,42,.12),
0 0 50px rgba(59,130,246,.12);
}

.number{
font-size:13px;
letter-spacing:.28em;
font-weight:700;
color:#3b82f6;
margin-bottom:26px;
}

.icon{
width:72px;
height:72px;
display:flex;
align-items:center;
justify-content:center;
border-radius:22px;
background:linear-gradient(
180deg,
rgba(59,130,246,.12),
rgba(59,130,246,.05)
);
border:1px solid rgba(59,130,246,.16);
margin-bottom:28px;
}

.icon svg{
width:34px;
height:34px;
stroke:#3b82f6;
stroke-width:1.7;
transition:.35s;
}

.solution-card:hover .icon svg{
transform:scale(1.12) rotate(-6deg);
}

.solution-card h3{
font-size:28px;
font-weight:700;
letter-spacing:-.03em;
color:#0f172a;
margin-bottom:16px;
}

.solution-card p{
font-size:16px;
line-height:1.8;
color:#64748b;
margin-bottom:auto;
}

.bottom{
display:flex;
justify-content:space-between;
align-items:center;
margin-top:36px;
padding-top:24px;
border-top:1px solid rgba(15,23,42,.08);
}

.bottom span{
font-size:13px;
font-weight:600;
letter-spacing:.14em;
text-transform:uppercase;
color:#64748b;
}

.arrow{
width:42px;
height:42px;
display:flex;
align-items:center;
justify-content:center;
border-radius:50%;
background:#0f172a;
color:white;
transition:.35s;
}

.solution-card:hover .arrow{
background:#3b82f6;
transform:translateX(4px);
}
.bg-grid{
position:absolute;
inset:0;
background-image:
linear-gradient(rgba(15,23,42,.04) 1px,transparent 1px),
linear-gradient(90deg,rgba(15,23,42,.04) 1px,transparent 1px);
background-size:46px 46px;
opacity:.55;
animation:gridMove 22s linear infinite;
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
left:-180px;
top:-120px;
background:rgba(59,130,246,.16);
}

.glow-right{
width:600px;
height:600px;
right:-220px;
bottom:-180px;
background:rgba(15,23,42,.08);
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

@media(max-width:1280px){

.solutions-grid{
grid-template-columns:repeat(3,1fr);
}

}

@media(max-width:992px){

.solutions{
padding:140px 0;
}

.heading h2{
font-size:clamp(46px,8vw,68px);
}

.solutions-grid{
grid-template-columns:repeat(2,1fr);
}

.solution-card{
min-height:310px;
}

}

@media(max-width:768px){

.solutions{
padding:110px 0;
}

.heading{
margin-bottom:60px;
}

.heading h2{
font-size:44px;
}

.heading p{
font-size:16px;
}

.solutions-grid{
grid-template-columns:1fr;
}

.solution-card{
padding:28px;
min-height:auto;
}

.icon{
width:64px;
height:64px;
}

.icon svg{
width:30px;
height:30px;
}

.solution-card h3{
font-size:24px;
}

}

@media(max-width:480px){

.heading h2{
font-size:36px;
}

.heading p{
font-size:15px;
}

.solution-card{
padding:24px;
border-radius:22px;
}

.bottom{
margin-top:24px;
}

.arrow{
width:38px;
height:38px;
}

}

</style>