const timeFmt = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit' });
const dateFmt = new Intl.DateTimeFormat('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });
const dateShortFmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });

export function formatTime(iso: string | null): string {
  if (!iso) return '';
  return timeFmt.format(new Date(iso));
}

export function formatDate(iso: string | null): string {
  if (!iso) return '';
  return dateFmt.format(new Date(iso));
}

export function formatDateShort(iso: string | null): string {
  if (!iso) return '';
  return dateShortFmt.format(new Date(iso));
}

export function dayKey(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}
