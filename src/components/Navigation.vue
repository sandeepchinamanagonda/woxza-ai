<template>
  <header
    class="navbar"
    :class="{ scrolled: isScrolled }"
  >
    <div class="container-custom navbar-inner">

      <RouterLink
        to="/"
        class="logo"
      >
        <span class="dot"></span>
        <span>Voxa</span>
      </RouterLink>

      <nav class="nav-links">

        <a href="#solutions" @click.prevent="scrollToSection('solutions')">Solutions</a>
        <a href="#approach" @click.prevent="scrollToSection('approach')">Approach</a>
        <a href="#about" @click.prevent="scrollToSection('about')">About</a>
        <a href="#faq" @click.prevent="scrollToSection('faq')">FAQ</a>

      </nav>

      <div class="nav-actions">

        <button
          class="cta"
          @click="openDemo('waitlist')"
        >
          Join the Waitlist
        </button>

        <button
          class="sales-cta"
          @click="openDemo('sales')"
        >
          Call Sales
        </button>

      </div>

      <button
        class="menu-btn"
        @click="mobile=!mobile"
      >
        ☰
      </button>

    </div>

    <transition name="menu">

      <div
        v-if="mobile"
        class="mobile-menu"
      >

        <a href="#solutions" @click.prevent="scrollToSection('solutions')">Solutions</a>
        <a href="#approach" @click.prevent="scrollToSection('approach')">Approach</a>
        <a href="#about" @click.prevent="scrollToSection('about')">About</a>
        <a href="#faq" @click.prevent="scrollToSection('faq')">FAQ</a>

        <div class="mobile-actions">

          <button
            class="cta mobile-cta"
            @click="openDemo('waitlist')"
          >
            Join the Waitlist
          </button>

          <button
            class="sales-cta mobile-cta"
            @click="openDemo('sales')"
          >
            Call Sales
          </button>

        </div>

      </div>

    </transition>

  </header>
</template>

<script setup>

import { ref } from "vue"
import { RouterLink } from "vue-router"
import { useMotionFrame } from "@/composables/useMotion"

const emit=defineEmits(["open-demo"])

const mobile=ref(false)

const isScrolled=ref(false)

useMotionFrame(({ scrollY }) => {
  isScrolled.value = scrollY > 25
})

const openDemo=(intent="waitlist")=>{

mobile.value=false

emit("open-demo",intent)

window.dispatchEvent(
new CustomEvent("voxa:open-demo",{
detail:{ intent }
})
)

}

const scrollToSection=(id)=>{

const target=document.getElementById(id)

if(!target) return

mobile.value=false

const scrollToTarget=()=>{

const top=
window.scrollY+
target.getBoundingClientRect().top-
110

window.scrollTo({
top:Math.max(0,top),
behavior:"smooth"
})

}

scrollToTarget()

window.setTimeout(scrollToTarget,650)

window.history.replaceState(null,"",`#${id}`)

}

</script>

<style scoped>

.navbar{

position:fixed;

top:22px;
left:50%;
transform:translateX(-50%);

width:min(1320px,calc(100% - 50px));

z-index:9999;

background:rgba(255,255,255,.94);

border:1px solid rgba(15,23,42,.08);

border-radius:18px;

box-shadow:0 10px 28px rgba(15,23,42,.07);

transition:.35s;

}

.scrolled{

top:12px;

background:#fff;

box-shadow:0 14px 34px rgba(15,23,42,.10);

}

.navbar-inner{

height:74px;

display:grid;

grid-template-columns:220px 1fr 220px;
grid-template-columns:220px 1fr auto;

align-items:center;

padding:0 26px;

}

.logo{

display:flex;

align-items:center;

gap:12px;

font-size:22px;

font-weight:800;

text-decoration:none;

color:#0f172a;

}

.dot{

width:8px;
height:8px;

border-radius:50%;

background:var(--voxa-accent);

box-shadow:0 0 18px rgba(var(--voxa-accent-rgb),.45);

}

.nav-links{

display:flex;

justify-content:center;

gap:44px;

}

.nav-links a{

position:relative;

font-size:14px;

font-weight:600;

color:#64748b;

text-decoration:none;

transition:.3s;

}

.nav-links a::after{

content:"";

position:absolute;

left:0;
bottom:-8px;

width:0;

height:2px;

background:var(--voxa-accent);

border-radius:20px;

transition:.3s;

}

.nav-links a:hover{

color:#0f172a;

}

.nav-links a:hover::after{

width:100%;

}

.nav-actions{

display:flex;

justify-content:flex-end;

align-items:center;

gap:12px;

}

.cta,
.sales-cta{

justify-self:end;

padding:14px 22px;

border:none;

border-radius:999px;

background:linear-gradient(135deg,var(--voxa-accent),var(--voxa-accent-2));

color:white;

font-weight:700;

cursor:pointer;

box-shadow:0 12px 30px rgba(var(--voxa-accent-rgb),.25);

transition:.35s;

}

.sales-cta{

background:white;

border:1px solid rgba(var(--voxa-accent-rgb),.18);

color:var(--voxa-blue);

box-shadow:none;

}

.cta:hover,
.sales-cta:hover{

transform:translateY(-2px);

box-shadow:0 14px 30px rgba(var(--voxa-accent-rgb),.26);

}

.menu-btn{

display:none;

border:none;

background:none;

font-size:24px;

color:var(--voxa-blue);

cursor:pointer;

}

.mobile-menu{

display:none;

}

@media(max-width:960px){

.navbar{

width:calc(100% - 24px);

}

.navbar-inner{

grid-template-columns:1fr auto;

}

.nav-links,
.nav-actions{

display:none;

}

.menu-btn{

display:block;

}

.mobile-menu{

display:flex;

flex-direction:column;

gap:18px;

padding:26px;

background:white;

border-top:1px solid rgba(15,23,42,.08);

}

.mobile-menu a{

text-decoration:none;

font-weight:600;

color:#64748b;

}

.mobile-actions{

display:grid;

gap:12px;

margin-top:10px;

}

.mobile-cta{

display:block;

width:100%;

}

}

.menu-enter-active,
.menu-leave-active{

transition:.25s;

}

.menu-enter-from,
.menu-leave-to{

opacity:0;

transform:translateY(-10px);

}

</style>
