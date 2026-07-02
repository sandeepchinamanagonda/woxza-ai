<template>
  <div class="bg-slate-50 rounded-lg p-6 text-center hover:shadow-md transition-all cursor-pointer hover:bg-slate-100">
    <p class="font-medium text-slate-700 text-sm">{{ name }}</p>
  </div>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
/* Component styles */
</style>
