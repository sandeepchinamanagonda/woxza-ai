<template>
  <article class="step-card">

    <div class="step-top">

      <span class="step-number">
        {{ String(number).padStart(2, "0") }}
      </span>

      <div class="step-line"></div>

    </div>

    <h3>
      {{ title }}
    </h3>

    <p>
      {{ description }}
    </p>

  </article>
</template>

<script setup>
defineProps({
  number: Number,
  title: String,
  description: String
});
</script>

<style scoped>

.step-card{

height:100%;

padding:42px;

background:#fff;

border:1px solid #E7E2DA;

border-radius:24px;

transition:.35s ease;

position:relative;

overflow:hidden;

}

.step-card:hover{

transform:translateY(-8px);

box-shadow:0 25px 60px rgba(0,0,0,.06);

}

.step-top{

display:flex;

align-items:center;

gap:18px;

margin-bottom:30px;

}

.step-number{

font-family:var(--font-primary);

font-size:12px;

letter-spacing:.28em;

color:#9C8168;

white-space:nowrap;

}

.step-line{

height:1px;

flex:1;

background:#E7E2DA;

}

h3{

font-family:var(--font-primary);

font-size:30px;

font-weight:500;

margin-bottom:18px;

color:#232323;

}

p{

font-size:16px;

line-height:1.9;

color:#6D6862;

}

@media(max-width:768px){

.step-card{

padding:30px;

}

h3{

font-size:26px;

}

}

</style>
