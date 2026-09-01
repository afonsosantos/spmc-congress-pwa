<script setup lang="ts">
const route = useRoute();
const announcements = useAnnouncementsStore();
const { t } = useI18n();

const items = computed(() => [
  { to: '/', name: 'index', label: t('nav.home'), icon: 'home' },
  { to: '/programa', name: 'programa', label: t('nav.program'), icon: 'program' },
  { to: '/meu-horario', name: 'meu-horario', label: t('nav.myScheduleShort'), icon: 'star' },
  { to: '/anuncios', name: 'anuncios', label: t('nav.announcements'), icon: 'bell' },
  { to: '/mais', name: 'mais', label: t('nav.more'), icon: 'more' },
]);

function isActive(name: string) {
  return route.name === name;
}
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-cream/95 dark:bg-slate-950/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 safe-bottom"
    :aria-label="t('common.mainNavigation')"
  >
    <ul class="grid grid-cols-5">
      <li v-for="item in items" :key="item.name">
        <NuxtLink
          :to="item.to"
          class="flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-[56px] relative text-xs font-medium transition-colors"
          :class="isActive(item.name) ? 'text-brand-700 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'"
        >
          <span class="relative">
            <Icon :name="item.icon" class="w-6 h-6" />
            <span
              v-if="item.name === 'anuncios' && announcements.unreadCount > 0"
              class="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] leading-4 text-center"
            >
              {{ announcements.unreadCount > 9 ? '9+' : announcements.unreadCount }}
            </span>
          </span>
          {{ item.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
