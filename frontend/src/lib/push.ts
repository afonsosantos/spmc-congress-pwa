import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<'subscribed' | 'unsupported' | 'disabled' | 'denied'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';

  const { publicKey, enabled } = await api.get<{ publicKey: string | null; enabled: boolean }>('/push/public-key');
  if (!enabled || !publicKey) return 'disabled';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  await api.post('/push/subscribe', subscription.toJSON());
  return 'subscribed';
}
