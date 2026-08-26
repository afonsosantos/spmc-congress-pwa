<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

onMounted(() => {
  if (auth.status === 'ready' && !auth.isAuthenticated) router.replace('/entrar');
});
</script>

<template>
  <div class="max-w-md mx-auto px-4 pt-6 pb-10 md:px-8" v-if="auth.user">
    <h1 class="text-xl font-bold mb-4">Meu Bilhete</h1>

    <div class="rounded-3xl border-2 border-brand-700 overflow-hidden bg-white dark:bg-slate-900">
      <div class="bg-brand-700 text-white px-5 py-4">
        <div class="flex items-center justify-between gap-2">
          <p class="text-xs uppercase tracking-wide opacity-80">Bilhete · SPMC 2027</p>
          <span
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
            :class="auth.user.checkedIn ? 'bg-emerald-400/20 text-emerald-50' : 'bg-white/15 text-white/90'"
          >
            <Icon :name="auth.user.checkedIn ? 'check' : 'clock'" class="w-3 h-3" />
            {{ auth.user.checkedIn ? 'Check-in feito' : 'Check-in por fazer' }}
          </span>
        </div>
        <p class="text-lg font-bold mt-0.5">{{ auth.user.name }}</p>
      </div>
      <div class="p-5 space-y-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Categoria</span>
          <span class="font-medium">{{ auth.user.ticket.product }}</span>
        </div>
        <div v-if="auth.user.ticket.variation" class="flex items-center justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Variante</span>
          <span class="font-medium">{{ auth.user.ticket.variation }}</span>
        </div>
        <div v-if="auth.user.workshops.length" class="flex items-center justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Workshop</span>
          <span class="font-medium">{{ auth.user.workshops.join(', ') }}</span>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">Email</span>
          <span class="font-medium truncate ml-4">{{ auth.user.email }}</span>
        </div>
      </div>
      <div class="px-5 pb-5">
        <div class="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Icon name="info" class="w-4 h-4 shrink-0 mt-0.5" />
          Este ecrã identifica-o como participante na aplicação. Para o check-in físico no congresso, utilize o bilhete original (PDF/email) enviado pelo Pretix. O estado do check-in é atualizado sempre que iniciar sessão.
        </div>
      </div>
    </div>
  </div>
</template>

