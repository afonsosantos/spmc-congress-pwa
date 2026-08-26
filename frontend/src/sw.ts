/// <reference lib="webworker" />
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(new NavigationRoute(createHandlerBoundToURL('/index.html')));

// Never cache API auth/participant responses — only cache-able public data.
registerRoute(
  ({ url }) => /\/api\/program(\/.*)?$/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'program-cache',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 })],
  })
);
registerRoute(
  ({ url }) => /\/api\/content\/.*/.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'content-cache',
    plugins: [new ExpirationPlugin({ maxAgeSeconds: 60 * 60 * 24 })],
  })
);
registerRoute(
  ({ url }) => /\/api\/announcements$/.test(url.pathname),
  new NetworkFirst({ cacheName: 'announcements-cache', networkTimeoutSeconds: 3 })
);

// Manual update prompt (see UpdatePrompt.vue): only activate a waiting
// worker once the user confirms via updateServiceWorker(), instead of
// skipping the wait unconditionally.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

interface PushPayload {
  title?: string;
  body?: string;
  url?: string;
}

self.addEventListener('push', (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data?.json() ?? {};
  } catch {
    // ignore malformed push payloads
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || 'SPMC 2027', {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && new URL(client.url).pathname === url) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
