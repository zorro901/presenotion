import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing of Chrome extension
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://notion.so',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Extension loading will be configured in test files using launchPersistentContext
      },
    },
  ],

  /* Run local dev server before starting tests (optional) */
  // webServer: {
  //   command: 'npm run dev:chrome',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  // },
});
