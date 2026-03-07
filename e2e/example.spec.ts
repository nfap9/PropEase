/**
 * 示例 E2E 测试
 *
 * 演示如何使用本项目测试框架编写 E2E 测试
 */

import { test, expect } from './fixtures';
import { goToDashboard, goToApartments } from './helpers/navigation';
import { login, logout } from './helpers/auth';
import { DASHBOARD, APARTMENTS, AUTH } from './testids';

test.describe('登录测试', () => {
  test('登录页面应该正常加载', async ({ page }) => {
    await page.goto('/login');

    // 验证登录页面存在
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();

    // 验证登录按钮存在
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_BUTTON}"]`)).toBeVisible();
  });

  test('密码登录成功后应跳转到首页', async ({ page }) => {
    // 执行密码登录
    await login(page);

    // 验证已跳转（dashboard 或其他页面）
    expect(page.url()).toMatch(/\/(dashboard|apartments|rooms)/);
  });

  test('退出登录后应跳转到登录页', async ({ page }) => {
    // 先登录
    await login(page);

    // 退出登录
    await logout(page);

    // 验证已跳转到登录页
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();
  });
});

test.describe('使用 authenticatedPage fixture（自动登录）', () => {
  test('已登录用户可以访问仪表盘', async ({ authenticatedPage }) => {
    await goToDashboard(authenticatedPage);

    // 验证页面标题存在
    const heading = authenticatedPage.locator(`[data-testid="${DASHBOARD.HEADING}"]`);
    await expect(heading).toBeVisible();
  });

  test('已登录用户可以访问公寓管理', async ({ authenticatedPage }) => {
    await goToApartments(authenticatedPage);

    // 验证页面标题
    const heading = authenticatedPage.locator(`[data-testid="${APARTMENTS.HEADING}"]`);
    await expect(heading).toBeVisible();

    // 验证新增按钮存在
    const newButton = authenticatedPage.locator(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`);
    await expect(newButton).toBeVisible();
  });
});

test.describe('公寓管理 - CRUD 操作', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前先登录
    await login(page);
  });

  test('新增公寓', async ({ page }) => {
    // 导航到公寓管理
    await goToApartments(page);

    // 点击新增按钮
    await page.click(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`);

    // 等待弹窗出现
    const dialog = page.locator(`[data-testid="${APARTMENTS.CREATE_DIALOG}"]`);
    await expect(dialog).toBeVisible();

    // 填写表单
    await page.fill(`[data-testid="${APARTMENTS.NAME_INPUT}"]`, '测试公寓');
    await page.fill(`[data-testid="${APARTMENTS.ADDRESS_INPUT}"]`, '测试地址');

    // 提交
    await page.click(`[data-testid="${APARTMENTS.CONFIRM_BUTTON}"]`);

    // 验证成功（等待弹窗关闭）
    await expect(dialog).not.toBeVisible();
  });
});
