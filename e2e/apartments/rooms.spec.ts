/**
 * 公寓详情页房间管理 E2E 测试
 *
 * 覆盖场景：
 * - 新增房间
 * - 批量添加房间
 * - 编辑房间
 * - 删除房间
 */

import { test, expect } from '@playwright/test';
import { login, AUTH_STORAGE_KEYS } from '../helpers/auth';
import { createTestDataGenerator, TestDataGenerator } from '../helpers/test-data';

/**
 * 创建测试数据生成器的辅助函数
 * 确保测试数据创建在正确的组织下
 */
async function createGeneratorWithOrg(request: Parameters<typeof createTestDataGenerator>[0]): Promise<TestDataGenerator> {
  const generator = await createTestDataGenerator(request);
  // 从 test info 获取组织 ID 并同步
  const orgId = (test.info() as { orgId?: string }).orgId;
  if (orgId) {
    generator.setOrgId(orgId);
  }
  return generator;
}

/**
 * 导航到公寓详情页
 */
async function goToApartmentDetail(page: import('@playwright/test').Page, apartmentId: string): Promise<void> {
  await page.goto(`/apartments/${apartmentId}`);
}

/**
 * 生成唯一的房间号
 */
function generateRoomNumber(): string {
  return `R${Date.now().toString().slice(-6)}`;
}

