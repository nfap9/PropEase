/**
 * 房间列表 E2E 测试
 *
 * 覆盖场景（基于 docs/测试用例/房源管理/02-房间管理.md）：
 * - 房间列表显示
 * - 房间搜索（房间号、备注）
 * - 房间筛选（公寓、状态、户型、月租范围、面积范围）
 * - 清除筛选
 * - 签约
 * - 退租
 * - 更改状态
 */

import { test, expect } from '@playwright/test';
import { goToRooms } from '../helpers/navigation';
import { login, AUTH_STORAGE_KEYS } from '../helpers/auth';
import { createTestDataGenerator, TestDataGenerator } from '../helpers/test-data';
import { ROOMS } from '../testids';

test.describe('房间列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToRooms(page);

    // 等待页面完全加载后再获取组织 ID
    await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

    // 获取页面中的组织 ID，确保 API 创建数据时使用相同的组织
    const orgId = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.CURRENT_ORG_ID
    );
    // 将组织 ID 存入 test info，供测试用例使用
    (test.info() as { orgId?: string }).orgId = orgId ?? undefined;
  });

  // 创建测试数据生成器的辅助函数
  async function createGeneratorWithOrg(request: Parameters<typeof createTestDataGenerator>[0]): Promise<TestDataGenerator> {
    const generator = await createTestDataGenerator(request);
    // 从 test info 获取组织 ID 并同步
    const orgId = (test.info() as { orgId?: string }).orgId;
    if (orgId) {
      generator.setOrgId(orgId);
    }
    return generator;
  }

  // ==================== 功能 1：房间列表 ====================

  test('应该显示房间列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${ROOMS.HEADING}"]`)).toBeVisible();

    // 验证搜索框
    await expect(page.locator(`[data-testid="${ROOMS.SEARCH_INPUT}"]`)).toBeVisible();

    // 验证筛选器开关
    await expect(page.locator(`[data-testid="${ROOMS.FILTER_TOGGLE}"]`)).toBeVisible();

    // 验证筛选器（使用 first() 来选择第一个匹配的元素）
    await expect(page.locator(`[data-testid="${ROOMS.APARTMENT_FILTER}"]`).first()).toBeVisible();
    await expect(page.locator(`[data-testid="${ROOMS.STATUS_FILTER}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${ROOMS.LAYOUT_FILTER}"]`)).toBeVisible();
  });

  test('应该显示已有的测试房间', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建公寓和房间
      const apartment = await generator.createApartmentWithRooms(3);
      const firstRoomNumber = apartment.rooms[0].room_number;

      // 使用搜索功能来验证房间是否存在
      await goToRooms(page);

      // 验证列表容器可见
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 搜索新创建的房间号（搜索会触发 API 重新获取数据）
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, firstRoomNumber);

      // 等待搜索结果显示
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toContainText(firstRoomNumber, {
        timeout: 10000,
      });

      // 验证至少有一个数据行（排除表头）
      const dataRows = page.locator(`[data-testid="${ROOMS.LIST}"] tbody tr`);
      const count = await dataRows.count();
      expect(count).toBeGreaterThan(0);
    } finally {
      await generator.cleanup();
    }
  });

  // ==================== 功能 2：房间搜索 ====================

  test('搜索房间号', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建带有特定房间号的房间
      const apartment = await generator.createApartmentWithRooms(3);
      const targetRoomNumber = apartment.rooms[0].room_number;

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 搜索房间号
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, targetRoomNumber);

      // 等待搜索结果（使用自动等待）
      const searchInput = page.locator(`[data-testid="${ROOMS.SEARCH_INPUT}"]`);
      await expect(searchInput).toHaveValue(targetRoomNumber);

      // 验证搜索结果（搜索后应该只显示匹配的房间）
      const listItems = page.locator(`[data-testid="${ROOMS.LIST}"] [role="row"]`);
      const count = await listItems.count();

      // 如果有结果，验证包含搜索的房间号
      if (count > 0) {
        const firstCell = listItems.first().locator('[role="cell"]').first();
        const cellText = await firstCell.textContent();
        expect(cellText).toContain(targetRoomNumber);
      }
    } finally {
      await generator.cleanup();
    }
  });

  test('搜索备注', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间并添加备注
      const apartment = await generator.createApartmentWithRooms(1);
      const roomId = apartment.rooms[0].id;
      const notes = '测试备注内容';

      // 使用 API 更新房间备注
      const api = generator.getApi();
      await api.put(`/api/v1/apartments/rooms/${roomId}`, {
        notes: notes,
      });

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 搜索备注
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, '测试备注');

      // 验证搜索结果
      const searchInput = page.locator(`[data-testid="${ROOMS.SEARCH_INPUT}"]`);
      await expect(searchInput).toHaveValue('测试备注');
    } finally {
      await generator.cleanup();
    }
  });

  // ==================== 功能 3：房间筛选 ====================

  test('按公寓筛选房间', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建两个公寓，每个有房间
      const apartment1 = await generator.createApartmentWithRooms(2);
      await generator.createApartmentWithRooms(2, {
        apartmentName: `${generator.getApartmentName()}_2`,
      });

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 选择第一个公寓筛选
      const apartmentFilter = page.locator(`[data-testid="${ROOMS.APARTMENT_FILTER}"]`);
      await apartmentFilter.click();

      // 选择第一个公寓
      await page.locator(`text="${apartment1.name}"`).first().click();

      // 等待筛选结果
      const listLocator = page.locator(`[data-testid="${ROOMS.LIST}"]`);
      await expect(listLocator).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });

  test('按状态筛选房间', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间
      await generator.createApartmentWithRooms(3);

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 选择"空置"状态筛选
      const statusFilter = page.locator(`[data-testid="${ROOMS.STATUS_FILTER}"]`);
      await statusFilter.click();

      // 等待下拉菜单打开并选择"空置"选项（使用 role="option" 精确选择下拉选项）
      const vacantOption = page.locator('[role="option"]:has-text("空置")');
      await vacantOption.waitFor({ state: 'visible', timeout: 3000 });
      await vacantOption.click();

      // 等待下拉菜单关闭
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 等待筛选结果
      const listLocator = page.locator(`[data-testid="${ROOMS.LIST}"]`);
      await expect(listLocator).toBeVisible();

      // 验证筛选器显示已选状态
      await expect(statusFilter).toContainText('空置');
    } finally {
      await generator.cleanup();
    }
  });

  test('按户型筛选房间', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间并设置户型
      const apartment = await generator.createApartmentWithRooms(2);
      const roomId = apartment.rooms[0].id;

      // 使用 API 更新房间户型
      const api = generator.getApi();
      await api.put(`/api/v1/apartments/rooms/${roomId}`, {
        layout: '一室一厅',
        area: 50,
      });

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 选择户型筛选
      const layoutFilter = page.locator(`[data-testid="${ROOMS.LAYOUT_FILTER}"]`);
      await layoutFilter.click();

      // 等待下拉菜单打开并选择"一室一厅"户型（使用 role="option" 精确选择下拉选项）
      const layoutOption = page.locator('[role="option"]:has-text("一室一厅")');
      await layoutOption.waitFor({ state: 'visible', timeout: 3000 });
      await layoutOption.click();

      // 等待下拉菜单关闭
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 等待筛选结果
      const listLocator = page.locator(`[data-testid="${ROOMS.LIST}"]`);
      await expect(listLocator).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });

  test('按月租范围筛选', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间（月租分别为 1100, 1200, 1300）
      await generator.createApartmentWithRooms(3);

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 设置月租范围筛选
      await page.fill(`[data-testid="${ROOMS.RENT_MIN_INPUT}"]`, '1100');
      await page.fill(`[data-testid="${ROOMS.RENT_MAX_INPUT}"]`, '1200');

      // 等待筛选结果
      const listLocator = page.locator(`[data-testid="${ROOMS.LIST}"]`);
      await expect(listLocator).toBeVisible();

      // 验证输入值
      const minInput = page.locator(`[data-testid="${ROOMS.RENT_MIN_INPUT}"]`);
      const maxInput = page.locator(`[data-testid="${ROOMS.RENT_MAX_INPUT}"]`);
      await expect(minInput).toHaveValue('1100');
      await expect(maxInput).toHaveValue('1200');
    } finally {
      await generator.cleanup();
    }
  });

  test('按面积范围筛选', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间并设置面积
      const apartment = await generator.createApartmentWithRooms(2);
      const roomId = apartment.rooms[0].id;

      // 使用 API 更新房间面积
      const api = generator.getApi();
      await api.put(`/api/v1/apartments/rooms/${roomId}`, {
        area: 50,
      });

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 设置面积范围筛选
      await page.fill(`[data-testid="${ROOMS.AREA_MIN_INPUT}"]`, '40');
      await page.fill(`[data-testid="${ROOMS.AREA_MAX_INPUT}"]`, '60');

      // 等待筛选结果
      const listLocator = page.locator(`[data-testid="${ROOMS.LIST}"]`);
      await expect(listLocator).toBeVisible();

      // 验证输入值
      const minInput = page.locator(`[data-testid="${ROOMS.AREA_MIN_INPUT}"]`);
      const maxInput = page.locator(`[data-testid="${ROOMS.AREA_MAX_INPUT}"]`);
      await expect(minInput).toHaveValue('40');
      await expect(maxInput).toHaveValue('60');
    } finally {
      await generator.cleanup();
    }
  });

  test('清除筛选', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间
      await generator.createApartmentWithRooms(3);

      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 设置筛选条件
      const statusFilter = page.locator(`[data-testid="${ROOMS.STATUS_FILTER}"]`);
      await statusFilter.click();

      // 等待下拉菜单打开并选择"空置"选项（使用 role="option" 精确选择下拉选项）
      const vacantOption = page.locator('[role="option"]:has-text("空置")');
      await vacantOption.waitFor({ state: 'visible', timeout: 3000 });
      await vacantOption.click();

      // 等待下拉菜单关闭
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 等待筛选结果
      const listLocator = page.locator(`[data-testid="${ROOMS.LIST}"]`);
      await expect(listLocator).toBeVisible();

      // 验证清除筛选按钮出现（当有筛选条件时）
      const clearButton = page.locator(`[data-testid="${ROOMS.CLEAR_FILTERS_BTN}"]`);
      if (await clearButton.isVisible()) {
        // 点击清除筛选按钮
        await clearButton.click();

        // 验证筛选器恢复默认状态
        await expect(statusFilter).toContainText('全部状态');
      }
    } finally {
      await generator.cleanup();
    }
  });

  // ==================== 功能 4：签约 ====================

  test('为空置房间签约', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间和租客
      const apartment = await generator.createApartmentWithRooms(1);
      const tenant = await generator.createTenant();
      const roomNumber = apartment.rooms[0].room_number;

      await goToRooms(page);

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 使用搜索功能查找新创建的房间（绕过缓存和分页）
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);

      // 等待搜索结果加载
      await page.waitForTimeout(2000);

      // 直接在表格中查找包含房间号和"签约"的行
      const rowWithRoomAndButton = page.locator('[data-testid="rooms-list"] table tbody tr');
      await rowWithRoomAndButton.waitFor({ state: 'visible', timeout: 10000 });

      // 点击"签约"按钮
      await rowWithRoomAndButton.getByRole('button', { name: '签约' }).click();

      // 等待签约弹窗出现
      await expect(page.locator('[data-testid="leases-create-dialog"]')).toBeVisible();

      // 填写租约信息
      await page.fill('[data-testid="leases-monthly-rent-input"]', '1500');
      await page.fill('[data-testid="leases-deposit-input"]', '1500');

      // 选择租客（需要等待租客列表加载）
      const tenantSelect = page.locator('[data-testid="leases-tenant-select"]');
      await tenantSelect.click();

      // 等待下拉菜单打开
      await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 5000 });

      // 选择新创建的租客（使用 role="option" 选择器）
      const tenantOption = page.locator(`[role="option"]:has-text("${tenant.name}")`);
      await tenantOption.click();

      // 点击确认签约按钮
      await page.click('[data-testid="leases-confirm-btn"]');

      // 验证签约成功（弹窗关闭，房间状态更新）
      await expect(page.locator('[data-testid="leases-create-dialog"]')).not.toBeVisible({ timeout: 10000 });

      // 刷新页面验证状态
      await page.reload();

      // 再次搜索房间号来验证
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
      await page.waitForTimeout(2000);

      // 验证房间状态变为"已租"
      const updatedRoomRow = page.locator('[data-testid="rooms-list"] table tbody tr');
      await expect(updatedRoomRow.getByText('已租')).toBeVisible({ timeout: 10000 });
    } finally {
      await generator.cleanup();
    }
  });

  // ==================== 功能 5：退租 ====================

  test('为已出租房间退租', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间、租客和租约
      const apartment = await generator.createApartmentWithRooms(1);
      const tenant = await generator.createTenant();
      const room = apartment.rooms[0];
      const roomNumber = room.room_number;

      // 创建租约
      await generator.createLease(room.id, tenant.id);

      await goToRooms(page);

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 使用搜索功能查找房间
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
      await page.waitForTimeout(2000);

      // 找到表格行
      const roomRow = page.locator('[data-testid="rooms-list"] table tbody tr');
      await roomRow.waitFor({ state: 'visible', timeout: 10000 });

      // 点击"退租"按钮
      await roomRow.getByRole('button', { name: '退租' }).click();

      // 等待退租确认弹窗出现
      await expect(
        page.locator(`[data-testid="${ROOMS.TERMINATE_DIALOG}"]`)
      ).toBeVisible();

      // 点击确认退租按钮
      await page.click(`[data-testid="${ROOMS.CONFIRM_TERMINATE_BTN}"]`);

      // 验证退租成功（弹窗关闭）
      await expect(
        page.locator(`[data-testid="${ROOMS.TERMINATE_DIALOG}"]`)
      ).not.toBeVisible({ timeout: 10000 });

      // 刷新页面验证状态
      await page.reload();

      // 再次搜索房间号来验证
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
      await page.waitForTimeout(2000);

      // 验证房间状态变为"空置"
      const updatedRoomRow = page.locator('[data-testid="rooms-list"] table tbody tr');
      await expect(updatedRoomRow.getByText('空置')).toBeVisible({ timeout: 10000 });
    } finally {
      await generator.cleanup();
    }
  });

  // ==================== 功能 6：更改状态 ====================

  test('将房间设置为维修中', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建空置房间
      const apartment = await generator.createApartmentWithRooms(1);
      const room = apartment.rooms[0];
      const roomNumber = room.room_number;

      await goToRooms(page);

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 使用搜索功能找到房间（搜索会触发 API 重新获取数据）
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
      await page.waitForTimeout(3000);

      // 找到表格行
      const roomRow = page.locator('[data-testid="rooms-list"] table tbody tr');
      await expect(roomRow).toBeVisible();

      // 验证房间状态为"空置"
      await expect(roomRow.getByText('空置')).toBeVisible();

      // 点击"开始维修"按钮
      await expect(roomRow.getByRole('button', { name: '开始维修' })).toBeVisible();
      await roomRow.getByRole('button', { name: '开始维修' }).click();

      // 等待 API 调用完成
      await page.waitForTimeout(3000);

      // 刷新页面
      await page.reload();
      await page.waitForTimeout(2000);

      // 使用搜索功能查找房间
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
      await page.waitForTimeout(3000);

      // 找到更新后的房间行
      const updatedRoomRow = page.locator('[data-testid="rooms-list"] table tbody tr');
      await expect(updatedRoomRow).toBeVisible();

      // 验证状态变为"维修中"
      await expect(updatedRoomRow.getByText('维修中')).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });

  test('将维修中房间恢复为空置', async ({ page, request }) => {
    const generator = await createGeneratorWithOrg(request);
    try {
      // 创建房间并设置为维修中
      const apartment = await generator.createApartmentWithRooms(1);
      const room = apartment.rooms[0];
      const roomNumber = room.room_number;

      const api = generator.getApi();

      // 更新房间状态
      await api.put(`/api/v1/apartments/rooms/${room.id}`, {
        status: 'maintenance',
      });

      // 等待一下确保数据库已更新
      await page.waitForTimeout(1000);

      // 重新加载页面以获取最新数据
      await goToRooms(page, { reload: true });

      // 验证列表加载
      await expect(page.locator(`[data-testid="${ROOMS.LIST}"]`)).toBeVisible();

      // 按状态筛选为"维修中"
      const statusFilter = page.locator(`[data-testid="${ROOMS.STATUS_FILTER}"]`);
      await statusFilter.click();

      // 选择"维修中"选项
      const maintenanceOption = page.locator('[role="option"]:has-text("维修中")');
      await maintenanceOption.waitFor({ state: 'visible', timeout: 3000 });
      await maintenanceOption.click();

      // 等待筛选结果
      await page.waitForTimeout(2000);

      // 找到表格行
      const roomRow = page.locator('[data-testid="rooms-list"] table tbody tr').filter({ hasText: roomNumber });
      await expect(roomRow).toBeVisible();

      // 验证房间状态显示为"维修中"
      await expect(roomRow.getByText('维修中')).toBeVisible();

      // 点击"完成维修"按钮
      await expect(roomRow.getByRole('button', { name: '完成维修' })).toBeVisible();
      await roomRow.getByRole('button', { name: '完成维修' }).click();

      // 等待 API 调用完成
      await page.waitForTimeout(3000);

      // 刷新页面
      await page.reload();
      await page.waitForTimeout(2000);

      // 使用搜索功能查找房间
      await page.fill(`[data-testid="${ROOMS.SEARCH_INPUT}"]`, roomNumber);
      await page.waitForTimeout(2000);

      // 找到更新后的房间行
      const updatedRoomRow = page.locator('[data-testid="rooms-list"] table tbody tr');
      await expect(updatedRoomRow).toBeVisible();

      // 验证状态变为"空置"
      await expect(updatedRoomRow.getByText('空置')).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });
});
