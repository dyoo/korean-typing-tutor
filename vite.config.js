import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

const commitId = process.env.COMMIT_ID || 'dev';

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'auto',
      manifest: {
        name: 'Korean Typing Tutor',
        short_name: 'KoreanTyping',
        description: 'Learn Korean through typing practice',
        theme_color: '#ffffff',
        version: commitId,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    }),
    {
      name: 'cache-buster',
      transformIndexHtml(html) {
        // Appends the commit ID as a query parameter to URLs that start with ./assets/index
        return html.replace(
          /(src|href)="(\.?\/?assets\/index[^"|?]*?\.(js|css|png|svg|jpg|jpeg|webp|avif|ico))"/g,
          `$1="$2?v=${commitId}"`
        );
      }
    }
  ],
})
