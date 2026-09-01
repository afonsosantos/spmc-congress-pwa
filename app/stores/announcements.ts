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

export const useAnnouncementsStore = defineStore('announcements', () => {
  const announcements = ref<Announcement[]>([]);
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const unreadCount = computed(() => announcements.value.filter((a) => !a.read).length);

  async function fetchAnnouncements() {
    status.value = 'loading';
    try {
      const data = await api.get<{ announcements: Announcement[] }>('/announcements');
      announcements.value = data.announcements;
      status.value = 'ready';
    } catch {
      status.value = 'error';
    }
  }

  async function markRead(id: string) {
    const item = announcements.value.find((a) => a.id === id);
    if (!item || item.read) return;
    item.read = true;
    await api.post(`/announcements/${id}/read`).catch(() => {
      item.read = false;
    });
  }

  return { announcements, status, unreadCount, fetchAnnouncements, markRead };
});
