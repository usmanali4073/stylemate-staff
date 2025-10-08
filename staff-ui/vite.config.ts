import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import federation from './federation.config';

export default defineConfig({
  base: './',
  plugins: [react(), federation],
  build: {
    target: 'chrome89',
    modulePreload: false,
    minify: false
  },
  server: {
    host: '0.0.0.0',
    origin: 'http://localhost:3003',
    port: 3003
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
