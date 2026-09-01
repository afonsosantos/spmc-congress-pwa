<script setup lang="ts">
const route = useRoute();
const auth = useAuthStore();
const announcements = useAnnouncementsStore();
const { t } = useI18n();

const items = computed(() => [
  { to: '/', name: 'index', label: t('nav.home') },
  { to: '/programa', name: 'programa', label: t('nav.program') },
  { to: '/meu-horario', name: 'meu-horario', label: t('nav.mySchedule') },
  { to: '/anuncios', name: 'anuncios', label: t('nav.announcements') },
  { to: '/mais', name: 'mais', label: t('nav.more') },
]);

function isActive(name: string) {
  return route.name === name;
}
</script>

<template>
  <header class="hidden lg:flex sticky top-0 z-40 items-center justify-between gap-4 px-4 xl:px-8 h-16 border-b border-slate-200 dark:border-slate-800 bg-cream/90 dark:bg-slate-950/90 backdrop-blur">
    <NuxtLink to="/" class="shrink-0 flex items-center gap-2 font-serif font-semibold text-lg text-brand-700 dark:text-brand-400">
      <span class="w-8 h-8 rounded-full bg-brand-700 text-gold-400 grid place-items-center text-xs font-bold shrink-0">SP</span>
      <span class="hidden xl:inline">SPMC 2027</span>
    </NuxtLink>

    <nav class="flex items-center gap-1 min-w-0 overflow-x-auto" :aria-label="t('common.mainNavigation')">
      <NuxtLink
        v-for="item in items"
        :key="item.name"
        :to="item.to"
        class="relative shrink-0 px-3 xl:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
        :class="isActive(item.name) ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'"
      >
        {{ item.label }}
        <span
          v-if="item.name === 'anuncios' && announcements.unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-4 text-center"
        >
          {{ announcements.unreadCount > 9 ? '9+' : announcements.unreadCount }}
        </span>
      </NuxtLink>
    </nav>

    <NuxtLink
      v-if="auth.isAuthenticated"
      to="/bilhete"
      class="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900"
    >
      <Icon name="ticket" class="w-4 h-4" />
      <span class="hidden xl:inline">{{ t('nav.myTicket') }}</span>
    </NuxtLink>
    <NuxtLink
      v-else
      to="/entrar"
      class="shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500 text-white text-sm font-medium hover:bg-gold-600 whitespace-nowrap"
    >
      {{ t('nav.loginWithTicket') }}
    </NuxtLink>
  </header>
</template>
