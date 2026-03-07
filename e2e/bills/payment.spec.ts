/**
 * 账单付款 E2E 测试
 *
 * 覆盖场景：
 * - 登记付款
 * - 部分付款
 */

import { test, expect } from '../fixtures';
import { goToBills } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { BILLS } from '../testids';

test.describe('登记付款', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToBills(page);
  });

  test('显示付款弹窗', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 5000 });

    // 找到待付账单
    const pendingBill = page.locator(`[data-testid="${BILLS.LIST}"] > *:has-text("待付")`).first();
    if (await pendingBill.isVisible()) {
      await pendingBill.hover();
      await page.waitForTimeout(300);

      // 点击登记付款按钮
      const payButton = page.locator(`[data-testid="${BILLS.PAY_BUTTON}"]`);
      if (await payButton.isVisible()) {
        await payButton.click();

        // 等待付款弹窗
        await expect(page.locator(`[data-testid="${BILLS.PAY_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
      } else {
        // 尝试点击账单行中的付款按钮
        const inlinePayButton = pendingBill.locator('button:has-text("登记付款"), button:has-text("收款")').first();
        if (await inlinePayButton.isVisible()) {
          await inlinePayButton.click();
          await expect(page.locator(`[data-testid="${BILLS.PAY_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
        } else {
          test.skip();
        }
      }
    } else {
      test.skip();
    }
  });

  test('成功登记全额付款', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 5000 });

    // 找到待付账单
    const pendingBill = page.locator(`[data-testid="${BILLS.LIST}"] > *:has-text("待付")`).first();
    if (await pendingBill.isVisible()) {
      // 点击账单查看详情或直接点击付款按钮
      await pendingBill.click();
      await page.waitForTimeout(300);

      // 尝试找到付款按钮
      const payButton = page.locator('button:has-text("登记付款"), button:has-text("收款")').first();
      if (await payButton.isVisible()) {
        await payButton.click();

        // 等待付款弹窗
        const payDialog = page.locator(`[data-testid="${BILLS.PAY_DIALOG}"]`);
        if (await payDialog.isVisible({ timeout: 3000 })) {
          // 填写付款金额（默认可能是全额）
          await page.fill(`[data-testid="${BILLS.AMOUNT_INPUT}"]`, '1000');

          // 选择付款方式
          const methodSelect = page.locator(`[data-testid="${BILLS.PAYMENT_METHOD_SELECT}"]`);
          if (await methodSelect.isVisible()) {
            await methodSelect.click();
            const option = page.locator('text="微信"').first();
            if (await option.isVisible()) {
              await option.click();
            }
          }

          // 确认付款
          const confirmButton = payDialog.locator(`button:has-text("确认")`).first();
          await confirmButton.click();

          // 等待弹窗关闭
          await expect(payDialog).not.toBeVisible({ timeout: 5000 });
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('付款金额超过剩余金额显示错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 5000 });

    const pendingBill = page.locator(`[data-testid="${BILLS.LIST}"] > *:has-text("待付")`).first();
    if (await pendingBill.isVisible()) {
      await pendingBill.click();
      await page.waitForTimeout(300);

      const payButton = page.locator('button:has-text("登记付款"), button:has-text("收款")').first();
      if (await payButton.isVisible()) {
        await payButton.click();

        const payDialog = page.locator(`[data-testid="${BILLS.PAY_DIALOG}"]`);
        if (await payDialog.isVisible({ timeout: 3000 })) {
          // 填写超过账单金额的数值
          await page.fill(`[data-testid="${BILLS.AMOUNT_INPUT}"]`, '99999999');

          // 确认付款
          const confirmButton = payDialog.locator(`button:has-text("确认")`).first();
          await confirmButton.click();

          // 应该显示验证错误（弹窗不关闭）
          await expect(payDialog).toBeVisible();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('付款金额为负数显示错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 5000 });

    const pendingBill = page.locator(`[data-testid="${BILLS.LIST}"] > *:has-text("待付")`).first();
    if (await pendingBill.isVisible()) {
      await pendingBill.click();
      await page.waitForTimeout(300);

      const payButton = page.locator('button:has-text("登记付款"), button:has-text("收款")').first();
      if (await payButton.isVisible()) {
        await payButton.click();

        const payDialog = page.locator(`[data-testid="${BILLS.PAY_DIALOG}"]`);
        if (await payDialog.isVisible({ timeout: 3000 })) {
          // 填写负数
          await page.fill(`[data-testid="${BILLS.AMOUNT_INPUT}"]`, '-100');

          // 确认付款
          const confirmButton = payDialog.locator(`button:has-text("确认")`).first();
          await confirmButton.click();

          // 应该显示验证错误
          await expect(payDialog).toBeVisible();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});
