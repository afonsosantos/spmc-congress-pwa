// Debug helper: visiting `?now=2025-06-15T09:00:00` pins "now" (current/next
// session, etc.) to that instant so the congress dates can be exercised
// without touching the device clock; `?now=clear` removes the override.
// Persisted in localStorage so it survives client-side navigation.
export default defineNuxtPlugin(() => {
  const params = new URLSearchParams(location.search);
  const now = params.get('now');
  if (now === null) return;

  if (now === 'clear') localStorage.removeItem(NOW_OVERRIDE_KEY);
  else localStorage.setItem(NOW_OVERRIDE_KEY, now);

  params.delete('now');
  const query = params.toString();
  history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
});
