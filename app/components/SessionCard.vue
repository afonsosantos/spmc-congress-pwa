<script setup lang="ts">
import type { Session } from '@/stores/program';

const props = defineProps<{ session: Session }>();
const schedule = useScheduleStore();
const auth = useAuthStore();
const { t } = useI18n();

function toggle(e: Event) {
  e.preventDefault();
  e.stopPropagation();
  if (!auth.isAuthenticated) return;
  schedule.toggleFavourite(props.session.id);
}
</script>

<template>
  <NuxtLink
    :to="`/programa/${session.id}`"
    class="block rounded-2xl border border-slate-200 dark:border-slate-800 p-4 active:scale-[0.99] transition-transform bg-white dark:bg-slate-900"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-brand-700 dark:text-brand-400">
          <span class="flex items-center gap-1 shrink-0">
            <Icon name="clock" class="w-3.5 h-3.5" />
            {{ formatTime(session.start) }} – {{ formatTime(session.end) }}
          </span>
          <span
            v-if="session.track"
            class="px-2 py-0.5 rounded-full text-[11px] max-w-[10rem] truncate"
            :style="session.track.color ? { backgroundColor: session.track.color + '22', color: session.track.color } : {}"
          >
            {{ session.track.name }}
          </span>
        </div>
        <h3 class="font-semibold mt-1 line-clamp-2">{{ session.title }}</h3>
        <div class="flex items-center gap-3 mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          <span v-if="session.room" class="flex items-center gap-1">
            <Icon name="location" class="w-3.5 h-3.5" />
            {{ session.room.name }}
          </span>
          <span v-if="session.speakers.length" class="truncate">
            {{ session.speakers.map((s) => s.name).join(', ') }}
          </span>
        </div>
      </div>
      <button
        v-if="auth.isAuthenticated"
        type="button"
        class="shrink-0 w-9 h-9 grid place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
        :aria-label="schedule.isFavourite(session.id) ? t('session.removeFavourite') : t('session.addFavouriteAria')"
        @click="toggle"
      >
        <Icon
          name="star"
          class="w-5 h-5"
          :class="schedule.isFavourite(session.id) ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'"
        />
      </button>
    </div>
  </NuxtLink>
</template>
