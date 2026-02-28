import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import tailwind from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  server: {
    allowedHosts: ['7c70a1d2860f.ngrok-free.app', '9a4d-2804-7f0-96c1-3583-3de8-5349-4125-3324.ngrok-free.app'],
  },
  plugins: [react(), svgr(), tailwind()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
