import { test, expect } from '@playwright/test';

test.describe('认证 - 负向用例', () => {
  test('已注册手机号注册时显示错误提示（AUTH-R-02）', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '姓名' }).fill('重复测试');
    await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
    await page.getByRole('textbox', { name: '验证码' }).fill('123456');
    await page.getByRole('textbox', { name: '密码', exact: true }).fill('Test1234');
    await page.getByRole('textbox', { name: '确认密码' }).fill('Test1234');
    await page.getByRole('button', { name: '注册' }).click();
    await expect(
      page.getByText(/注册失败|手机号.*已被|验证码无效/)
    ).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('错误密码登录时显示错误提示（AUTH-L-02）', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
    await page.getByRole('textbox', { name: '密码' }).fill('WrongPassword1');
    await page.getByRole('button', { name: '登录' }).click();
    await expect(page.getByText('手机号或密码错误')).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});

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
