<script setup lang="ts">
const { t } = useI18n();
const program = useProgramStore();

onMounted(() => {
  program.fetchProgram();
});

const query = ref('');
const roomFilter = ref<number | null>(null);
const trackFilter = ref<number | null>(null);
const dayFilter = ref<string | null>(null);
const showFilters = ref(false);

const days = computed(() => {
  const keys = new Set(program.sessions.map((s) => dayKey(s.start)).filter(Boolean));
  return [...keys].sort();
});

const activeFilterCount = computed(
  () => Number(roomFilter.value !== null) + Number(trackFilter.value !== null) + Number(dayFilter.value !== null)
);

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  return program.sessions
    .filter((s) => {
      if (roomFilter.value !== null && s.room?.id !== roomFilter.value) return false;
      if (trackFilter.value !== null && s.track?.id !== trackFilter.value) return false;
      if (dayFilter.value !== null && dayKey(s.start) !== dayFilter.value) return false;
      if (!q) return true;
      const haystack = [s.title, s.room?.name, s.track?.name, ...s.speakers.map((sp) => sp.name)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    })
    .sort((a, b) => (a.start ?? '').localeCompare(b.start ?? ''));
});

const grouped = computed(() => {
  const groups = new Map<string, typeof filtered.value>();
  for (const s of filtered.value) {
    const key = dayKey(s.start);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
});

function clearFilters() {
  roomFilter.value = null;
  trackFilter.value = null;
  dayFilter.value = null;
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 pt-6 pb-8 md:px-8">
    <h1 class="text-xl font-bold mb-4">{{ t('program.title') }}</h1>

    <div class="flex gap-2 mb-4">
      <div class="relative flex-1">
        <Icon name="search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          v-model="query"
          type="search"
          :placeholder="t('program.searchPlaceholder')"
          class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600"
        />
      </div>
      <button
        type="button"
        class="relative shrink-0 w-11 h-11 grid place-items-center rounded-xl border border-slate-200 dark:border-slate-800"
        @click="showFilters = !showFilters"
        :aria-label="t('program.filters')"
      >
        <Icon name="filter" class="w-5 h-5" />
        <span
          v-if="activeFilterCount"
          class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-700 text-white text-[10px] grid place-items-center"
          >{{ activeFilterCount }}</span
        >
      </button>
    </div>

    <div v-if="showFilters" class="mb-4 space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <div>
        <p class="text-xs font-semibold text-slate-500 mb-1.5">{{ t('program.day') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="d in days"
            :key="d"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="dayFilter === d ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
            @click="dayFilter = dayFilter === d ? null : d"
          >
            {{ formatDate(d).split(',')[0] }}
          </button>
        </div>
      </div>
      <div>
        <p class="text-xs font-semibold text-slate-500 mb-1.5">{{ t('program.room') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="r in program.rooms"
            :key="r.id"
            type="button"
            class="px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="roomFilter === r.id ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
            @click="roomFilter = roomFilter === r.id ? null : r.id"
          >
            {{ r.name }}
          </button>
        </div>
      </div>
      <div>
        <p class="text-xs font-semibold text-slate-500 mb-1.5">{{ t('program.track') }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="track in program.tracks"
            :key="track.id"
            type="button"
            class="max-w-[10rem] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
            :class="trackFilter === track.id ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
            @click="trackFilter = trackFilter === track.id ? null : track.id"
          >
            <span
              v-if="track.color"
              class="w-2 h-2 rounded-full shrink-0"
              :style="{ backgroundColor: trackFilter === track.id ? '#fff' : track.color }"
            />
            <span class="min-w-0 truncate">{{ track.name }}</span>
          </button>
        </div>
      </div>
      <button v-if="activeFilterCount" type="button" class="text-xs font-semibold text-brand-700 dark:text-brand-400" @click="clearFilters">
        {{ t('program.clearFilters') }}
      </button>
    </div>

    <SkeletonList v-if="program.status === 'loading' && !program.sessions.length" />
    <EmptyState
      v-else-if="program.status === 'error' && !program.sessions.length"
      icon="wifiOff"
      :title="t('program.loadError')"
      :message="t('program.loadErrorHint')"
    />
    <EmptyState v-else-if="!filtered.length" icon="search" :title="t('program.noResults')" :message="t('program.noResultsHint')" />

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
