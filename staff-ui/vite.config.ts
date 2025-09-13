import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from './federation.config';

export default defineConfig({
  base: './',
  plugins: [react(), federation],
  build: { target: 'chrome89' },
  server: { 
    origin: 'http://localhost:3003',
    port: 0 
  }
});
