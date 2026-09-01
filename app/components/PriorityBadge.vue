<script setup lang="ts">
const props = defineProps<{ priority: 'INFO' | 'WARNING' | 'IMPORTANT' }>();
const { t } = useI18n();

const styles: Record<string, string> = {
  INFO: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  WARNING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  IMPORTANT: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
};
</script>

<template>
  <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold" :class="styles[props.priority]">
    {{ t(`announcements.priority.${props.priority}`) }}
  </span>
</template>
