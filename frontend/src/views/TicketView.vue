<script setup lang="ts">
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import TicketCard from '@/components/TicketCard.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();

onMounted(async () => {
  if (auth.status === 'ready' && !auth.isAuthenticated) {
    router.replace('/entrar');
    return;
  }
  // Refresh from Pretix so check-in status reflects reality, not just
  // what was true when the participant last logged in.
  if (auth.isAuthenticated) await auth.refreshCheckIn();
});
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6 pb-10 md:px-8" v-if="auth.user">
    <h1 class="text-xl font-bold mb-4">{{ t('ticket.title') }}</h1>
    <TicketCard />
  </div>
</template>
