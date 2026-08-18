import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';

const commitId = process.env.COMMIT_ID || 'dev';

export default defineConfig({
  base: './',
  server: {
    port: 8080,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  preview: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  worker: {
    format: 'es',
  },
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB — WASM excluded from precache
        /**
         * Exclude `.wasm` from precache glob patterns so the 21 MB ONNX Runtime
         * binary (ort-wasm-simd-threaded.jsep.wasm) is NOT downloaded during
         * service worker install. Users who never enable TTS avoid this cost
         * entirely. The WASM is instead runtime-cached on first use below.
         */
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        /**
         * Runtime caching for WASM files: when the TTS worker initializes the
         * ONNX session and fetches the .wasm binary, the service worker
         * intercepts the request and caches it with a CacheFirst strategy.
         * Subsequent loads (including offline) are served from cache.
         */
        runtimeCaching: [
          {
            urlPattern: /\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'onnx-wasm-runtime',
              expiration: {
                maxEntries: 5,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Korean Typing Tutor',
        short_name: 'KoreanTyping',
        description: 'Learn Korean through typing practice',
        theme_color: '#ffffff',
        display: 'fullscreen',
        version: commitId,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
});
