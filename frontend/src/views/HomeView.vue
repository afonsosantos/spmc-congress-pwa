<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import Icon from '@/components/Icon.vue';
import PriorityBadge from '@/components/PriorityBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import { useProgramStore } from '@/stores/program';
import { useAnnouncementsStore } from '@/stores/announcements';
import { useAuthStore } from '@/stores/auth';
import { useNow } from '@/composables/useNow';
import { formatDate, formatTime } from '@/lib/format';

const program = useProgramStore();
const announcements = useAnnouncementsStore();
const auth = useAuthStore();
const { now } = useNow();

const sortedSessions = computed(() =>
  [...program.sessions].sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))
);

const currentSession = computed(() =>
  sortedSessions.value.find((s) => s.start && s.end && new Date(s.start) <= now.value && new Date(s.end) > now.value)
);

const nextSessions = computed(() =>
  sortedSessions.value.filter((s) => s.start && new Date(s.start) > now.value).slice(0, 3)
);

const topAnnouncement = computed(
  () => announcements.announcements.find((a) => a.priority === 'IMPORTANT' && !a.read) ?? announcements.announcements[0]
);

const shortcuts = [
  { to: '/bilhete', icon: 'ticket', label: 'Meu Bilhete', requiresAuth: true },
  { to: '/meu-horario', icon: 'schedule', label: 'Meu Horário', requiresAuth: false },
  { to: '/anuncios', icon: 'bell', label: 'Avisos', requiresAuth: false },
  { to: '/info/venue', icon: 'location', label: 'Informação', requiresAuth: false },
];
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pt-6 pb-8 md:px-8">
    <header class="mb-6">
      <p class="text-sm text-slate-500 dark:text-slate-400 capitalize">{{ formatDate(now.toISOString()) }}</p>
      <h1 class="text-2xl font-bold mt-1">II Congresso Internacional de Medicina Chinesa</h1>
      <p class="text-brand-700 dark:text-brand-400 font-medium">SPMC 2027</p>
    </header>

    <RouterLink
      v-if="!auth.isAuthenticated"
      to="/entrar"
      class="flex items-center justify-between gap-3 rounded-2xl bg-brand-700 text-white px-5 py-4 mb-6 active:scale-[0.99] transition-transform"
    >
      <span class="flex items-center gap-3">
        <Icon name="qr" class="w-6 h-6" />
        <span class="font-semibold">Entrar com bilhete</span>
      </span>
      <Icon name="chevronRight" class="w-5 h-5" />
    </RouterLink>

    <section v-if="topAnnouncement" class="mb-6">
      <RouterLink
        to="/anuncios"
        class="block rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900"
      >
        <div class="flex items-center justify-between mb-2">
          <PriorityBadge :priority="topAnnouncement.priority" />
          <Icon name="chevronRight" class="w-4 h-4 text-slate-400" />
        </div>
        <p class="font-semibold">{{ topAnnouncement.title }}</p>
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{{ topAnnouncement.body }}</p>
      </RouterLink>
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Agora</h2>
      <div
        v-if="program.status === 'loading' && !program.sessions.length"
        class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 skeleton h-20"
      />
      <RouterLink
        v-else-if="currentSession"
        :to="`/programa/${currentSession.id}`"
        class="block rounded-2xl border-2 border-brand-600 p-4 bg-brand-50 dark:bg-brand-900/20"
      >
        <p class="text-sm font-semibold text-brand-700 dark:text-brand-300">
          {{ formatTime(currentSession.start) }} — {{ currentSession.title }}
        </p>
        <p v-if="currentSession.room" class="text-sm text-slate-600 dark:text-slate-300 mt-1 flex items-center gap-1">
          <Icon name="location" class="w-4 h-4" />
          {{ currentSession.room.name }}
        </p>
      </RouterLink>
      <EmptyState v-else icon="clock" title="Sem sessão a decorrer" />
    </section>

    <section class="mb-6">
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Próximo</h2>
      <div v-if="nextSessions.length" class="space-y-2">
        <RouterLink
          v-for="s in nextSessions"
          :key="s.id"
          :to="`/programa/${s.id}`"
          class="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3"
        >
          <div class="min-w-0">
            <p class="text-sm font-medium truncate">{{ formatTime(s.start) }} — {{ s.title }}</p>
            <p v-if="s.room" class="text-xs text-slate-500 dark:text-slate-400">{{ s.room.name }}</p>
          </div>
          <Icon name="chevronRight" class="w-4 h-4 text-slate-400 shrink-0" />
        </RouterLink>
      </div>
      <EmptyState v-else icon="program" title="Sem próximas sessões" />
    </section>

    <section>
      <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Atalhos</h2>
      <div class="grid grid-cols-2 gap-3">
        <RouterLink
          v-for="s in shortcuts"
          :key="s.to"
          :to="s.requiresAuth && !auth.isAuthenticated ? '/entrar' : s.to"
          class="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 p-4"
        >
          <Icon :name="s.icon" class="w-6 h-6 text-brand-700 dark:text-brand-400" />
          <span class="text-sm font-medium">{{ s.label }}</span>
        </RouterLink>
      </div>
    </section>
  </div>
</template>
