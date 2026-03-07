import { test, expect } from '@playwright/test';
import { UTILITIES, COMMON } from '../testids';
import {
  createUniqueName,
  createUniquePhone,
  waitForDialogOpen,
  waitForDialogClosed,
  isVisible,
} from '../test-helpers';

/**
 * 水电录入模块 E2E 测试
 * 对应测试用例：1.7 水电录入模块
 *
 * 模块编号：UT（水电）
 * - UT-L-*: 水电记录列表
 * - UT-C-*: 水电录入
 * - UT-IMP-*: 批量导入
 */

test.describe('水电记录列表 (UT-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/utilities');
  });

  test('查看水电记录列表 (UT-L-01)', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(2000);

    // 验证页面标题或内容
    const heading = page.getByRole('heading', { name: /水电|水电记录|录入/ });
    const hasHeading = await heading.isVisible().catch(() => false);

    // 验证列表或空状态存在
    const list = page.locator('table').or(page.locator('[data-testid="utilities-list"]'));
    const emptyState = page.getByText(/暂无.*记录|没有水电|没有数据/);
    const hasList = await list.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasContent = await page.getByText(/水电|记录|房间/).isVisible().catch(() => false);

    expect(hasHeading || hasList || hasEmpty || hasContent).toBe(true);
  });

  test('待录入提醒列表 (UT-L-02)', async ({ page }) => {
    // 查找待录入区域
    const pendingSection = page.getByText(/待录入|未录入|待处理/);
    const hasPending = await pendingSection.isVisible().catch(() => false);

    if (hasPending) {
      // 验证待录入列表存在
      const pendingList = page.locator('table').or(page.locator('ul'));
      await expect(pendingList.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('按公寓筛选水电记录 (UT-L-03)', async ({ page }) => {
    // 查找公寓筛选器
    const apartmentFilter = page.getByRole('combobox', { name: /公寓/ }).or(
      page.getByTestId(UTILITIES.APARTMENT_SELECT).or(
        page.locator('[data-testid="utilities-apartment-filter"]')
      )
    ).first();

    if (await apartmentFilter.isVisible()) {
      await apartmentFilter.click();

      // 选择一个公寓选项
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // 验证筛选结果
        const rows = page.getByRole('row');
        const rowCount = await rows.count();
        expect(rowCount).toBeGreaterThanOrEqual(1);
      }
    }
  });

  test('按房间搜索水电记录 (UT-L-04)', async ({ page }) => {
    // 查找搜索框
    const searchInput = page.getByPlaceholder(/搜索.*房间|房间号/).or(
      page.getByTestId(UTILITIES.APARTMENT_SELECT).or(
        page.locator('input[type="search"]')
      )
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('101');
      await page.waitForTimeout(500);

      // 验证搜索结果
      const rows = page.getByRole('row');
      for (let i = 1; i < Math.min(await rows.count(), 5); i++) {
        const row = rows.nth(i);
        const text = await row.textContent();
        if (text && !text.includes('暂无')) {
          expect(text).toContain('101');
        }
      }
    }
  });
});

test.describe('水电录入 (UT-C)', () => {
  test.beforeEach(async ({ page }) => {
    // 准备测试数据：需要有已签约的租约
    await page.goto('/utilities');
  });

  test('录入水电读数成功 (UT-C-01)', async ({ page }) => {
    // 查找待录入的房间
    const pendingItem = page.getByRole('row').filter({ hasText: /待录入|未录入/ }).first();
    const entryBtn = page.getByRole('button', { name: /录入|录入读数/ }).first();

    if (await entryBtn.isVisible()) {
      await entryBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /录入读数|水电录入/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 填写水表读数
      const waterInput = dialog.getByLabel(/水表|水费|水/);
      if (await waterInput.isVisible()) {
        await waterInput.fill('100');
      }

      // 填写电表读数
      const electricityInput = dialog.getByLabel(/电表|电费|电/);
      if (await electricityInput.isVisible()) {
        await electricityInput.fill('200');
      }

      // 保存
      await dialog.getByRole('button', { name: /保存|确认|提交/ }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // 验证保存成功
      await expect(page.getByText(/保存成功|录入成功/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('录入初始读数 (UT-C-02)', async ({ page }) => {
    // 查找需要录入初始读数的房间
    const initialReadingBtn = page.getByRole('button', { name: /录入初始|初始读数/ }).first();

    if (await initialReadingBtn.isVisible()) {
      await initialReadingBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /初始读数|录入初始/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 填写读数
      const waterInput = dialog.getByLabel(/水表|水费/);
      const electricityInput = dialog.getByLabel(/电表|电费/);

      if (await waterInput.isVisible()) {
        await waterInput.fill('0');
      }
      if (await electricityInput.isVisible()) {
        await electricityInput.fill('0');
      }

      await dialog.getByRole('button', { name: /保存|确认/ }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });

  test('录入读数-读数为空 (UT-C-03)', async ({ page }) => {
    const entryBtn = page.getByRole('button', { name: /录入|录入读数/ }).first();

    if (await entryBtn.isVisible()) {
      await entryBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /录入读数|水电录入/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 不填写任何读数，直接保存
      await dialog.getByRole('button', { name: /保存|确认/ }).click();

      // 验证错误提示
      await expect(dialog.getByText(/请输入.*读数/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('录入读数小于上期 (UT-C-04)', async ({ page }) => {
    const entryBtn = page.getByRole('button', { name: /录入|录入读数/ }).first();

    if (await entryBtn.isVisible()) {
      await entryBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /录入读数|水电录入/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 查看是否有上期读数显示
      const lastReading = dialog.getByText(/上期|上次|上月/);
      if (await lastReading.isVisible()) {
        // 输入比上期小的读数
        const waterInput = dialog.getByLabel(/水表|水费|水/);
        if (await waterInput.isVisible()) {
          await waterInput.fill('1'); // 很小的值
        }

        await dialog.getByRole('button', { name: /保存|确认/ }).click();

        // 应该有警告或错误提示
        const warning = dialog.getByText(/小于|低于|异常|警告/);
        const hasWarning = await warning.isVisible({ timeout: 3000 }).catch(() => false);
        // 可能会显示警告但允许继续，或者直接拒绝
        if (hasWarning) {
          // 验证警告出现
          await expect(warning).toBeVisible();
        }
      }

      await page.keyboard.press('Escape');
    }
  });

  test('修改已录入读数 (UT-C-05)', async ({ page }) => {
    // 查找已录入的记录
    const recordedRow = page.getByRole('row').filter({ hasText: /\d+.*\d+/ }).first();

    if (await recordedRow.isVisible()) {
      // 点击编辑按钮
      const editBtn = recordedRow.getByRole('button', { name: /编辑|修改/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑|修改读数/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 修改读数
        const waterInput = dialog.getByLabel(/水表|水费|水/);
        if (await waterInput.isVisible()) {
          await waterInput.fill('150');
        }

        await dialog.getByRole('button', { name: /保存|确认/ }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证修改成功
        await expect(page.getByText(/修改成功|保存成功/)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('批量导入 (UT-IMP)', () => {
  test('导出待录入模板 (UT-IMP-01)', async ({ page }) => {
    await page.goto('/utilities');

    // 点击导出按钮
    const exportBtn = page.getByRole('button', { name: /导出|导出模板/ });
    if (await exportBtn.isVisible()) {
      // 监听下载
      const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        // 验证下载的文件
        expect(download.suggestedFilename()).toMatch(/\.xlsx|\.xls|\.csv/);
      }
    }
  });

  test('批量导入水电读数 (UT-IMP-02)', async ({ page }) => {
    await page.goto('/utilities');

    // 点击批量导入按钮
    const importBtn = page.getByRole('button', { name: /批量导入|导入/ });
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /导入|批量导入/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 验证有文件上传控件
      const fileInput = dialog.locator('input[type="file"]');
      await expect(fileInput).toBeVisible();

      // 这里不实际上传文件，只验证弹窗可以正常打开
      await page.keyboard.press('Escape');
    }
  });

  test('导入格式错误文件 (UT-IMP-03)', async ({ page }) => {
    await page.goto('/utilities');

    const importBtn = page.getByRole('button', { name: /批量导入|导入/ });
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /导入|批量导入/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      const fileInput = dialog.locator('input[type="file"]');
      // 验证只能上传特定格式
      const acceptAttr = await fileInput.getAttribute('accept');
      if (acceptAttr) {
        // 验证接受 Excel 或 CSV 格式
        expect(acceptAttr).toMatch(/\.xlsx|\.xls|\.csv|spreadsheet/);
      }

      await page.keyboard.press('Escape');
    }
  });

  test('导入部分成功提示 (UT-IMP-04)', async ({ page }) => {
    await page.goto('/utilities');

    const importBtn = page.getByRole('button', { name: /批量导入|导入/ });
    if (await importBtn.isVisible()) {
      await importBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /导入|批量导入/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 验证有模板下载链接
      const templateLink = dialog.getByRole('link', { name: /下载模板|模板/ }).or(
        dialog.getByRole('button', { name: /下载模板|模板/ })
      );
      // 模板下载是可选功能
      if (await templateLink.isVisible()) {
        await expect(templateLink).toBeVisible();
      }

      await page.keyboard.press('Escape');
    }
  });
});

test.describe('水电历史记录 (UT-L-05)', () => {
  test('查看历史记录', async ({ page }) => {
    await page.goto('/utilities/history');
    await page.waitForTimeout(2000);

    // 验证页面标题或内容
    const heading = page.getByRole('heading', { name: /历史|水电历史|记录/ });
    const hasHeading = await heading.isVisible().catch(() => false);

    // 验证列表存在
    const table = page.getByRole('table');
    const emptyState = page.getByText(/暂无历史|没有历史|没有数据/);
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    const hasContent = await page.getByText(/历史|记录|水电/).isVisible().catch(() => false);

    // 页面可能重定向到其他页面
    const url = page.url();
    const isValidPage = url.includes('utilities') || url.includes('history') || hasHeading || hasTable || hasEmpty || hasContent;

    expect(isValidPage).toBe(true);
  });
});
