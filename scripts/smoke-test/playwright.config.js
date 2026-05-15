// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Hexlash smoke — read-only Playwright config.
 *
 * BASE_URL env var selects target. Defaults to prod (sanity self-check).
 * For PR smoke, run with BASE_URL=<vercel-preview-url>.
 *
 * SPA-aware: `networkidle` wait for Vue router + lazy chunks.
 */
module.exports = defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // serial — keeps console-error inspection clean
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.hexlash.com',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    // INSECURE=1 opt-in for sandboxed environments using TLS-inspection proxies
    // (Anthropic Claude Code sandbox injects a custom CA into system trust, but
    // Playwright's bundled Chromium has its own trust store that doesn't see it).
    // Default off — production / CI runs keep strict TLS validation.
    ignoreHTTPSErrors: process.env.INSECURE === '1',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
