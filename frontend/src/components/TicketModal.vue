<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Icon from '@/components/Icon.vue';
import TicketCard from '@/components/TicketCard.vue';

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    role="dialog"
    :aria-label="t('nav.myTicket')"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-sm max-h-[90dvh] overflow-y-auto">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-white font-semibold">{{ t('ticket.title') }}</h2>
        <button
          type="button"
          class="w-8 h-8 rounded-full bg-white/10 text-white grid place-items-center"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <Icon name="close" class="w-4 h-4" />
        </button>
      </div>
      <TicketCard />
    </div>
  </div>
</template>
