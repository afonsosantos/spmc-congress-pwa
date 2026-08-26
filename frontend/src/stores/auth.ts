import { defineStore } from 'pinia';
import { api, ApiError } from '@/lib/api';
import { i18n, translateApiErrorMessage } from '@/lib/i18n';

export interface Participant {
  id: string;
  name: string;
  email: string;
  ticket: { product: string; variation: string | null };
  workshops: string[];
  answers: Record<string, string>;
  checkedIn: boolean;
}

interface State {
  user: Participant | null;
  status: 'idle' | 'loading' | 'ready';
  loginError: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): State => ({ user: null, status: 'idle', loginError: null }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async fetchMe() {
      this.status = 'loading';
      try {
        const { user } = await api.get<{ user: Participant }>('/auth/me');
        this.user = user;
      } catch {
        this.user = null;
      } finally {
        this.status = 'ready';
      }
    },

    async loginWithTicketSecret(secret: string) {
      this.loginError = null;
      try {
        const { user } = await api.post<{ user: Participant }>('/auth/ticket', { secret });
        this.user = user;
        return true;
      } catch (err) {
        this.loginError = err instanceof ApiError
          ? translateApiErrorMessage(err.message)
          : (i18n.global.t as (k: string) => string)('errors.networkError');
        return false;
      }
    },

    /** Live re-check of Pretix check-in status (rate-limited server-side). */
    async refreshCheckIn() {
      try {
        const { user } = await api.post<{ user: Participant }>('/me/refresh');
        this.user = user;
      } catch {
        // keep last known state on failure (e.g. rate-limited, offline)
      }
    },

    async logout() {
      await api.post('/auth/logout').catch(() => {});
      this.user = null;
    },
  },
});
