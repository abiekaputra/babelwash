import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 45_000,
  use: {
    baseURL: 'http://127.0.0.1:4311',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://127.0.0.1:4311',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
