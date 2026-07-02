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
--text:#0f172a;
--muted:#64748b;
--border:rgba(15,23,42,.08);
--primary:#2563eb;

}

*{
margin:0;
padding:0;
box-sizing:border-box;
}

html{
scroll-behavior:smooth;
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
background:#2563eb;
color:#fff;
}

section{
position:relative;
isolation:isolate;
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