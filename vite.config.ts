import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Screen Time Guardian',
        short_name: 'Screen Guard',
        description: 'Stay focused and mindful with customizable timers, inspiring quotes, and gentle reminders to take breaks',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'icons/icon16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: 'icons/icon48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: 'icons/icon128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'src/index.html') 
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  esbuild: {
    logOverride: { 'module level directives cause errors': 'silent' },
  },
  publicDir: 'public',
});
