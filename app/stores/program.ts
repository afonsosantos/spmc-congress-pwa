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

const STORAGE_KEY = 'spmc-program-cache-v1';

export const useProgramStore = defineStore('program', () => {
  const sessions = ref<Session[]>([]);
  const rooms = ref<{ id: number; name: string }[]>([]);
  const tracks = ref<{ id: number; name: string; color: string | null }[]>([]);
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const lastFetchedAt = ref<number | null>(null);

  const sessionById = computed(() => (id: string) => sessions.value.find((s) => s.id === id) ?? null);

  function loadFromLocalCache() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const cached = JSON.parse(raw) as {
        sessions: Session[];
        rooms: typeof rooms.value;
        tracks: typeof tracks.value;
        lastFetchedAt: number | null;
      };
      sessions.value = cached.sessions;
      rooms.value = cached.rooms;
      tracks.value = cached.tracks;
      lastFetchedAt.value = cached.lastFetchedAt;
      status.value = 'ready';
    } catch {
      // corrupt cache, ignore
    }
  }

  async function fetchProgram() {
    if (status.value === 'idle') loadFromLocalCache();
    status.value = sessions.value.length ? status.value : 'loading';
    try {
      const data = await api.get<{ sessions: Session[]; rooms: typeof rooms.value; tracks: typeof tracks.value }>(
        '/program'
      );
      sessions.value = data.sessions;
      rooms.value = data.rooms;
      tracks.value = data.tracks;
      lastFetchedAt.value = Date.now();
      status.value = 'ready';
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ sessions: sessions.value, rooms: rooms.value, tracks: tracks.value, lastFetchedAt: lastFetchedAt.value })
        );
      } catch {
        // storage full/unavailable — cache is a convenience, not required
      }
    } catch {
      if (!sessions.value.length) status.value = 'error';
    }
  }

  return { sessions, rooms, tracks, status, lastFetchedAt, sessionById, loadFromLocalCache, fetchProgram };
});
