import { test as setup, expect } from '@playwright/test';

const businessAuthFile = '.auth/business.json';

setup('业务端登录并保存登录态', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
  await page.getByRole('textbox', { name: '密码' }).fill('Test1234');
  await page.getByRole('button', { name: '登录' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(
    page.getByRole('heading', { name: '仪表盘' }).or(page.getByText('欢迎使用 Apartment Ultra'))
  ).toBeVisible();
  await page.context().storageState({ path: businessAuthFile });
});
