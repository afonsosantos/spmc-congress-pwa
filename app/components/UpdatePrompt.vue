<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';

const { t } = useI18n();
const { needRefresh, updateServiceWorker } = useRegisterSW();
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200"
    enter-from-class="opacity-0 translate-y-2"
    leave-active-class="transition-all duration-150"
    leave-to-class="opacity-0 translate-y-2"
  >
    <div
      v-if="needRefresh"
      class="fixed z-50 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-2xl bg-brand-700 text-white px-4 py-3 shadow-lg flex items-center justify-between gap-3"
    >
      <span class="text-sm font-medium">{{ t('update.available') }}</span>
      <button
        type="button"
        class="shrink-0 px-3 py-1.5 rounded-full bg-white text-brand-700 text-xs font-semibold"
        @click="updateServiceWorker(true)"
      >
        {{ t('update.reload') }}
      </button>
    </div>
  </Transition>
</template>
