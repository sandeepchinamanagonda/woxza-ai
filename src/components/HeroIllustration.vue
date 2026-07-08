<template>
  <div class="hero-illustration">

    <!-- Background Rings -->

    <div class="ring ring-1"></div>
    <div class="ring ring-2"></div>
    <div class="ring ring-3"></div>

    <!-- Blueprint -->

    <svg
      class="blueprint"
      viewBox="0 0 700 700"
      xmlns="http://www.w3.org/2000/svg"
    >

      <defs>

        <pattern
          id="smallGrid"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >

          <path
            d="M40 0H0V40"
            fill="none"
            stroke="#ECE6DE"
            stroke-width="1"
          />

        </pattern>

      </defs>

      <rect
        width="700"
        height="700"
        fill="url(#smallGrid)"
      />

      <!-- Main Vertical -->

      <line
        class="wire"
        x1="350"
        y1="70"
        x2="350"
        y2="630"
      />

      <!-- Horizontal -->

      <line
        class="wire"
        x1="170"
        y1="220"
        x2="530"
        y2="220"
      />

      <line
        class="wire"
        x1="170"
        y1="480"
        x2="530"
        y2="480"
      />

      <!-- Nodes -->

      <circle class="node" cx="350" cy="70" r="7"/>
      <circle class="node" cx="350" cy="220" r="7"/>
      <circle class="node" cx="350" cy="350" r="7"/>
      <circle class="node" cx="350" cy="480" r="7"/>
      <circle class="node" cx="350" cy="630" r="7"/>

    </svg>

    <!-- Glass Cards -->

    <div class="glass top">

      <span>AI EMPLOYEE</span>

      <h3>Online</h3>

      <p>Operational</p>

    </div>

    <div class="glass left">

      <span>VOICE</span>

      <h3>Natural</h3>

      <p>Conversation Engine</p>

    </div>

    <div class="glass right">

      <span>WORKFLOW</span>

      <h3>Running</h3>

      <p>Automation Active</p>

    </div>

    <div class="glass bottom">

      <span>ENTERPRISE</span>

      <h3>Connected</h3>

      <p>Secure Infrastructure</p>

    </div>

    <!-- Main Block -->

    <div class="core">

      <div class="core-inner">

        <small>Voxa</small>

        <h2>
          AI
        </h2>

      </div>

    </div>

  </div>
</template>

<script setup>
</script>

<style scoped>

.hero-illustration{

position:relative;

width:640px;

height:640px;

margin:auto;

}

/* ==========================
   RINGS
========================== */

.ring{

position:absolute;

border-radius:50%;

border:1px solid #DED8CF;

}

.ring-1{

width:600px;
height:600px;

left:20px;
top:20px;

}

.ring-2{

width:470px;
height:470px;

left:85px;
top:85px;

}

.ring-3{

width:340px;
height:340px;

left:150px;
top:150px;

}

/* ==========================
   BLUEPRINT
========================== */

.blueprint{

position:absolute;

inset:0;

width:100%;
height:100%;

}

.wire{

stroke:#D6CEC4;

stroke-width:1.4;

stroke-dasharray:8 8;

fill:none;

}

.node{

fill:#9C8168;

}

.core{

position:absolute;

left:220px;

top:220px;

width:200px;

height:200px;

background:white;

border-radius:36px;

border:1px solid #E7E2DA;

display:flex;

justify-content:center;

align-items:center;

box-shadow:0 30px 80px rgba(0,0,0,.05);

}

.core-inner{

text-align:center;

}

.core small{

display:block;

font-family:"IBM Plex Sans";

letter-spacing:.3em;

font-size:11px;

margin-bottom:14px;

color:#9C8168;

}

.core h2{

font-family:"Source Serif 4",serif;

font-size:82px;

font-weight:500;

line-height:1;

color:#232323;

}

/* ==========================
   GLASS CARDS
========================== */

.glass{

position:absolute;

width:180px;

padding:20px 22px;

background:rgba(255,255,255,.75);

border:1px solid rgba(255,255,255,.6);

border-radius:20px;

box-shadow:0 20px 50px rgba(0,0,0,.05);

}

.glass span{

display:block;

font-size:11px;

letter-spacing:.28em;

margin-bottom:10px;

font-family:"IBM Plex Sans";

color:#9C8168;

}

.glass h3{

font-family:"Source Serif 4",serif;

font-size:28px;

font-weight:500;

margin-bottom:6px;

color:#232323;

}

.glass p{

font-size:14px;

color:#6D6862;

}
.top{

top:20px;

left:230px;

}

.left{

left:20px;

top:180px;

}

.right{

right:20px;

top:340px;

}

.bottom{

left:230px;

bottom:20px;

}

/* ==========================
   ARCHITECTURAL PANELS
========================== */

.hero-illustration::before{

content:"";

position:absolute;

left:170px;

top:170px;

width:300px;

height:300px;

border-radius:42px;

background:#E8DED1;

opacity:.45;

z-index:-2;

}

