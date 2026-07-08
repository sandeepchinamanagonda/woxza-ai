<template>
<section
id="integrations"
ref="sectionRef"
class="integrations"
:class="{ 'is-visible': isVisible }"
>

<div class="container-custom">

<div class="section-header">

<span class="eyebrow">

ECOSYSTEM

</span>

<h2>

Works with the tools
your business already uses.

</h2>

<p>

VOXA connects with your existing business ecosystem,
making AI employees a natural extension of your workflows.

</p>

</div>

<div
class="integration-grid"
:style="{ '--scroll-progress': scrollProgress }"
>

<div
v-for="item in integrations"
:key="item.name"
class="integration-card"
:style="{
  '--card-index': item.index,
  '--float-x': item.floatX,
  '--float-y': item.floatY,
  '--delay': `${item.index * 80}ms`
}"
>

<div class="icon">

{{ item.short }}

</div>

<h3>

{{ item.name }}

</h3>

</div>

</div>

</div>

</section>
</template>

<script setup>

import {
ref,
onMounted,
onUnmounted
} from "vue"

const integrations=[

{
name:"CRM Systems",
short:"CRM",
floatX:"-18px",
floatY:"-22px"
},

{
name:"WhatsApp Business",
short:"WA",
floatX:"-6px",
floatY:"18px"
},

{
name:"Microsoft Teams",
short:"MS",
floatX:"8px",
floatY:"-18px"
},

{
name:"Slack",
short:"SL",
floatX:"20px",
floatY:"16px"
},

{
name:"Google Workspace",
short:"GW",
floatX:"-16px",
floatY:"20px"
},

{
name:"Calendars",
short:"CAL",
floatX:"-4px",
floatY:"-16px"
},

{
name:"Email Platforms",
short:"EM",
floatX:"10px",
floatY:"22px"
},

{
name:"Custom APIs",
short:"API",
floatX:"18px",
floatY:"-20px"
}

].map((item,index)=>({
...item,
index
}))

const sectionRef=ref(null)
const isVisible=ref(false)
const scrollProgress=ref(0)

let observer
let frame=0

const updateScrollProgress=()=>{

frame=0

const section=sectionRef.value

if(!section) return

const rect=section.getBoundingClientRect()
const travel=window.innerHeight+rect.height
const raw=(window.innerHeight-rect.top)/travel

scrollProgress.value=Math.min(
1,
Math.max(0,raw)
).toFixed(3)

}

const requestProgressUpdate=()=>{

if(frame) return

frame=requestAnimationFrame(updateScrollProgress)

}

onMounted(()=>{

const section=sectionRef.value

if(!section) return

observer=new IntersectionObserver(
([entry])=>{

isVisible.value=entry.isIntersecting

if(entry.isIntersecting){

requestProgressUpdate()

}

},
{
threshold:.18
}
)

observer.observe(section)

window.addEventListener(
"scroll",
requestProgressUpdate,
{ passive:true }
)

window.addEventListener(
"resize",
requestProgressUpdate,
{ passive:true }
)

requestProgressUpdate()

})

onUnmounted(()=>{

observer?.disconnect()

window.removeEventListener(
"scroll",
requestProgressUpdate
)

window.removeEventListener(
"resize",
requestProgressUpdate
)

if(frame){

cancelAnimationFrame(frame)

}

})

</script>

<style scoped>

