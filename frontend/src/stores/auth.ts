import { defineStore } from 'pinia';
import { api, ApiError } from '@/lib/api';

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
        this.loginError = err instanceof ApiError ? err.message : 'Não foi possível ligar ao servidor.';
        return false;
      }
    },

    async logout() {
      await api.post('/auth/logout').catch(() => {});
      this.user = null;
    },
  },
});
