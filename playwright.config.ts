import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 测试配置
 *
 * 使用方法：
 * - pnpm test:e2e          运行所有 E2E 测试
 * - pnpm test:e2e:ui       使用 UI 模式运行测试
 * - pnpm test:e2e:debug    调试模式
 * - pnpm test:e2e:headed   在浏览器中运行测试
 * - pnpm test:e2e:setup   创建认证状态（首次或 token 过期时运行）
 * - pnpm test:e2e:project  只运行指定项目（chromium/firefox/webkit）
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',

  // 测试文件匹配模式
  testMatch: '**/*.spec.ts',

  // 排除 setup 文件
  testIgnore: '**/*.setup.ts',

  // 完全并行运行测试
  fullyParallel: true,

  // CI 上失败时禁止 test.only
  forbidOnly: !!process.env.CI,

  // CI 上重试失败用例
  retries: process.env.CI ? 2 : 0,

  // CI 上限制并发
  workers: process.env.CI ? 1 : undefined,

  // Reporter 配置
  reporter: [
    ['html', { outputFolder: 'e2e/results/report' }],
    ['list'],
    // 可选：添加 JSON reporter 用于 CI/CD
    // ['json', { outputFile: 'e2e/results/report/results.json' }],
  ],

  // 测试输出目录（trace、截图、视频等）
  outputDir: 'e2e/results/test-results',

  // 全局测试配置
  use: {
    // 基础 URL
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',

    // 收集失败用例的 trace
    trace: 'on-first-retry',

    // 截图配置
    screenshot: 'only-on-failure',

    // 视频录制（CI 环境）
    video: process.env.CI ? 'on-first-retry' : 'off',

    // 操作超时
    actionTimeout: 10000,

    // 导航超时
    navigationTimeout: 30000,

    // 启用 HTTP 缓存
    httpCache: true,

    // 忽略 HTTPS 错误（开发环境）
    ignoreHTTPSErrors: true,

    // 颜色支持
    colorScheme: 'light',

    // 地理区域和时区
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',

    // 视图ports
    viewport: { width: 1280, height: 720 },

    // 权限（如果需要）
    // permissions: ['geolocation', 'notifications'],

    // 运营后台基础 URL（用于 admin E2E 测试）
    E2E_ADMIN_BASE_URL: process.env.E2E_ADMIN_BASE_URL || 'http://localhost:3001',
  },

  // 配置项目（浏览器）
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 开发环境默认只运行 Chromium，加快测试速度
    // CI 环境可以取消注释以下行来运行多浏览器测试
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // 移动端测试（可选）
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Setup 文件 - 用于预登录等全局设置
  // 注意：setup 文件会在所有测试之前运行一次
  // 使用 storageState 可以复用登录状态，加快测试速度
  globalSetup: './e2e/global.setup.ts',

  // 全局 teardown
  globalTeardown: undefined,

  // 本地开发时自动启动服务（支持同时启动 tenant-web 和 admin-web）
  webServer: [
    {
      command: 'pnpm dev:web',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      command: 'pnpm dev:admin',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});
