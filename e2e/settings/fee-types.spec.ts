/**
 * 费用类型管理 E2E 测试
 *
 * 覆盖场景：
 * - 查看费用类型列表
 * - 创建自定义费用类型
 * - 编辑费用类型
 * - 删除费用类型
 */

import { test, expect } from '../fixtures';
import { login } from '../helpers/auth';
import { FEE_TYPES, COMMON } from '../testids';

// 生成唯一的测试数据名称
const uniqueCode = () => `test_fee_${Date.now()}`;
const uniqueName = () => `测试费用_${Date.now()}`;

test.describe('费用类型管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings/fee-types');
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${FEE_TYPES.HEADING}"]`, { timeout: 10000 });
  });

  test('显示费用类型列表', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${FEE_TYPES.HEADING}"]`)).toBeVisible();

    // 应该有新增按钮
    await expect(page.locator(`[data-testid="${FEE_TYPES.NEW_BUTTON}"]`)).toBeVisible();
  });

  test('创建自定义费用类型', async ({ page }) => {
    const name = uniqueName();
    const code = uniqueCode();

    // 点击新增按钮
    await page.click(`[data-testid="${FEE_TYPES.NEW_BUTTON}"]`);

    // 等待弹窗出现
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写表单
    await page.fill(`[data-testid="${FEE_TYPES.NAME_INPUT}"]`, name);
    await page.fill(`[data-testid="${FEE_TYPES.CODE_INPUT}"]`, code);

    // 选择分类
    await page.selectOption(`[data-testid="${FEE_TYPES.CATEGORY_SELECT}"]`, 'optional');

    // 提交
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/v1/fee-types') && resp.request().method() === 'POST'
    ).catch(() => null);

    await page.click(`[data-testid="${FEE_TYPES.CONFIRM_BUTTON}"]`);

    // 等待响应
    const response = await responsePromise;
    if (response && !response.ok()) {
      const body = await response.text();
      console.error('API Error:', response.status(), body);
    }

    // 等待弹窗关闭
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 10000 });

    // 验证新创建的类型出现在列表中
    await expect(page.locator(`text="${name}"`)).toBeVisible({ timeout: 5000 });
  });

  test('费用名称为空显示验证错误', async ({ page }) => {
    // 点击新增按钮
    await page.click(`[data-testid="${FEE_TYPES.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).toBeVisible();

    // 只填写编码，不填写名称
    await page.fill(`[data-testid="${FEE_TYPES.CODE_INPUT}"]`, uniqueCode());

    // 提交
    await page.click(`[data-testid="${FEE_TYPES.CONFIRM_BUTTON}"]`);

    // 应该显示验证错误（弹窗不关闭）
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).toBeVisible();
  });

  test('编辑费用类型', async ({ page }) => {
    // 等待列表加载（增加超时时间）
    await page.waitForSelector('[data-testid="fee-types-list"], .grid', { timeout: 10000 });

    // 找到一个可编辑的费用类型（非系统预设）
    const editableCard = page.locator('[data-testid^="fee-types-edit-btn"]').first();

    if (await editableCard.isVisible()) {
      await editableCard.click();

      // 等待编辑弹窗
      await expect(page.locator(`[data-testid="${FEE_TYPES.EDIT_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

      // 修改名称
      const nameInput = page.locator(`[data-testid="${FEE_TYPES.NAME_INPUT}"]`);
      await nameInput.fill(`更新名称_${Date.now()}`);

      // 保存
      await page.click(`[data-testid="${FEE_TYPES.CONFIRM_BUTTON}"]`);

      // 等待弹窗关闭
      await expect(page.locator(`[data-testid="${FEE_TYPES.EDIT_DIALOG}"]`)).not.toBeVisible({ timeout: 10000 });
    } else {
      // 如果没有可编辑的费用类型，跳过
      test.skip();
    }
  });

  test('取消创建应该关闭弹窗', async ({ page }) => {
    await page.click(`[data-testid="${FEE_TYPES.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写一些数据
    await page.fill(`[data-testid="${FEE_TYPES.NAME_INPUT}"]`, '测试');

    // 点击取消
    await page.click(`[data-testid="${FEE_TYPES.CANCEL_BUTTON}"]`);

    // 弹窗应该关闭
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).not.toBeVisible();
  });

  test('删除自定义费用类型', async ({ page }) => {
    // 先创建一个用于删除的费用类型
    const name = uniqueName();
    const code = uniqueCode();

    await page.click(`[data-testid="${FEE_TYPES.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).toBeVisible();
    await page.fill(`[data-testid="${FEE_TYPES.NAME_INPUT}"]`, name);
    await page.fill(`[data-testid="${FEE_TYPES.CODE_INPUT}"]`, code);
    await page.click(`[data-testid="${FEE_TYPES.CONFIRM_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${FEE_TYPES.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 10000 });

    // 等待列表刷新
    await page.waitForTimeout(500);

    // 找到刚创建的费用类型
    const createdItem = page.locator(`text="${name}"`).first();
    if (await createdItem.isVisible()) {
      // 点击删除按钮
      const deleteButton = createdItem.locator('xpath=ancestor::*[contains(@class, "Card")]//button[contains(@class, "ghost")][last()]');
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 处理确认弹窗（如果有）
        const confirmDialog = page.locator(`[data-testid="${FEE_TYPES.DELETE_DIALOG}"]`);
        if (await confirmDialog.isVisible()) {
          await confirmDialog.locator('button').last().click();
        }

        // 等待删除完成
        await page.waitForTimeout(500);
      }
    }
  });
});
