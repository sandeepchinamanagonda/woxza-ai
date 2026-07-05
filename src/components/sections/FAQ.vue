<template>

<section id="faq" class="faq">

    <div class="container-custom">

        <div class="heading">

            <span>

                FREQUENTLY ASKED QUESTIONS

            </span>

            <h2>

                Everything you
                need to know.

            </h2>

            <p>

                Answers to the questions we hear most
                before beginning an AI transformation.

            </p>

        </div>

        <div class="faq-list">

            <div class="faq-item">

                <div class="question">

                    <span>01</span>

                    <h3>

                        What services does Voxa provide?

                    </h3>

                </div>

                <p>

                    We design Voice AI, AI agents,
                    workflow automations, enterprise
                    knowledge systems and custom AI
                    integrations.

                </p>

            </div>

            <div class="faq-item">

                <div class="question">

                    <span>02</span>

                    <h3>

                        Can AI integrate with existing software?

                    </h3>

                </div>

                <p>

                    Yes. We connect AI with your CRM,
                    ERP, APIs, databases and existing
                    business applications.

                </p>

            </div>

            <div class="faq-item">

                <div class="question">

                    <span>03</span>

                    <h3>

                        How long does implementation take?

                    </h3>

                </div>

                <p>

                    Depending on complexity,
                    projects generally range from
                    several weeks to a few months.

                </p>

            </div>

            <div class="faq-item">

                <div class="question">

                    <span>04</span>

                    <h3>

                        Do you provide ongoing support?

                    </h3>

                </div>

                <p>

                    Yes. Continuous optimisation,
                    monitoring and improvements
                    are included after deployment.

                </p>

            </div>

        </div>

    </div>

</section>

</template>

<script setup>

</script>

<style scoped>

.faq{

position:relative;

padding:220px 0;

background:
radial-gradient(circle at 12% 18%, rgba(var(--voxa-accent-rgb), .08), transparent 32%),
#fff;

overflow:hidden;

}

.container-custom{

position:relative;

z-index:1;

}

.heading{

max-width:760px;

margin:auto;

margin-bottom:100px;

text-align:center;

}

.heading span{

display:inline-block;

margin-bottom:18px;

font-size:12px;

font-weight:700;

letter-spacing:.35em;

text-transform:uppercase;

color:#5B8CFF;

}

.heading h2{

font-size:clamp(60px,6vw,90px);

line-height:.94;

letter-spacing:-.05em;

margin-bottom:26px;

color:#101828;

}

.heading p{

max-width:620px;

margin:auto;

font-size:20px;

line-height:1.9;

color:#667085;

}

.faq-list{

max-width:1000px;

margin:auto;

display:flex;

flex-direction:column;

gap:24px;

}

.faq-item{

background:#FFFFFF;

border:1px solid #E5ECF6;

border-radius:24px;

padding:34px 38px;

box-shadow:

0 18px 55px rgba(59,130,246,.06);

transition:.35s;

}

.question{

display:flex;

align-items:center;

gap:24px;

margin-bottom:18px;

}

.question span{

font-size:12px;

font-weight:700;

letter-spacing:.28em;

color:#5B8CFF;

}

.question h3{

font-size:28px;

color:#101828;

}

.faq-item p{

font-size:18px;

line-height:1.9;

color:#667085;

}
/* ==========================================================
BACKGROUND
========================================================== */

.faq::before{

content:"";

position:absolute;

inset:0;

pointer-events:none;

background-image:

linear-gradient(rgba(59,130,246,.04) 1px,transparent 1px),

linear-gradient(90deg,rgba(59,130,246,.04) 1px,transparent 1px);

background-size:48px 48px;

mask-image:

radial-gradient(circle,#000 60%,transparent 100%);

opacity:.45;

animation:none;

}

.faq::after{

content:"";

position:absolute;

left:50%;

top:50%;

transform:translate(-50%,-50%);

width:900px;

height:900px;

border-radius:50%;

background:

radial-gradient(

circle,

rgba(91,140,255,.08),

transparent 72%

);

filter:blur(90px);

pointer-events:none;

}

/* ==========================================================
ITEMS
========================================================== */

.faq-item{

position:relative;

overflow:hidden;

transition:

transform .4s cubic-bezier(.22,1,.36,1),

box-shadow .35s ease,

border-color .35s ease,

background .35s ease;

}

.faq-item:hover{

transform:translateY(-8px);

border-color:#5B8CFF;

box-shadow:

0 28px 70px rgba(59,130,246,.12);

}

.faq-item::before{

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

rgba(255,255,255,.8),

transparent

);

transform:rotate(18deg);

animation:none;

}
.question h3{

transition:.35s;

}

.faq-item:hover h3{

color:#3B82F6;

}

.faq-item p{

transition:.35s;

}

.faq-item:hover p{

color:#475467;

}
/* ==========================================================
RESPONSIVE
========================================================== */

@media(max-width:1100px){

.faq{

padding:180px 0;

}

.heading{

margin-bottom:80px;

}

.question h3{

font-size:24px;

}

.faq-item{

padding:30px;

}

}

@media(max-width:768px){

.faq{

padding:120px 0;

}

.heading h2{

font-size:44px;

line-height:1;

}

.heading p{

font-size:17px;

}

.question{

gap:16px;

align-items:flex-start;

}

.question h3{

font-size:20px;

}

.faq-item{

padding:24px;

border-radius:20px;

}

.faq-item p{

font-size:16px;

line-height:1.8;

}

}

@media(max-width:480px){

.heading h2{

font-size:36px;

}

.heading p{

font-size:15px;

}

.question h3{

font-size:18px;

}

.faq-item{

padding:20px;

}

}

/* ==========================================================
ANIMATIONS
========================================================== */

.heading{

animation:none;

}

.faq-item{

animation:none;

}
@keyframes fadeUp{

from{

opacity:0;

transform:translateY(40px);

}

to{

opacity:1;

transform:translateY(0);

}

}
/* ==========================================================
FINISH
========================================================== */

.faq{

isolation:isolate;

}

.heading,
.faq-list{

position:relative;

z-index:2;

}

.heading h2{

text-wrap:balance;

}

.heading p{

text-wrap:pretty;

}

.faq-item{

backface-visibility:hidden;

}

</style>
