import { defineStore } from 'pinia';
import { api } from '@/lib/api';
import type { Session } from '@/stores/program';

interface State {
  favouriteIds: Set<string>;
  status: 'idle' | 'loading' | 'ready';
}

export const useScheduleStore = defineStore('schedule', {
  state: (): State => ({ favouriteIds: new Set(), status: 'idle' }),
  actions: {
    isFavourite(sessionId: string) {
      return this.favouriteIds.has(sessionId);
    },

    async fetchMySchedule() {
      this.status = 'loading';
      try {
        const { sessions } = await api.get<{ sessions: Session[] }>('/me/schedule');
        this.favouriteIds = new Set(sessions.map((s) => s.id));
      } finally {
        this.status = 'ready';
      }
    },

    async toggleFavourite(sessionId: string) {
      const wasFavourite = this.favouriteIds.has(sessionId);
      // optimistic update
      if (wasFavourite) this.favouriteIds.delete(sessionId);
      else this.favouriteIds.add(sessionId);
      this.favouriteIds = new Set(this.favouriteIds);

      try {
        if (wasFavourite) await api.delete(`/me/schedule/${sessionId}`);
        else await api.post(`/me/schedule/${sessionId}`);
      } catch {
        // revert on failure
        if (wasFavourite) this.favouriteIds.add(sessionId);
        else this.favouriteIds.delete(sessionId);
        this.favouriteIds = new Set(this.favouriteIds);
      }
    },

    clear() {
      this.favouriteIds = new Set();
    },
  },
});
