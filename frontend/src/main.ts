import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useTheme } from './composables/useTheme';
import { i18n } from './lib/i18n';
import './style.css';

// Apply the saved/system theme before mounting, on every load, regardless
// of which route (and therefore which lazy chunk) happens to load first.
useTheme();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(i18n);
app.mount('#app');
