<template>
<section class="editorial">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="quote-card">

<span class="eyebrow">
OUR PHILOSOPHY
</span>

<h2>
Technology should
<br>
fade into the background.
</h2>

<p>
The best AI is never distracting. It quietly understands,
assists and improves every interaction, allowing people to
focus on what truly matters.
</p>

<div class="signature">

<div class="mark"></div>

<span>Woxza</span>

<div class="mark"></div>

</div>

</div>

</div>

</section>
</template>

<script setup>
</script>

<style scoped>

.editorial{
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
opacity:.55;
animation:none;
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
top:-180px;
background:rgba(59,130,246,.15);
}

.glow-right{
width:560px;
height:560px;
right:-220px;
bottom:-180px;
background:rgba(15,23,42,.08);
}

.quote-card{
position:relative;
z-index:2;
max-width:960px;
margin:auto;
padding:100px 80px;
background:rgba(255,255,255,.75);
border:1px solid rgba(15,23,42,.08);
border-radius:36px;
box-shadow:0 35px 90px rgba(15,23,42,.08);
text-align:center;
overflow:hidden;
}

.quote-card::before{
content:"";
position:absolute;
top:-180%;
left:-70%;
width:60%;
height:340%;
background:linear-gradient(
90deg,
transparent,
rgba(59,130,246,.10),
transparent
);
transform:rotate(20deg);
animation:none;
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
margin-bottom:28px;
}

.quote-card h2{
font-size:clamp(54px,6vw,82px);
line-height:.95;
letter-spacing:-.05em;
color:#0f172a;
margin-bottom:30px;
}

.quote-card p{
max-width:680px;
margin:auto;
font-size:19px;
line-height:1.9;
color:#64748b;
}

.signature{
margin-top:60px;
display:flex;
justify-content:center;
align-items:center;
gap:18px;
}

.mark{
width:70px;
height:2px;
background:#3b82f6;
}

.signature span{
font-size:12px;
font-weight:700;
letter-spacing:.35em;
color:#2563eb;
}
@media(max-width:768px){

.editorial{
padding:110px 0;
}

.quote-card{
padding:60px 26px;
border-radius:24px;
}

.quote-card h2{
font-size:42px;
}

.quote-card p{
font-size:16px;
}

.mark{
width:40px;
}

}

</style>
