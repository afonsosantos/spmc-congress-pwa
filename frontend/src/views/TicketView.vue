<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import QRCode from 'qrcode';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Icon from '@/components/Icon.vue';
import TicketCard from '@/components/TicketCard.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
const router = useRouter();
const qrDataUrl = ref('');

onMounted(async () => {
  if (auth.status === 'ready' && !auth.isAuthenticated) {
    router.replace('/entrar');
    return;
  }
  // Refresh from Pretix so check-in status reflects reality, not just
  // what was true when the participant last logged in.
  if (auth.isAuthenticated) await auth.refreshCheckIn();
});

// Decorative badge identifier only — not used for physical check-in (see ticket.notice).
watch(
  () => auth.user?.id,
  async (id) => {
    if (id) qrDataUrl.value = await QRCode.toDataURL(id, { margin: 1, width: 240 });
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="auth.user" class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xl">
    <div class="max-w-md mx-auto px-4 pt-6 pb-10 md:px-8">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold text-white">{{ t('ticket.title') }}</h1>
        <button
          type="button"
          class="w-9 h-9 rounded-full bg-white/15 text-white grid place-items-center"
          :aria-label="t('common.close')"
          @click="router.push('/')"
        >
          <Icon name="close" class="w-4 h-4" />
        </button>
      </div>
      <div v-if="qrDataUrl" class="bg-white rounded-2xl p-4 mb-4 grid place-items-center">
        <img :src="qrDataUrl" alt="" class="w-48 h-48" />
      </div>
      <TicketCard />
    </div>
  </div>
</template>
