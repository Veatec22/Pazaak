import path from 'node:path';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/Pazaak/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['brand/favicon-48.png', 'brand/icon-192.png', 'brand/icon-512.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,wav}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'Pazaak — Republic Cantina Edition',
        short_name: 'Pazaak',
        description: 'Play pazaak (the KotOR card game) against a friend, peer-to-peer.',
        start_url: '.',
        theme_color: '#0a1310',
        background_color: '#0a1310',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'brand/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'brand/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 7443,
    strictPort: true,
  },
  preview: {
    port: 7443,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
