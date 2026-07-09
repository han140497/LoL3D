import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  // Served from https://han140497.github.io/LoL3D/ — assets and the router
  // need the /LoL3D/ prefix in production. Dev stays at /.
  base: mode === 'production' ? '/LoL3D/' : '/',
  plugins: [react(), tailwindcss()],
}));
