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
import { APARTMENTS } from '../testids';
import { createTestDataGenerator } from '../helpers/test-data';

test.describe('公寓费用配置', () => {
  test('进入公寓详情并打开费用配置弹窗', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const generator = await createTestDataGenerator(request);
    const apartment = await generator.createApartmentWithRooms(1);

    try {
      await goToApartments(page);

      // 等待列表加载
      await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

      // 搜索刚创建的公寓
      const searchInput = page.locator(`input[placeholder*="搜索"], input[placeholder*="公寓"]`).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(apartment.name);
        await page.waitForTimeout(500);
      }

      // 点击测试公寓进入详情
      const testApartment = page.locator(`text="${apartment.name}"`).first();
      await testApartment.click();

      // 等待跳转到详情页
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 等待页面加载
      await page.waitForTimeout(500);

      // 尝试找到费用配置相关按钮
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();
      await feeConfigButton.waitFor({ state: 'visible', timeout: 5000 });
      await feeConfigButton.click();

      // 等待费用配置弹窗出现
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
    } finally {
      await generator.cleanup();
    }
  });

  test('为公寓添加费用配置', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const generator = await createTestDataGenerator(request);
    const apartment = await generator.createApartmentWithRooms(1);

    try {
      await goToApartments(page);

      // 等待列表加载
      await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

      // 搜索刚创建的公寓
      const searchInput = page.locator(`input[placeholder*="搜索"], input[placeholder*="公寓"]`).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(apartment.name);
        await page.waitForTimeout(500);
      }

      // 点击测试公寓进入详情
      const testApartment = page.locator(`text="${apartment.name}"`).first();
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();
      await feeConfigButton.waitFor({ state: 'visible', timeout: 5000 });
      await feeConfigButton.click();

      // 等待弹窗出现
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // 点击添加费用按钮
      const addButton = dialog.locator('button:has-text("添加费用")').first();
      await addButton.waitFor({ state: 'visible', timeout: 3000 });
      await addButton.click();

      // 等待添加表单出现
      await page.waitForTimeout(300);

      // 选择费用类型
      const feeTypeSelect = dialog.locator('select').first();
      await feeTypeSelect.waitFor({ state: 'visible', timeout: 3000 });
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

      // 提交
      const confirmButton = dialog.locator('button:has-text("确认")').last();
      await confirmButton.click();

      // 等待添加完成
      await page.waitForTimeout(500);
    } finally {
      await generator.cleanup();
    }
  });

  test('删除公寓费用配置', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const generator = await createTestDataGenerator(request);
    const apartment = await generator.createApartmentWithRooms(1);

    try {
      await goToApartments(page);

      // 等待列表加载
      await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

      // 搜索刚创建的公寓
      const searchInput = page.locator(`input[placeholder*="搜索"], input[placeholder*="公寓"]`).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(apartment.name);
        await page.waitForTimeout(500);
      }

      // 点击测试公寓进入详情
      const testApartment = page.locator(`text="${apartment.name}"`).first();
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();
      await feeConfigButton.waitFor({ state: 'visible', timeout: 5000 });
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
    } finally {
      await generator.cleanup();
    }
  });

  test('关闭费用配置弹窗', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const generator = await createTestDataGenerator(request);
    const apartment = await generator.createApartmentWithRooms(1);

    try {
      await goToApartments(page);

      // 等待列表加载
      await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

      // 搜索刚创建的公寓
      const searchInput = page.locator(`input[placeholder*="搜索"], input[placeholder*="公寓"]`).first();
      if (await searchInput.isVisible()) {
        await searchInput.fill(apartment.name);
        await page.waitForTimeout(500);
      }

      // 点击测试公寓进入详情
      const testApartment = page.locator(`text="${apartment.name}"`).first();
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找费用配置按钮
      await page.waitForTimeout(500);
      const feeConfigButton = page.locator('button:has-text("费用配置"), button:has-text("费用")').first();
      await feeConfigButton.waitFor({ state: 'visible', timeout: 5000 });
      await feeConfigButton.click();

      // 等待弹窗出现
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      // 点击关闭按钮
      const closeButton = dialog.locator('button:has-text("关闭")').last();
      await closeButton.click();

      // 弹窗应该关闭
      await expect(dialog).not.toBeVisible({ timeout: 3000 });
    } finally {
      await generator.cleanup();
    }
  });
});
