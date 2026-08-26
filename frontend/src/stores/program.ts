import { defineStore } from 'pinia';
import { api } from '@/lib/api';

export interface Speaker {
  code: string;
  name: string;
  biography: string | null;
  avatar: string | null;
}

export interface Session {
  id: string;
  title: string;
  abstract: string;
  description: string;
  start: string | null;
  end: string | null;
  room: { id: number; name: string } | null;
  speakers: Speaker[];
  track: { id: number; name: string; color: string | null } | null;
  sessionType: string | null;
  tags: string[];
}

interface State {
  sessions: Session[];
  rooms: { id: number; name: string }[];
  tracks: { id: number; name: string; color: string | null }[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  lastFetchedAt: number | null;
}

const STORAGE_KEY = 'spmc-program-cache-v1';

export const useProgramStore = defineStore('program', {
  state: (): State => ({ sessions: [], rooms: [], tracks: [], status: 'idle', lastFetchedAt: null }),
  getters: {
    sessionById: (state) => (id: string) => state.sessions.find((s) => s.id === id) ?? null,
  },
  actions: {
    loadFromLocalCache() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const cached = JSON.parse(raw) as Pick<State, 'sessions' | 'rooms' | 'tracks' | 'lastFetchedAt'>;
        this.sessions = cached.sessions;
        this.rooms = cached.rooms;
        this.tracks = cached.tracks;
        this.lastFetchedAt = cached.lastFetchedAt;
        this.status = 'ready';
      } catch {
        // corrupt cache, ignore
      }
    },

    async fetchProgram() {
      if (this.status === 'idle') this.loadFromLocalCache();
      this.status = this.sessions.length ? this.status : 'loading';
      try {
        const data = await api.get<{ sessions: Session[]; rooms: State['rooms']; tracks: State['tracks'] }>(
          '/program'
        );
        this.sessions = data.sessions;
        this.rooms = data.rooms;
        this.tracks = data.tracks;
        this.lastFetchedAt = Date.now();
        this.status = 'ready';
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ sessions: this.sessions, rooms: this.rooms, tracks: this.tracks, lastFetchedAt: this.lastFetchedAt })
          );
        } catch {
          // storage full/unavailable — cache is a convenience, not required
        }
      } catch {
        if (!this.sessions.length) this.status = 'error';
      }
    },
  },
});
