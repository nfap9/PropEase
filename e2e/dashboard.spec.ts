import { test, expect } from '@playwright/test';
import { AUTH, DASHBOARD, COMMON } from './testids';

/**
 * 认证负向用例与仪表盘 E2E
 * - 未登录态或完整登录/注册流程，在 chromium 项目中运行，部分用例不依赖 storageState
 * - 对应测试用例：1.1、1.2（注册失败、登录失败、注册成功进入仪表盘 AUTH-R-01 等）
 *
 * 注意：当前测试仍使用文案定位，前端添加 data-testid 后可进一步优化
 */

test.describe('认证 - 负向用例（对应测试用例 1.1、1.2）', () => {
  test('已注册手机号注册时显示错误提示（AUTH-R-02）', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');

    // 姓名输入
    await page.getByRole('textbox', { name: '姓名' }).fill('重复测试');
    await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
    await page.getByRole('textbox', { name: '验证码' }).fill('123456');
    await page.getByRole('textbox', { name: '密码', exact: true }).fill('Test1234');
    await page.getByRole('textbox', { name: '确认密码' }).fill('Test1234');

    // 注册按钮
    await page.getByRole('button', { name: '注册' }).click();

    await expect(
      page.getByText(/注册失败|手机号.*已被|验证码无效/)
    ).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
  });

  test('错误密码登录时显示错误提示（AUTH-L-02）', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // 手机号输入
    await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
    await page.getByRole('textbox', { name: '密码' }).fill('WrongPassword1');

    // 登录按钮
    await page.getByRole('button', { name: '登录' }).click();

    // 错误提示
    await expect(page.getByText('手机号或密码错误')).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/dashboard/);
  });
});

test.describe('仪表盘（认证正向）', () => {
  test('注册成功并进入仪表盘（AUTH-R-01）', async ({ page }) => {
    const uniquePhone = `138${Date.now().toString().slice(-8)}`;
    await page.goto('/register');

    // 姓名输入
    await page.getByRole('textbox', { name: '姓名' }).fill('E2E注册用户');
    await page.getByRole('textbox', { name: '手机号' }).fill(uniquePhone);
    await page.getByRole('textbox', { name: '验证码' }).fill('123456');
    await page.getByRole('textbox', { name: '密码', exact: true }).fill('Test1234');
    await page.getByRole('textbox', { name: '确认密码' }).fill('Test1234');

    // 注册按钮
    await page.getByRole('button', { name: '注册' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 验证首页标题 - 支持"首页"或"仪表盘"两种文案
    await expect(
      page.getByRole('heading', { name: '首页' }).or(page.getByRole('heading', { name: '仪表盘' }))
    ).toBeVisible({ timeout: 10000 });
  });

  test('密码登录成功并进入仪表盘（AUTH-L-01）', async ({ page }) => {
    await page.goto('/login');

    // 手机号输入
    await page.getByRole('textbox', { name: '手机号' }).fill('13800138000');
    await page.getByRole('textbox', { name: '密码' }).fill('Test1234');

    // 登录按钮
    await page.getByRole('button', { name: '登录' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 验证首页标题 - 支持"首页"或"仪表盘"两种文案
    await expect(
      page.getByRole('heading', { name: '首页' }).or(page.getByRole('heading', { name: '仪表盘' }))
    ).toBeVisible({ timeout: 10000 });
  });
});