.hero-illustration::after{

content:"";

position:absolute;

left:130px;

top:260px;

width:380px;

height:220px;

background:white;

border-radius:34px;

border:1px solid #E7E2DA;

box-shadow:0 30px 80px rgba(0,0,0,.04);

z-index:-1;

}

/* ==========================
   CARD HOVER
========================== */

.glass{

transition:.45s ease;

}

.glass:hover{

transform:translateY(-8px);

box-shadow:0 35px 90px rgba(0,0,0,.08);

}

.core{

transition:.45s ease;

}

.core:hover{

transform:translateY(-10px) scale(1.02);

box-shadow:0 45px 110px rgba(0,0,0,.08);

}

/* ==========================
   FLOAT
========================== */

@keyframes floatSlow{

0%{

transform:translateY(0px);

}

50%{

transform:translateY(-8px);

}

100%{

transform:translateY(0px);

}

}

.top{

animation:floatSlow 8s ease-in-out infinite;

}

.left{

animation:floatSlow 9s ease-in-out infinite;

animation-delay:1s;

}

.right{

animation:floatSlow 10s ease-in-out infinite;

animation-delay:2s;

}

.bottom{

animation:floatSlow 8s ease-in-out infinite;

animation-delay:3s;

}

.core{

animation:floatSlow 12s ease-in-out infinite;

}

/* ==========================
   NODE PULSE
========================== */

.node{

animation:pulse 3s infinite;

transform-origin:center;

}

@keyframes pulse{

0%{

r:7;

}

50%{

r:10;

}

100%{

r:7;

}

}

/* ==========================
   DRAW LINES
========================== */

.wire{

stroke-dasharray:12;

stroke-dashoffset:120;

animation:draw 2.5s ease forwards;

}

@keyframes draw{

to{

stroke-dashoffset:0;

}

}
/* ==========================
   DECORATIVE LABELS
========================== */

.hero-illustration .label{

position:absolute;

font-family:"IBM Plex Sans",sans-serif;

font-size:11px;

letter-spacing:.28em;

text-transform:uppercase;

color:#9C8168;

opacity:.9;

}

.hero-illustration .label-a{

left:70px;

top:130px;

}

.hero-illustration .label-b{

right:40px;

top:295px;

}

.hero-illustration .label-c{

left:240px;

bottom:110px;

}

/* ==========================
   GLOW
========================== */

.core::before{

content:"";

position:absolute;

inset:-35px;

border-radius:60px;

background:radial-gradient(circle,
rgba(156,129,104,.18),
transparent 72%);

z-index:-1;

filter:blur(18px);

}

.core::after{

content:"";

position:absolute;

width:26px;

height:26px;

border-radius:50%;

background:#9C8168;

top:-13px;

left:50%;

transform:translateX(-50%);

box-shadow:
0 0 0 8px rgba(156,129,104,.10);

}

/* ==========================
   MICRO DETAILS
========================== */

.glass::before{

content:"";

position:absolute;

left:0;

top:0;

width:100%;

height:4px;

background:linear-gradient(
90deg,
#9C8168,
transparent
);

opacity:.15;

border-radius:20px 20px 0 0;

}

.glass::after{

content:"";

position:absolute;

right:16px;

top:16px;

width:8px;

height:8px;

border-radius:50%;

background:#9C8168;

opacity:.45;

}

/* ==========================
   GRID FADE
========================== */

.blueprint{

mask-image:
radial-gradient(circle,
rgba(0,0,0,1) 55%,
rgba(0,0,0,.15) 100%);

}

/* ==========================
   RESPONSIVE
========================== */

@media(max-width:960px){

.hero-illustration{

width:380px;

height:380px;

}

.ring-1{

width:360px;
height:360px;
left:10px;
top:10px;

}

.ring-2{

width:280px;
height:280px;
left:50px;
top:50px;

}

.ring-3{

width:200px;
height:200px;
left:90px;
top:90px;

}

.core{

width:120px;
height:120px;

left:130px;
top:130px;

border-radius:24px;

}

.core h2{

font-size:46px;

}

.core small{

font-size:9px;

}

.glass{

width:120px;

padding:14px 16px;

}

.glass h3{

font-size:18px;

}

.glass p{

font-size:12px;

}

.top{

left:130px;
top:5px;

}

.left{

left:0;
top:120px;

}

.right{

right:0;
top:220px;

}

.bottom{

left:130px;
bottom:5px;

}

}

@media(max-width:640px){

.hero-illustration{

width:300px;

height:300px;

}

.ring,
.blueprint{

display:none;

}

.hero-illustration::before,
.hero-illustration::after{

display:none;

}

.core{

left:90px;

top:90px;

width:120px;

height:120px;

}

.left,
.right{

display:none;

}

.top{

left:90px;

}

.bottom{

left:90px;

}

}

</style>
    <div class="glass bottom">

      <span>ENTERPRISE</span>

      <h3>Connected</h3>

      <p>Secure Infrastructure</p>

    </div>

    <!-- Decorative Labels -->

    <span class="label label-a">
      VOICE
    </span>

    <span class="label label-b">
      AUTOMATION
    </span>

    <span class="label label-c">
      AI CORE
    </span>

  </div>
</template>

<script setup>
</script>

<style scoped>
