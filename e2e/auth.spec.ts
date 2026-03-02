import { test, expect } from '@playwright/test';

test.describe('认证与导航', () => {
  test('未登录访问首页应重定向到登录页', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('登录页可点击注册链接进入注册页', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: '注册' }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});
