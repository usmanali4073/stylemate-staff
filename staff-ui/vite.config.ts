import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import federation from './federation.config';

export default defineConfig({
  base: './',
  plugins: [react(), federation],
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: false,
  },
  server: {
    origin: 'http://localhost:3002',
    port: 3002,
    strictPort: true,
    allowedHosts: ['host.docker.internal'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
