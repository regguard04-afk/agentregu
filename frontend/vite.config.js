// vite.config.js — Vite configuration for the frontend dev server
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,       // Default Vite port — visit http://localhost:5173
    open: true,        // Automatically opens the browser on `npm run dev`
  },
});
