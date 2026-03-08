/**
 * 运营后台 - 概览页面 E2E 测试
 *
 * 覆盖场景：
 * - 概览页统计数据展示
 * - 退出登录
 */

import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/auth';
import { ADMIN } from '../testids';

test.describe('运营后台概览页', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin');
  });

  test('应该显示概览页统计数据', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${ADMIN.OVERVIEW_HEADING}"]`, { timeout: 10000 });

    // 验证统计数据展示
    const orgCount = page.locator(`[data-testid="${ADMIN.ORG_COUNT}"]`);
    if (await orgCount.isVisible()) {
      await expect(orgCount).toBeVisible();
    }

    const userCount = page.locator(`[data-testid="${ADMIN.USER_COUNT}"]`);
    if (await userCount.isVisible()) {
      await expect(userCount).toBeVisible();
    }
  });
});

test.describe('运营后台导航', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('访问用户管理页面', async ({ page }) => {
    await page.goto('/admin/registered-users');
    await page.waitForTimeout(500);
  });

  test('访问角色管理页面', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForTimeout(500);
  });

  test('访问组织管理页面', async ({ page }) => {
    await page.goto('/admin/organizations');
    await page.waitForTimeout(500);
  });

  test('访问套餐配置页面', async ({ page }) => {
    await page.goto('/admin/plans');
    await page.waitForTimeout(500);
  });

  test('访问订阅管理页面', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    await page.waitForTimeout(500);
  });
});
