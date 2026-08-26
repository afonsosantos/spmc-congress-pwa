<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';
import { useScheduleStore } from '@/stores/schedule';
import { useTheme } from '@/composables/useTheme';
import { subscribeToPush } from '@/lib/push';

const auth = useAuthStore();
const schedule = useScheduleStore();
const router = useRouter();
const { theme, setTheme } = useTheme();

const pushStatus = ref<string | null>(null);
const deleting = ref(false);

const infoLinks = [
  { slug: 'about', label: 'Sobre o Congresso', icon: 'info' },
  { slug: 'venue', label: 'Local', icon: 'building' },
  { slug: 'directions', label: 'Como Chegar', icon: 'location' },
  { slug: 'parking', label: 'Estacionamento', icon: 'car' },
  { slug: 'accommodation', label: 'Alojamento', icon: 'bed' },
  { slug: 'food', label: 'Alimentação', icon: 'food' },
  { slug: 'sponsors', label: 'Patrocinadores', icon: 'heart' },
  { slug: 'committee', label: 'Comissão Organizadora', icon: 'user' },
  { slug: 'contacts', label: 'Contactos', icon: 'contact' },
];

const legalLinks = [
  { slug: 'privacy', label: 'Política de Privacidade', icon: 'shield' },
  { slug: 'terms', label: 'Termos e Condições', icon: 'doc' },
];

async function handleLogout() {
  await auth.logout();
  schedule.clear();
  router.push('/');
}

async function enablePush() {
  const result = await subscribeToPush();
  pushStatus.value =
    result === 'subscribed'
      ? 'Notificações ativadas.'
      : result === 'denied'
        ? 'Permissão de notificações negada.'
        : result === 'ios-not-installed'
          ? 'No iPhone, as notificações só funcionam depois de instalar a aplicação no ecrã principal (Partilhar → Adicionar ao Ecrã Principal) e abri-la a partir daí. Requer iOS 16.4 ou superior.'
          : result === 'unsupported'
            ? 'O seu navegador não suporta notificações.'
            : 'Notificações push não estão configuradas neste evento.';
}

async function deleteAccount() {
  if (!confirm('Isto apaga permanentemente os seus dados desta aplicação (o registo no Pretix não é afetado). Continuar?')) return;
  deleting.value = true;
  try {
    await fetch('/api/me', { method: 'DELETE', credentials: 'include' });
    auth.user = null;
    schedule.clear();
    router.push('/');
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-8 md:px-8 space-y-6">
    <h1 class="text-xl font-bold">Mais</h1>

    <section v-if="auth.isAuthenticated" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <p class="font-semibold">{{ auth.user?.name }}</p>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ auth.user?.ticket.product }}</p>
      <RouterLink to="/bilhete" class="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-700 dark:text-brand-400">
        <Icon name="ticket" class="w-4 h-4" /> Ver bilhete
      </RouterLink>
    </section>
    <RouterLink v-else to="/entrar" class="flex items-center justify-between rounded-2xl bg-brand-700 text-white px-5 py-4">
      <span class="font-semibold flex items-center gap-2"><Icon name="qr" class="w-5 h-5" /> Entrar com bilhete</span>
      <Icon name="chevronRight" class="w-5 h-5" />
    </RouterLink>

    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Informação do Congresso</h2>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <RouterLink v-for="l in infoLinks" :key="l.slug" :to="`/info/${l.slug}`" class="flex items-center justify-between px-4 py-3">
          <span class="flex items-center gap-3 text-sm font-medium"><Icon :name="l.icon" class="w-4 h-4 text-slate-400" />{{ l.label }}</span>
          <Icon name="chevronRight" class="w-4 h-4 text-slate-300" />
        </RouterLink>
      </div>
    </section>

    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Preferências</h2>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div>
          <p class="text-sm font-medium mb-2">Aparência</p>
          <div class="flex gap-2">
            <button
              v-for="opt in [{ v: 'light', l: 'Claro' }, { v: 'dark', l: 'Escuro' }, { v: 'system', l: 'Sistema' }]"
              :key="opt.v"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-medium border"
              :class="theme === opt.v ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
              @click="setTheme(opt.v as any)"
            >
              {{ opt.l }}
            </button>
          </div>
        </div>
        <div>
          <button type="button" class="text-sm font-semibold text-brand-700 dark:text-brand-400" @click="enablePush">
            Ativar notificações
          </button>
          <p v-if="pushStatus" class="text-xs text-slate-500 mt-1">{{ pushStatus }}</p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Legal</h2>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <RouterLink v-for="l in legalLinks" :key="l.slug" :to="`/info/${l.slug}`" class="flex items-center justify-between px-4 py-3">
          <span class="flex items-center gap-3 text-sm font-medium"><Icon :name="l.icon" class="w-4 h-4 text-slate-400" />{{ l.label }}</span>
          <Icon name="chevronRight" class="w-4 h-4 text-slate-300" />
        </RouterLink>
      </div>
    </section>

    <section v-if="auth.isAuthenticated" class="space-y-2">
      <button type="button" class="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium flex items-center gap-3" @click="handleLogout">
        <Icon name="logout" class="w-4 h-4" /> Terminar sessão
      </button>
      <button
        type="button"
        class="w-full text-left px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900 text-sm font-medium text-rose-600 dark:text-rose-400"
        :disabled="deleting"
        @click="deleteAccount"
      >
        Apagar os meus dados desta aplicação
      </button>
    </section>
  </div>
</template>

