import { test, expect } from '@playwright/test';

/**
 * 运营后台未登录与登录失败 E2E
 * - 无需登录态，在 chromium 项目中运行，不依赖 storageState
 * - 对应测试用例：12.1（未登录重定向、错误密码提示 ADM-A-02）
 */
test.describe('运营后台 - 未登录与登录（对应测试用例 12.1）', () => {
  test('未登录访问 /admin 应重定向到登录页', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('管理后台登录')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('错误密码登录应显示错误提示（ADM-A-02）', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '用户名' }).fill('admin');
    await page.getByRole('textbox', { name: '密码' }).fill('WrongPassword');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(
      page.getByText(/用户名或密码错误|登录失败|密码错误/)
    ).toBeVisible({ timeout: 10000 });
  });
});
