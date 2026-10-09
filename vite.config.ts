import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Two build targets from one codebase:
 *   vite build                → PWA for GitHub Pages (base /Meditation/, service worker)
 *   vite build --mode native  → bundle for the Capacitor (Android) and Electron (desktop)
 *                               shells: relative paths, no service worker
 */
export default defineConfig(({ mode }) => {
  const native = mode === 'native';
  return {
    base: native ? './' : '/Meditation/',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    build: {
      outDir: native ? 'dist-native' : 'dist',
      chunkSizeWarningLimit: 1200,
    },
    plugins: [
      react(),
      VitePWA({
        disable: native,
        registerType: 'prompt',
        includeAssets: ['favicon.svg', 'icons/*.png'],
        manifest: {
          id: '/Meditation/',
          name: 'Meditation',
          short_name: 'Meditation',
          description: 'Calm, distraction-free meditation and breathing, synced across your devices.',
          theme_color: '#FAFAF9',
          background_color: '#FAFAF9',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/Meditation/',
          scope: '/Meditation/',
          categories: ['health', 'lifestyle'],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts-stylesheets' },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
    ],
  };
});
