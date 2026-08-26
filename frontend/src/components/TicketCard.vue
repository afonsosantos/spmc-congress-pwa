<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';

const { t } = useI18n();
const auth = useAuthStore();
</script>

<template>
  <div v-if="auth.user" class="rounded-3xl border-2 border-brand-700 overflow-hidden bg-white dark:bg-slate-900">
    <div class="bg-brand-700 text-white px-5 py-4">
      <div class="flex items-center justify-between gap-2">
        <p class="text-xs uppercase tracking-wide opacity-80">{{ t('ticket.cardLabel') }}</p>
        <span
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
          :class="auth.user.checkedIn ? 'bg-emerald-400/20 text-emerald-50' : 'bg-white/15 text-white/90'"
        >
          <Icon :name="auth.user.checkedIn ? 'check' : 'clock'" class="w-3 h-3" />
          {{ auth.user.checkedIn ? t('ticket.checkedIn') : t('ticket.notCheckedIn') }}
        </span>
      </div>
      <p class="text-lg font-bold mt-0.5">{{ auth.user.name }}</p>
    </div>
    <div class="p-5 space-y-3">
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-500 dark:text-slate-400">{{ t('ticket.category') }}</span>
        <span class="font-medium">{{ auth.user.ticket.product }}</span>
      </div>
      <div v-if="auth.user.ticket.variation" class="flex items-center justify-between text-sm">
        <span class="text-slate-500 dark:text-slate-400">{{ t('ticket.variation') }}</span>
        <span class="font-medium">{{ auth.user.ticket.variation }}</span>
      </div>
      <div v-if="auth.user.workshops.length" class="flex items-center justify-between text-sm">
        <span class="text-slate-500 dark:text-slate-400">{{ t('ticket.workshop') }}</span>
        <span class="font-medium">{{ auth.user.workshops.join(', ') }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-slate-500 dark:text-slate-400">{{ t('ticket.email') }}</span>
        <span class="font-medium truncate ml-4">{{ auth.user.email }}</span>
      </div>
      <div v-if="auth.user.addons.length" class="pt-1">
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-1.5">{{ t('ticket.addons') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="addon in auth.user.addons"
            :key="addon"
            class="px-2.5 py-1 rounded-full bg-gold-50 dark:bg-gold-900/30 text-gold-700 dark:text-gold-300 text-xs font-medium"
          >
            {{ addon }}
          </span>
        </div>
      </div>
    </div>
    <div class="px-5 pb-5">
      <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Icon name="info" class="w-4 h-4 shrink-0 mt-0.5" />
        {{ t('ticket.notice') }}
      </div>
    </div>
  </div>
</template>
