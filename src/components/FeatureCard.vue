<template>
  <article class="feature-card">

    <div class="feature-top">

      <span class="feature-number">
        {{ number }}
      </span>

      <div class="feature-icon">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            :d="icon"
          />
        </svg>

      </div>

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
const props = defineProps({
  title: String,
  description: String,
  icon: String,
  number: {
    type: Number,
    default: 1
  }
});
</script>

<style scoped>

.feature-card{

height:100%;

padding:42px;

background:rgba(255,255,255,.7);

border:1px solid #E7E2DA;

border-radius:24px;

transition:.4s ease;

}

.feature-card:hover{

transform:translateY(-10px);

box-shadow:0 25px 60px rgba(0,0,0,.06);

}

.feature-top{

display:flex;

justify-content:space-between;

align-items:center;

margin-bottom:36px;

}

.feature-number{

font-family:"IBM Plex Sans";

font-size:12px;

letter-spacing:.28em;

color:#9C8168;

}

.feature-icon{

width:52px;

height:52px;

border-radius:50%;

display:flex;

align-items:center;

justify-content:center;

background:#F5F2EE;

border:1px solid #E7E2DA;

}

.feature-icon svg{

width:22px;

height:22px;

color:#232323;

}

h3{

font-family:"Source Serif 4",serif;

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

.feature-card{

padding:30px;

}

h3{

font-size:26px;

}

}

</style>