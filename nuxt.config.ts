// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },

  // Client-only SPA: no meaningful SSR win behind a login wall, and several
  // modules (i18n, theme) touch localStorage/document at module scope.
  ssr: false,

  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt', 'nuxt-security'],

  imports: {
    presets: [{ from: 'vue-i18n', imports: ['useI18n'] }],
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
  },

  app: {
    head: {
      htmlAttrs: { lang: 'pt' },
      // Base body colors live in app/assets/css/tailwind.css instead of
      // here — Tailwind's content scanner never sees class names in this
      // file, so bodyAttrs.class silently produced no CSS.
      title: 'SPMC Congress 2027',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1' },
        { name: 'theme-color', content: '#4a1e2c' },
        { name: 'description', content: 'Aplicação oficial do II Congresso Internacional de Medicina Chinesa (SPMC 2027).' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'SPMC 2027' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
      ],
    },
  },

  security: {
    // Same-origin single deployment now — no cross-origin API calls left to
    // permit, so CORS is left at its secure default (disabled) rather than
    // configured. headers.crossOriginEmbedderPolicy stays default too;
    // the QR scanner uses getUserMedia, not SharedArrayBuffer/WASM threads.
    headers: {
      crossOriginResourcePolicy: 'same-origin',
    },
  },

  pwa: {
    registerType: 'prompt',
    injectRegister: false,
    strategies: 'injectManifest',
    srcDir: '.',
    filename: 'sw.ts',
    injectManifest: {
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
  },

  nitro: {
    preset: 'bun',
    errorHandler: '~~/server/error.ts',
  },

  devServer: {
    port: 5173,
    host: '0.0.0.0',
    // HTTPS in dev (self-signed) so the camera (getUserMedia) works when
    // testing from a phone over the LAN — insecure origins other than
    // localhost can't access the camera at all.
    https: true,
  },

  typescript: {
    typeCheck: false,
  },
});
