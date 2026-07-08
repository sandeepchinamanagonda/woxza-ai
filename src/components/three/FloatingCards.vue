<template>

<div class="floating-layer">

    <div class="card top">

        <span class="dot green"></span>

        <div>

            <strong>

                Voice AI

            </strong>

            <small>

                Active

            </small>

        </div>

    </div>

    <div class="card right">

        <span class="dot blue"></span>

        <div>

            <strong>

                Knowledge AI

            </strong>

            <small>

                12,842 Documents

            </small>

        </div>

    </div>

    <div class="card bottom">

        <span class="dot purple"></span>

        <div>

            <strong>

                AI Agents

            </strong>

            <small>

                Running

            </small>

        </div>

    </div>

    <div class="card left">

        <span class="dot orange"></span>

        <div>

            <strong>

                Automation

            </strong>

            <small>

                36 Workflows

            </small>

        </div>

    </div>

</div>

</template>

<script setup>

</script>

<style scoped>

.floating-layer{

position:absolute;

inset:0;

pointer-events:none;

z-index:40;

}

.card{

position:absolute;

display:flex;

align-items:center;

gap:16px;

padding:18px 22px;

border-radius:22px;

background:rgba(255,255,255,.88);

border:1px solid rgba(var(--voxa-accent-rgb),.12);

box-shadow:

0 24px 70px rgba(40,90,180,.10);

min-width:220px;

animation:float 8s ease-in-out infinite;

}

.card strong{

display:block;

font-size:15px;

font-weight:700;

color:#101828;

margin-bottom:4px;

}

.card small{

font-size:13px;

color:#667085;

}

.dot{

width:12px;

height:12px;

border-radius:50%;

flex-shrink:0;

}

.green{

background:var(--voxa-accent);

box-shadow:0 0 14px rgba(var(--voxa-accent-rgb),.65);

}

.blue{

background:var(--voxa-accent-2);

box-shadow:0 0 14px rgba(var(--voxa-accent-rgb),.65);

}

.purple{

background:var(--voxa-accent);

box-shadow:0 0 14px rgba(var(--voxa-accent-rgb),.65);

}

.orange{

background:var(--voxa-accent-2);

box-shadow:0 0 14px rgba(var(--voxa-accent-rgb),.65);

}

.top{

top:30px;

right:160px;

left:auto;

}

.right{

top:260px;

right:180px;

}

.bottom{

bottom:40px;

right:220px;

}

.left{

bottom:260px;

left:180px;

}

.card{

overflow:hidden;

transition:

transform .45s cubic-bezier(.22,1,.36,1),

box-shadow .35s ease,

border-color .35s ease,

background .35s ease;

}

.card::before{

content:"";

position:absolute;

top:-180%;

left:-70%;

width:60%;

height:340%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.45),

transparent

);

transform:rotate(18deg);

animation:none;

}

.card:hover{

transform:translateY(-10px) scale(1.03);

border-color:var(--voxa-accent);

box-shadow:

0 35px 90px rgba(var(--voxa-accent-rgb),.18);

}

.card:hover strong{

color:var(--voxa-accent);

}

.card:hover .dot{

transform:scale(1.25);

}

.dot{

transition:.35s;

}
@keyframes float{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(-12px);

}

}
@media(max-width:1200px){

.card{

min-width:190px;

padding:16px 18px;

}

}

@media(max-width:768px){

.card{

min-width:160px;

padding:12px 14px;

border-radius:16px;

}

.card strong{

font-size:13px;

}

.card small{

font-size:11px;

}

.top{

top:20px;

left:10px;

}

.right{

right:0;

top:120px;

}

.bottom{

bottom:20px;

right:10px;

}

.left{

left:0;

bottom:120px;

}

}

</style>
