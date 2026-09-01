/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Unlike a plain Vite SPA build, Nuxt's SPA-mode output has no static
// index.html — Nitro renders the shell per-request (see
// .output/server/chunks/routes/renderer.mjs), so there's nothing for
// workbox-precaching's createHandlerBoundToURL() to bind to; calling it
// with a URL that isn't in the precache manifest throws synchronously at
// SW evaluation time and silently kills registration entirely. Network-first
// against the live (always-fresh) Nitro-rendered shell gets the same
// offline-reload capability instead: cache it on success, fall back to that
// cache when offline.
registerRoute(new NavigationRoute(new NetworkFirst({ cacheName: 'app-shell', networkTimeoutSeconds: 3 })));

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
