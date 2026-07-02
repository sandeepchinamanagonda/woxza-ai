<template>
<section id="programs" class="process">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="heading">

<span>PROCESS</span>

<h2>
From idea
<br>
to intelligent deployment.
</h2>

<p>
A streamlined process ensuring every AI solution is designed,
validated and deployed with confidence.
</p>

</div>

<div class="timeline">

<div
v-for="(step,index) in steps"
:key="index"
class="step"
>

<div class="indicator">

<div class="dot"></div>

<div
v-if="index!==steps.length-1"
class="line"
></div>

</div>

<div class="content">

<div class="number">
{{ String(index+1).padStart(2,"0") }}
</div>

<h3>
{{ step.title }}
</h3>

<p>
{{ step.description }}
</p>

</div>

</div>

</div>

</div>

</section>
</template>

<script setup>

const steps=[

{
title:"Discovery",
description:"We understand your business, workflows, goals and customer interactions."
},

{
title:"Design",
description:"Our team designs AI employees tailored to your organization."
},

{
title:"Validation",
description:"Every workflow is tested, optimized and refined before launch."
},

{
title:"Deployment",
description:"Launch with monitoring, analytics and continuous AI improvement."
}

]

</script>

<style scoped>

.process{
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
animation:gridMove 22s linear infinite;
}

.glow{
position:absolute;
border-radius:50%;
filter:blur(120px);
pointer-events:none;
}

.glow-left{
width:520px;
height:520px;
left:-200px;
top:-160px;
background:rgba(59,130,246,.15);
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
margin-bottom:24px;
color:#0f172a;
}

.heading p{
max-width:620px;
margin:auto;
font-size:19px;
line-height:1.8;
color:#64748b;
}

.timeline{
max-width:900px;
margin:auto;
position:relative;
z-index:2;
}

.step{
display:grid;
grid-template-columns:80px 1fr;
gap:40px;
padding-bottom:60px;
}

.indicator{
display:flex;
flex-direction:column;
align-items:center;
}

.dot{
width:18px;
height:18px;
border-radius:50%;
background:#3b82f6;
box-shadow:0 0 25px rgba(59,130,246,.4);
}

.line{
width:2px;
flex:1;
margin-top:18px;
background:linear-gradient(
180deg,
#3b82f6,
rgba(59,130,246,.08)
);
}

.number{
font-size:13px;
font-weight:700;
letter-spacing:.24em;
color:#3b82f6;
margin-bottom:14px;
}

.content{
padding:34px;
border-radius:28px;
background:white;
border:1px solid rgba(15,23,42,.08);
box-shadow:0 25px 70px rgba(15,23,42,.08);
transition:.4s;
}

.content:hover{
transform:translateY(-8px);
border-color:#3b82f6;
}

.content h3{
font-size:30px;
font-weight:700;
letter-spacing:-.03em;
color:#0f172a;
margin-bottom:16px;
}

.content p{
font-size:17px;
line-height:1.9;
color:#64748b;
}

@keyframes gridMove{
from{
background-position:0 0;
}
to{
background-position:46px 46px;
}
}

@media(max-width:768px){

.process{
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

.step{
grid-template-columns:50px 1fr;
gap:20px;
}

.content{
padding:24px;
}

.content h3{
font-size:24px;
}

.content p{
font-size:15px;
}

}

</style>