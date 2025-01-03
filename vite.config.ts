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
        short_name: 'ScreenTimer',
        start_url: '/', 
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4F46E5',
        icons: [
          {
            src: '/icons/icon16.png',
            sizes: '16x16',
            type: 'image/png'
          },
          {
            src: '/icons/icon48.png',
            sizes: '48x48',
            type: 'image/png'
          },
          {
            src: '/icons/icon128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icons/icon512.png',
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
        website: resolve(__dirname, 'index.html'),          
        app: resolve(__dirname, 'public/index.html')        
      },
      output: {
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
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
