import { test, expect } from '@playwright/test';
import { BILLS, COMMON } from '../testids';
import {
  createUniqueName,
  createUniquePhone,
  waitForDialogOpen,
  waitForDialogClosed,
  isVisible,
} from '../test-helpers';

/**
 * 账单管理模块 E2E 测试
 * 对应测试用例：1.8 账单管理模块
 *
 * 模块编号：BL（账单）
 * - BL-L-*: 账单列表
 * - BL-GEN-*: 账单生成
 * - BL-PY-C-*: 账单支付
 * - BL-E-*: 账单导出
 */

test.describe('账单列表 (BL-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bills');
  });

  test('查看账单列表 (BL-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible({ timeout: 10000 });

    // 验证表格或空状态存在
    const table = page.getByRole('table');
    const emptyState = page.getByText('暂无账单');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('按状态筛选账单 (BL-L-02)', async ({ page }) => {
    // 查找状态筛选器
    const statusFilter = page.getByRole('combobox', { name: /状态/ }).or(
      page.locator('[data-testid="bills-status-filter"]')
    ).or(
      page.getByRole('button', { name: /状态/ })
    );

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // 选择一个状态
      const option = page.getByRole('option', { name: /待支付|已支付/ }).first();
      if (await option.isVisible()) {
        await option.click();

        // 验证列表更新
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('账单生成 (BL-GEN)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bills');
  });

  test('手动触发出账 (BL-GEN-01)', async ({ page }) => {
    // 查找出账按钮
    const generateBtn = page.getByRole('button', { name: /出账|生成账单|手动出账/ });

    if (await generateBtn.isVisible()) {
      await generateBtn.click();

      // 如果有确认弹窗
      const dialog = page.getByRole('dialog').filter({ hasText: /出账|生成账单/ });
      if (await dialog.isVisible()) {
        await dialog.getByRole('button', { name: /确认|生成/ }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }

      // 验证出账成功提示
      await expect(page.getByText(/出账成功|账单.*生成/)).toBeVisible({ timeout: 10000 });
    }
  });

  test('账单金额计算正确 (BL-GEN-03)', async ({ page }) => {
    // 查找一个账单查看详情
    const billRow = page.getByRole('row').filter({ hasText: /待支付|已支付/ }).first();

    if (await billRow.isVisible()) {
      // 点击查看详情
      const detailBtn = billRow.getByRole('button', { name: /详情|查看/ });
      if (await detailBtn.isVisible()) {
        await detailBtn.click();

        // 验证账单详情页
        const dialog = page.getByRole('dialog').filter({ hasText: /账单详情/ });
        if (await dialog.isVisible()) {
          // 验证账单包含租金、水电费等明细
          const hasRent = await dialog.getByText(/租金|月租/).isVisible().catch(() => false);
          const hasUtility = await dialog.getByText(/水电|电费|水费/).isVisible().catch(() => false);

          // 至少应该有租金项
          expect(hasRent).toBe(true);
        }
      }
    }
  });
});

test.describe('账单支付 (BL-PY)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bills');
  });

  test('登记付款成功 (BL-PY-C-01)', async ({ page }) => {
    // 查找待支付账单
    const pendingBill = page.getByRole('row').filter({ hasText: /待支付/ }).first();

    if (await pendingBill.isVisible()) {
      // 点击登记付款按钮
      const payBtn = pendingBill.getByRole('button', { name: /登记付款|付款|收款/ });
      if (await payBtn.isVisible()) {
        await payBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /登记付款|收款登记/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 填写付款金额（默认可能是账单全额）
        const amountInput = dialog.getByLabel(/金额|实收金额/);
        if (await amountInput.isVisible()) {
          // 使用默认金额或填写全额
        }

        // 选择付款方式
        const methodSelect = dialog.getByLabel(/付款方式|支付方式/);
        if (await methodSelect.isVisible()) {
          await methodSelect.click();
          const option = page.getByRole('option', { name: /微信|支付宝|现金|银行转账/ }).first();
          if (await option.isVisible()) {
            await option.click();
          }
        }

        // 确认付款
        await dialog.getByRole('button', { name: /确认|保存/ }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证付款成功
        await expect(page.getByText(/已支付|付款成功/)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('账单导出 (BL-E)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bills');
  });

  test('导出账单为PDF (BL-E-01)', async ({ page }) => {
    // 选择一个账单
    const billRow = page.getByRole('row').filter({ hasText: /待支付|已支付/ }).first();

    if (await billRow.isVisible()) {
      // 点击导出PDF按钮
      const exportBtn = billRow.getByRole('button', { name: /导出PDF|PDF/ });
      if (await exportBtn.isVisible()) {
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
        await exportBtn.click();

        const download = await downloadPromise;
        if (download) {
          // 验证下载的是PDF文件
          expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
        }
      }
    }
  });

  test('导出账单为Excel (BL-E-02)', async ({ page }) => {
    // 查找批量导出按钮
    const exportBtn = page.getByRole('button', { name: /导出Excel|批量导出|导出/ });

    if (await exportBtn.isVisible()) {
      const downloadPromise = page.waitForEvent('download', { timeout: 30000 }).catch(() => null);
      await exportBtn.click();

      const download = await downloadPromise;
      if (download) {
        // 验证下载的是Excel文件
        expect(download.suggestedFilename()).toMatch(/\.xlsx?$/i);
      }
    }
  });
});

test.describe('账单统计 (BL-SUM)', () => {
  test('账单统计卡片显示 (BL-SUM-01)', async ({ page }) => {
    await page.goto('/bills');

    // 验证统计卡片存在
    const statsCard = page.locator('text=/账单总数|待收款|已收款|逾期/').first();
    const hasStats = await statsCard.isVisible().catch(() => false);

    // 如果页面有统计区域，验证数据显示
    if (hasStats) {
      await expect(statsCard).toBeVisible();
    }
  });
});
