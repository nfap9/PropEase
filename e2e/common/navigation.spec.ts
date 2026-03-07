/**
 * 导航 E2E 测试
 *
 * 覆盖场景：
 * - 侧边栏导航
 * - 页面跳转
 */

import { test, expect } from '../fixtures';
import { login } from '../helpers/auth';
import { NAV, DASHBOARD, APARTMENTS, ROOMS, TENANTS, LEASES, BILLS, UTILITIES, REPORTS, SETTINGS } from '../testids';

test.describe('侧边栏导航', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('导航到仪表盘', async ({ page }) => {
    await page.click(`[data-testid="${NAV.DASHBOARD}"]`);
    await page.waitForURL(/\/dashboard/);
    await expect(page.locator(`[data-testid="${DASHBOARD.HEADING}"]`)).toBeVisible();
  });

  test('导航到公寓管理', async ({ page }) => {
    await page.click(`[data-testid="${NAV.APARTMENTS}"]`);
    await page.waitForURL(/\/apartments/);
    await expect(page.locator(`[data-testid="${APARTMENTS.HEADING}"]`)).toBeVisible();
  });

  test('导航到房间管理', async ({ page }) => {
    await page.click(`[data-testid="${NAV.ROOMS}"]`);
    await page.waitForURL(/\/rooms/);
    await expect(page.locator(`[data-testid="${ROOMS.HEADING}"]`)).toBeVisible();
  });

  test('导航到租客管理', async ({ page }) => {
    await page.click(`[data-testid="${NAV.TENANTS}"]`);
    await page.waitForURL(/\/tenants/);
    await expect(page.locator(`[data-testid="${TENANTS.HEADING}"]`)).toBeVisible();
  });

  test('导航到租约管理', async ({ page }) => {
    await page.click(`[data-testid="${NAV.LEASES}"]`);
    await page.waitForURL(/\/leases/);
    await expect(page.locator(`[data-testid="${LEASES.HEADING}"]`)).toBeVisible();
  });

  test('导航到水电录入', async ({ page }) => {
    await page.click(`[data-testid="${NAV.UTILITIES}"]`);
    await page.waitForURL(/\/utilities/);
    await expect(page.locator(`[data-testid="${UTILITIES.HEADING}"]`)).toBeVisible();
  });

  test('导航到账单管理', async ({ page }) => {
    await page.click(`[data-testid="${NAV.BILLS}"]`);
    await page.waitForURL(/\/bills/);
    await expect(page.locator(`[data-testid="${BILLS.HEADING}"]`)).toBeVisible();
  });

  test('导航到经营分析', async ({ page }) => {
    await page.click(`[data-testid="${NAV.REPORTS}"]`);
    await page.waitForURL(/\/reports/);
    await expect(page.locator(`[data-testid="${REPORTS.HEADING}"]`)).toBeVisible();
  });

  test('导航到设置', async ({ page }) => {
    await page.click(`[data-testid="${NAV.SETTINGS}"]`);
    await page.waitForURL(/\/settings/);
    await expect(page.locator(`[data-testid="${SETTINGS.HEADING}"]`)).toBeVisible();
  });
});

test.describe('未登录访问控制', () => {
  test('未登录访问受保护页面应跳转到登录页', async ({ page }) => {
    // 直接访问仪表盘
    await page.goto('/dashboard');

    // 应该跳转到登录页
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('未登录访问公寓页面应跳转到登录页', async ({ page }) => {
    await page.goto('/apartments');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('未登录访问设置页面应跳转到登录页', async ({ page }) => {
    await page.goto('/settings/team');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });
});
