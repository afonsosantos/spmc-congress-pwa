import { createRouter, createWebHistory } from 'vue-router';
import { routeLoading } from '@/lib/routeLoading';

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior() {
    return { top: 0 };
  },
  routes: [
    { path: '/', name: 'home', component: () => import('@/views/HomeView.vue') },
    { path: '/programa', name: 'program', component: () => import('@/views/ProgramView.vue') },
    { path: '/programa/:id', name: 'session', component: () => import('@/views/SessionDetailView.vue'), props: true },
    { path: '/meu-horario', name: 'my-schedule', component: () => import('@/views/MyScheduleView.vue') },
    { path: '/anuncios', name: 'announcements', component: () => import('@/views/AnnouncementsView.vue') },
    { path: '/mais', name: 'more', component: () => import('@/views/MoreView.vue') },
    { path: '/entrar', name: 'login', component: () => import('@/views/LoginView.vue') },
    { path: '/bilhete', name: 'ticket', component: () => import('@/views/TicketView.vue') },
    { path: '/info/:slug', name: 'content-page', component: () => import('@/views/ContentPageView.vue'), props: true },
    { path: '/admin', name: 'admin', component: () => import('@/views/AdminView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFoundView.vue') },
  ],
});

// Route components are lazy-loaded, so navigation can have a visible gap
// while the chunk downloads — surface it as a thin top progress bar.
router.beforeEach(() => {
  routeLoading.value = true;
});
router.afterEach(() => {
  routeLoading.value = false;
});
router.onError(() => {
  routeLoading.value = false;
});

export default router;
