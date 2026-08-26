import { ref } from 'vue';

/** Set by router guards in router/index.ts; read by RouteProgressBar.vue. */
export const routeLoading = ref(false);
