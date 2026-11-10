import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// BASE_PATH: "/cong-dong-ve-so/" khi xuất bản lên GitHub Pages, "./" khi đóng gói APK
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  resolve: { alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) } },
  server: { fs: { allow: ['..'] } },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      disable: process.env.CAPACITOR === '1',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'logo.png'],
      manifest: {
        name: 'Cộng Đồng Vé Số',
        short_name: 'Cộng Đồng Vé Số',
        description: 'Hỗ trợ lẫn nhau – Vượt qua khó khăn',
        lang: 'vi',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]?\.?tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: { cacheName: 'osm-tiles', expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 14 } },
          },
        ],
      },
    }),
  ],
  build: { chunkSizeWarningLimit: 900 },
});
