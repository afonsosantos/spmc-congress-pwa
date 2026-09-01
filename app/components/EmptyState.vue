<script setup lang="ts">
withDefaults(
  defineProps<{ icon?: string; title: string; message?: string }>(),
  { icon: 'info', message: '' }
);
</script>

<template>
  <div class="flex flex-col items-center justify-center text-center py-16 px-6 text-slate-500 dark:text-slate-400">
    <div class="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-900 grid place-items-center mb-4">
      <Icon :name="icon" class="w-7 h-7" />
    </div>
    <p class="font-medium text-slate-700 dark:text-slate-200">{{ title }}</p>
    <p v-if="message" class="text-sm mt-1 max-w-xs">{{ message }}</p>
    <slot />
  </div>
</template>
