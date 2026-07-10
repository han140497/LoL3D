import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => ({
  // Served from https://lol3d.in at the domain root (public/CNAME pins the
  // custom domain on GitHub Pages; the github.io URL redirects there).
  base: '/',
  plugins: [react(), tailwindcss()],
}));
