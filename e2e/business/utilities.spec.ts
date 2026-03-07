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
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /水电|水电记录/ })).toBeVisible({ timeout: 10000 });

    // 验证列表或空状态存在
    const list = page.locator('table').or(page.locator('[data-testid="utilities-list"]'));
    const emptyState = page.getByText(/暂无.*记录|没有水电/);
    const hasList = await list.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasList || hasEmpty).toBe(true);
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
});

test.describe('水电历史记录 (UT-L-05)', () => {
  test('查看历史记录', async ({ page }) => {
    await page.goto('/utilities/history');

    // 验证页面标题
    await expect(page.getByRole('heading', { name: /历史|水电历史/ })).toBeVisible({ timeout: 10000 });

    // 验证列表存在
    const table = page.getByRole('table');
    const emptyState = page.getByText(/暂无历史/);
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });
});
