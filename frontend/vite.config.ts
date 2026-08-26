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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        // keep the precache manifest small — same public-data caching
        // rules are implemented explicitly in src/sw.ts
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      },
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'SPMC Congress 2027',
        short_name: 'SPMC 2027',
        description: 'II Congresso Internacional de Medicina Chinesa — aplicação do participante',
        theme_color: '#4a1e2c',
        background_color: '#fffdf9',
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
