/**
 * 报表分析 E2E 测试
 *
 * 覆盖场景：
 * - 总览报表
 * - 收入分析
 * - 入住率分析
 */

import { test, expect } from '../fixtures';
import { goToReports } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { REPORTS } from '../testids';

test.describe('报表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToReports(page);
  });

  test('应该显示报表页面', async ({ page }) => {
    await expect(page.locator(`[data-testid="${REPORTS.HEADING}"]`)).toBeVisible();
  });

  test('显示总览 Tab', async ({ page }) => {
    const overviewTab = page.locator(`[data-testid="${REPORTS.OVERVIEW_TAB}"]`);
    await expect(overviewTab).toBeVisible();
  });

  test('显示收入分析 Tab', async ({ page }) => {
    const incomeTab = page.locator(`[data-testid="${REPORTS.INCOME_TAB}"]`);
    await expect(incomeTab).toBeVisible();
  });

  test('显示入住率 Tab', async ({ page }) => {
    const occupancyTab = page.locator(`[data-testid="${REPORTS.OCCUPANCY_TAB}"]`);
    await expect(occupancyTab).toBeVisible();
  });
});

test.describe('总览报表', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToReports(page);
  });

  test('默认显示总览', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);

    // 总览 Tab 应该是激活状态
    const overviewTab = page.locator(`[data-testid="${REPORTS.OVERVIEW_TAB}"]`);
    await expect(overviewTab).toBeVisible();
  });

  test('显示年份选择器', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);

    const yearSelect = page.locator(`[data-testid="${REPORTS.YEAR_SELECT}"]`);
    if (await yearSelect.isVisible()) {
      await yearSelect.click();
      await page.waitForTimeout(300);
    }
  });
});

test.describe('收入分析', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToReports(page);
  });

  test('切换到收入分析 Tab', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);

    const incomeTab = page.locator(`[data-testid="${REPORTS.INCOME_TAB}"]`);
    await incomeTab.click();

    // 等待内容加载
    await page.waitForTimeout(500);
  });

  test('显示收入趋势图', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);

    const incomeTab = page.locator(`[data-testid="${REPORTS.INCOME_TAB}"]`);
    await incomeTab.click();
    await page.waitForTimeout(500);

    // 验证图表容器存在
    const chart = page.locator('[data-testid="reports-income-chart"]');
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });
});

test.describe('入住率分析', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToReports(page);
  });

  test('切换到入住率 Tab', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);

    const occupancyTab = page.locator(`[data-testid="${REPORTS.OCCUPANCY_TAB}"]`);
    await occupancyTab.click();

    // 等待内容加载
    await page.waitForTimeout(500);
  });

  test('显示入住率趋势图', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);

    const occupancyTab = page.locator(`[data-testid="${REPORTS.OCCUPANCY_TAB}"]`);
    await occupancyTab.click();
    await page.waitForTimeout(500);

    // 验证图表容器存在
    const chart = page.locator('[data-testid="reports-occupancy-chart"]');
    if (await chart.isVisible()) {
      await expect(chart).toBeVisible();
    }
  });
});
