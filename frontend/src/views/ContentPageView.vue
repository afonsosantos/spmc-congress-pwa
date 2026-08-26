<script setup lang="ts">
import { ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import Icon from '@/components/Icon.vue';
import EmptyState from '@/components/EmptyState.vue';
import { api } from '@/lib/api';

const props = defineProps<{ slug: string }>();

interface Page {
  slug: string;
  title: string;
  body: string;
  updatedAt: string;
}

const page = ref<Page | null>(null);
const status = ref<'loading' | 'ready' | 'error'>('loading');

async function load() {
  status.value = 'loading';
  page.value = null;
  try {
    const data = await api.get<{ page: Page }>(`/content/${props.slug}`);
    page.value = data.page;
    status.value = 'ready';
  } catch {
    status.value = 'error';
  }
}

watch(() => props.slug, load, { immediate: true });
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-10 md:px-8">
    <RouterLink to="/mais" class="inline-flex items-center gap-1 text-sm text-slate-500 mb-4">
      <Icon name="chevronLeft" class="w-4 h-4" /> Mais
    </RouterLink>

    <div v-if="status === 'loading'" class="space-y-3">
      <div class="skeleton h-6 w-1/2"></div>
      <div class="skeleton h-4 w-full"></div>
      <div class="skeleton h-4 w-5/6"></div>
    </div>

    <EmptyState v-else-if="status === 'error' || !page" icon="doc" title="Página não disponível" />

    <template v-else>
      <h1 class="text-xl font-bold mb-4">{{ page.title }}</h1>
      <p class="text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">{{ page.body }}</p>
    </template>
  </div>
</template>

