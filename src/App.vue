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
import { nextTick, onMounted, onUnmounted } from "vue"
import { RouterView } from "vue-router"
import Lenis from "@studio-freight/lenis"
import Navigation from "@/components/Navigation.vue"
import Footer from "@/components/Footer.vue"
import { scrollSectionIntoView } from "@/utils/sectionScroll"

let lenis
let smoothScrollFrame = 0

const startSmoothScroll = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

  lenis = new Lenis({
    duration: 1.05,
    smoothWheel: true,
    smoothTouch: false,
    wheelMultiplier: 0.9
  })

  const update = (time) => {
    lenis?.raf(time)
    smoothScrollFrame = window.requestAnimationFrame(update)
  }

  smoothScrollFrame = window.requestAnimationFrame(update)
}

const alignHashTarget = async () => {
  if (!window.location.hash) return

  await nextTick()
  const id = decodeURIComponent(window.location.hash.slice(1))
  const target = document.getElementById(id)
  if (!target) return

  scrollSectionIntoView(target, "auto")
}

onMounted(() => {
  startSmoothScroll()
  window.addEventListener("hashchange", alignHashTarget)
  window.requestAnimationFrame(() => window.requestAnimationFrame(alignHashTarget))
  document.fonts?.ready.then(alignHashTarget)
})

onUnmounted(() => {
  window.removeEventListener("hashchange", alignHashTarget)
  if (smoothScrollFrame) window.cancelAnimationFrame(smoothScrollFrame)
  lenis?.destroy()
})
</script>

<style>

:root{

--bg:#ffffff;
--dark:#0f172a;
--woxza-blue:#0f172a;
--woxza-blue-2:#162238;
--woxza-blue-rgb:15,23,42;
--woxza-white:#ffffff;
--woxza-soft:#f8f9fb;
--woxza-pale:#edf0f5;
--woxza-heading:#11152b;
--woxza-accent:#2563eb;
--woxza-accent-2:#3b82f6;
--woxza-accent-rgb:37,99,235;
--woxza-accent-soft:#dbeafe;
--text:#0f172a;
--muted:#64748b;
--border:rgba(15,23,42,.08);
--primary:var(--woxza-accent);

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

html.lenis,
html.lenis body{
height:auto;
}

.lenis.lenis-smooth{
scroll-behavior:auto !important;
}

.lenis.lenis-stopped{
overflow:hidden;
}

.lenis.lenis-scrolling iframe{
pointer-events:none;
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
background:var(--woxza-accent);
color:#fff;
}

section{
position:relative;
isolation:isolate;
scroll-margin-top:110px;
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
