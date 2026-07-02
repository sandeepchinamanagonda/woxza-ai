<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-20">
    <div class="text-center max-w-md">
      <h1 class="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <p class="text-xl text-slate-600 mb-8">Page not found. Let's get you back on track.</p>
      
      <RouterLink to="/" class="btn-primary inline-block">
        Back to Home
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>

<style scoped>
/* Page styles */
</style>
