import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

import { minifiedJsonAssets } from './scripts/minified-json-assets.ts'

export default defineConfig({
  plugins: [react(), minifiedJsonAssets()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
