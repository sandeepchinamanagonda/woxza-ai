<template>
<section class="integrations">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="heading">

<span>INTEGRATIONS</span>

<h2>
Works with the tools
<br>
your team already uses.
</h2>

<p>
VOXA connects with your existing platforms to create one
connected AI operating system.
</p>

</div>

<div class="integration-grid">

<div
v-for="(item,index) in services"
:key="index"
class="integration-card"
>

<div class="number">
{{ String(index+1).padStart(2,"0") }}
</div>

<h3>
{{ item.title }}
</h3>

<p>
{{ item.description }}
</p>

<div class="tags">

<span
v-for="platform in item.platforms"
:key="platform"
>
{{ platform }}
</span>

</div>

</div>

</div>

</div>

</section>
</template>

<script setup>

const services=[

{
title:"CRM Integration",
description:"Synchronize customers, conversations and business data.",
platforms:["HubSpot","Salesforce"]
},

{
title:"Communication",
description:"Voice, chat and collaboration platforms connected together.",
platforms:["Twilio","Slack"]
},

{
title:"Automation",
description:"Trigger workflows across your business automatically.",
platforms:["Zapier","n8n"]
},

{
title:"Cloud Infrastructure",
description:"Enterprise deployment with scalable cloud architecture.",
platforms:["AWS","Google Cloud"]
},

{
title:"Scheduling",
description:"Connect bookings, meetings and customer interactions.",
platforms:["Calendly","Monday"]
},

{
title:"Knowledge",
description:"Connect documents, CRMs and internal knowledge.",
platforms:["Notion","Drive"]
}

]

</script>

<style scoped>

.integrations{
position:relative;
padding:180px 0;
background:#f8fafc;
overflow:hidden;
}

.grid-bg{
position:absolute;
inset:0;
background-image:
linear-gradient(rgba(15,23,42,.04) 1px,transparent 1px),
linear-gradient(90deg,rgba(15,23,42,.04) 1px,transparent 1px);
background-size:46px 46px;
animation:gridMove 22s linear infinite;
opacity:.55;
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

.integration-grid{
position:relative;
z-index:2;
display:grid;
grid-template-columns:repeat(3,1fr);
gap:28px;
}

.integration-card{
padding:34px;
border-radius:28px;
background:rgba(255,255,255,.75);
backdrop-filter:blur(24px);
border:1px solid rgba(15,23,42,.08);
box-shadow:0 25px 70px rgba(15,23,42,.08);
transition:.4s;
}

.integration-card:hover{
transform:translateY(-10px);
border-color:#3b82f6;
}

.number{
font-size:13px;
font-weight:700;
letter-spacing:.24em;
color:#3b82f6;
margin-bottom:20px;
}

.integration-card h3{
font-size:28px;
margin-bottom:14px;
color:#0f172a;
}

.integration-card p{
font-size:16px;
line-height:1.8;
color:#64748b;
margin-bottom:26px;
}

.tags{
display:flex;
flex-wrap:wrap;
gap:10px;
}

.tags span{
padding:10px 16px;
border-radius:999px;
background:#eff6ff;
border:1px solid rgba(59,130,246,.15);
font-size:13px;
font-weight:600;
color:#2563eb;
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

.integration-grid{
grid-template-columns:repeat(2,1fr);
}

}

@media(max-width:768px){

.integrations{
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

.integration-grid{
grid-template-columns:1fr;
}

.integration-card{
padding:26px;
}

.integration-card h3{
font-size:24px;
}

}

</style>