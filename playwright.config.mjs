import { defineConfig, devices } from '@playwright/test';

const external = process.env.BASE_URL;

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  use: { baseURL: external || 'http://localhost:4173' },
  webServer: external
    ? undefined
    : {
        command: 'npx http-server .site-preview -p 4173 -s -c-1',
        url: 'http://localhost:4173',
        reuseExistingServer: false,
      },
  projects: [
    { name: 'desktop-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'dark' } },
    { name: 'desktop-light', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'light' } },
    { name: 'mobile-dark', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, colorScheme: 'dark' } },
    { name: 'mobile-light', use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 }, colorScheme: 'light' } },
  ],
});
