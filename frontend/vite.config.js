// Vite is the dev server / bundler. This config just turns on React support.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Fixed port (rather than Vite's auto-increment) so it always matches
  // FRONTEND_URLS / SANCTUM_STATEFUL_DOMAINS in backend/.env.
  server: {
    port: 5174,
    strictPort: true,
  },
});
