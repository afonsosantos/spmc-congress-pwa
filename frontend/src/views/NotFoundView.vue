<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import EmptyState from '@/components/EmptyState.vue';

const { t } = useI18n();
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-16">
    <EmptyState icon="search" :title="t('notFound.title')" :message="t('notFound.hint')">
      <RouterLink to="/" class="mt-4 px-5 py-2.5 rounded-full bg-brand-700 text-white text-sm font-semibold">{{ t('notFound.cta') }}</RouterLink>
    </EmptyState>
  </div>
</template>
