<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 4 });
</script>

<template>
  <div class="space-y-3 p-4">
    <div v-for="i in count" :key="i" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div class="skeleton h-3 w-16 mb-3"></div>
      <div class="skeleton h-4 w-3/4 mb-2"></div>
      <div class="skeleton h-3 w-1/2"></div>
    </div>
  </div>
</template>