test.describe('公寓详情页 - 房间管理', () => {
  // 每个测试前先登录并设置组织 ID
  test.beforeEach(async ({ page }) => {
    await login(page);

    // 等待页面加载完成后获取组织 ID
    await page.waitForLoadState('networkidle');

    // 获取页面中的组织 ID，确保 API 创建数据时使用相同的组织
    const orgId = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.CURRENT_ORG_ID
    );

    // 将组织 ID 存入 test info，供测试用例使用
    (test.info() as { orgId?: string }).orgId = orgId ?? undefined;
  });

  test.describe('新增房间', () => {
    test('成功新增房间', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(0);

      try {
        // 导航到公寓详情页
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        // 点击新增房间按钮
        const addRoomButton = page.locator('button:has-text("新增房间")');
        await expect(addRoomButton).toBeVisible();
        await addRoomButton.click();

        // 等待新增房间弹窗出现
        const dialog = page.locator('[role="dialog"]:has-text("新增房间")');
        await expect(dialog).toBeVisible();

        // 填写房间信息 - 使用 getByLabel
        const roomNumber = generateRoomNumber();
        await dialog.getByLabel('房间号').fill(roomNumber);
        await dialog.getByLabel('月租 (元)').fill('1500');
        await dialog.getByLabel('面积').fill('30');

        // 点击创建按钮 - 使用 last() 确保找到正确的按钮
        const createButton = dialog.getByRole('button', { name: '创建' });
        await createButton.click();

        // 等待弹窗关闭
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // 验证房间已添加到列表
        const roomRow = page.locator('table tbody tr').filter({ hasText: roomNumber });
        await expect(roomRow).toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });

    test('房间号为空显示验证错误', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(0);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        // 点击新增房间按钮
        const addRoomButton = page.locator('button:has-text("新增房间")');
        await addRoomButton.click();

        // 等待弹窗
        const dialog = page.locator('[role="dialog"]:has-text("新增房间")');
        await expect(dialog).toBeVisible();

        // 只填写月租，不填写房间号
        await dialog.getByLabel('月租 (元)').fill('1500');

        // 点击创建按钮
        const createButton = dialog.getByRole('button', { name: '创建' });
        await createButton.click();

        // 弹窗不应该关闭，应该显示验证错误
        await expect(dialog).toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });

    test('月租为负数显示验证错误', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(0);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        // 点击新增房间按钮
        const addRoomButton = page.locator('button:has-text("新增房间")');
        await addRoomButton.click();

        // 等待弹窗
        const dialog = page.locator('[role="dialog"]:has-text("新增房间")');
        await expect(dialog).toBeVisible();

        // 填写房间号和负数月租
        await dialog.getByLabel('房间号').fill(generateRoomNumber());
        await dialog.getByLabel('月租 (元)').fill('-100');

        // 点击创建按钮
        const createButton = dialog.getByRole('button', { name: '创建' });
        await createButton.click();

        // 弹窗不应该关闭
        await expect(dialog).toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });

    test('取消创建关闭弹窗', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(0);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        // 点击新增房间按钮
        const addRoomButton = page.locator('button:has-text("新增房间")');
        await addRoomButton.click();

        // 等待弹窗
        const dialog = page.locator('[role="dialog"]:has-text("新增房间")');
        await expect(dialog).toBeVisible();

        // 填写部分信息
        await dialog.getByLabel('房间号').fill(generateRoomNumber());

        // 点击取消按钮
        const cancelButton = dialog.getByRole('button', { name: '取消' });
        await cancelButton.click();

        // 弹窗应该关闭
        await expect(dialog).not.toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });
  });

  test.describe('批量添加房间', () => {
    test('显示批量添加弹窗', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(0);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        // 点击批量添加按钮
        const batchAddButton = page.locator('button:has-text("批量添加")');
        await expect(batchAddButton).toBeVisible();
        await batchAddButton.click();

        // 验证批量添加弹窗出现
        const dialog = page.locator('[role="dialog"]:has-text("批量添加")');
        await expect(dialog).toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });

    test('批量添加多个房间', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(0);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        // 点击批量添加按钮
        const batchAddButton = page.locator('button:has-text("批量添加")');
        await batchAddButton.click();

        // 等待弹窗
        const dialog = page.locator('[role="dialog"]:has-text("批量添加")');
        await expect(dialog).toBeVisible();

        // 填写批量添加信息 - 使用 getByLabel
        await dialog.getByLabel('起始房间号').fill('101');
        await dialog.getByLabel('房间数量').fill('5');
        await dialog.getByLabel('月租').fill('2000');

        // 点击确认按钮
        const confirmButton = dialog.getByRole('button', { name: '确认' });
        await confirmButton.click();

        // 等待弹窗关闭
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // 验证多个房间已添加到列表
        for (let i = 1; i <= 5; i++) {
          const roomRow = page.locator('table tbody tr').filter({ hasText: `10${i}` });
          await expect(roomRow).toBeVisible();
        }
      } finally {
        await generator.cleanup();
      }
    });
  });

  test.describe('编辑房间', () => {
    test('在公寓详情页编辑房间', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(1);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        const roomNumber = apartment.rooms[0].room_number;

        // 找到房间行
        const roomRow = page.locator('table tbody tr').filter({ hasText: roomNumber });
        await expect(roomRow).toBeVisible();

        // 点击编辑按钮（房间行的编辑按钮）
        const editButton = roomRow.getByRole('button', { name: '编辑' });
        await expect(editButton).toBeVisible();
        await editButton.click();

        // 等待编辑弹窗
        const dialog = page.locator('[role="dialog"]:has-text("编辑房间")');
        await expect(dialog).toBeVisible();

        // 修改月租 - 清空并填写新值
        const rentInput = dialog.getByLabel('月租 (元)');
        await rentInput.fill('');

        // 填写新值
        await rentInput.fill('2500');

        // 点击保存按钮
        const saveButton = dialog.getByRole('button', { name: '保存' });
        await saveButton.click();

        // 等待弹窗关闭
        await expect(dialog).not.toBeVisible({ timeout: 10000 });

        // 验证更新成功
        const updatedRow = page.locator('table tbody tr').filter({ hasText: roomNumber });
        await expect(updatedRow.getByText('2500')).toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });
  });

  test.describe('删除房间', () => {
    test('删除空置房间', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);
      const apartment = await generator.createApartmentWithRooms(1);

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        const roomNumber = apartment.rooms[0].room_number;

        // 找到房间行
        const roomRow = page.locator('table tbody tr').filter({ hasText: roomNumber });
        await expect(roomRow).toBeVisible();

        // 点击删除按钮
        const deleteButton = roomRow.getByRole('button', { name: '删除' });
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // 等待确认弹窗
        const confirmDialog = page.locator('[role="alertdialog"]:has-text("确认删除")');
        await expect(confirmDialog).toBeVisible();

        // 确认删除 - 点击最后一个"删除"按钮
        const confirmDeleteButton = confirmDialog.getByRole('button', { name: '删除' }).last();
        await confirmDeleteButton.click();

        // 等待确认弹窗关闭
        await expect(confirmDialog).not.toBeVisible({ timeout: 10000 });

        // 验证房间已从列表中删除
        await expect(roomRow).not.toBeVisible();
      } finally {
        await generator.cleanup();
      }
    });

    test('删除已出租房间应该失败', async ({ page, request }) => {
      const generator = await createGeneratorWithOrg(request);

      // 创建公寓和房间
      const apartment = await generator.createApartmentWithRooms(1);
      const roomId = apartment.rooms[0].id;

      // 创建租客和租约，使房间变为已出租状态
      const tenant = await generator.createTenant();
      await generator.createLease(roomId, tenant.id, { monthlyRent: 1500 });

      try {
        await goToApartmentDetail(page, apartment.id);
        await page.waitForLoadState('networkidle');

        const roomNumber = apartment.rooms[0].room_number;

        // 找到房间行（状态应为"已租"）
        const roomRow = page.locator('table tbody tr').filter({ hasText: roomNumber });
        await expect(roomRow).toBeVisible();

        // 点击删除按钮
        const deleteButton = roomRow.getByRole('button', { name: '删除' });
        await expect(deleteButton).toBeVisible();
        await deleteButton.click();

        // 等待确认弹窗出现
        const confirmDialog = page.locator('[role="alertdialog"]:has-text("确认删除")');
        await expect(confirmDialog).toBeVisible();

        // 确认删除 - 点击"删除"按钮
        const confirmDeleteButton = confirmDialog.getByRole('button', { name: '删除' }).last();
        await confirmDeleteButton.click();

        // 等待一段时间后检查行为
        await page.waitForTimeout(1000);

        // 验证是否显示了错误提示或房间仍然存在
        // 页面应该显示错误提示，或者房间仍然在列表中
        // 具体行为取决于实现
        const errorMessage = page.locator('text=删除失败').or(page.locator('text=无法删除')).or(page.locator('text=已出租'));
        if (await errorMessage.isVisible({ timeout: 3000 }).catch(() => false)) {
          // 显示了错误提示
          await expect(errorMessage).toBeVisible();
        } else {
          // 或者房间仍然存在
          await expect(roomRow).toBeVisible();
        }
      } finally {
        await generator.cleanup();
      }
    });
  });
});
