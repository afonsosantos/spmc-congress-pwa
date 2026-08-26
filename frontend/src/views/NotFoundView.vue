<script setup lang="ts">
import EmptyState from '@/components/EmptyState.vue';
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-16">
    <EmptyState icon="search" title="Página não encontrada" message="Verifique o endereço ou volte ao início.">
      <RouterLink to="/" class="mt-4 px-5 py-2.5 rounded-full bg-brand-700 text-white text-sm font-semibold">Início</RouterLink>
    </EmptyState>
  </div>
</template>

