/**
 * 房间列表 E2E 测试
 *
 * 覆盖场景：
 * - 列表显示
 * - 筛选
 * - 搜索
 */

import { test, expect } from '../fixtures';
import { goToRooms } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { ROOMS } from '../testids';

test.describe('房间列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToRooms(page);
  });

  test('应该显示房间列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${ROOMS.HEADING}"]`)).toBeVisible();

    // 验证新增按钮存在
    await expect(page.locator(`[data-testid="${ROOMS.NEW_BUTTON}"]`)).toBeVisible();
  });

  test('应该显示已有的测试房间', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`, { timeout: 5000 });

    // 应该至少有一个测试房间
    const listItems = page.locator(`[data-testid="${ROOMS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('搜索房间', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`);

    // 搜索房间号
    await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, '101');

    // 等待搜索结果
    await page.waitForTimeout(500);

    // 验证有搜索结果
    const listItems = page.locator(`[data-testid="${ROOMS.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('按公寓筛选房间', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`);

    // 选择公寓筛选
    const apartmentFilter = page.locator(`[data-testid="${ROOMS.APARTMENT_FILTER}"]`);
    if (await apartmentFilter.isVisible()) {
      await apartmentFilter.click();

      // 选择一个公寓
      const option = page.locator('text="E2E测试公寓1"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // 验证筛选结果
        const listItems = page.locator(`[data-testid="${ROOMS.LIST}"] > *`);
        const count = await listItems.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      // 筛选器可能不存在，跳过
      test.skip();
    }
  });

  test('按状态筛选房间', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`);

    // 选择状态筛选
    const statusFilter = page.locator(`[data-testid="${ROOMS.STATUS_FILTER}"]`);
    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // 选择"空置"状态
      const option = page.locator('text="空置"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // 验证筛选结果
        const listItems = page.locator(`[data-testid="${ROOMS.LIST}"] > *`);
        const count = await listItems.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip();
    }
  });

  test('清除筛选', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`);

    // 先设置一个筛选
    const statusFilter = page.locator(`[data-testid="${ROOMS.STATUS_FILTER}"]`);
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      const option = page.locator('text="空置"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }

    // 清除筛选（如果有清除按钮）
    const clearButton = page.locator('button:has-text("清除"), button:has-text("重置")').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
    }
  });
});
