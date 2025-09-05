import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from './federation.config';

export default defineConfig({
  base: './',
  plugins: [react(), federation],
  build: { target: 'esnext' },
  server: { port: 0 }
});
