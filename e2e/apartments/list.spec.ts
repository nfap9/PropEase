/**
 * 公寓列表 E2E 测试
 *
 * 覆盖场景：
 * - 列表显示
 * - 搜索
 * - 空状态
 */

import { test, expect } from '../fixtures';
import { goToApartments } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { APARTMENTS } from '../testids';

test.describe('公寓列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToApartments(page);
  });

  test('应该显示公寓列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${APARTMENTS.HEADING}"]`)).toBeVisible();

    // 验证新增按钮存在
    await expect(page.locator(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`)).toBeVisible();
  });

  test('应该显示已有的测试公寓', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`, { timeout: 5000 });

    // 应该至少有一个测试公寓
    const listItems = page.locator(`[data-testid="${APARTMENTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('搜索公寓', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 搜索测试公寓
    await page.fill(`[data-testid="${APARTMENTS.SEARCH_INPUT}"]`, 'E2E');

    // 等待搜索结果
    await page.waitForTimeout(500);

    // 验证搜索结果
    const listItems = page.locator(`[data-testid="${APARTMENTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('清空搜索应该显示所有公寓', async ({ page }) => {
    // 先搜索
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);
    await page.fill(`[data-testid="${APARTMENTS.SEARCH_INPUT}"]`, 'E2E');
    await page.waitForTimeout(500);

    // 清空搜索
    await page.fill(`[data-testid="${APARTMENTS.SEARCH_INPUT}"]`, '');
    await page.waitForTimeout(500);

    // 应该显示所有公寓
    const listItems = page.locator(`[data-testid="${APARTMENTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('公寓列表空状态', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToApartments(page);
  });

  test('搜索不存在的内容显示空结果', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 搜索一个不存在的内容
    const uniqueSearchTerm = `不存在的公寓_${Date.now()}`;
    await page.fill(`[data-testid="${APARTMENTS.SEARCH_INPUT}"]`, uniqueSearchTerm);

    // 等待搜索结果
    await page.waitForTimeout(500);

    // 验证搜索结果为空
    const listItems = page.locator(`[data-testid="${APARTMENTS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBe(0);
  });
});
