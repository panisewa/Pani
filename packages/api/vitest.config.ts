import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
    },
  },
  resolve: {
    alias: {
      '@panisewa/shared': new URL('../shared/src/index.ts', import.meta.url).pathname,
    },
  },
})
