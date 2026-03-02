import { test, expect } from '@playwright/test';

/**
 * 运营后台未登录 / 登录失败相关用例（无需登录态，在默认 chromium 项目中运行）。
 */
test.describe('运营后台 - 未登录与登录', () => {
  test('未登录访问 /admin 应重定向到登录页', async ({ page }) => {
    await page.goto('/admin');
    // 客户端重定向在 useEffect 中执行，需等待登录页内容出现
    await expect(page.getByText('管理后台登录')).toBeVisible({ timeout: 15000 });
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test('错误密码登录应显示错误提示', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '用户名' }).fill('admin');
    await page.getByRole('textbox', { name: '密码' }).fill('WrongPassword');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    // 需 API 可用；文案通常为「用户名或密码错误」或接口返回的 message
    await expect(
      page.getByText(/用户名或密码错误|登录失败|密码错误/)
    ).toBeVisible({ timeout: 10000 });
  });
});
