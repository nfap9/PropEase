import { test, expect } from '@playwright/test';

/**
 * 认证与导航 E2E
 * - 未登录态，在 chromium 项目中运行，无需 storageState
 * - 对应测试用例：1.1、1.2（登录页重定向、注册入口）
 */
test.describe('认证与导航（对应测试用例 1）', () => {
  test('未登录访问首页应重定向到登录页', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('登录页可点击注册链接进入注册页', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: '注册' }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
