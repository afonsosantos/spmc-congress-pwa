export interface Participant {
  id: string;
  name: string;
  email: string;
  ticket: { product: string; variation: string | null };
  workshops: string[];
  answers: Record<string, string>;
  addons: string[];
  checkedIn: boolean;
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<Participant | null>(null);
  const status = ref<'idle' | 'loading' | 'ready'>('idle');
  const loginError = ref<string | null>(null);

  const isAuthenticated = computed(() => Boolean(user.value));

  async function fetchMe() {
    status.value = 'loading';
    try {
      const { user: u } = await api.get<{ user: Participant }>('/auth/me');
      user.value = u;
    } catch {
      user.value = null;
    } finally {
      status.value = 'ready';
    }
  }

  async function loginWithTicketSecret(secret: string) {
    loginError.value = null;
    try {
      const { user: u } = await api.post<{ user: Participant }>('/auth/ticket', { secret });
      user.value = u;
      return true;
    } catch (err) {
      loginError.value = err instanceof ApiError
        ? translateApiErrorMessage(err.message)
        : (i18n.global.t as (k: string) => string)('errors.networkError');
      return false;
    }
  }

  /** Live re-check of Pretix check-in status (rate-limited server-side). */
  async function refreshCheckIn() {
    try {
      const { user: u } = await api.post<{ user: Participant }>('/me/refresh');
      user.value = u;
    } catch {
      // keep last known state on failure (e.g. rate-limited, offline)
    }
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => {});
    user.value = null;
  }

  return { user, status, loginError, isAuthenticated, fetchMe, loginWithTicketSecret, refreshCheckIn, logout };
});
