import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'list' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // 通用 chromium 项目 - 无需登录态的测试
    {
      name: 'chromium',
      testMatch: [
        // 新结构中的认证测试
        /business\/auth\.spec\.ts/,
        // 兼容旧结构
        /auth\.spec\.ts/,
        /dashboard\.spec\.ts/,
        /admin\.guest\.spec\.ts/,
      ],
      use: { ...devices['Desktop Chrome'] },
    },
    // 业务端登录态设置
    {
      name: 'business-setup',
      testMatch: /business\.auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // 业务端测试 - 需要登录态
    {
      name: 'business',
      testMatch: [
        // 新结构
        /business\/(?!auth\.spec\.ts).*\.spec\.ts/,
        // 兼容旧结构
        /business\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/business.json',
      },
      dependencies: ['business-setup'],
    },
    // 运营端登录态设置
    {
      name: 'admin-setup',
      testMatch: /admin\.auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    // 运营端测试 - 需要登录态
    {
      name: 'admin',
      testMatch: [
        // 新结构
        /admin\/.*\.spec\.ts/,
        // 兼容旧结构
        /admin\.spec\.ts/,
      ],
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['admin-setup'],
    },
    // 集成测试
    {
      name: 'integration',
      testMatch: /integration\/.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/business.json',
      },
      dependencies: ['business-setup'],
    },
  ],
});
