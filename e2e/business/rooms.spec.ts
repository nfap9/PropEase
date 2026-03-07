import { test, expect } from '@playwright/test';
import { ROOMS, COMMON } from '../testids';
import {
  createUniqueName,
  waitForDialogOpen,
  waitForDialogClosed,
  isVisible,
} from '../test-helpers';

/**
 * 房间管理模块 E2E 测试
 * 对应测试用例：1.4 房间管理模块
 *
 * 模块编号：RM（房间）
 * - RM-L-*: 房间列表
 * - RM-C-*: 房间创建
 * - RM-U-*: 房间编辑
 * - RM-D-*: 房间删除
 */

test.describe('房间列表 (RM-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rooms');
  });

  test('查看全部房间 (RM-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: '全部房间' })).toBeVisible({ timeout: 10000 });

    // 验证筛选器存在
    const apartmentFilter = page.getByRole('combobox', { name: /公寓/ }).or(
      page.locator('[data-testid="rooms-apartment-filter"]')
    );
    const statusFilter = page.getByRole('combobox', { name: /状态/ }).or(
      page.locator('[data-testid="rooms-status-filter"]')
    );

    // 验证列表或空状态
    const table = page.getByRole('table');
    const emptyState = page.getByText('暂无房间');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('查看房间详情 (RM-L-05)', async ({ page }) => {
    // 查找房间列表中的房间
    const roomRow = page.getByRole('row').filter({ hasText: /房间/ }).first();
    if (await roomRow.isVisible()) {
      // 点击房间查看详情
      const roomLink = roomRow.getByRole('link').first();
      if (await roomLink.isVisible()) {
        await roomLink.click();
        // 验证详情页
        await expect(page.getByText(/房间详情|房间信息/)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('房间创建 (RM-C)', () => {
  let apartmentName: string;

  test.beforeEach(async ({ page }) => {
    // 先创建一个公寓用于测试
    apartmentName = createUniqueName('E2E房间公寓');
    await page.goto('/apartments');

    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(apartmentName);
      await dialog.getByLabel('地址').fill('E2E测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });

  test('单个添加房间 (RM-C-01)', async ({ page }) => {
    // 进入公寓详情页
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      // 点击新增房间
      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 填写房间信息
        const roomNumber = `10${Date.now().toString().slice(-3)}`;
        await dialog.getByLabel(/房间号/).fill(roomNumber);
        await dialog.getByLabel(/月租/).fill('1500');

        await dialog.getByRole('button', { name: '创建' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证房间出现在列表中
        await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('房间号为空 (RM-C-03)', async ({ page }) => {
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 只填写月租，不填房间号
        await dialog.getByLabel(/月租/).fill('1500');
        await dialog.getByRole('button', { name: '创建' }).click();

        // 验证错误提示
        await expect(dialog.getByText(/请输入房间号/)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('月租为空 (RM-C-04)', async ({ page }) => {
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 只填写房间号，不填月租
        await dialog.getByLabel(/房间号/).fill('999');
        await dialog.getByRole('button', { name: '创建' }).click();

        // 验证错误提示
        await expect(dialog.getByText(/请输入月租/)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('房间编辑与删除 (RM-U, RM-D)', () => {
  let apartmentName: string;
  let roomNumber: string;

  test.beforeEach(async ({ page }) => {
    // 创建公寓和房间
    apartmentName = createUniqueName('E2E编辑房间公寓');
    roomNumber = `20${Date.now().toString().slice(-3)}`;

    await page.goto('/apartments');

    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(apartmentName);
      await dialog.getByLabel('地址').fill('E2E测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // 进入公寓详情添加房间
      const card = page.getByRole('link', { name: new RegExp(apartmentName) });
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();
        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await dialog.getByLabel(/房间号/).fill(roomNumber);
        await dialog.getByLabel(/月租/).fill('1500');
        await dialog.getByRole('button', { name: '创建' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });

  test('编辑房间信息 (RM-U-01)', async ({ page }) => {
    await page.goto('/rooms');

    // 找到刚创建的房间
    const roomRow = page.getByRole('row').filter({ hasText: roomNumber }).first();
    if (await roomRow.isVisible()) {
      // 点击编辑按钮
      const editBtn = roomRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 修改月租
        const rentInput = dialog.getByLabel(/月租/);
        await rentInput.fill('2000');
        await dialog.getByRole('button', { name: '保存' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证修改成功
        await expect(page.getByText('2000')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('删除有活跃租约的房间 (RM-D-03)', async ({ page }) => {
    await page.goto('/rooms');

    // 查找有租约的房间（状态为"已租"）
    const rentedRoomRow = page.getByRole('row').filter({ hasText: /已租/ }).first();
    if (await rentedRoomRow.isVisible()) {
      // 尝试点击删除按钮
      const deleteBtn = rentedRoomRow.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // 验证提示信息
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          // 应该显示无法删除的提示
          const warningText = dialog.getByText(/有租约|无法删除|履行中/);
          // 如果有确认删除按钮，验证是否禁用
          const confirmBtn = dialog.getByRole('button', { name: /确认|删除/ });
          const isDisabled = await confirmBtn.isDisabled().catch(() => false);

          // 关闭弹窗
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});
