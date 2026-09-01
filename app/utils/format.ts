function locale(): string {
  return i18n.global.locale.value;
}

export function formatTime(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale(), { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(locale(), { day: '2-digit', month: '2-digit' }).format(new Date(iso));
}

export function dayKey(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}
