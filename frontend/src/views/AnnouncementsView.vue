<script setup lang="ts">
import { onMounted } from 'vue';
import PriorityBadge from '@/components/PriorityBadge.vue';
import EmptyState from '@/components/EmptyState.vue';
import SkeletonList from '@/components/SkeletonList.vue';
import { useAnnouncementsStore } from '@/stores/announcements';
import { formatDate, formatTime } from '@/lib/format';

const announcements = useAnnouncementsStore();

onMounted(() => {
  for (const a of announcements.announcements) {
    if (!a.read) announcements.markRead(a.id);
  }
});
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-8 md:px-8">
    <h1 class="text-xl font-bold mb-4">Avisos</h1>

    <SkeletonList v-if="announcements.status === 'loading' && !announcements.announcements.length" />
    <EmptyState
      v-else-if="announcements.status === 'error' && !announcements.announcements.length"
      icon="wifiOff"
      title="Não foi possível carregar os avisos"
    />
    <EmptyState v-else-if="!announcements.announcements.length" icon="bell" title="Sem avisos por agora" />

    <div v-else class="space-y-3">
      <article
        v-for="a in announcements.announcements"
        :key="a.id"
        class="rounded-2xl border p-4"
        :class="a.priority === 'IMPORTANT' ? 'border-rose-200 dark:border-rose-900' : 'border-slate-200 dark:border-slate-800'"
      >
        <div class="flex items-center justify-between gap-3 mb-2">
          <PriorityBadge :priority="a.priority" />
          <time class="text-xs text-slate-400">{{ formatDate(a.createdAt) }}, {{ formatTime(a.createdAt) }}</time>
        </div>
        <h2 class="font-semibold">{{ a.title }}</h2>
        <p class="text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{{ a.body }}</p>
        <img v-if="a.imageUrl" :src="a.imageUrl" alt="" class="mt-3 rounded-xl w-full object-cover max-h-52" />
        <a v-if="a.link" :href="a.link" target="_blank" rel="noopener" class="inline-block mt-3 text-sm font-semibold text-brand-700 dark:text-brand-400">
          Saber mais →
        </a>
      </article>
    </div>
  </div>
</template>

