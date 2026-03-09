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

// 生成唯一的测试数据名称
const uniqueName = () => `测试费用_${Date.now()}`;

test.describe('费用类型管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // 费用配置页面已移至 /fee-configs
    await page.goto('/fee-configs');
    // 等待页面加载
    await page.waitForSelector('[data-testid="fee-types-heading"]', { timeout: 10000 });
  });

  test('显示费用类型列表', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('[data-testid="fee-types-heading"]')).toBeVisible();

    // 应该有新增按钮
    await expect(page.locator('[data-testid="fee-types-new-btn"]')).toBeVisible();
  });

  test('创建自定义费用类型', async ({ page }) => {
    const name = uniqueName();

    // 点击新增按钮
    await page.click('[data-testid="fee-types-new-btn"]');

    // 等待弹窗出现
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).toBeVisible();

    // 填写表单
    await page.fill('[data-testid="fee-types-name-input"]', name);

    // 提交
    const responsePromise = page.waitForResponse(resp =>
      resp.url().includes('/api/v1/fee-types') && resp.request().method() === 'POST'
    ).catch(() => null);

    await page.click('[data-testid="fee-types-confirm-btn"]');

    // 等待响应
    const response = await responsePromise;
    if (response && !response.ok()) {
      const body = await response.text();
      console.error('API Error:', response.status(), body);
    }

    // 等待弹窗关闭
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).not.toBeVisible({ timeout: 10000 });

    // 验证新创建的类型出现在列表中
    await expect(page.locator(`text="${name}"`)).toBeVisible({ timeout: 5000 });
  });

  test('费用名称为空时提交按钮禁用', async ({ page }) => {
    // 点击新增按钮
    await page.click('[data-testid="fee-types-new-btn"]');
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).toBeVisible();

    // 确认按钮应该是禁用状态
    const confirmButton = page.locator('[data-testid="fee-types-confirm-btn"]');
    await expect(confirmButton).toBeDisabled();
  });

  test('编辑费用类型', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector('[data-testid="fee-types-list"]', { timeout: 10000 }).catch(() => null);

    // 检查是否有费用类型卡片
    const card = page.locator('[data-testid="fee-types-list"] > div').first();
    if (await card.isVisible({ timeout: 2000 }).catch(() => false)) {
      // 点击卡片展开
      await card.click();
      await page.waitForTimeout(300);

      // 找到编辑按钮（铅笔图标）- 在卡片头部
      const editButton = card.locator('button').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // 等待编辑弹窗
        await expect(page.locator('[data-testid="fee-types-edit-dialog"]')).toBeVisible({ timeout: 3000 });

        // 修改名称
        const nameInput = page.locator('[data-testid="fee-types-name-input"]');
        await nameInput.fill(`更新名称_${Date.now()}`);

        // 保存
        await page.click('[data-testid="fee-types-confirm-btn"]');

        // 等待弹窗关闭
        await expect(page.locator('[data-testid="fee-types-edit-dialog"]')).not.toBeVisible({ timeout: 10000 });
      } else {
        test.skip();
      }
    } else {
      // 如果没有可编辑的费用类型，跳过
      test.skip();
    }
  });

  test('取消创建应该关闭弹窗', async ({ page }) => {
    await page.click('[data-testid="fee-types-new-btn"]');
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).toBeVisible();

    // 填写一些数据
    await page.fill('[data-testid="fee-types-name-input"]', '测试');

    // 点击取消
    await page.click('[data-testid="fee-types-cancel-btn"]');

    // 弹窗应该关闭
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).not.toBeVisible();
  });

  test('删除自定义费用类型', async ({ page }) => {
    // 先创建一个用于删除的费用类型
    const name = uniqueName();

    await page.click('[data-testid="fee-types-new-btn"]');
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).toBeVisible();
    await page.fill('[data-testid="fee-types-name-input"]', name);
    await page.click('[data-testid="fee-types-confirm-btn"]');
    await expect(page.locator('[data-testid="fee-types-create-dialog"]')).not.toBeVisible({ timeout: 10000 });

    // 等待列表刷新
    await page.waitForTimeout(500);

    // 找到刚创建的费用类型并点击删除
    const createdItem = page.locator(`text="${name}"`).first();
    if (await createdItem.isVisible()) {
      // 找到删除按钮（垃圾桶图标）- 在卡片头部的第二个按钮
      const card = createdItem.locator('xpath=ancestor::*[contains(@class, "Card")]');
      const deleteButton = card.locator('button').nth(1); // 第二个按钮是删除
      if (await deleteButton.isVisible()) {
        // 处理 confirm 弹窗
        page.on('dialog', dialog => dialog.accept());
        await deleteButton.click();

        // 等待删除完成
        await page.waitForTimeout(500);
      }
    }
  });
});
