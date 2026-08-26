<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import Icon from '@/components/Icon.vue';

/**
 * Custom "Instalar aplicação" banner.
 *
 * beforeinstallprompt only fires on Chromium browsers (Chrome/Edge/Samsung
 * Internet on Android, desktop Chrome/Edge) and only over HTTPS (or
 * localhost) with a valid manifest + registered service worker — that's a
 * platform requirement, not something this component controls. iOS Safari
 * never fires it; there, "install" is Share → Adicionar ao Ecrã Principal,
 * so we show static instructions instead.
 */

const DISMISS_KEY = 'spmc-install-dismissed-at';
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const showIosHint = ref(false);
const visible = ref(false);

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function recentlyDismissed(): boolean {
  const at = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
  return Date.now() - at < DISMISS_COOLDOWN_MS;
}

function onBeforeInstallPrompt(e: Event) {
  e.preventDefault();
  if (isStandalone() || recentlyDismissed()) return;
  deferredPrompt.value = e as BeforeInstallPromptEvent;
  visible.value = true;
}

function onAppInstalled() {
  visible.value = false;
  deferredPrompt.value = null;
}

async function install() {
  if (!deferredPrompt.value) return;
  await deferredPrompt.value.prompt();
  await deferredPrompt.value.userChoice;
  deferredPrompt.value = null;
  visible.value = false;
}

function dismiss() {
  visible.value = false;
  localStorage.setItem(DISMISS_KEY, String(Date.now()));
}

onMounted(() => {
  if (isStandalone() || recentlyDismissed()) return;

  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.addEventListener('appinstalled', onAppInstalled);

  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /safari/i.test(navigator.userAgent) && !/crios|fxios|edgios/i.test(navigator.userAgent);
  if (isIos && isSafari) {
    showIosHint.value = true;
    visible.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
  window.removeEventListener('appinstalled', onAppInstalled);
});
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-200"
    leave-active-class="transition-transform duration-200"
    enter-from-class="translate-y-full"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="visible"
      class="fixed inset-x-0 bottom-16 md:bottom-4 z-40 mx-auto max-w-md px-4"
      role="dialog"
      aria-label="Instalar aplicação"
    >
      <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-4 flex items-start gap-3">
        <div class="w-10 h-10 rounded-xl bg-brand-700 text-white grid place-items-center shrink-0 font-bold text-sm">SP</div>

        <div class="min-w-0 flex-1">
          <p class="font-semibold text-sm">Instalar SPMC 2027</p>
          <p v-if="showIosHint" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Toque em <Icon name="ticket" class="w-3.5 h-3.5 inline -mt-0.5" /> Partilhar e depois em "Adicionar ao Ecrã Principal".
          </p>
          <p v-else class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acesso rápido e utilização offline do programa.
          </p>

          <div v-if="!showIosHint" class="flex gap-2 mt-3">
            <button type="button" class="px-3 py-1.5 rounded-full bg-brand-700 text-white text-xs font-semibold" @click="install">
              Instalar
            </button>
            <button type="button" class="px-3 py-1.5 rounded-full text-xs font-semibold text-slate-500" @click="dismiss">
              Agora não
            </button>
          </div>
        </div>

        <button type="button" class="shrink-0 w-7 h-7 grid place-items-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Fechar" @click="dismiss">
          <Icon name="close" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </Transition>
</template>
