<script setup lang="ts">
const { t } = useI18n();
const program = useProgramStore();
const schedule = useScheduleStore();
const auth = useAuthStore();

onMounted(() => {
  program.fetchProgram();
  if (auth.isAuthenticated) schedule.fetchMySchedule();
});

const favouriteSessions = computed(() =>
  program.sessions
    .filter((s) => schedule.isFavourite(s.id))
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''))
);

const grouped = computed(() => {
  const groups = new Map<string, typeof favouriteSessions.value>();
  for (const s of favouriteSessions.value) {
    const key = dayKey(s.start);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
});
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pt-6 pb-8 md:px-8">
    <h1 class="text-xl font-bold mb-4">{{ t('schedule.title') }}</h1>

    <EmptyState v-if="!auth.isAuthenticated" icon="ticket" :title="t('schedule.loginPrompt')" :message="t('schedule.loginPromptHint')">
      <NuxtLink to="/entrar" class="mt-4 px-5 py-2.5 rounded-full bg-brand-700 text-white text-sm font-semibold">
        {{ t('schedule.loginCta') }}
      </NuxtLink>
    </EmptyState>

    <SkeletonList v-else-if="schedule.status === 'loading' && !favouriteSessions.length" />

    <EmptyState
      v-else-if="!favouriteSessions.length"
      icon="star"
      :title="t('schedule.empty')"
      :message="t('schedule.emptyHint')"
    >
      <NuxtLink to="/programa" class="mt-4 px-5 py-2.5 rounded-full bg-brand-700 text-white text-sm font-semibold">
        {{ t('schedule.browseProgram') }}
      </NuxtLink>
    </EmptyState>

    <div v-else class="space-y-6">
      <section v-for="[day, sessions] in grouped" :key="day">
        <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 capitalize mb-2">{{ formatDate(day) }}</h2>
        <div class="space-y-2">
          <SessionCard v-for="s in sessions" :key="s.id" :session="s" />
        </div>
      </section>
    </div>
  </div>
</template>