.integrations{

padding:140px 0;

overflow:hidden;

background:
radial-gradient(circle at 15% 20%,rgba(91,140,255,.10),transparent 30%),
radial-gradient(circle at 82% 70%,rgba(16,185,129,.08),transparent 28%),
linear-gradient(180deg,#FFFFFF 0%,#F8FBFF 100%);

isolation:isolate;

}

.integrations::before{

content:"";

position:absolute;

inset:0;

background-image:
linear-gradient(rgba(20,38,77,.045) 1px,transparent 1px),
linear-gradient(90deg,rgba(20,38,77,.045) 1px,transparent 1px);

background-size:58px 58px;

mask-image:linear-gradient(180deg,transparent,#000 18%,#000 78%,transparent);

pointer-events:none;

}

.integrations::after{

content:"";

position:absolute;

left:50%;

top:56%;

width:min(860px,70vw);

height:min(360px,34vw);

transform:translate(-50%,-50%);

border:1px solid rgba(91,140,255,.14);

border-radius:50%;

opacity:.65;

pointer-events:none;

}

.container-custom{

position:relative;

z-index:1;

}

.section-header{

max-width:760px;

margin:0 auto 90px;

text-align:center;

opacity:0;

transform:translateY(24px);

transition:
opacity .7s cubic-bezier(.22,1,.36,1),
transform .7s cubic-bezier(.22,1,.36,1);

}

.is-visible .section-header{

opacity:1;

transform:translateY(0);

}

.eyebrow{

display:inline-block;

margin-bottom:18px;

font-size:12px;

font-weight:700;

letter-spacing:.28em;

text-transform:uppercase;

color:#5B8CFF;

}

.section-header h2{

font-size:clamp(42px,5vw,64px);

line-height:1.08;

margin-bottom:22px;

color:#111827;

}

.section-header p{

max-width:700px;

margin:auto;

font-size:18px;

line-height:1.8;

color:#667085;

}

.integration-grid{

display:grid;

grid-template-columns:repeat(4,1fr);

gap:26px;

position:relative;

perspective:1200px;

--scroll-progress:0;

}

.integration-grid::before{

content:"";

position:absolute;

inset:50% 8%;

height:2px;

background:
linear-gradient(90deg,transparent,rgba(91,140,255,.24),rgba(16,185,129,.20),transparent);

transform:translateY(-50%) scaleX(calc(.15 + (var(--scroll-progress) * .85)));

transform-origin:center;

opacity:calc(.15 + (var(--scroll-progress) * .55));

pointer-events:none;

}

.integration-card{

position:relative;

height:180px;

display:flex;

flex-direction:column;

justify-content:center;

align-items:center;

background:white;

border:1px solid #E5E7EB;

border-radius:22px;

box-shadow:
0 16px 50px rgba(15,23,42,.05);

opacity:0;

transform:
translate3d(
calc(var(--float-x) * (1 - var(--scroll-progress))),
calc(44px + (var(--float-y) * (1 - var(--scroll-progress)))),
0
)
rotateX(calc((1 - var(--scroll-progress)) * 10deg))
scale(.94);

transition:
opacity .7s cubic-bezier(.22,1,.36,1) var(--delay),
transform .7s cubic-bezier(.22,1,.36,1) var(--delay),
box-shadow .35s cubic-bezier(.22,1,.36,1),
border-color .35s cubic-bezier(.22,1,.36,1);

cursor:pointer;

overflow:hidden;

will-change:transform,opacity;

}

.is-visible .integration-card{

opacity:1;

transform:
translate3d(
calc(var(--float-x) * (var(--scroll-progress) - .5) * .7),
calc(var(--float-y) * (var(--scroll-progress) - .5) * .7),
0
)
rotateX(0deg)
scale(1);

}

.integration-card::before{

content:"";

position:absolute;

inset:-1px;

border-radius:22px;

background:
linear-gradient(135deg,rgba(91,140,255,.22),transparent 38%,rgba(16,185,129,.16));

opacity:0;

transition:opacity .35s cubic-bezier(.22,1,.36,1);

z-index:0;

}

.integration-card::after{

content:"";

position:absolute;

top:-30%;

left:-70%;

width:48%;

height:160%;

background:
linear-gradient(90deg,transparent,rgba(255,255,255,.75),transparent);

transform:rotate(18deg);

transition:left .9s cubic-bezier(.22,1,.36,1);

z-index:1;

pointer-events:none;

}

.integration-card:hover{

transform:
translate3d(
calc(var(--float-x) * (var(--scroll-progress) - .5) * .7),
calc(-10px + (var(--float-y) * (var(--scroll-progress) - .5) * .7)),
0
)
scale(1.02);

box-shadow:

0 26px 70px rgba(91,140,255,.16);

border-color:#5B8CFF;

}

.integration-card:hover::before{

opacity:1;

}

.integration-card:hover::after{

left:125%;

}

.icon{

position:relative;

z-index:2;

width:56px;

height:56px;

display:grid;

place-items:center;

border-radius:16px;

background:#F3F4F6;

font-size:18px;

font-weight:700;

color:#5B8CFF;

margin-bottom:20px;

transition:.35s cubic-bezier(.22,1,.36,1);

box-shadow:
inset 0 0 0 1px rgba(91,140,255,.05);

}

.integration-card:hover .icon{

background:#EEF4FF;

transform:translateY(-3px) rotate(-4deg);

}

.integration-card h3{

position:relative;

z-index:2;

font-size:18px;

font-weight:600;

color:#14264D;

}

@media(max-width:1000px){

.integration-grid{

grid-template-columns:repeat(2,1fr);

}

}

@media(max-width:640px){

.integrations{

padding:90px 0;

}

.integration-grid{

grid-template-columns:1fr;

}

.integration-card{

height:150px;

}

}

@media (prefers-reduced-motion:reduce){

.integration-card,
.section-header,
.integration-card::after{

transition:none;

}

.integration-card,
.is-visible .integration-card{

opacity:1;

transform:none;

}

.integration-grid::before{

transform:translateY(-50%);

}

}

</style>
