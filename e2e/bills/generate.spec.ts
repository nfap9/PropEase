/**
 * 账单生成 E2E 测试
 *
 * 覆盖场景：
 * - 批量生成账单
 * - 手动创建账单
 */

import { test, expect } from '../fixtures';
import { goToBills } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { BILLS } from '../testids';

test.describe('生成账单', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToBills(page);
  });

  test('显示生成账单弹窗', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${BILLS.HEADING}"]`);

    // 点击生成账单按钮
    const generateButton = page.locator('button:has-text("生成账单"), button:has-text("手动出账")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();

      // 等待弹窗出现
      await expect(page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
    } else {
      test.skip();
    }
  });

  test('批量生成月度账单', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${BILLS.HEADING}"]`);

    // 点击生成账单按钮
    const generateButton = page.locator('button:has-text("生成账单"), button:has-text("手动出账")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

      // 填写账单月份
      const yearInput = page.locator('[data-testid="bills-year-input"]');
      const monthInput = page.locator('[data-testid="bills-month-input"]');

      if (await yearInput.isVisible()) {
        await yearInput.fill(new Date().getFullYear().toString());
      }
      if (await monthInput.isVisible()) {
        await monthInput.fill((new Date().getMonth() + 1).toString());
      }

      // 提交生成（按钮文本是"生成账单"）
      const confirmButton = page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"] button[type="submit"]`).first();
      await confirmButton.click();

      // 等待弹窗关闭
      await expect(page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"]`)).not.toBeVisible({ timeout: 15000 });
    } else {
      test.skip();
    }
  });

  test('无活跃租约时生成账单', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${BILLS.HEADING}"]`);

    // 点击生成账单按钮
    const generateButton = page.locator('button:has-text("生成账单"), button:has-text("手动出账")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await expect(page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

      // 选择一个未来月份（可能没有租约）
      const monthInput = page.locator('[data-testid="bills-month-input"]');
      if (await monthInput.isVisible()) {
        await monthInput.fill('12');
      }

      // 提交生成（按钮文本是"生成账单"）
      const confirmButton = page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"] button[type="submit"]`).first();
      await confirmButton.click();

      // 等待响应
      await page.waitForTimeout(2000);
    } else {
      test.skip();
    }
  });
});
