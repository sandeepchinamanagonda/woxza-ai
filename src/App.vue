<template>
  <div id="app">

    <Navigation />

    <main class="site-content">
      <RouterView />
    </main>

    <Footer />

  </div>
</template>

<script setup>
import { RouterView } from "vue-router"
import Navigation from "@/components/Navigation.vue"
import Footer from "@/components/Footer.vue"
</script>

<style>

:root{

--bg:#ffffff;
--dark:#0f172a;
--voxa-blue:#0f172a;
--voxa-blue-2:#162238;
--voxa-blue-rgb:15,23,42;
--voxa-white:#ffffff;
--voxa-soft:#f8fbff;
--voxa-accent:#2563eb;
--voxa-accent-2:#3b82f6;
--voxa-accent-rgb:37,99,235;
--voxa-accent-soft:#dbeafe;
--text:#0f172a;
--muted:#64748b;
--border:rgba(15,23,42,.08);
--primary:var(--voxa-accent);

}

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{
background:#ffffff;
color:var(--text);
overflow-x:hidden;
font-family:"Inter",sans-serif;
-webkit-font-smoothing:antialiased;
text-rendering:optimizeLegibility;
}

#app{
min-height:100vh;
overflow-x:hidden;
background:#ffffff;
}

.site-content{
position:relative;
z-index:1;
}

img{
display:block;
max-width:100%;
}

button,
a{
transition:.35s cubic-bezier(.22,1,.36,1);
}

button{
font-family:inherit;
}

::selection{
background:var(--voxa-accent);
color:#fff;
}

section{
position:relative;
isolation:isolate;
scroll-margin-top:110px;
}

section:not(.hero){
content-visibility:auto;
contain-intrinsic-size:900px;
}

.grid-bg{
animation:none !important;
}

section::before,
.card::before,
.story::before,
.cta::before,
.quote-card::before,
article>div:last-child::after,
.principles::after,
.middle::after,
.line::after{
animation:none !important;
}

.glow{
filter:blur(80px) !important;
transform:translateZ(0);
}

section:not(.hero):not(.motion-active) *,
section:not(.hero):not(.motion-active)::before,
section:not(.hero):not(.motion-active)::after{
animation-play-state:paused !important;
}

.btn-primary,
.btn-secondary,
.cta,
.sales-cta,
button,
a{
transition-duration:.24s !important;
}

.container-custom{
width:min(1320px,calc(100% - 64px));
margin-inline:auto;
}

@media(max-width:768px){

.container-custom{
width:calc(100% - 32px);
}

}

</style>
