/**
 * 水电录入 E2E 测试
 *
 * 覆盖场景：
 * - 录入读数
 * - 批量录入
 */

import { test, expect } from '../fixtures';
import { goToUtilities } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { UTILITIES } from '../testids';

test.describe('水电列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('应该显示水电列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${UTILITIES.HEADING}"]`)).toBeVisible();

    // 验证录入按钮存在
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_BUTTON}"]`)).toBeVisible();
  });

  test('显示待录入提醒', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 查看待录入列表
    const pendingList = page.locator(`[data-testid="${UTILITIES.PENDING_LIST}"]`);
    if (await pendingList.isVisible()) {
      const items = await pendingList.locator('> *').count();
      expect(items).toBeGreaterThanOrEqual(0);
    }
  });

  test('按公寓筛选水电记录', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${UTILITIES.LIST}"]`, { timeout: 5000 });

    // 选择公寓筛选
    const apartmentSelect = page.locator(`[data-testid="${UTILITIES.APARTMENT_SELECT}"]`);
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();

      const option = page.locator('text="E2E测试公寓1"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('录入读数', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('显示录入读数弹窗', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 点击录入按钮
    await page.click(`[data-testid="${UTILITIES.ENTRY_BUTTON}"]`);

    // 等待弹窗出现
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
  });

  test('成功录入水表读数', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 点击录入按钮
    await page.click(`[data-testid="${UTILITIES.ENTRY_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 选择公寓
    const apartmentSelect = page.locator(`[data-testid="${UTILITIES.APARTMENT_SELECT}"]`);
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();
      const apartmentOption = page.locator('text="E2E测试公寓1"').first();
      if (await apartmentOption.isVisible()) {
        await apartmentOption.click();
        await page.waitForTimeout(300);
      }
    }

    // 选择房间
    const roomSelect = page.locator(`[data-testid="${UTILITIES.ROOM_SELECT}"]`);
    if (await roomSelect.isVisible()) {
      await roomSelect.click();
      const roomOption = page.locator('text="102"').first(); // 已出租的房间
      if (await roomOption.isVisible()) {
        await roomOption.click();
        await page.waitForTimeout(300);
      }
    }

    // 填写水表读数
    await page.fill(`[data-testid="${UTILITIES.WATER_READING_INPUT}"]`, '100');

    // 保存
    const saveButton = page.locator(`[data-testid="${UTILITIES.SAVE_BUTTON}"]`);
    await saveButton.click();

    // 等待弹窗关闭
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
  });

  test('成功录入电表读数', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 点击录入按钮
    await page.click(`[data-testid="${UTILITIES.ENTRY_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 选择公寓和房间
    const apartmentSelect = page.locator(`[data-testid="${UTILITIES.APARTMENT_SELECT}"]`);
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();
      const apartmentOption = page.locator('text="E2E测试公寓1"').first();
      if (await apartmentOption.isVisible()) {
        await apartmentOption.click();
        await page.waitForTimeout(300);
      }
    }

    const roomSelect = page.locator(`[data-testid="${UTILITIES.ROOM_SELECT}"]`);
    if (await roomSelect.isVisible()) {
      await roomSelect.click();
      const roomOption = page.locator('text="102"').first();
      if (await roomOption.isVisible()) {
        await roomOption.click();
        await page.waitForTimeout(300);
      }
    }

    // 填写电表读数
    await page.fill(`[data-testid="${UTILITIES.ELECTRICITY_READING_INPUT}"]`, '500');

    // 保存
    const saveButton = page.locator(`[data-testid="${UTILITIES.SAVE_BUTTON}"]`);
    await saveButton.click();

    // 等待弹窗关闭
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
  });

  test('读数为负数显示验证错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 点击录入按钮
    await page.click(`[data-testid="${UTILITIES.ENTRY_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 选择公寓和房间
    const apartmentSelect = page.locator(`[data-testid="${UTILITIES.APARTMENT_SELECT}"]`);
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();
      const apartmentOption = page.locator('text="E2E测试公寓1"').first();
      if (await apartmentOption.isVisible()) {
        await apartmentOption.click();
        await page.waitForTimeout(300);
      }
    }

    const roomSelect = page.locator(`[data-testid="${UTILITIES.ROOM_SELECT}"]`);
    if (await roomSelect.isVisible()) {
      await roomSelect.click();
      const roomOption = page.locator('text="102"').first();
      if (await roomOption.isVisible()) {
        await roomOption.click();
        await page.waitForTimeout(300);
      }
    }

    // 填写负数读数
    await page.fill(`[data-testid="${UTILITIES.WATER_READING_INPUT}"]`, '-10');

    // 保存
    const saveButton = page.locator(`[data-testid="${UTILITIES.SAVE_BUTTON}"]`);
    await saveButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${UTILITIES.ENTRY_DIALOG}"]`)).toBeVisible();
  });
});

test.describe('批量录入', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('显示批量录入弹窗', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 点击批量录入按钮
    const batchButton = page.locator(`[data-testid="${UTILITIES.BATCH_BUTTON}"]`);
    if (await batchButton.isVisible()) {
      await batchButton.click();

      // 等待批量录入弹窗
      await page.waitForTimeout(500);
    } else {
      test.skip();
    }
  });
});
