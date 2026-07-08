<template>
  <div class="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <span class="text-sm font-semibold text-slate-700">Live Call Status</span>
      <span class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
    </div>

    <!-- Call Info -->
    <div class="bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-6 space-y-3">
      <p class="text-sm font-medium text-slate-600">AI Agent: Sarah</p>
      <div class="flex gap-2">
        <div class="w-10 h-10 rounded-full bg-slate-300 animate-pulse"></div>
        <div class="flex-1">
          <div class="h-3 bg-slate-300 rounded w-3/4 mb-2 animate-pulse"></div>
          <div class="h-2 bg-slate-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    </div>

    <!-- Metrics -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-blue-50 rounded-lg p-4">
        <p class="text-2xl font-bold text-blue-600">1,243</p>
        <p class="text-xs text-slate-600 mt-1">Calls Today</p>
      </div>
      <div class="bg-green-50 rounded-lg p-4">
        <p class="text-2xl font-bold text-green-600">94%</p>
        <p class="text-xs text-slate-600 mt-1">Resolution Rate</p>
      </div>
    </div>
  </div>
</template>

<script setup>
// Dashboard preview component - no logic needed
</script>

<style scoped>
/* Styles scoped to this component */
</style>
