import { defineConfig } from '@playwright/test';

// Playwright configuration for end‑to‑end tests on the frontend. The tests
// assume that the backend and database are running. Adjust `command` if
// using pnpm. In CI, reuseExistingServer should be false.
export default defineConfig({
  testDir: './tests',
  use: {
    browserName: 'chromium',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});