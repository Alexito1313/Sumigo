import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// En producción GitHub Pages sirve en https://alexito1313.github.io/Sumigo/ → base con la subruta.
// En desarrollo servimos en '/' para que el dev server y el preview sean cómodos.
// El build de Capacitor ya fija su base automáticamente vía CAP_BUILD (abajo).
export default defineConfig(({ command, isPreview }) => ({
  // CAP_BUILD (APK Capacitor): base '/' (la WebView sirve desde la raíz).
  base: process.env.CAP_BUILD ? '/' : command === 'build' || isPreview ? '/Sumigo/' : '/',
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
        name: 'Sumigo · 墨語',
        short_name: 'Sumigo',
        description:
          'Estudia japonés: kanji y vocabulario con flashcards, test, escritura y simulacro de examen N4.',
        lang: 'es',
        theme_color: '#C8102E',
        // Splash de MARCA: el mismo rojo que el fondo del icono (sello 墨) → el
        // arranque se ve igual de bien en tema claro y oscuro (antes era el azul
        // nocturno y los usuarios de tema claro veían un splash oscuro ajeno).
        background_color: '#C8102E',
        display: 'standalone',
        // Sin `orientation`: fijar 'portrait' BLOQUEABA el apaisado en tablets
        // con la app instalada → nunca alcanzaban el modo escritorio (>=960px).
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
          // Trazos de kanji fuera del temario (Míos): el fallback al CDN se
          // cachea para que un kanji trazado una vez online funcione offline.
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/gh\/KanjiVG\//i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'kanjivg-cdn',
              expiration: { maxEntries: 200, maxAgeSeconds: 31536000 },
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
