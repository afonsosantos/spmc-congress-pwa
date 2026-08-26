import { defineStore } from 'pinia';
import { api } from '@/lib/api';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'INFO' | 'WARNING' | 'IMPORTANT';
  link: string | null;
  imageUrl: string | null;
  createdAt: string;
  read: boolean;
}

interface State {
  announcements: Announcement[];
  status: 'idle' | 'loading' | 'ready' | 'error';
}

export const useAnnouncementsStore = defineStore('announcements', {
  state: (): State => ({ announcements: [], status: 'idle' }),
  getters: {
    unreadCount: (state) => state.announcements.filter((a) => !a.read).length,
  },
  actions: {
    async fetchAnnouncements() {
      this.status = 'loading';
      try {
        const { announcements } = await api.get<{ announcements: Announcement[] }>('/announcements');
        this.announcements = announcements;
        this.status = 'ready';
      } catch {
        this.status = 'error';
      }
    },

    async markRead(id: string) {
      const item = this.announcements.find((a) => a.id === id);
      if (!item || item.read) return;
      item.read = true;
      await api.post(`/announcements/${id}/read`).catch(() => {
        item.read = false;
      });
    },
  },
});
