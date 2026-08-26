import { createI18n } from 'vue-i18n';
import ptPT from '@/locales/pt-PT.json';
import enUS from '@/locales/en-US.json';

export const SUPPORTED_LOCALES = ['pt-PT', 'en-US'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

const STORAGE_KEY = 'spmc-locale';

function detectInitialLocale(): SupportedLocale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) return stored as SupportedLocale;
  // Portuguese is the app's primary language — only default to English if
  // the browser clearly prefers it.
  return navigator.language.toLowerCase().startsWith('en') ? 'en-US' : 'pt-PT';
}

export const i18n = createI18n({
  legacy: false,
  locale: detectInitialLocale(),
  fallbackLocale: 'pt-PT',
  messages: { 'pt-PT': ptPT, 'en-US': enUS },
});

export function setLocale(locale: SupportedLocale) {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

document.documentElement.lang = i18n.global.locale.value;

// Known error strings returned by the backend (always in Portuguese —
// there's no server-side i18n) mapped to the current UI locale. Anything
// not recognized is shown as-is rather than swallowed.
const BACKEND_ERROR_KEYS: Record<string, string> = {
  'Não foi possível ler o QR code.': 'errors.unreadableQr',
  'Este bilhete não é válido.': 'errors.invalidTicket',
  'Não foi possível ligar ao servidor.': 'errors.networkError',
  'Demasiadas tentativas. Tente novamente mais tarde.': 'common.tooManyAttempts',
};

export function translateApiErrorMessage(message: string): string {
  const key = BACKEND_ERROR_KEYS[message];
  return key ? (i18n.global.t as (k: string) => string)(key) : message;
}
