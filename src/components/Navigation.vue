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
        <span>VOXA</span>
      </RouterLink>

      <nav class="nav-links">

        <a href="#solutions">Solutions</a>
        <a href="#approach">Approach</a>
        <a href="#about">About</a>
        <a href="#faq">FAQ</a>

      </nav>

      <button
        class="cta"
        @click="$emit('open-demo')"
      >
        Book Consultation
      </button>

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

        <a href="#solutions">Solutions</a>
        <a href="#approach">Approach</a>
        <a href="#about">About</a>
        <a href="#faq">FAQ</a>

        <button
          class="cta mobile-cta"
          @click="$emit('open-demo')"
        >
          Book Consultation
        </button>

      </div>

    </transition>

  </header>
</template>

<script setup>

import { ref,onMounted,onUnmounted } from "vue"
import { RouterLink } from "vue-router"

defineEmits(["open-demo"])

const mobile=ref(false)

const isScrolled=ref(false)

const onScroll=()=>{

isScrolled.value=window.scrollY>25

}

onMounted(()=>{

window.addEventListener("scroll",onScroll)

})

onUnmounted(()=>{

window.removeEventListener("scroll",onScroll)

})

</script>

<style scoped>

.navbar{

position:fixed;

top:22px;
left:50%;
transform:translateX(-50%);

width:min(1320px,calc(100% - 50px));

z-index:9999;

background:rgba(255,255,255,.72);

backdrop-filter:blur(24px);

border:1px solid rgba(15,23,42,.08);

border-radius:18px;

box-shadow:0 12px 40px rgba(15,23,42,.08);

transition:.35s;

}

.scrolled{

top:12px;

background:rgba(255,255,255,.92);

box-shadow:0 20px 50px rgba(15,23,42,.12);

}

.navbar-inner{

height:74px;

display:grid;

grid-template-columns:220px 1fr 220px;

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

background:#2563eb;

box-shadow:0 0 18px rgba(37,99,235,.45);

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

background:#2563eb;

border-radius:20px;

transition:.3s;

}

.nav-links a:hover{

color:#0f172a;

}

.nav-links a:hover::after{

width:100%;

}

.cta{

justify-self:end;

padding:14px 24px;

border:none;

border-radius:999px;

background:linear-gradient(135deg,#2563eb,#3b82f6);

color:white;

font-weight:700;

cursor:pointer;

box-shadow:0 12px 30px rgba(37,99,235,.25);

transition:.35s;

}

.cta:hover{

transform:translateY(-3px);

box-shadow:0 20px 45px rgba(37,99,235,.35);

}

.menu-btn{

display:none;

border:none;

background:none;

font-size:24px;

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
.cta{

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

.mobile-cta{

display:block;

width:100%;

margin-top:10px;

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