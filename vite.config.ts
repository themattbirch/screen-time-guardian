import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
    server: {
    open: '/app/',
    proxy: {
      '/app': {
        target: 'https://localhost:5173/public',
        rewrite: (path) => path.replace(/^\/app/, ''),
        secure: true 
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        website: resolve(__dirname, 'index.html'),          
        app: resolve(__dirname, 'public/index.html'),
        support: resolve(__dirname, 'public/support.html'),
        privacy: resolve(__dirname, 'public/privacy.html'),
        terms: resolve(__dirname, 'public/terms.html'),
        
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