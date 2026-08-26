<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import Icon from '@/components/Icon.vue';
import TicketModal from '@/components/TicketModal.vue';
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
    <TicketModal v-if="open" @close="close" />
  </Transition>
</template>
