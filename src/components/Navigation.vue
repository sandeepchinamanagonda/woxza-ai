<template>

<header
class="navbar"
:class="{ scrolled: isScrolled, scrolling: isScrolling }"
>

<div class="navbar-inner">

<!-- ===========================
LOGO
=========================== -->

<RouterLink
to="/"
class="brand"
>

<div class="brand-logo">

<div class="wave"></div>

</div>

<span class="brand-name">

WOXZA

</span>

</RouterLink>

<!-- ===========================
NAVIGATION
=========================== -->

<nav class="nav-links">

<a
href="#"
@click.prevent="scrollTo('solutions')"
:class="{active:activeSection==='solutions'}"
>

Solutions

</a>

<a
href="#"
@click.prevent="scrollTo('about')"
:class="{active:activeSection==='about'}"
>

About

</a>

<a
href="#why-voxa"
@click.prevent="scrollTo('why-voxa')"
:class="{active:activeSection==='why-voxa'}"
>

Why Voxa

</a>

<a
href="#demo"
@click.prevent="scrollTo('demo')"
:class="{active:activeSection==='demo'}"
>

Demo

</a>

<a
href="#"
@click.prevent="scrollTo('approach')"
:class="{active:activeSection==='approach'}"
>

Approach

</a>

<a
href="#"
@click.prevent="scrollTo('faq')"
:class="{active:activeSection==='faq'}"
>

FAQ

</a>

</nav>

<!-- ===========================
RIGHT
=========================== -->

<div class="actions">

<button
class="cta"
@click="openLeadModal('waitlist')"
>

Join Waitlist

</button>

<button
class="cta cta-secondary"
@click="openLeadModal('sales')"
>

Get a Demo

</button>

<button
class="mobile-toggle"
type="button"
:aria-expanded="mobile"
 :aria-label="mobile ? 'Close navigation menu' : 'Open navigation menu'"
 :class="{ 'is-open': mobile }"
@click="mobile=!mobile"
>

<X v-if="mobile" aria-hidden="true" />
<Menu v-else aria-hidden="true" />

</button>

</div>

</div>

<!-- ===========================
MOBILE
=========================== -->

<transition name="mobile">

<div
v-if="mobile"
class="mobile-menu"
>

<a @click="scrollTo('solutions')">

Solutions

</a>

<a @click="scrollTo('about')">

About

</a>

<a @click="scrollTo('why-voxa')">

Why Voxa

</a>

<a @click="openDemo">

Demo

</a>

<a @click="scrollTo('approach')">

Approach

</a>

<a @click="scrollTo('faq')">

FAQ

</a>

<button
class="cta mobile-btn"
@click="openLeadModal('waitlist')"
>

Join Waitlist

</button>

<button
class="cta cta-secondary mobile-btn"
@click="openLeadModal('sales')"
>

Get a Demo

</button>

</div>

</transition>

</header>

</template>

<script setup>

import { ref, onMounted, onUnmounted, watch } from "vue"
import { Menu, X } from "lucide-vue-next"
import { RouterLink } from "vue-router"
import { scrollSectionIntoView } from "@/utils/sectionScroll"

const emit = defineEmits([
  "open-demo"
])

const mobile = ref(false)

const syncMobileMenuScrollLock = (isOpen) => {
  document.body.classList.toggle("mobile-nav-open", isOpen)
}

watch(mobile, syncMobileMenuScrollLock)

const isScrolled = ref(false)

const isScrolling = ref(false)

const activeSection = ref("")

let scrollFrame = 0
let scrollStopTimer = 0

const sections = [

"demo",

  "solutions",

  "about",

  "why-voxa",

  "approach",

  "faq"

]

const openDemo = () => {

  mobile.value = false

scrollTo("demo")

}

const openLeadModal = (intent) => {
  mobile.value = false
  window.dispatchEvent(new CustomEvent("woxza:open-demo", {
    detail: { intent }
  }))
}

const scrollTo = (id) => {

  mobile.value = false

  const section = document.getElementById(id)

  if (!section) return

  window.history.replaceState(null, "", `#${id}`)
  scrollSectionIntoView(section)

}

const updateNavbar = () => {

  isScrolled.value = window.scrollY > 40

  sections.forEach((id) => {

    const section = document.getElementById(id)

    if (!section) return

    const top = section.offsetTop - 170

    const bottom = top + section.offsetHeight

    if (

      window.scrollY >= top &&

      window.scrollY < bottom

    ) {

      activeSection.value = id

    }

  })

}

