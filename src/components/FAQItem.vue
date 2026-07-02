<template>
  <div class="border border-slate-200 rounded-xl overflow-hidden hover:border-primary-500 transition-colors">
    <!-- Question Button -->
    <button
      @click="$emit('toggle')"
      class="w-full px-6 py-4 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors text-left"
    >
      <span class="font-semibold text-slate-900">{{ question }}</span>
      <svg
        class="w-5 h-5 text-slate-600 transition-transform"
        :style="{ transform: isOpen ? 'rotate(180deg)' : '' }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
      </svg>
    </button>

    <!-- Answer -->
    <div v-if="isOpen" class="bg-slate-50 px-6 py-4 border-t border-slate-200">
      <p class="text-slate-600 leading-relaxed">{{ answer }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle'])
</script>

<style scoped>
/* Component styles */
</style>
