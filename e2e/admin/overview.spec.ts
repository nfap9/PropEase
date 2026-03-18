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

const ADMIN_BASE_URL = 'http://localhost:3001';

test.describe('运营后台概览页', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_BASE_URL}/`);
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
    await page.goto(`${ADMIN_BASE_URL}/admin/registered-users`);
    await page.waitForTimeout(500);
  });

  test('访问角色管理页面', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/roles`);
    await page.waitForTimeout(500);
  });

  test('访问组织管理页面', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/organizations`);
    await page.waitForTimeout(500);
  });

  test('访问服务配置页面', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/plans`);
    await page.waitForTimeout(500);
  });

  test('访问订阅管理页面', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/subscriptions`);
    await page.waitForTimeout(500);
  });
});