const requestNavbarUpdate = () => {

  if (scrollFrame) return

  scrollFrame = window.requestAnimationFrame(() => {

    scrollFrame = 0

    updateNavbar()

  })

}

const handleWindowScroll = () => {

  isScrolling.value = true

  window.clearTimeout(scrollStopTimer)

  scrollStopTimer = window.setTimeout(() => {

    isScrolling.value = false

  }, 220)

  requestNavbarUpdate()

}

onMounted(() => {

  updateNavbar()

  window.addEventListener(

    "scroll",

    handleWindowScroll,

    {

      passive: true

    }

  )

})

onUnmounted(() => {

  syncMobileMenuScrollLock(false)


  window.removeEventListener(

    "scroll",

    handleWindowScroll

  )

  if (scrollFrame) {

    window.cancelAnimationFrame(scrollFrame)

    scrollFrame = 0

  }

  window.clearTimeout(scrollStopTimer)

})

</script>

<style scoped>

/* ==========================================================
NAVBAR
========================================================== */

.navbar{

position:fixed;

top:0;

left:0;

width:100%;

display:flex;

justify-content:center;

z-index:9999;

transition:all .45s cubic-bezier(.22,1,.36,1);

}

.navbar.scrolled{

top:16px;

}

.navbar.scrolling{

opacity:0;

pointer-events:none;

transform:translate3d(0,calc(-100% - 24px),0);

}

@media(prefers-reduced-motion:reduce){

.navbar{

transition:none;

}

}

/* ==========================================================
CONTAINER
========================================================== */

.navbar-inner{

width:min(1700px,96%);

height:88px;

display:grid;

grid-template-columns:340px 1fr 240px;

align-items:center;

padding:0 48px;

background:transparent;

transition:all .45s cubic-bezier(.22,1,.36,1);

}

.navbar.scrolled .navbar-inner{

height:72px;

background:rgba(255,255,255,.78);

backdrop-filter:blur(24px);

-webkit-backdrop-filter:blur(24px);

border:1px solid rgba(20,38,77,.08);

border-radius:24px;

box-shadow:

0 18px 60px rgba(15,23,42,.08);

}

/* ==========================================================
BRAND
========================================================== */

.brand{

display:flex;

align-items:center;

gap:16px;

text-decoration:none;

color:#14264D;

user-select:none;

}

.brand-name{

font-family:"Plus Jakarta Sans",sans-serif;

font-size:42px;

font-weight:800;

letter-spacing:-.05em;

line-height:1;

transition:.35s;

}

.navbar.scrolled .brand-name{

font-size:34px;

}

/* ==========================================================
LOGO
========================================================== */

.brand-logo{

display:flex;

justify-content:center;

align-items:center;

width:34px;

height:34px;

}

