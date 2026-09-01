<script setup lang="ts">
const { isOnline } = useOnlineStatus();
const { t } = useI18n();
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-200"
    leave-active-class="transition-transform duration-200"
    enter-from-class="-translate-y-full"
    leave-to-class="-translate-y-full"
  >
    <div
      v-if="!isOnline"
      class="fixed top-0 inset-x-0 z-50 safe-top bg-amber-500 text-amber-950 text-sm font-medium flex items-center justify-center gap-2 py-1.5"
      role="status"
    >
      <Icon name="wifiOff" class="w-4 h-4" />
      {{ t('common.offline') }}
    </div>
  </Transition>
</template>
