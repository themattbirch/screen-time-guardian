import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
 plugins: [
   react()
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