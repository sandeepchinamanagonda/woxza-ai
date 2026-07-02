<template>
<section class="programs">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="heading">

<span>ENGAGEMENT MODELS</span>

<h2>
Choose the journey
<br>
that fits your business.
</h2>

<p>
Whether you're exploring AI or deploying enterprise-wide
automation, Voxa provides a structured path from strategy to scale.
</p>

</div>

<div class="program-grid">

<article
v-for="(program,index) in programs"
:key="index"
class="program-card"
>

<div class="top">

<span class="type">
{{ program.type }}
</span>

<div class="badge">
0{{ index+1 }}
</div>

</div>

<h3>
{{ program.title }}
</h3>

<p class="description">
{{ program.description }}
</p>

<ul>

<li
v-for="item in program.features"
:key="item"
>
{{ item }}
</li>

</ul>

<a href="#">
Learn More →
</a>

</article>

</div>

</div>

</section>
</template>

<script setup>

const programs=[

{
type:"FOUNDATION",
title:"AI Readiness",
description:"Identify opportunities and create a strategic roadmap for AI adoption.",
features:[
"Business Assessment",
"AI Strategy",
"Opportunity Mapping",
"Implementation Roadmap"
]
},

{
type:"IMPLEMENTATION",
title:"AI Deployment",
description:"Deploy intelligent AI employees integrated with your business.",
features:[
"AI Employees",
"CRM Integration",
"Workflow Automation",
"Training"
]
},

{
type:"OPTIMIZATION",
title:"Continuous Growth",
description:"Improve AI performance through analytics and optimization.",
features:[
"Performance Reviews",
"Conversation Tuning",
"Workflow Improvements",
"Business Insights"
]
},

{
type:"ENTERPRISE",
title:"Strategic Partnership",
description:"Long-term AI partnership supporting enterprise transformation.",
features:[
"Dedicated Consultant",
"Priority Support",
"Executive Workshops",
"Continuous Innovation"
]
}

]

</script>

< style scoped>

.programs{
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
left:-180px;
top:-150px;
background:rgba(59,130,246,.16);
}

.glow-right{
width:560px;
height:560px;
right:-220px;
bottom:-180px;
background:rgba(15,23,42,.08);
}

.heading{
max-width:760px;
margin:auto;
text-align:center;
margin-bottom:90px;
position:relative;
z-index:2;
}

.heading span{
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

.heading h2{
font-size:clamp(58px,6vw,82px);
line-height:.95;
letter-spacing:-.05em;
color:#0f172a;
margin-bottom:24px;
}

.heading p{
max-width:620px;
margin:auto;
font-size:19px;
line-height:1.8;
color:#64748b;
}

.program-grid{
position:relative;
z-index:2;
display:grid;
grid-template-columns:repeat(2,1fr);
gap:30px;
}
.program-card{
position:relative;
padding:40px;
border-radius:30px;
background:rgba(255,255,255,.78);
border:1px solid rgba(15,23,42,.08);
box-shadow:0 25px 70px rgba(15,23,42,.08);
overflow:hidden;
transition:.4s cubic-bezier(.22,1,.36,1);
display:flex;
flex-direction:column;
}

.program-card::before{
content:"";
position:absolute;
top:-180%;
left:-70%;
width:60%;
height:340%;
background:linear-gradient(
90deg,
transparent,
rgba(59,130,246,.12),
transparent
);
transform:rotate(20deg);
animation:none;
}

.program-card:hover{
transform:translateY(-10px);
border-color:#3b82f6;
box-shadow:
0 40px 90px rgba(15,23,42,.12),
0 0 40px rgba(59,130,246,.12);
}

.top{
display:flex;
justify-content:space-between;
align-items:center;
margin-bottom:28px;
}

.type{
font-size:12px;
font-weight:700;
letter-spacing:.24em;
color:#64748b;
}

.badge{
width:44px;
height:44px;
display:flex;
align-items:center;
justify-content:center;
border-radius:50%;
background:#eff6ff;
color:#2563eb;
font-weight:700;
}

.program-card h3{
font-size:32px;
font-weight:700;
letter-spacing:-.03em;
color:#0f172a;
margin-bottom:18px;
}

.description{
font-size:16px;
line-height:1.8;
color:#64748b;
margin-bottom:28px;
}

.program-card ul{
list-style:none;
padding:0;
margin:0 0 32px;
display:flex;
flex-direction:column;
gap:14px;
}

.program-card li{
padding-bottom:14px;
border-bottom:1px solid rgba(15,23,42,.08);
font-size:15px;
color:#334155;
}

.program-card li::before{
content:"✓";
margin-right:10px;
color:#3b82f6;
font-weight:700;
}

.program-card a{
display:inline-flex;
align-items:center;
gap:8px;
margin-top:auto;
font-weight:700;
color:#2563eb;
text-decoration:none;
transition:.3s;
}

.program-card:hover a{
gap:14px;
}
@media(max-width:1100px){

.program-grid{
grid-template-columns:1fr;
}

}

@media(max-width:768px){

.programs{
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

.program-card{
padding:28px;
}

.program-card h3{
font-size:26px;
}

.description{
font-size:15px;
}

}

@media(max-width:480px){

.heading h2{
font-size:36px;
}

.heading p{
font-size:15px;
}

.program-card{
padding:24px;
border-radius:22px;
}

.badge{
width:38px;
height:38px;
font-size:13px;
}

.program-card h3{
font-size:22px;
}

.program-card li{
font-size:14px;
}

}

</style>
