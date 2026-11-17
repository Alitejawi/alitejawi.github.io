import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // One retry on GitHub, so a slow runner cannot hold back a deploy on its own.
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Windows and Linux draw a scrollbar that takes 15px of the window; macOS lays it over
    // the page. The layout tests run both ways, so a Mac catches what GitHub's Linux would.
    {
      name: 'classic-scrollbar',
      testMatch: /(readme|layout)\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { args: ['--disable-features=OverlayScrollbar'], ignoreDefaultArgs: ['--hide-scrollbars'] },
      },
    },
  ],
  // Run npm run build first so these checks exercise the published HTML.
  webServer: {
    // Opt out of Astro's agent auto-backgrounding so Playwright owns the process.
    command: 'npm run preview -- --host 127.0.0.1 --port 4321 --ignore-lock',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
  },
});
