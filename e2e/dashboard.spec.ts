import { test, expect } from '@playwright/test';

test.describe('仪表盘', () => {
  test('注册成功并进入仪表盘', async ({ page }) => {
    const uniquePhone = `138${Date.now().toString().slice(-8)}`;
    await page.goto('/register');

    await page.getByRole('textbox', { name: '姓名' }).fill('E2E注册用户');
    await page.getByRole('textbox', { name: '手机号' }).fill(uniquePhone);
    await page.getByRole('textbox', { name: '验证码' }).fill('123456');
    await page.getByRole('textbox', { name: '密码', exact: true }).fill('Test1234');
    await page.getByRole('textbox', { name: '确认密码' }).fill('Test1234');
    await page.getByRole('button', { name: '注册' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole('heading', { name: '仪表盘' }).or(page.getByText('欢迎使用 Apartment Ultra'))
    ).toBeVisible();
  });

  test('密码登录成功并进入仪表盘', async ({ page }) => {
    await page.goto('/login');

    await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
    await page.getByRole('textbox', { name: '密码' }).fill('Test1234');
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(
      page.getByRole('heading', { name: '仪表盘' }).or(page.getByText('欢迎使用 Apartment Ultra'))
    ).toBeVisible();
  });
});
