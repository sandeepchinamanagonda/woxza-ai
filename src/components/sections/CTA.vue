<template>
<section id="contact" class="cta-section">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="cta">

<span class="eyebrow">
EARLY ACCESS
</span>

<h2>
Ready to put Voxa
<br>
on your phones?
</h2>

<p>
Join the waitlist for early access, or talk with sales if you
already know which calls and workflows you want Voxa to handle.
</p>

<div class="actions">

<button
class="btn-primary"
@click="$emit('open-demo','waitlist')"
>
Join the Waitlist
</button>

<button
class="btn-secondary"
@click="$emit('open-demo','sales')"
>
Call Sales
</button>

</div>

</div>

</div>

</section>
</template>

<script setup>

defineEmits([
"start-free",
"open-demo"
])

</script>

<style scoped>

.cta-section{
position:relative;
padding:180px 0;
background:var(--voxa-blue);
overflow:hidden;
}

.grid-bg{
position:absolute;
inset:0;
background-image:
linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),
linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);
background-size:46px 46px;
opacity:.45;
animation:none;
}

.glow{
display:none;
}

.glow-left{
width:560px;
height:560px;
left:-220px;
top:-180px;
background:rgba(var(--voxa-accent-rgb),.18);
}

.glow-right{
width:620px;
height:620px;
right:-260px;
bottom:-220px;
background:rgba(var(--voxa-accent-rgb),.08);
}

.cta{
position:relative;
z-index:2;
padding:100px 70px;
border-radius:36px;
background:var(--voxa-blue-2);
border:1px solid rgba(255,255,255,.08);
text-align:center;
overflow:hidden;
box-shadow:0 36px 100px rgba(0,0,0,.16);
}

.cta::before{
content:"";
position:absolute;
top:-180%;
left:-70%;
width:60%;
height:340%;
background:linear-gradient(
90deg,
transparent,
rgba(255,255,255,.08),
transparent
);
transform:rotate(20deg);
animation:none;
}

.eyebrow{
display:inline-flex;
padding:8px 16px;
border-radius:999px;
background:rgba(255,255,255,.06);
border:1px solid rgba(255,255,255,.08);
font-size:12px;
font-weight:700;
letter-spacing:.22em;
color:#dbeafe;
margin-bottom:24px;
}

.cta h2{
font-size:clamp(56px,6vw,82px);
line-height:.95;
letter-spacing:-.05em;
color:white;
margin-bottom:28px;
max-width:900px;
margin-inline:auto;
}

.cta p{
max-width:700px;
margin:auto;
font-size:19px;
line-height:1.8;
color:#94a3b8;
}

.actions{
display:flex;
justify-content:center;
gap:18px;
margin-top:48px;
}

.btn-primary,
.btn-secondary{
padding:16px 30px;
border-radius:999px;
font-weight:700;
transition:.35s;
cursor:pointer;
}

.btn-primary{
background:var(--voxa-accent);
border:none;
color:white;
}

.btn-primary:hover{
transform:translateY(-3px);
}

.btn-secondary{
background:transparent;
border:1px solid rgba(255,255,255,.15);
color:white;
}

.btn-secondary:hover{
background:rgba(255,255,255,.06);
border-color:rgba(255,255,255,.24);
}
@media(max-width:768px){

.cta-section{
padding:110px 0;
}

.cta{
padding:60px 26px;
border-radius:24px;
}

.cta h2{
font-size:42px;
}

.cta p{
font-size:16px;
}

.actions{
flex-direction:column;
}

.btn-primary,
.btn-secondary{
width:100%;
}

}

</style>
