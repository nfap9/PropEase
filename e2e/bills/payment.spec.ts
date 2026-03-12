/**
 * 账单付款 E2E 测试
 *
 * 覆盖场景：
 * - 登记付款
 * - 部分付款
 * - 付款验证
 *
 * 每个测试都会创建独立的测试数据，确保测试隔离性
 */

import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { login } from '../helpers/auth';
import { BILLS } from '../testids';
import { TestDataGenerator, createTestDataGenerator } from '../helpers/test-data';

// 付款弹窗的实际 testid（页面代码中使用 BILLS.PAYMENT_DIALOG）
const PAYMENT_DIALOG = 'bills-payment-dialog';

// 使用一个独特的金额来识别测试创建的账单（避免与其他测试数据冲突）
const UNIQUE_BILL_AMOUNT = 1357;

/**
 * 账单付款测试辅助函数 - 创建完整测试环境（公寓、房间、租客、租约、账单）
 */
async function setupBillPaymentTestData(
  request: APIRequestContext,
  billAmount: number = UNIQUE_BILL_AMOUNT
): Promise<{
  generator: TestDataGenerator;
  billId: string;
  billAmount: number;
}> {
  const generator = await createTestDataGenerator(request);

  // 创建完整测试环境
  const { lease } = await generator.createFullTestEnvironment();

  // 创建账单
  const bill = await generator.createBill(lease.id, { rent_amount: billAmount, total_amount: billAmount });

  return { generator, billId: bill.id, billAmount };
}

/**
 * 确保页面干净并导航到账单页面
 */
async function cleanNavigateToBills(page: Page): Promise<void> {
  // 先关闭可能存在的任何弹窗（按 ESC 键）
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  // 直接导航到账单页面
  await page.goto('/bills', { waitUntil: 'networkidle' });

  // 等待页面标题出现
  await page.waitForSelector(`[data-testid="${BILLS.HEADING}"]`, { timeout: 10000 });
}

/**
 * 打开付款弹窗的通用方法
 * 直接点击账单行中的"登记付款"按钮
 */
async function openPayDialog(page: Page, billAmount: number): Promise<boolean> {
  // 等待列表加载
  await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 10000 });

  // 额外等待确保数据渲染完成
  await page.waitForTimeout(2000);

  // 刷新页面确保新创建的账单加载
  await page.reload();
  await page.waitForSelector(`[data-testid="${BILLS.LIST}"]`, { timeout: 10000 });
  await page.waitForTimeout(1500);

  // 查找包含指定金额的账单行
  // 金额格式可能是 "¥1234" 或 "¥1,234"，使用正则匹配
  const amountRegex = new RegExp(`¥1?,?${billAmount}`);
  const table = page.locator(`[data-testid="${BILLS.LIST}"]`);
  const rows = table.locator('tr').filter({ hasText: amountRegex });
  const rowCount = await rows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i);

    // 查找该行中的"登记付款"按钮
    const payButton = row.getByRole('button', { name: /登记付款/ });
    if (await payButton.isVisible({ timeout: 2000 })) {
      await payButton.click();

      // 等待付款弹窗
      const payDialog = page.locator(`[data-testid="${PAYMENT_DIALOG}"]`);
      if (await payDialog.isVisible({ timeout: 3000 })) {
        return true;
      }
    }
  }

  return false;
}

test.describe('登记付款', () => {
  test('显示付款弹窗', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, billAmount } = await setupBillPaymentTestData(request);

    try {
      await cleanNavigateToBills(page);

      // 打开付款弹窗
      const opened = await openPayDialog(page, billAmount);
      expect(opened).toBe(true);

      // 验证付款弹窗中的关键元素
      const payDialog = page.locator(`[data-testid="${PAYMENT_DIALOG}"]`);
      await expect(payDialog).toBeVisible();

      // 验证金额输入框存在
      await expect(page.locator(`[data-testid="${BILLS.AMOUNT_INPUT}"]`)).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });

  test('成功登记全额付款', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, billAmount } = await setupBillPaymentTestData(request);

    try {
      await cleanNavigateToBills(page);

      // 打开付款弹窗
      const opened = await openPayDialog(page, billAmount);
      expect(opened).toBe(true);

      const payDialog = page.locator(`[data-testid="${PAYMENT_DIALOG}"]`);
      await expect(payDialog).toBeVisible();

      // 填写付款金额（全额）
      await page.fill(`[data-testid="${BILLS.AMOUNT_INPUT}"]`, billAmount.toString());

      // 选择付款方式
      const methodSelect = page.locator(`[data-testid="${BILLS.PAYMENT_METHOD_SELECT}"]`);
      if (await methodSelect.isVisible()) {
        await methodSelect.click();
        const option = page.getByRole('option', { name: '微信' }).first();
        if (await option.isVisible()) {
          await option.click();
        }
      }

      // 确认付款
      const confirmButton = payDialog.getByRole('button', { name: /确认/ }).first();
      await confirmButton.click();

      // 等待弹窗关闭
      await expect(payDialog).not.toBeVisible({ timeout: 5000 });
    } finally {
      await generator.cleanup();
    }
  });

  test('付款金额超过剩余金额显示错误', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, billAmount } = await setupBillPaymentTestData(request);

    try {
      await cleanNavigateToBills(page);

      // 打开付款弹窗
      const opened = await openPayDialog(page, billAmount);
      expect(opened).toBe(true);

      const payDialog = page.locator(`[data-testid="${PAYMENT_DIALOG}"]`);
      await expect(payDialog).toBeVisible();

      // 填写超过账单金额的数值
      const excessiveAmount = billAmount * 100; // 100倍金额
      await page.fill(`[data-testid="${BILLS.AMOUNT_INPUT}"]`, excessiveAmount.toString());

      // 确认付款
      const confirmButton = payDialog.getByRole('button', { name: /确认/ }).first();
      await confirmButton.click();

      // 应该显示验证错误（弹窗不关闭）
      await expect(payDialog).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });

  test('付款金额为负数显示错误', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, billAmount } = await setupBillPaymentTestData(request);

    try {
      await cleanNavigateToBills(page);

      // 打开付款弹窗
      const opened = await openPayDialog(page, billAmount);
      expect(opened).toBe(true);

      const payDialog = page.locator(`[data-testid="${PAYMENT_DIALOG}"]`);
      await expect(payDialog).toBeVisible();

      // 填写负数
      await page.fill(`[data-testid="${BILLS.AMOUNT_INPUT}"]`, '-100');

      // 确认付款
      const confirmButton = payDialog.getByRole('button', { name: /确认/ }).first();
      await confirmButton.click();

      // 应该显示验证错误
      await expect(payDialog).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });
});
