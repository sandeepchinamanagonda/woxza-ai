<template>
  <div>
    <p class="stat-number text-2xl md:text-3xl">{{ number }}</p>
    <p class="text-sm text-slate-600 mt-1">{{ label }}</p>
  </div>
</template>

<script setup>
defineProps({
  number: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.stat-number {
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
