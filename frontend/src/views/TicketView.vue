<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TicketModal from '@/components/TicketModal.vue';
import { useAuthStore } from '@/stores/auth';

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
  <TicketModal v-if="auth.user" @close="router.push('/')" />
</template>
