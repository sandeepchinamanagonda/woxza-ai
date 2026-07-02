<template>
<footer class="footer">

<div class="grid-bg"></div>
<div class="glow glow-left"></div>
<div class="glow glow-right"></div>

<div class="container-custom">

<div class="footer-card">

<div class="top">

<div class="brand">

<h2>Voxa</h2>

<p>
Building voice AI that answers calls, books appointments,
updates systems and keeps every customer conversation moving.
</p>

</div>

<div class="links">

<div>

<h4>Company</h4>

<a href="#about">About</a>
<a href="#services">Services</a>
<a href="#programs">Programs</a>

</div>

<div>

<h4>Resources</h4>

<a href="#faq">FAQ</a>
<a href="#contact">Waitlist</a>
<a href="#">Insights</a>

</div>

<div>

<h4>Support</h4>

<a href="#">Contact</a>
<a href="#">Privacy</a>
<a href="#">Terms</a>

</div>

<div>

<h4>Connect</h4>

<a href="#">LinkedIn</a>
<a href="#">Instagram</a>
<a href="#">Email</a>

</div>

</div>

</div>

<div class="divider"></div>

<div class="bottom">

<p>© 2026 Voxa. All rights reserved.</p>

<p>Voice AI Platform • Waitlist Access • Customer Automation</p>

</div>

</div>

</div>

</footer>
</template>

<script setup>
</script>

<style scoped>

.footer{
position:relative;
padding:140px 0 50px;
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
background:rgba(var(--voxa-accent-rgb),.16);
}

.glow-right{
width:620px;
height:620px;
right:-260px;
bottom:-220px;
background:rgba(var(--voxa-accent-rgb),.08);
}

.footer-card{
position:relative;
z-index:2;
padding:70px;
border-radius:34px;
background:rgba(255,255,255,.05);
border:1px solid rgba(255,255,255,.08);
}

.top{
display:grid;
grid-template-columns:1.3fr 1fr;
gap:80px;
}

.brand h2{
font-size:56px;
font-weight:800;
letter-spacing:.04em;
color:white;
margin-bottom:24px;
}

.brand p{
max-width:460px;
font-size:17px;
line-height:1.9;
color:#94a3b8;
}

.links{
display:grid;
grid-template-columns:repeat(2,1fr);
gap:40px;
}

.links h4{
font-size:12px;
letter-spacing:.22em;
font-weight:700;
color:#dbeafe;
margin-bottom:20px;
}

.links a{
display:block;
margin-bottom:14px;
text-decoration:none;
color:#94a3b8;
transition:.3s;
}

.links a:hover{
color:white;
padding-left:6px;
}

.divider{
height:1px;
margin:60px 0 26px;
background:rgba(255,255,255,.08);
}

.bottom{
display:flex;
justify-content:space-between;
align-items:center;
font-size:14px;
color:#64748b;
}
@media(max-width:900px){

.footer{
padding:100px 0 40px;
}

.footer-card{
padding:40px 24px;
}

.top{
grid-template-columns:1fr;
gap:50px;
}

.links{
grid-template-columns:repeat(2,1fr);
}

.bottom{
flex-direction:column;
gap:14px;
text-align:center;
}

.brand h2{
font-size:42px;
}

}

@media(max-width:600px){

.links{
grid-template-columns:1fr;
}

.brand h2{
font-size:34px;
}

.brand p{
font-size:15px;
}

}

</style>
