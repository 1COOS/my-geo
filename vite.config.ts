import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/my-geo.svg',
        'icons/my-geo-192.png',
        'icons/my-geo-512.png',
        'icons/apple-touch-icon.png',
      ],
      manifest: {
        name: 'My Geo · 探索我们的世界',
        short_name: 'My Geo',
        description: '面向青少年的互动式 3D 世界探索应用。',
        theme_color: '#071426',
        background_color: '#040b16',
        display: 'standalone',
        orientation: 'any',
        lang: 'zh-CN',
        start_url: '/',
        scope: '/',
        categories: ['education', 'games'],
        icons: [
          {
            src: '/icons/my-geo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/my-geo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/my-geo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 3_000,
  },
})
