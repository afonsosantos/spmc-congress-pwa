<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import Icon from '@/components/Icon.vue';
import { useAuthStore } from '@/stores/auth';
import { useScheduleStore } from '@/stores/schedule';
import { useTheme } from '@/composables/useTheme';
import { subscribeToPush } from '@/lib/push';
import { SUPPORTED_LOCALES, setLocale, type SupportedLocale } from '@/lib/i18n';

const { t, locale } = useI18n();
const auth = useAuthStore();
const schedule = useScheduleStore();
const router = useRouter();
const { theme, setTheme } = useTheme();

const pushStatus = ref<string | null>(null);
const deleting = ref(false);

// Language names are conventionally shown in their own language, not
// translated into the currently active one.
const localeLabels: Record<SupportedLocale, string> = { 'pt-PT': 'Português', 'en-US': 'English' };

const infoLinks = computed(() => [
  { slug: 'about', label: t('more.links.about'), icon: 'info' },
  { slug: 'venue', label: t('more.links.venue'), icon: 'building' },
  { slug: 'directions', label: t('more.links.directions'), icon: 'location' },
  { slug: 'parking', label: t('more.links.parking'), icon: 'car' },
  { slug: 'accommodation', label: t('more.links.accommodation'), icon: 'bed' },
  { slug: 'food', label: t('more.links.food'), icon: 'food' },
  { slug: 'sponsors', label: t('more.links.sponsors'), icon: 'heart' },
  { slug: 'committee', label: t('more.links.committee'), icon: 'user' },
  { slug: 'contacts', label: t('more.links.contacts'), icon: 'contact' },
]);

const legalLinks = computed(() => [
  { slug: 'privacy', label: t('more.links.privacy'), icon: 'shield' },
  { slug: 'terms', label: t('more.links.terms'), icon: 'doc' },
]);

const themeOptions = computed(() => [
  { v: 'light', l: t('more.themeLight') },
  { v: 'dark', l: t('more.themeDark') },
  { v: 'system', l: t('more.themeSystem') },
]);

async function handleLogout() {
  await auth.logout();
  schedule.clear();
  router.push('/');
}

async function enablePush() {
  const result = await subscribeToPush();
  pushStatus.value =
    result === 'subscribed'
      ? t('more.pushSubscribed')
      : result === 'denied'
        ? t('more.pushDenied')
        : result === 'ios-not-installed'
          ? t('more.pushIosNotInstalled')
          : result === 'unsupported'
            ? t('more.pushUnsupported')
            : t('more.pushDisabled');
}

async function deleteAccount() {
  if (!confirm(t('more.deleteAccountConfirm'))) return;
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
    <h1 class="text-xl font-bold">{{ t('more.title') }}</h1>

    <section v-if="auth.isAuthenticated" class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
      <p class="font-semibold">{{ auth.user?.name }}</p>
      <p class="text-sm text-slate-500 dark:text-slate-400">{{ auth.user?.ticket.product }}</p>
      <RouterLink to="/bilhete" class="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-brand-700 dark:text-brand-400">
        <Icon name="ticket" class="w-4 h-4" /> {{ t('more.viewTicket') }}
      </RouterLink>
    </section>
    <RouterLink v-else to="/entrar" class="flex items-center justify-between rounded-2xl bg-brand-700 text-white px-5 py-4">
      <span class="font-semibold flex items-center gap-2"><Icon name="qr" class="w-5 h-5" /> {{ t('nav.loginWithTicket') }}</span>
      <Icon name="chevronRight" class="w-5 h-5" />
    </RouterLink>

    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{{ t('more.congressInfo') }}</h2>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <RouterLink v-for="l in infoLinks" :key="l.slug" :to="`/info/${l.slug}`" class="flex items-center justify-between px-4 py-3">
          <span class="flex items-center gap-3 text-sm font-medium"><Icon :name="l.icon" class="w-4 h-4 text-slate-400" />{{ l.label }}</span>
          <Icon name="chevronRight" class="w-4 h-4 text-slate-300" />
        </RouterLink>
      </div>
    </section>

    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{{ t('more.preferences') }}</h2>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div>
          <p class="text-sm font-medium mb-2">{{ t('more.language') }}</p>
          <div class="flex gap-2">
            <button
              v-for="code in SUPPORTED_LOCALES"
              :key="code"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-medium border"
              :class="locale === code ? 'bg-brand-700 text-white border-brand-700' : 'border-slate-200 dark:border-slate-700'"
              @click="setLocale(code)"
            >
              {{ localeLabels[code] }}
            </button>
          </div>
        </div>
        <div>
          <p class="text-sm font-medium mb-2">{{ t('more.appearance') }}</p>
          <div class="flex gap-2">
            <button
              v-for="opt in themeOptions"
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
            {{ t('more.enableNotifications') }}
          </button>
          <p v-if="pushStatus" class="text-xs text-slate-500 mt-1">{{ pushStatus }}</p>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{{ t('more.legal') }}</h2>
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        <RouterLink v-for="l in legalLinks" :key="l.slug" :to="`/info/${l.slug}`" class="flex items-center justify-between px-4 py-3">
          <span class="flex items-center gap-3 text-sm font-medium"><Icon :name="l.icon" class="w-4 h-4 text-slate-400" />{{ l.label }}</span>
          <Icon name="chevronRight" class="w-4 h-4 text-slate-300" />
        </RouterLink>
      </div>
    </section>

    <section v-if="auth.isAuthenticated" class="space-y-2">
      <button type="button" class="w-full text-left px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-medium flex items-center gap-3" @click="handleLogout">
        <Icon name="logout" class="w-4 h-4" /> {{ t('more.logout') }}
      </button>
      <button
        type="button"
        class="w-full text-left px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900 text-sm font-medium text-rose-600 dark:text-rose-400"
        :disabled="deleting"
        @click="deleteAccount"
      >
        {{ t('more.deleteAccount') }}
      </button>
    </section>
  </div>
</template>
