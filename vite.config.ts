import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En producción GitHub Pages sirve en https://alexito1313.github.io/JapoWeb/ → base con la subruta.
// En desarrollo servimos en '/' para que el dev server y el preview sean cómodos.
// (Cuando se empaquete con Capacitor para tiendas, cambiar base a './'.)
export default defineConfig(({ command, isPreview }) => ({
  // CAP_BUILD (APK Capacitor): base '/' (la WebView sirve desde la raíz).
  base: process.env.CAP_BUILD ? '/' : command === 'build' || isPreview ? '/JapoWeb/' : '/',
  plugins: [
    react(),
    // En el build de Capacitor no usamos PWA: los assets ya van dentro del APK.
    ...(process.env.CAP_BUILD
      ? []
      : [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-src.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: '日本語 estudio',
        short_name: 'JapoWeb',
        description:
          'Estudia japonés: kanji y vocabulario con flashcards, test, escritura y simulacro JLPT.',
        lang: 'es',
        theme_color: '#C8102E',
        background_color: '#0E1E33',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache de toda la app + datos (json) + trazos KanjiVG (svg) → offline total.
        globPatterns: ['**/*.{js,css,html,svg,png,json,woff2}'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Las fuentes de Google son externas: se cachean en runtime para offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 40, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
        ]),
  ],
  server: {
    port: 5173,
    open: false,
  },
}))
