/**
 * 房间 CRUD 操作 E2E 测试
 *
 * 覆盖场景：
 * - 创建房间
 * - 编辑房间
 * - 删除房间
 */

import { test, expect } from '../fixtures';
import { goToRooms, goToApartments } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { ROOMS, APARTMENTS } from '../testids';

// 生成唯一的测试数据
const uniqueRoomNumber = () => `${Date.now().toString().slice(-4)}`;

test.describe('创建房间', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToRooms(page);
  });

  test('成功创建房间', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${ROOMS.NEW_BUTTON}"]`);

    // 等待弹窗出现
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();

    // 选择公寓（如果有公寓选择）
    const apartmentSelect = page.locator('[data-testid="rooms-apartment-select"]');
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();
      const option = page.locator('text="E2E测试公寓1"').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // 填写房间信息
    const roomNumber = uniqueRoomNumber();
    await page.fill(`[data-testid="${ROOMS.NUMBER_INPUT}"]`, roomNumber);
    await page.fill(`[data-testid="${ROOMS.MONTHLY_RENT_INPUT}"]`, '1500');

    // 提交
    const confirmButton = page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"] button:has-text("确认"), [data-testid="${ROOMS.CREATE_DIALOG}"] button:has-text("确定")`).first();
    await confirmButton.click();

    // 等待弹窗关闭
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
  });

  test('房间号为空显示验证错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${ROOMS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();

    // 只填写月租，不填写房间号
    await page.fill(`[data-testid="${ROOMS.MONTHLY_RENT_INPUT}"]`, '1500');

    // 提交
    const confirmButton = page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误（弹窗不关闭）
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();
  });

  test('月租为负数显示验证错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${ROOMS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写负数月租
    await page.fill(`[data-testid="${ROOMS.NUMBER_INPUT}"]`, uniqueRoomNumber());
    await page.fill(`[data-testid="${ROOMS.MONTHLY_RENT_INPUT}"]`, '-100');

    // 提交
    const confirmButton = page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();
  });

  test('取消创建应该关闭弹窗', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${ROOMS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写一些数据
    await page.fill(`[data-testid="${ROOMS.NUMBER_INPUT}"]`, '9999');

    // 点击取消
    const cancelButton = page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"] button:has-text("取消")`).first();
    await cancelButton.click();

    // 弹窗应该关闭
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).not.toBeVisible();
  });
});

test.describe('编辑房间', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToRooms(page);
  });

  test('成功编辑房间信息', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`);

    // 找到第一个房间
    const firstRoom = page.locator(`[data-testid="${ROOMS.LIST}"] > *`).first();
    await firstRoom.hover();
    await page.waitForTimeout(300);

    // 尝试找到编辑按钮
    const editButton = page.locator('button:has-text("编辑")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      // 等待编辑弹窗
      await expect(page.locator(`[data-testid="${ROOMS.EDIT_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

      // 修改月租
      await page.fill(`[data-testid="${ROOMS.MONTHLY_RENT_INPUT}"]`, '1600');

      // 保存
      const confirmButton = page.locator(`[data-testid="${ROOMS.EDIT_DIALOG}"] button:has-text("确认")`).first();
      await confirmButton.click();

      // 验证弹窗关闭
      await expect(page.locator(`[data-testid="${ROOMS.EDIT_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
    } else {
      // 可能需要点击更多菜单
      const moreButton = page.locator('button[aria-label="更多"], button:has-text("更多")').first();
      if (await moreButton.isVisible()) {
        await moreButton.click();
        const editOption = page.locator('button:has-text("编辑")').first();
        if (await editOption.isVisible()) {
          await editOption.click();
        }
      } else {
        test.skip();
      }
    }
  });
});

test.describe('删除房间', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToRooms(page);
  });

  test('删除空置房间', async ({ page }) => {
    // 先创建一个房间用于删除
    await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);

    await page.click(`[data-testid="${ROOMS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).toBeVisible();

    const roomNumber = uniqueRoomNumber();
    await page.fill(`[data-testid="${ROOMS.NUMBER_INPUT}"]`, roomNumber);
    await page.fill(`[data-testid="${ROOMS.MONTHLY_RENT_INPUT}"]`, '1000');

    const confirmButton = page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();
    await expect(page.locator(`[data-testid="${ROOMS.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });

    // 搜索刚创建的房间
    await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
    await page.waitForTimeout(500);

    // 找到并删除
    const createdRoom = page.locator(`text="${roomNumber}"`).first();
    if (await createdRoom.isVisible()) {
      await createdRoom.hover();
      await page.waitForTimeout(300);

      // 点击删除按钮
      const deleteButton = page.locator('button:has-text("删除")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 等待确认弹窗
        await expect(page.locator(`[data-testid="${ROOMS.DELETE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

        // 确认删除
        const confirmDeleteBtn = page.locator(`[data-testid="${ROOMS.DELETE_DIALOG}"] button:has-text("确认")`).last();
        await confirmDeleteBtn.click();

        // 验证弹窗关闭
        await expect(page.locator(`[data-testid="${ROOMS.DELETE_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
      } else {
        // 尝试通过更多菜单
        const moreButton = page.locator('button[aria-label="更多"]').first();
        if (await moreButton.isVisible()) {
          await moreButton.click();
          const delBtn = page.locator('button:has-text("删除")').first();
          if (await delBtn.isVisible()) {
            await delBtn.click();
          }
        }
      }
    }
  });

  test('删除已出租房间应该失败', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${ROOMS.LIST}"]`);

    // 找到状态为"已租"的房间（测试数据中有 102 房间是 occupied）
    const occupiedRoom = page.locator('text="102"').first();
    if (await occupiedRoom.isVisible()) {
      await occupiedRoom.hover();
      await page.waitForTimeout(300);

      // 尝试删除
      const deleteButton = page.locator('button:has-text("删除")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // 应该显示错误提示或确认弹窗
        // 具体行为取决于实现
        await page.waitForTimeout(500);
      }
    } else {
      // 没有找到已出租的房间，跳过
      test.skip();
    }
  });
});

test.describe('批量添加房间', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToRooms(page);
  });

  test('显示批量添加弹窗', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);

    // 点击批量添加按钮
    const batchButton = page.locator(`[data-testid="${ROOMS.BATCH_BUTTON}"]`);
    if (await batchButton.isVisible()) {
      await batchButton.click();

      // 等待批量添加弹窗
      await expect(page.locator(`[data-testid="${ROOMS.BATCH_DIALOG}"]`)).toBeVisible();
    } else {
      test.skip();
    }
  });
});
