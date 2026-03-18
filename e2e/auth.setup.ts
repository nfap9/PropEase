/**
 * Playwright E2E Setup - 认证状态复用
 *
 * 使用方法：
 * 1. 先运行一次 pnpm test:e2e:setup 创建认证状态
 * 2. 后续测试会自动使用保存的认证状态，加快测试速度
 *
 * 运行命令：
 * - pnpm test:e2e:setup   创建认证状态（首次或 token 过期时运行）
 * - pnpm test:e2e         运行测试（自动使用保存的认证状态）
 *
 * 注意：这个文件是 setup 文件，会在所有测试之前运行
 * 使用 --grep "@authenticate" 可以只运行 setup
 */

import { test as setup } from '@playwright/test';
import { login, saveAuthState, TEST_ACCOUNTS } from './helpers/auth';

/**
 * 租户端认证 setup
 * 保存认证状态到文件，后续测试复用
 *
 * @tag authenticate
 */
setup('租户端：创建认证状态', async ({ page, context }) => {
  // 执行登录
  await login(page);

  // 保存认证状态到文件
  await saveAuthState(context, 'e2e/results/.auth/user.json');

  console.log('✅ 租户端认证状态已保存');
});

/**
 * 运营后台认证 setup
 *
 * @tag authenticate
 */
setup('运营后台：创建认证状态', async ({ page, context }) => {
  // 访问运营后台登录页
  await page.goto('/admin/login');

  // 等待登录页加载
  await page.waitForSelector('[data-testid="admin-login-page"]', { timeout: 10000 });

  // 填写登录信息
  await page.fill('[data-testid="admin-username-input"]', TEST_ACCOUNTS.owner.phone);
  await page.fill('[data-testid="admin-password-input"]', TEST_ACCOUNTS.owner.password);

  // 点击登录按钮
  await page.click('[data-testid="admin-login-button"]');

  // 等待跳转
  await page.waitForURL(/\/admin(?!\/login)/, { timeout: 15000 });

  // 保存认证状态
  await saveAuthState(context, 'e2e/results/.auth/admin.json');

  console.log('✅ 运营后台认证状态已保存');
});
