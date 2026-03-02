import { test as setup, expect } from '@playwright/test';

const adminAuthFile = '.auth/admin.json';

setup('运营后台登录并保存登录态', async ({ page }) => {
  await page.goto('/admin/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: '用户名' }).fill('admin');
  await page.getByRole('textbox', { name: '密码' }).fill('Admin@123456');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/admin$/, { timeout: 15000 });
  await expect(page.getByText('平台概览')).toBeVisible();
  await page.context().storageState({ path: adminAuthFile });
});
