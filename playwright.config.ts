import { defineConfig, devices } from '@playwright/test';

const includeWebkit = process.env.PW_INCLUDE_WEBKIT === '1';
const configuredWorkers = Number(process.env.PW_WORKERS ?? 4);
const defaultWorkers = Number.isFinite(configuredWorkers) && configuredWorkers > 0 ? configuredWorkers : 4;

/**
 * Playwright E2E 测试配置
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 默认串行文件内用例，降低跨浏览器并发抖动
  fullyParallel: false,

  // CI 上失败时禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 上重试失败测试；本地保留一次重试以降低偶发抖动
  retries: process.env.CI ? 2 : 1,

  // CI 上限制并行 workers
  workers: process.env.CI ? 1 : defaultWorkers,

  // Reporter 配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: 'http://localhost:3000',

    // 收集失败测试的 trace
    trace: 'on-first-retry',

    // 截图
    screenshot: 'only-on-failure',

    // 视频录制
    video: 'on-first-retry',
  },

  // 配置项目（浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    ...(includeWebkit
      ? [
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] },
        },
      ]
      : []),
  ],

  // 启动开发服务器
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
