<template>

<Transition name="loader">

<div
v-if="visible"
class="loader"
>

<div class="ring"></div>

<div class="logo">

Voxa

</div>

</div>

</Transition>

</template>

<script setup>

import { ref,onMounted } from "vue"

const visible=ref(true)

onMounted(()=>{

setTimeout(()=>{

visible.value=false

},1400)

})

</script>

<style scoped>

.loader{

position:fixed;

inset:0;

background:white;

display:flex;

justify-content:center;

align-items:center;

z-index:999999;

flex-direction:column;

}

.ring{

width:70px;

height:70px;

border-radius:50%;

border:3px solid rgba(37,99,235,.15);

border-top-color:#2563eb;

animation:spin 1s linear infinite;

}

.logo{

margin-top:26px;

font-size:34px;

font-weight:800;

letter-spacing:.18em;

color:#0f172a;

}

.loader-enter-active,
.loader-leave-active{

transition:.6s;

}

.loader-leave-to{

opacity:0;

}

@keyframes spin{

to{

transform:rotate(360deg);

}

}

</style>
