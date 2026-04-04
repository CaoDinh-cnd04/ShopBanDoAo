import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  /** GitHub Pages: đặt VITE_BASE=/ hoặc /TênRepo/ nếu chưa có custom domain */
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Cảnh báo khi chunk > 500KB
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // State management
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          // UI framework
          'vendor-bootstrap': ['react-bootstrap', 'bootstrap'],
          // Animation (nặng ~100KB)
          'vendor-framer': ['framer-motion'],
          // Charts (admin dashboard)
          'vendor-charts': ['recharts'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],
        },
      },
    },
  },
});
