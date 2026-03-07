/**
 * 租客列表 E2E 测试
 *
 * 覆盖场景：
 * - 列表显示
 * - 搜索
 */

import { test, expect } from '../fixtures';
import { goToTenants } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { TENANTS } from '../testids';

test.describe('租客列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTenants(page);
  });

  test('应该显示租客列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${TENANTS.HEADING}"]`)).toBeVisible();

    // 验证新增按钮存在
    await expect(page.locator(`[data-testid="${TENANTS.NEW_BUTTON}"]`)).toBeVisible();
  });

  test('应该显示已有的测试租客', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${TENANTS.LIST}"]`, { timeout: 5000 });

    // 应该至少有一个测试租客
    const listItems = page.locator(`[data-testid="${TENANTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('搜索租客', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${TENANTS.LIST}"]`);

    // 搜索租客姓名
    await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, '张三');

    // 等待搜索结果
    await page.waitForTimeout(500);

    // 验证有搜索结果
    const listItems = page.locator(`[data-testid="${TENANTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('按手机号搜索租客', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${TENANTS.LIST}"]`);

    // 搜索手机号
    await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, '13900139001');

    // 等待搜索结果
    await page.waitForTimeout(500);

    // 验证有搜索结果
    const listItems = page.locator(`[data-testid="${TENANTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('搜索无结果显示空状态', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${TENANTS.LIST}"]`);

    // 搜索不存在的内容
    await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, '不存在的租客_xyz_123');

    // 等待搜索结果
    await page.waitForTimeout(500);

    // 验证显示空状态或无结果
    const listItems = page.locator(`[data-testid="${TENANTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBe(0);
  });
});
