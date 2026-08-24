import { defineConfig, devices } from '@playwright/test';

const isCi = Boolean(process.env['CI']);
const backendCommand =
  process.platform === 'win32'
    ? 'backend\\mvnw.cmd -f backend\\pom.xml spring-boot:run -Dspring-boot.run.profiles=e2e'
    : './backend/mvnw -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=e2e';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://127.0.0.1:4200',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: backendCommand,
      url: 'http://127.0.0.1:8080/api/auth/csrf',
      reuseExistingServer: !isCi,
      timeout: 180_000,
    },
    {
      command: 'npm start -- --host 127.0.0.1 --port 4200',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: !isCi,
      timeout: 120_000,
    },
  ],
});
