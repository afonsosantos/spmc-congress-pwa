<script setup lang="ts">
import { routeLoading } from '@/lib/routeLoading';
</script>

<template>
  <Transition enter-active-class="transition-opacity duration-150" leave-active-class="transition-opacity duration-300" leave-to-class="opacity-0">
    <div v-if="routeLoading" class="fixed top-0 inset-x-0 z-[60] h-0.5 overflow-hidden bg-brand-100 dark:bg-brand-900/40" role="progressbar" aria-label="A carregar">
      <div class="h-full w-1/3 bg-brand-600 route-progress-bar" />
    </div>
  </Transition>
</template>

<style scoped>
.route-progress-bar {
  animation: route-progress 0.9s ease-in-out infinite;
}
@keyframes route-progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(300%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .route-progress-bar {
    animation: none;
  }
}
</style>
