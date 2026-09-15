const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests', fullyParallel: false, workers: 1,
  timeout: 30000, retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000', browserName: 'chromium', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
});