.wave{

width:24px;

height:24px;

border-radius:50%;

background:

radial-gradient(circle at center,#3B82F6 18%,transparent 20%),

radial-gradient(circle,#3B82F6 1px,transparent 1px);

background-size:100% 100%,6px 6px;

opacity:.9;

}

/* ==========================================================
NAVIGATION
========================================================== */

.nav-links{

display:flex;

justify-content:space-evenly;

align-items:center;

width:100%;

padding:0 80px;

}

.nav-links a{

flex:1;

display:flex;

justify-content:center;

align-items:center;

height:88px;

position:relative;

text-decoration:none;

font-family:"Plus Jakarta Sans",sans-serif;

font-size:15px;

font-weight:500;

color:#14264D;

transition:.3s;

}

.navbar.scrolled .nav-links a{

height:72px;

}

.nav-links a:hover{

opacity:.7;

}

.nav-links a::after{

content:"";

position:absolute;

left:50%;

bottom:22px;

width:0;

height:2px;

background:#14264D;

border-radius:999px;

transform:translateX(-50%);

transition:.3s;

}

.nav-links a.active{

font-weight:700;

}

.nav-links a.active::after,

.nav-links a:hover::after{

width:58%;

}

/* ==========================================================
RIGHT
========================================================== */

.actions{

display:flex;

justify-content:flex-end;

align-items:center;

gap:16px;

}

.cta{

padding:15px 30px;

border:none;

border-radius:999px;

background:#14264D;

color:white;

font-family:"Plus Jakarta Sans",sans-serif;

font-size:14px;

font-weight:700;

cursor:pointer;

transition:.35s cubic-bezier(.22,1,.36,1);

box-shadow:

0 10px 28px rgba(20,38,77,.12);

}

.cta:hover{

transform:translateY(-2px);

box-shadow:

0 18px 42px rgba(20,38,77,.18);

}

.cta-secondary{

border:1px solid #14264D;

background:#14264D;

color:#ffffff;

box-shadow:0 10px 28px rgba(20,38,77,.12);

}

.cta-secondary:hover{

border-color:#1d3568;

background:#1d3568;

box-shadow:0 18px 42px rgba(20,38,77,.22);

}

/* ==========================================================
MOBILE TOGGLE
========================================================== */

.mobile-toggle{

display:none;

width:46px;

height:46px;

border:none;

background:transparent;

font-size:26px;

color:#14264D;

cursor:pointer;

transition:.35s;

}

.mobile-toggle:hover{

transform:rotate(90deg);

}

.mobile-toggle svg{

width:24px;
height:24px;
stroke-width:2.25;

}

/* ==========================================================
MOBILE MENU
========================================================== */

.mobile-menu{

display:none;

}

/* ==========================================================
LAPTOP
========================================================== */

@media(max-width:1400px){

.navbar-inner{

grid-template-columns:280px 1fr 220px;

padding:0 34px;

}

.brand-name{

font-size:36px;

}

.nav-links{

padding:0 30px;

}

.nav-links a{

font-size:14px;

}

}

/* ==========================================================
TABLET
========================================================== */

@media(max-width:980px){

.navbar-inner{

grid-template-columns:1fr auto;

height:74px;

padding:0 22px;

}

.brand-name{

font-size:30px;

}

.nav-links{

display:none;

}

.mobile-toggle{

display:flex;

justify-content:center;

align-items:center;

}

.mobile-menu{

display:flex;

flex-direction:column;

gap:18px;

width:min(94%,700px);

max-height:calc(100dvh - 88px);

margin:14px auto 0;

padding:26px;

overflow-y:auto;

overscroll-behavior:contain;

background:rgba(255,255,255,.90);

backdrop-filter:blur(24px);

-webkit-backdrop-filter:blur(24px);

border-radius:24px;

border:1px solid rgba(20,38,77,.08);

box-shadow:

0 20px 60px rgba(15,23,42,.08);

}

.mobile-menu a{

text-decoration:none;

font-family:"Plus Jakarta Sans",sans-serif;

font-size:17px;

font-weight:500;

color:#14264D;

cursor:pointer;

transition:.3s;

}

.mobile-menu a:hover{

padding-left:12px;

}

.mobile-btn{

margin-top:8px;

width:100%;

}

:global(body.mobile-nav-open){

overflow:hidden;

}

}

/* ==========================================================
PHONE
========================================================== */

@media(max-width:640px){

.navbar-inner{

height:64px;

padding:0 16px;

}

.brand{

gap:12px;

}

.brand-logo{

transform:scale(.85);

}

.brand-name{

font-size:24px;

}

.navbar.scrolled .brand-name{

font-size:22px;

}

.cta{

display:none;

}

.mobile-toggle{

font-size:24px;

}

}

/* ==========================================================
MOBILE ANIMATION
========================================================== */

.mobile-enter-active,

.mobile-leave-active{

transition:

opacity .35s ease,

transform .35s cubic-bezier(.22,1,.36,1);

}

.mobile-enter-from,

.mobile-leave-to{

opacity:0;

transform:translateY(-16px);

}

/* ==========================================================
GLASS SHINE
========================================================== */

.navbar.scrolled .navbar-inner{

position:relative;

overflow:hidden;

}

.navbar.scrolled .navbar-inner::before{

content:"";

position:absolute;

top:0;

left:-120%;

width:40%;

height:100%;

background:

linear-gradient(

90deg,

transparent,

rgba(255,255,255,.35),

transparent

);

transform:skewX(-20deg);

transition:1.2s ease;

pointer-events:none;

}

.navbar.scrolled:hover .navbar-inner::before{

left:140%;

}

/* ==========================================================
ACTIVE LINK
========================================================== */

.nav-links a.active{

font-weight:700;

color:#0F172A;

}

.nav-links a.active::after{

width:60%;

}

/* ==========================================================
HOVER EFFECT
========================================================== */

.nav-links a{

transition:

color .3s ease,

transform .3s ease,

opacity .3s ease;

}

.nav-links a:hover{

transform:translateY(-2px);

}

/* ==========================================================
BRAND
========================================================== */

.brand{

transition:

transform .35s ease,

opacity .35s ease;

}

.brand:hover{

opacity:.85;

}

.navbar.scrolled .brand{

transform:scale(.96);

transform-origin:left center;

}

/* ==========================================================
BUTTON
========================================================== */

.cta{

box-shadow:

0 10px 28px rgba(20,38,77,.12);

}

.cta:hover{

transform:

translateY(-2px)

scale(1.02);

box-shadow:

0 20px 48px rgba(20,38,77,.18);

}

/* ==========================================================
SCROLL MORPH
========================================================== */

.navbar.scrolled .navbar-inner{

padding:0 40px;

}

.navbar.scrolled .nav-links{

padding:0 60px;

}

.navbar.scrolled .cta{

padding:13px 28px;

font-size:13px;

}

/* ==========================================================
TEXT
========================================================== */

.brand,

.brand-name,

.nav-links a,

.cta{

-webkit-font-smoothing:antialiased;

text-rendering:optimizeLegibility;

}

/* ==========================================================
PERFORMANCE
========================================================== */

.navbar,

.navbar-inner,

.brand,

.nav-links,

.cta{

will-change:

transform,

background,

backdrop-filter;

}

/* ==========================================================
FINAL LAYOUT
========================================================== */

/* Make the navbar span almost the full width */
.navbar-inner{

width:min(1800px,98%);

grid-template-columns:300px 1fr 350px;

padding:0 42px;

}

/* Bigger brand like OpenAI */
.brand{

justify-content:flex-start;

width:100%;

}

.brand-name{

font-size:46px;

font-weight:800;

letter-spacing:-0.08em;

line-height:1;

}

.navbar.scrolled .brand-name{

font-size:36px;

}

/* Spread navigation across the whole center */
.nav-links{

width:max-content;

display:grid;

grid-template-columns:repeat(6,max-content);

align-items:center;

justify-items:center;

justify-self:center;

padding:0;

column-gap:clamp(28px,2.5vw,44px);

}

/* Every item gets equal space */
.nav-links a{

width:auto;

padding:0;

height:86px;

display:flex;

justify-content:center;

align-items:center;

font-size:15px;

font-weight:500;

}

.navbar.scrolled .nav-links a{

height:72px;

}

/* Keep CTA pinned right */
.actions{

justify-self:end;

}

/* Better spacing when scrolled */
.navbar.scrolled .navbar-inner{

grid-template-columns:280px 1fr 340px;

}

/* Hover */

.nav-links a:hover{

color:#111827;

}

/* Slight underline animation */

.nav-links a::after{

bottom:18px;

}

.nav-links a.active::after,

.nav-links a:hover::after{

width:52%;

}

/* Premium spacing */

@media(min-width:1600px){

.navbar-inner{

padding:0 64px;

}

}

@media(max-width:1180px){

.navbar-inner,
.navbar.scrolled .navbar-inner{

grid-template-columns:230px 1fr 300px;

padding:0 24px;

}

.actions{ gap:10px; }

.cta{ padding:13px 20px; font-size:13px; }

.nav-links{ padding:0; column-gap:24px; }

}

@media(max-width:980px){

.navbar{
flex-direction:column;
align-items:center;
}

.navbar-inner,
.navbar.scrolled .navbar-inner{

grid-template-columns:1fr auto;
width:calc(100% - 20px);
padding:0 20px;

}

.actions .cta{ display:none; }

.actions .mobile-toggle{
display:flex;
align-items:center;
justify-content:center;
}

.nav-links{
display:none;
width:0;
padding:0;
overflow:hidden;

}

.navbar.scrolled .navbar-inner{
padding:0 20px;
}

}

@media(max-width:640px){

.navbar-inner,
.navbar.scrolled .navbar-inner{
width:calc(100% - 16px);
height:64px;
padding:0 14px;
border-radius:20px;
}

.brand{
min-width:0;
gap:10px;
}

.brand-name,
.navbar.scrolled .brand-name{
font-size:24px;
}

.actions{
min-width:46px;
}

.mobile-toggle{
display:flex;
flex:0 0 46px;
}

.mobile-menu{
width:calc(100% - 16px);
max-height:calc(100vh - 84px);
overflow-y:auto;
}

.mobile-menu .mobile-btn{
display:block;
}

}
</style>
