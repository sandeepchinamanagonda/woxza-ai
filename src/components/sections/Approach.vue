<template>

<section id="approach" class="approach">

    <div class="container-custom">

        <div class="heading">

            <span>

                OUR PROCESS

            </span>

            <h2>

                From strategy
                to intelligent
                execution.

            </h2>

            <p>

                Every successful AI implementation follows
                a structured engineering process designed
                for long-term scalability.

            </p>

        </div>

        <div class="timeline">

            <div class="line"></div>

            <div class="step left">

                <div class="card">

                    <span>01</span>

                    <h3>Discover</h3>

                    <p>

                        Business analysis, workflows,
                        goals and opportunities.

                    </p>

                </div>

                <div class="dot"></div>

            </div>

            <div class="step right">

                <div class="dot"></div>

                <div class="card">

                    <span>02</span>

                    <h3>Architect</h3>

                    <p>

                        Design the AI ecosystem,
                        integrations and workflows.

                    </p>

                </div>

            </div>

            <div class="step left">

                <div class="card">

                    <span>03</span>

                    <h3>Build</h3>

                    <p>

                        Develop Voice AI,
                        Agents and Automations.

                    </p>

                </div>

                <div class="dot"></div>

            </div>

            <div class="step right">

                <div class="dot"></div>

                <div class="card">

                    <span>04</span>

                    <h3>Deploy</h3>

                    <p>

                        Testing,
                        optimisation
                        and launch.

                    </p>

                </div>

            </div>

            <div class="step left">

                <div class="card">

                    <span>05</span>

                    <h3>Scale</h3>

                    <p>

                        Continuous monitoring,
                        analytics and
                        improvement.

                    </p>

                </div>

                <div class="dot"></div>

            </div>

        </div>

    </div>

</section>

</template>

<script setup>

</script>

<style scoped>

.approach{

position:relative;

padding:240px 0;

background:
radial-gradient(
circle at top left,
rgba(var(--voxa-accent-rgb),.12),
transparent 35%
),
linear-gradient(
180deg,
var(--voxa-blue),
var(--voxa-blue-2)
);

overflow:hidden;

}

.heading{

text-align:center;

max-width:760px;

margin:auto;

margin-bottom:130px;

}

.heading span{

display:inline-block;

margin-bottom:18px;

font-size:12px;

font-weight:700;

letter-spacing:.35em;

text-transform:uppercase;

color:var(--voxa-accent-soft);

}

.heading h2{

font-size:clamp(60px,6vw,90px);

line-height:.94;

letter-spacing:-.05em;

margin-bottom:28px;

color:white;

}

.heading p{

font-size:20px;

line-height:1.9;

color:#A8B2C1;

max-width:620px;

margin:auto;

}

.timeline{

position:relative;

max-width:1100px;

margin:auto;

}
.line{

position:absolute;

left:50%;

top:0;

bottom:0;

width:2px;

transform:translateX(-50%);

background:

linear-gradient(

180deg,

transparent,

rgba(var(--voxa-accent-rgb),.35),

transparent

);

}

.step{

display:grid;

grid-template-columns:1fr 80px 1fr;

align-items:center;

margin-bottom:120px;

position:relative;

}

.step:last-child{

margin-bottom:0;

}

.card{

padding:42px;

border-radius:26px;

background:

linear-gradient(

180deg,

rgba(255,255,255,.05),

rgba(255,255,255,.02)

);

border:1px solid rgba(255,255,255,.08);

transition:

transform .4s cubic-bezier(.22,1,.36,1),

border-color .35s ease,

box-shadow .35s ease;

}

.card:hover{

transform:translateY(-8px);

border-color:var(--voxa-accent);

box-shadow:

0 30px 80px rgba(0,0,0,.35),

0 0 40px rgba(var(--voxa-accent-rgb),.12);

}

.left .card{

grid-column:1;

margin-right:40px;

text-align:right;

}

.right .card{

grid-column:3;

margin-left:40px;

}

.card span{

display:block;

margin-bottom:16px;

font-size:12px;

font-weight:700;

letter-spacing:.3em;

color:var(--voxa-accent-soft);

}

.card h3{

font-size:38px;

margin-bottom:18px;

color:#FFFFFF;

}

.card p{

font-size:18px;

line-height:1.9;

color:#A8B2C1;

}

.dot{

width:22px;

height:22px;

border-radius:50%;

background:var(--voxa-accent);

justify-self:center;

box-shadow:

0 0 35px rgba(var(--voxa-accent-rgb),.45);

z-index:2;

}
.line::after{

content:"";

position:absolute;

left:50%;

top:-120px;

transform:translateX(-50%);

width:8px;

height:120px;

border-radius:999px;

background:

linear-gradient(

180deg,

transparent,

var(--voxa-accent),

transparent

);

box-shadow:

0 0 40px rgba(var(--voxa-accent-rgb),.55);

animation:none;

}
.dot{

animation:none;

}
@keyframes float{

0%,100%{

transform:translateY(0);

}

50%{

transform:translateY(-6px);

}

}

.card{

position:relative;

overflow:hidden;

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

rgba(255,255,255,.08),

transparent

);

transform:rotate(18deg);

animation:none;

}
.card:hover h3{

color:var(--voxa-accent-soft);

}

.card:hover p{

color:#E6EEF8;

}

.card h3,

.card p{

transition:.35s;

}
@media(max-width:1100px){

.approach{

padding:180px 0;

}

.step{

grid-template-columns:1fr;

gap:24px;

margin-bottom:70px;

}

.left .card,
.right .card{

grid-column:auto;

margin:0;

text-align:left;

}

.timeline{

padding-left:36px;

}

.line{

left:10px;

transform:none;

}

.dot{

justify-self:start;

margin-left:0;

}

.heading{

margin-bottom:90px;

}

}

@media(max-width:768px){

.approach{

padding:120px 0;

}

.heading h2{

font-size:44px;

line-height:1;

}

.heading p{

font-size:17px;

}

.card{

padding:28px;

border-radius:22px;

}

.card h3{

font-size:30px;

}

.card p{

font-size:16px;

line-height:1.8;

}

}

@media(max-width:480px){

.heading h2{

font-size:36px;

}

.card{

padding:22px;

}

.card h3{

font-size:24px;

}

.card p{

font-size:15px;

}

}

.approach::before{

content:"";

position:absolute;

inset:0;

pointer-events:none;

background-image:

linear-gradient(rgba(255,255,255,.02) 1px,transparent 1px),

linear-gradient(90deg,rgba(255,255,255,.02) 1px,transparent 1px);

background-size:48px 48px;

mask-image:

radial-gradient(circle,#000 60%,transparent 100%);

opacity:.22;

animation:none;

}

.approach::after{

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

rgba(var(--voxa-accent-rgb),.08),

transparent 72%

);

filter:blur(90px);

pointer-events:none;

}
.approach{

isolation:isolate;

}

.heading,
.timeline{

position:relative;

z-index:2;

}

</style>
