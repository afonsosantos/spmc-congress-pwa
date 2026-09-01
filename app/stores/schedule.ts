import type { Session } from '@/stores/program';

export const useScheduleStore = defineStore('schedule', () => {
  const favouriteIds = ref<Set<string>>(new Set());
  const status = ref<'idle' | 'loading' | 'ready'>('idle');

  function isFavourite(sessionId: string) {
    return favouriteIds.value.has(sessionId);
  }

  async function fetchMySchedule() {
    status.value = 'loading';
    try {
      const { sessions } = await api.get<{ sessions: Session[] }>('/me/schedule');
      favouriteIds.value = new Set(sessions.map((s) => s.id));
    } finally {
      status.value = 'ready';
    }
  }

  async function toggleFavourite(sessionId: string) {
    const wasFavourite = favouriteIds.value.has(sessionId);
    // optimistic update
    if (wasFavourite) favouriteIds.value.delete(sessionId);
    else favouriteIds.value.add(sessionId);
    favouriteIds.value = new Set(favouriteIds.value);

    try {
      if (wasFavourite) await api.delete(`/me/schedule/${sessionId}`);
      else await api.post(`/me/schedule/${sessionId}`);
    } catch {
      // revert on failure
      if (wasFavourite) favouriteIds.value.add(sessionId);
      else favouriteIds.value.delete(sessionId);
      favouriteIds.value = new Set(favouriteIds.value);
    }
  }

  function clear() {
    favouriteIds.value = new Set();
  }

  return { favouriteIds, status, isFavourite, fetchMySchedule, toggleFavourite, clear };
});
