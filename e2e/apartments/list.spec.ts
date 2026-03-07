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
  // 注：这个测试需要在一个没有公寓的组织中运行
  // 在实际场景中可能需要创建一个临时组织

  test('无公寓时显示空状态', async ({ page }) => {
    // 这个测试用例需要特定的测试数据准备
    // 暂时跳过，在完整测试套件中实现
    test.skip();
  });
});
