<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink, useRoute } from 'vue-router';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';
import { useAnnouncementsStore } from '@/stores/announcements';

const route = useRoute();
const auth = useAuthStore();
const announcements = useAnnouncementsStore();
const { t } = useI18n();

const items = computed(() => [
  { to: '/', name: 'home', label: t('nav.home') },
  { to: '/programa', name: 'program', label: t('nav.program') },
  { to: '/meu-horario', name: 'my-schedule', label: t('nav.mySchedule') },
  { to: '/anuncios', name: 'announcements', label: t('nav.announcements') },
  { to: '/mais', name: 'more', label: t('nav.more') },
]);

function isActive(name: string) {
  return route.name === name;
}
</script>

<template>
  <header class="hidden md:flex sticky top-0 z-40 items-center justify-between px-8 h-16 border-b border-slate-200 dark:border-slate-800 bg-cream/90 dark:bg-slate-950/90 backdrop-blur">
    <RouterLink to="/" class="flex items-center gap-2 font-serif font-semibold text-lg text-brand-700 dark:text-brand-400">
      <span class="w-8 h-8 rounded-full bg-brand-700 text-gold-400 grid place-items-center text-xs font-bold">SP</span>
      SPMC 2027
    </RouterLink>

    <nav class="flex items-center gap-1" :aria-label="t('common.mainNavigation')">
      <RouterLink
        v-for="item in items"
        :key="item.name"
        :to="item.to"
        class="relative px-4 py-2 rounded-full text-sm font-medium transition-colors"
        :class="isActive(item.name) ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'"
      >
        {{ item.label }}
        <span
          v-if="item.name === 'announcements' && announcements.unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-4 text-center"
        >
          {{ announcements.unreadCount > 9 ? '9+' : announcements.unreadCount }}
        </span>
      </RouterLink>
    </nav>

    <RouterLink
      v-if="auth.isAuthenticated"
      to="/bilhete"
      class="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
    >
      <Icon name="ticket" class="w-4 h-4" />
      {{ t('nav.myTicket') }}
    </RouterLink>
    <RouterLink
      v-else
      to="/entrar"
      class="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500 text-white text-sm font-medium hover:bg-gold-600"
    >
      {{ t('nav.loginWithTicket') }}
    </RouterLink>
  </header>
</template>
