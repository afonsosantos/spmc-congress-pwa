import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useTheme } from './composables/useTheme';
import { NOW_OVERRIDE_KEY } from './composables/useNow';
import { i18n } from './lib/i18n';
import './style.css';

// Apply the saved/system theme before mounting, on every load, regardless
// of which route (and therefore which lazy chunk) happens to load first.
useTheme();

// Debug helper: visiting `?now=2025-06-15T09:00:00` pins "now" (current/next
// session, etc.) to that instant so the congress dates can be exercised
// without touching the device clock; `?now=clear` removes the override.
// Persisted in localStorage so it survives client-side navigation.
{
  const params = new URLSearchParams(location.search);
  const now = params.get('now');
  if (now !== null) {
    if (now === 'clear') localStorage.removeItem(NOW_OVERRIDE_KEY);
    else localStorage.setItem(NOW_OVERRIDE_KEY, now);
    params.delete('now');
    const query = params.toString();
    history.replaceState(null, '', location.pathname + (query ? `?${query}` : '') + location.hash);
  }
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount('#app');
