import { defineConfig } from 'vitest/config';

// Vitest configuration for the SST backend. Tests run in a Node environment
// with support for ES modules via ts-node/transpileOnly. Adjust the
// configuration as needed (e.g. include environment variables or setup files).
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
});