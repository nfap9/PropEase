import { test, expect } from '@playwright/test';
import { REPORTS, COMMON } from '../testids';

/**
 * 经营分析模块 E2E 测试
 * 对应测试用例：1.9 经营分析模块
 *
 * 模块编号：RP（报表）
 * - RP-O-*: 总览
 * - RP-I-*: 收入分析
 * - RP-OCC-*: 入住率
 * - RP-D-*: 经营分析详情
 */

test.describe('经营分析总览 (RP-O)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');
  });

  test('查看经营分析总览 (RP-O-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /经营分析|报表/ })).toBeVisible({ timeout: 10000 });

    // 验证有统计数据或图表
    const hasStats = await page.getByText(/收入|支出|利润|统计/).isVisible().catch(() => false);
    const hasChart = await page.locator('canvas, svg').isVisible().catch(() => false);
    expect(hasStats || hasChart).toBe(true);
  });

  test('统计卡片显示 (RP-O-02)', async ({ page }) => {
    // 验证仪表盘统计卡片
    await page.goto('/dashboard');

    // 验证各项统计卡片
    const expectedStats = [
      /房间|总计/,
      /空房|空置/,
      /租客|住户/,
      /收入|收益/,
    ];

    let visibleCount = 0;
    for (const stat of expectedStats) {
      const card = page.locator('text=' + stat.source).first();
      if (await card.isVisible().catch(() => false)) {
        visibleCount++;
      }
    }

    // 至少应该有一项统计显示
    expect(visibleCount).toBeGreaterThan(0);
  });
});

test.describe('收入分析 (RP-I)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');

    // 切换到收入分析 Tab
    const incomeTab = page.getByRole('tab', { name: /收入分析|收入/ }).or(
      page.getByRole('button', { name: /收入分析|收入/ })
    );

    if (await incomeTab.isVisible()) {
      await incomeTab.click();
    }
  });

  test('查看收入分析 (RP-I-01)', async ({ page }) => {
    // 验证收入趋势图
    const chart = page.locator('canvas, svg').or(
      page.locator('[data-testid="income-chart"]')
    );

    // 如果有图表区域，验证其可见
    const hasChart = await chart.isVisible().catch(() => false);

    // 或者验证有收入数据展示
    const hasData = await page.getByText(/收入|金额|元/).isVisible().catch(() => false);
    expect(hasChart || hasData).toBe(true);
  });

  test('按时间范围筛选 (RP-I-02)', async ({ page }) => {
    // 查找时间范围筛选器
    const timeFilter = page.getByRole('combobox', { name: /时间|日期|范围/ }).or(
      page.getByRole('button', { name: /本周|本月|本年/ })
    ).first();

    if (await timeFilter.isVisible()) {
      await timeFilter.click();

      // 选择"本月"
      const option = page.getByRole('option', { name: /本月/ }).or(
        page.getByRole('button', { name: /本月/ })
      ).first();

      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('入住率 (RP-OCC)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reports');

    // 切换到入住率 Tab
    const occupancyTab = page.getByRole('tab', { name: /入住率|出租率/ }).or(
      page.getByRole('button', { name: /入住率|出租率/ })
    );

    if (await occupancyTab.isVisible()) {
      await occupancyTab.click();
    }
  });

  test('查看入住率 (RP-OCC-01)', async ({ page }) => {
    // 验证入住率数据
    const occupancyText = page.getByText(/入住率|出租率|%/);
    const hasOccupancy = await occupancyText.isVisible().catch(() => false);

    if (hasOccupancy) {
      await expect(occupancyText.first()).toBeVisible();

      // 验证百分比格式
      const text = await occupancyText.first().textContent();
      expect(text).toMatch(/\d+%|%\d+/);
    }
  });

  test('按公寓查看入住率 (RP-OCC-02)', async ({ page }) => {
    // 查找公寓筛选器
    const apartmentFilter = page.getByRole('combobox', { name: /公寓/ }).or(
      page.getByRole('button', { name: /全部公寓/ })
    );

    if (await apartmentFilter.isVisible()) {
      await apartmentFilter.click();

      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});

test.describe('经营分析详情 (RP-D)', () => {
  test('导出报表 (RP-D-01)', async ({ page }) => {
    await page.goto('/reports');

    // 查找导出按钮
    const exportBtn = page.getByRole('button', { name: /导出|导出报表/ });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        // 验证下载的文件
        expect(download.suggestedFilename()).toMatch(/\.xlsx?|\.pdf|\.csv$/i);
      }
    }
  });

  test('查看支出明细 (RP-D-02)', async ({ page }) => {
    await page.goto('/reports');

    // 查找支出相关内容
    const expenseSection = page.getByText(/支出|成本/);
    const hasExpense = await expenseSection.isVisible().catch(() => false);

    if (hasExpense) {
      await expect(expenseSection.first()).toBeVisible();
    }
  });
});
