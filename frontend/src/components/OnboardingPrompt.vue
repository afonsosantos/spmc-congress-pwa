<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';
import { ONBOARDING_SEEN_KEY } from '@/lib/onboarding';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const visible = ref(!localStorage.getItem(ONBOARDING_SEEN_KEY) && !auth.isAuthenticated);

function dismiss() {
  visible.value = false;
  localStorage.setItem(ONBOARDING_SEEN_KEY, '1');
}

function scanTicket() {
  dismiss();
  router.push('/entrar');
}
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-200"
    leave-active-class="transition-opacity duration-150"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="visible" class="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-4" role="dialog" :aria-label="t('onboarding.dialogAria')">
      <div class="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 p-6 text-center safe-bottom">
        <div class="w-14 h-14 mx-auto rounded-2xl bg-brand-700 text-white grid place-items-center mb-4">
          <Icon name="qr" class="w-7 h-7" />
        </div>
        <h2 class="text-lg font-bold mb-2">{{ t('onboarding.title') }}</h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 mb-6">{{ t('onboarding.body') }}</p>
        <button type="button" class="w-full px-5 py-3 rounded-full bg-brand-700 text-white text-sm font-semibold" @click="scanTicket">
          {{ t('onboarding.scanCta') }}
        </button>
        <button type="button" class="w-full px-5 py-3 mt-2 rounded-full text-sm font-semibold text-slate-500" @click="dismiss">
          {{ t('onboarding.dismiss') }}
        </button>
      </div>
    </div>
  </Transition>
</template>
