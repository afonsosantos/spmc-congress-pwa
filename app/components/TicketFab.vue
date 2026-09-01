<script setup lang="ts">
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
    v-if="auth.isAuthenticated && route.name !== 'bilhete'"
    type="button"
    class="fixed z-30 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 right-4 w-14 h-14 rounded-full bg-brand-700 text-white shadow-lg grid place-items-center active:scale-95 transition-transform"
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
    <div v-if="open" class="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-slate-950" role="dialog" :aria-label="t('nav.myTicket')">
      <div class="max-w-sm mx-auto px-4 pt-6 pb-10">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-lg">{{ t('ticket.title') }}</h2>
          <button
            type="button"
            class="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 grid place-items-center"
            :aria-label="t('common.close')"
            @click="close"
          >
            <Icon name="close" class="w-4 h-4" />
          </button>
        </div>
        <TicketCard />
      </div>
    </div>
  </Transition>
</template>
