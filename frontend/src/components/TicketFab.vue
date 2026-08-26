<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import Icon from '@/components/Icon.vue';
import TicketCard from '@/components/TicketCard.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const route = useRoute();
const open = ref(false);

async function show() {
  open.value = true;
  // Keep check-in status fresh, same as opening the full My Ticket screen.
  await auth.refreshCheckIn();
}

function close() {
  open.value = false;
}

// Never leave it open across a navigation (e.g. user taps a link behind it).
watch(() => route.fullPath, close);
</script>

<template>
  <button
    v-if="auth.isAuthenticated && route.name !== 'ticket'"
    type="button"
    class="fixed z-30 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 right-4 w-14 h-14 rounded-full bg-brand-700 text-white shadow-lg grid place-items-center active:scale-95 transition-transform"
    :aria-label="t('nav.myTicket')"
    @click="show"
  >
    <Icon name="ticket" class="w-6 h-6" />
  </button>

  <Transition
    enter-active-class="transition-opacity duration-150"
    leave-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      :aria-label="t('nav.myTicket')"
      @click.self="close"
    >
      <div class="w-full max-w-sm max-h-[90dvh] overflow-y-auto">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-white font-semibold">{{ t('ticket.title') }}</h2>
          <button type="button" class="w-8 h-8 rounded-full bg-white/10 text-white grid place-items-center" :aria-label="t('common.close')" @click="close">
            <Icon name="close" class="w-4 h-4" />
          </button>
        </div>
        <TicketCard />
      </div>
    </div>
  </Transition>
</template>
