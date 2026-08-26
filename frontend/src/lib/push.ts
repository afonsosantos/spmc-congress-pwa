import { api } from '@/lib/api';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export async function subscribeToPush(): Promise<
  'subscribed' | 'unsupported' | 'disabled' | 'denied' | 'ios-not-installed'
> {
  // iOS Safari only exposes PushManager to a PWA that's been added to the
  // Home Screen and opened from there (iOS 16.4+) — never from a regular
  // Safari tab, even over HTTPS. Detect that case specifically so the UI
  // can say "install the app first" instead of a generic "unsupported".
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos && !isStandalone()) return 'ios-not-installed';

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
