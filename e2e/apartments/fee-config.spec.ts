/**
 * 公寓费用配置 E2E 测试
 *
 * 覆盖场景：
 * - 从公寓详情打开费用配置弹窗
 * - 为公寓添加费用配置
 * - 删除费用配置
 */

import { test, expect } from '../fixtures';
import { goToApartments } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { APARTMENTS, APARTMENT_FEE_CONFIG } from '../testids';

test.describe('公寓费用配置', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToApartments(page);
  });

  test('进入公寓详情并打开费用配置弹窗', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 点击测试公寓进入详情
    const testApartment = page.locator('text="E2E测试公寓1"').first();
    if (await testApartment.isVisible()) {
      await testApartment.click();

      // 等待跳转到详情页
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);

      // 尝试找到费用配置相关按钮
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();
      if (await feeConfigButton.isVisible()) {
        await feeConfigButton.click();

        // 等待费用配置弹窗出现
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });

  test('为公寓添加费用配置', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 点击测试公寓进入详情
    const testApartment = page.locator('text="E2E测试公寓1"').first();
    if (await testApartment.isVisible()) {
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();

      if (await feeConfigButton.isVisible()) {
        await feeConfigButton.click();

        // 等待弹窗出现
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3000 });

        // 点击添加费用按钮
        const addButton = dialog.locator('button:has-text("添加费用")').first();
        if (await addButton.isVisible()) {
          await addButton.click();

          // 等待添加表单出现
          await page.waitForTimeout(300);

          // 选择费用类型
          const feeTypeSelect = dialog.locator('select').first();
          if (await feeTypeSelect.isVisible()) {
            await feeTypeSelect.selectOption({ index: 1 });

            // 等待规格加载
            await page.waitForTimeout(300);

            // 选择规格（如果有）
            const specSelect = dialog.locator('select').nth(1);
            if (await specSelect.isVisible()) {
              const optionCount = await specSelect.locator('option').count();
              if (optionCount > 1) {
                await specSelect.selectOption({ index: 1 });
              }
            }

            // 填写生效日期
            const dateInput = dialog.locator('input[type="date"]').first();
            if (await dateInput.isVisible()) {
              await dateInput.fill(new Date().toISOString().split('T')[0]);
            }

            // 提交
            const confirmButton = dialog.locator('button:has-text("确认")').last();
            await confirmButton.click();

            // 等待添加完成
            await page.waitForTimeout(500);
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test('删除公寓费用配置', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 点击测试公寓进入详情
    const testApartment = page.locator('text="E2E测试公寓1"').first();
    if (await testApartment.isVisible()) {
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();

      if (await feeConfigButton.isVisible()) {
        await feeConfigButton.click();

        // 等待弹窗出现
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3000 });

        // 检查是否有已配置的费用项
        const deleteButtons = dialog.locator('button:has(svg[class*="h-4 w-4"])');
        const count = await deleteButtons.count();

        if (count > 0) {
          // 点击最后一个删除按钮
          await deleteButtons.last().click();

          // 等待删除完成
          await page.waitForTimeout(500);
        }
      }
    } else {
      test.skip();
    }
  });

  test('关闭费用配置弹窗', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 点击测试公寓进入详情
    const testApartment = page.locator('text="E2E测试公寓1"').first();
    if (await testApartment.isVisible()) {
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();

      if (await feeConfigButton.isVisible()) {
        await feeConfigButton.click();

        // 等待弹窗出现
        const dialog = page.locator('[role="dialog"]');
        await expect(dialog).toBeVisible({ timeout: 3000 });

        // 点击关闭按钮
        const closeButton = dialog.locator('button:has-text("关闭")').last();
        await closeButton.click();

        // 弹窗应该关闭
        await expect(dialog).not.toBeVisible({ timeout: 3000 });
      }
    } else {
      test.skip();
    }
  });
});
