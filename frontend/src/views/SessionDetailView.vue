<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { RouterLink } from 'vue-router';
import Icon from '@/components/Icon.vue';
import EmptyState from '@/components/EmptyState.vue';
import MarkdownContent from '@/components/MarkdownContent.vue';
import { useProgramStore } from '@/stores/program';
import { useScheduleStore } from '@/stores/schedule';
import { useAuthStore } from '@/stores/auth';
import { formatDate, formatTime } from '@/lib/format';

const props = defineProps<{ id: string }>();
const { t } = useI18n();
const program = useProgramStore();
const schedule = useScheduleStore();
const auth = useAuthStore();

const session = computed(() => program.sessionById(props.id));
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-10 md:px-8">
    <RouterLink to="/programa" class="inline-flex items-center gap-1 text-sm text-slate-500 mb-4">
      <Icon name="chevronLeft" class="w-4 h-4" />
      {{ t('nav.program') }}
    </RouterLink>

    <EmptyState v-if="!session" icon="search" :title="t('session.notFound')" />

    <template v-else>
      <div class="flex items-start justify-between gap-3 mb-2">
        <span
          v-if="session.track"
          class="px-2.5 py-1 rounded-full text-xs font-semibold max-w-[60%] truncate"
          :style="session.track.color ? { backgroundColor: session.track.color + '22', color: session.track.color } : {}"
        >
          {{ session.track.name }}
        </span>
        <button
          v-if="auth.isAuthenticated"
          type="button"
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-sm font-medium"
          @click="schedule.toggleFavourite(session.id)"
        >
          <Icon name="star" class="w-4 h-4" :class="schedule.isFavourite(session.id) ? 'text-amber-500 fill-amber-500' : ''" />
          {{ schedule.isFavourite(session.id) ? t('session.inSchedule') : t('session.addFavourite') }}
        </button>
      </div>

      <h1 class="text-2xl font-bold mb-3">{{ session.title }}</h1>

      <div class="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300 mb-6">
        <span class="flex items-center gap-1.5"><Icon name="clock" class="w-4 h-4" />
          {{ formatDate(session.start) }}, {{ formatTime(session.start) }}–{{ formatTime(session.end) }}
        </span>
        <span v-if="session.room" class="flex items-center gap-1.5"><Icon name="location" class="w-4 h-4" />{{ session.room.name }}</span>
        <span v-if="session.sessionType" class="flex items-center gap-1.5"><Icon name="doc" class="w-4 h-4" />{{ session.sessionType }}</span>
      </div>

      <MarkdownContent v-if="session.abstract" :source="session.abstract" class="mb-4" />
      <MarkdownContent v-if="session.description" :source="session.description" class="mb-6" />

      <div v-if="session.tags.length" class="flex flex-wrap gap-2 mb-6">
        <span v-for="tag in session.tags" :key="tag" class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs">{{ tag }}</span>
      </div>

      <section v-if="session.speakers.length">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">{{ t('session.speakers') }}</h2>
        <div class="space-y-4">
          <div v-for="sp in session.speakers" :key="sp.code" class="flex gap-3">
            <img v-if="sp.avatar" :src="sp.avatar" :alt="sp.name" class="w-12 h-12 rounded-full object-cover shrink-0" />
            <div v-else class="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900 grid place-items-center shrink-0">
              <Icon name="user" class="w-5 h-5 text-brand-700 dark:text-brand-400" />
            </div>
            <div>
              <p class="font-medium">{{ sp.name }}</p>
              <MarkdownContent v-if="sp.biography" :source="sp.biography" class="text-sm mt-0.5" />
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

