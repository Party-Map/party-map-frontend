/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  server: { port: 3000, strictPort: true },
  preview: { port: 3000 },
  build: {
    target: 'es2022',
    // The main chunk is react-dom + react-router + leaflet + keycloak-js (~170 kB gzipped); the
    // admin area is lazy-loaded separately. Raise the heuristic instead of splitting vendor code.
    chunkSizeWarningLimit: 600,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    env: {
      VITE_API_BASE_URL: 'http://api.test',
      VITE_KEYCLOAK_URL: 'http://kc.test',
      VITE_KEYCLOAK_REALM: 'party-map',
      VITE_KEYCLOAK_CLIENT_ID: 'partymap-web',
    },
    css: { modules: { classNameStrategy: 'non-scoped' } },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**', 'src/main.tsx', 'src/vite-env.d.ts'],
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: { lines: 90, statements: 90, functions: 90, branches: 80 },
    },
  },
})
