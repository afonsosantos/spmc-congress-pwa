import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ command }) => ({
  plugins: [
    vue(),
    // HTTPS in dev so the camera (getUserMedia) works when testing from a
    // phone over the LAN — insecure origins other than localhost can't
    // access the camera at all. Self-signed, so the browser will warn once.
    ...(command === 'serve' ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SPMC Congress 2027',
        short_name: 'SPMC 2027',
        description: 'II Congresso Internacional de Medicina Chinesa — aplicação do participante',
        theme_color: '#0f6e5c',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'pt',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        // Never cache API auth/participant responses — only cache-able public data.
        runtimeCaching: [
          {
            urlPattern: /\/api\/program(\/.*)?$/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'program-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 } },
          },
          {
            urlPattern: /\/api\/content\/.*/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'content-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 } },
          },
          {
            urlPattern: /\/api\/announcements$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'announcements-cache', networkTimeoutSeconds: 3 },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3000', changeOrigin: true },
    },
  },
}));
