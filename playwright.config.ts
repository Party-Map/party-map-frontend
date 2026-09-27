import { defineConfig, devices } from '@playwright/test'

const consent = (theme: 'light' | 'dark') => `e2e/state-${theme}.json`
const desktop = { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } }
// A Chromium phone profile: only Chromium is installed (`playwright install chromium`); iPhone
// profiles would need WebKit.
const phone = devices['Pixel 7']
// Signed-in specs run only in the project that carries the stored Keycloak session.
const anonymous = { testIgnore: /\.auth\.spec\.ts$/ }

export default defineConfig({
  testDir: 'e2e',
  outputDir: 'e2e/.results',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    geolocation: { latitude: 47.4979, longitude: 19.0402 },
    permissions: ['geolocation'],
    trace: 'retain-on-failure',
  },
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled', caret: 'hide' } },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'desktop-light', ...anonymous, use: { ...desktop, colorScheme: 'light', storageState: consent('light') } },
    { name: 'desktop-dark', ...anonymous, use: { ...desktop, colorScheme: 'dark', storageState: consent('dark') } },
    { name: 'phone-light', ...anonymous, use: { ...phone, colorScheme: 'light', storageState: consent('light') } },
    { name: 'phone-dark', ...anonymous, use: { ...phone, colorScheme: 'dark', storageState: consent('dark') } },
    {
      name: 'signed-in',
      dependencies: ['setup'],
      testMatch: /.*\.auth\.spec\.ts/,
      use: { ...desktop, colorScheme: 'light', storageState: 'e2e/.auth/user.json' },
    },
  ],
})
