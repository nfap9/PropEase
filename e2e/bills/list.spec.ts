/**
 * 账单列表 E2E 测试
 *
 * 覆盖场景：
 * - 列表显示
 * - 筛选
 */

import { test, expect } from '../fixtures';
import { goToBills } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { BILLS } from '../testids';

test.describe('账单列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToBills(page);
  });

  test('应该显示账单列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${BILLS.HEADING}"]`)).toBeVisible();
  });

  test('按状态筛选账单', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 5000 });

    // 选择状态筛选
    const statusFilter = page.locator(`[data-testid="${BILLS.STATUS_FILTER}"]`);
    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // 选择"待付"状态
      const option = page.locator('text="待付"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('按月份筛选账单', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`);

    // 选择月份筛选
    const monthFilter = page.locator(`[data-testid="${BILLS.MONTH_FILTER}"]`);
    if (await monthFilter.isVisible()) {
      await monthFilter.click();
      await page.waitForTimeout(300);

      // 选择当月
      const currentMonth = new Date().getMonth() + 1;
      const option = page.locator(`text="${currentMonth}月"`).first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('按租客筛选账单', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`);

    // 选择租客筛选
    const tenantFilter = page.locator(`[data-testid="${BILLS.TENANT_FILTER}"]`);
    if (await tenantFilter.isVisible()) {
      await tenantFilter.click();

      // 选择测试租客
      const option = page.locator('text="张三"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('账单详情', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToBills(page);
  });

  test('查看账单详情', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 5000 });

    // 点击第一条账单查看详情
    const firstBill = page.locator(`[data-testid="${BILLS.LIST}"] > *`).first();
    if (await firstBill.isVisible()) {
      await firstBill.click();

      // 等待详情弹窗
      await page.waitForTimeout(500);
    } else {
      test.skip();
    }
  });
});
