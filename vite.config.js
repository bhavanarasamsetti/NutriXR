import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',      // allow LAN + mobile access
    port: 5173,
    https: false,

    // Allow ngrok domains
    allowedHosts: ['.ngrok-free.dev'],

    proxy: {
      '/wikidata': {
        target: 'https://query.wikidata.org',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/wikidata/, '')
      },
      '/chat': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/health/analyze': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/recipe/generate': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
