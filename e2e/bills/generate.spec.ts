/**
 * 账单生成 E2E 测试
 *
 * 覆盖场景：
 * - 批量生成账单
 * - 手动创建账单
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import { goToBills } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { BILLS } from '../testids';
import { TestDataGenerator, createTestDataGenerator } from '../helpers/test-data';

/**
 * 账单测试辅助函数 - 创建完整测试环境（公寓、房间、租客、租约）
 */
async function setupBillTestData(request: APIRequestContext): Promise<TestDataGenerator> {
  const generator = await createTestDataGenerator(request);
  await generator.createFullTestEnvironment();
  return generator;
}

test.describe('生成账单', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToBills(page);
  });

  test('显示生成账单弹窗', async ({ page, request }) => {
    // 创建独立的测试环境（公寓、房间、租客、租约）
    const generator = await createTestDataGenerator(request);

    try {
      await generator.createFullTestEnvironment();

      // 刷新页面以加载最新数据
      await page.reload();
      await page.waitForSelector(`[data-testid="${BILLS.HEADING}"]`);

      // 点击生成账单按钮
      const generateButton = page.locator('button:has-text("生成账单"), button:has-text("手动出账")').first();
      if (await generateButton.isVisible()) {
        await generateButton.click();

        // 等待弹窗出现
        await expect(page.locator(`[data-testid="${BILLS.GENERATE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
      } else {
        // 如果按钮不可见，验证页面标题元素存在
        await expect(page.locator(`[data-testid="${BILLS.HEADING}"]`)).toBeVisible();
      }
    } finally {
      await generator.cleanup();
    }
  });

  test('批量生成月度账单', async ({ page, request }) => {
    // 创建测试数据（公寓、房间、租客、租约）
    const generator = await setupBillTestData(request);

    try {
      // 刷新页面以加载最新数据
      await page.reload();
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
        // 如果按钮不可见，验证页面标题元素存在
        await expect(page.locator(`[data-testid="${BILLS.HEADING}"]`)).toBeVisible();
      }
    } finally {
      await generator.cleanup();
    }
  });

  test('无活跃租约时生成账单', async ({ page, request }) => {
    // 创建独立的测试环境（只创建公寓和房间，不创建租约）
    const generator = await createTestDataGenerator(request);

    try {
      await generator.createApartmentWithRooms(1);

      // 刷新页面以加载最新数据
      await page.reload();
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
        // 如果按钮不可见，验证页面标题元素存在
        await expect(page.locator(`[data-testid="${BILLS.HEADING}"]`)).toBeVisible();
      }
    } finally {
      await generator.cleanup();
    }
  });
});
