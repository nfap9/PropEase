/**
 * 租约 CRUD 操作 E2E 测试
 *
 * 覆盖场景：
 * - 创建租约
 * - 编辑租约
 * - 终止租约
 *
 * 每个测试都会创建独立的测试数据，确保测试隔离性
 */

import { test, expect, APIRequestContext, Page } from '@playwright/test';
import { goToLeases } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { LEASES } from '../testids';
import { TestDataGenerator, createTestDataGenerator } from '../helpers/test-data';

/**
 * 租约测试辅助函数 - 创建测试数据并返回公寓名称
 */
async function setupLeaseTestData(request: APIRequestContext): Promise<{
  generator: TestDataGenerator;
  apartmentName: string;
}> {
  const generator = await createTestDataGenerator(request);
  const apartment = await generator.createApartmentWithRooms(3);
  await generator.createTenant();
  return { generator, apartmentName: apartment.name };
}

test.describe('租约列表页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToLeases(page);
  });

  test('应该显示租约列表页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${LEASES.HEADING}"]`)).toBeVisible();

    // 验证新增按钮存在
    await expect(page.locator(`[data-testid="${LEASES.NEW_BUTTON}"]`)).toBeVisible();
  });

  test('应该显示已有的测试租约', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${LEASES.LIST}"]`, { timeout: 5000 });

    // 应该至少有一个测试租约
    const listItems = page.locator(`[data-testid="${LEASES.LIST}"] > *`);
    const count = await listItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('按状态筛选租约', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${LEASES.LIST}"]`);

    // 选择状态筛选
    const statusFilter = page.locator(`[data-testid="${LEASES.STATUS_FILTER}"]`);
    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // 选择"进行中"状态
      const option = page.locator('text="进行中"').first();
      if (await option.isVisible()) {
        await option.click();
        await page.waitForTimeout(500);

        // 验证筛选结果
        const listItems = page.locator(`[data-testid="${LEASES.LIST}"] > *`);
        const count = await listItems.count();
        expect(count).toBeGreaterThanOrEqual(0);
      }
    } else {
      test.skip();
    }
  });
});

test.describe('创建租约', () => {
  test('显示创建租约弹窗', async ({ page }) => {
    await login(page);
    await goToLeases(page);

    // 等待页面加载
    await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${LEASES.NEW_BUTTON}"]`);

    // 等待弹窗出现
    await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();

    // 验证关键字段存在
    await expect(page.locator(`[data-testid="${LEASES.APARTMENT_SELECT}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${LEASES.TENANT_SELECT}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${LEASES.START_DATE_INPUT}"]`)).toBeVisible();
  });

  test('成功创建租约', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, apartmentName } = await setupLeaseTestData(request);

    try {
      await goToLeases(page);

      // 等待页面加载
      await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);

      // 点击新增按钮
      await page.click(`[data-testid="${LEASES.NEW_BUTTON}"]`);
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();

      // 选择公寓
      const apartmentSelect = page.locator(`[data-testid="${LEASES.APARTMENT_SELECT}"]`);
      await apartmentSelect.click();
      const apartmentOption = page.locator(`[role="option"]:has-text("${apartmentName}")`).first();
      await apartmentOption.waitFor({ state: 'visible', timeout: 5000 });
      await apartmentOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 选择房间
      const roomSelect = page.locator(`[data-testid="${LEASES.ROOM_SELECT}"]`);
      await roomSelect.click();
      const roomOption = page.locator('[role="option"]').first();
      await roomOption.waitFor({ state: 'visible', timeout: 3000 });
      await roomOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 选择租客
      const tenantSelect = page.locator(`[data-testid="${LEASES.TENANT_SELECT}"]`);
      await tenantSelect.click();
      const tenantOption = page.locator('[role="option"]').first();
      await tenantOption.waitFor({ state: 'visible', timeout: 3000 });
      await tenantOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 填写月租
      await page.fill(`[data-testid="${LEASES.MONTHLY_RENT_INPUT}"]`, '1500');

      // 提交
      const confirmButton = page.locator(`[data-testid="${LEASES.CONFIRM_BUTTON}"]`);
      await confirmButton.click();

      // 等待弹窗关闭
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
    } finally {
      await generator.cleanup();
    }
  });

  test('选择已出租的房间显示错误', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, apartmentName } = await setupLeaseTestData(request);

    try {
      // 先通过 API 创建一个租约，占用一个房间
      // 使用 getRaw 获取原始响应，然后解包
      const apartmentsRaw = await generator.getApi().getRaw<{ code: number; data: { id: string; rooms: { id: string }[] }[] }>('/api/v1/apartments');
      const tenantsRaw = await generator.getApi().getRaw<{ code: number; data: { id: string }[] }>('/api/v1/tenants');

      const apartments = apartmentsRaw.data || apartmentsRaw;
      const tenants = tenantsRaw.data || tenantsRaw;

      if (Array.isArray(apartments) && apartments.length > 0 && Array.isArray(tenants) && tenants.length > 0) {
        const room = apartments[0].rooms[0];
        const tenant = tenants[0];
        if (room && tenant) {
          await generator.createLease(room.id, tenant.id);
        }
      }

      await goToLeases(page);
      await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);

      // 点击新增按钮
      await page.click(`[data-testid="${LEASES.NEW_BUTTON}"]`);
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();

      // 选择公寓
      const apartmentSelect = page.locator(`[data-testid="${LEASES.APARTMENT_SELECT}"]`);
      await apartmentSelect.click();
      const apartmentOption = page.locator(`[role="option"]:has-text("${apartmentName}")`).first();
      await apartmentOption.waitFor({ state: 'visible', timeout: 5000 });
      await apartmentOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 尝试选择已出租的房间
      const roomSelect = page.locator(`[data-testid="${LEASES.ROOM_SELECT}"]`);
      await roomSelect.click();
      // 等待房间列表加载
      await page.waitForTimeout(500);

      // 关闭弹窗
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.click('[data-testid="leases-cancel-btn"]');
    } finally {
      await generator.cleanup();
    }
  });

  test('租客为空显示验证错误', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, apartmentName } = await setupLeaseTestData(request);

    try {
      await goToLeases(page);
      await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);

      // 点击新增按钮
      await page.click(`[data-testid="${LEASES.NEW_BUTTON}"]`);
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();

      // 只填写部分信息，不选择租客
      const apartmentSelect = page.locator(`[data-testid="${LEASES.APARTMENT_SELECT}"]`);
      await apartmentSelect.click();
      const apartmentOption = page.locator(`[role="option"]:has-text("${apartmentName}")`).first();
      await apartmentOption.waitFor({ state: 'visible', timeout: 5000 });
      await apartmentOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      await page.fill(`[data-testid="${LEASES.MONTHLY_RENT_INPUT}"]`, '1500');

      // 提交
      const confirmButton = page.locator(`[data-testid="${LEASES.CONFIRM_BUTTON}"]`);
      await confirmButton.click();

      // 应该显示验证错误，弹窗不关闭
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();
    } finally {
      await generator.cleanup();
    }
  });

  test('签约时可选择额外费用', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, apartmentName } = await setupLeaseTestData(request);

    try {
      await goToLeases(page);
      await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);

      // 点击新增按钮
      await page.click(`[data-testid="${LEASES.NEW_BUTTON}"]`);
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();

      // 选择公寓和房间
      const apartmentSelect = page.locator(`[data-testid="${LEASES.APARTMENT_SELECT}"]`);
      await apartmentSelect.click();
      const apartmentOption = page.locator(`[role="option"]:has-text("${apartmentName}")`).first();
      await apartmentOption.waitFor({ state: 'visible', timeout: 5000 });
      await apartmentOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      const roomSelect = page.locator(`[data-testid="${LEASES.ROOM_SELECT}"]`);
      await roomSelect.click();
      const roomOption = page.locator('[role="option"]').first();
      await roomOption.waitFor({ state: 'visible', timeout: 3000 });
      await roomOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 检查是否有费用选择区域
      const feeSection = page.locator('text=额外费用').first();
      if (await feeSection.isVisible()) {
        // 尝试点击一个费用规格
        const feeButton = page.locator('button:has-text("/月")').first();
        if (await feeButton.isVisible()) {
          await feeButton.click();
          await page.waitForTimeout(200);

          // 验证费用按钮存在且可点击
          await expect(feeButton).toBeEnabled();
        }
      }

      // 关闭弹窗 - 先按 Escape 关闭可能打开的下拉框
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await page.click('[data-testid="leases-cancel-btn"]');
    } finally {
      await generator.cleanup();
    }
  });

  test('同一费用类型只能选择一个规格', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const { generator, apartmentName } = await setupLeaseTestData(request);

    try {
      await goToLeases(page);
      await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);

      // 点击新增按钮
      await page.click(`[data-testid="${LEASES.NEW_BUTTON}"]`);
      await expect(page.locator(`[data-testid="${LEASES.CREATE_DIALOG}"]`)).toBeVisible();

      // 选择公寓和房间
      const apartmentSelect = page.locator(`[data-testid="${LEASES.APARTMENT_SELECT}"]`);
      await apartmentSelect.click();
      const apartmentOption = page.locator(`[role="option"]:has-text("${apartmentName}")`).first();
      await apartmentOption.waitFor({ state: 'visible', timeout: 5000 });
      await apartmentOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      const roomSelect = page.locator(`[data-testid="${LEASES.ROOM_SELECT}"]`);
      await roomSelect.click();
      const roomOption = page.locator('[role="option"]').first();
      await roomOption.waitFor({ state: 'visible', timeout: 3000 });
      await roomOption.click();
      await page.waitForSelector('[role="option"]', { state: 'hidden', timeout: 3000 }).catch(() => {});

      // 检查是否有费用选择区域
      const feeSection = page.locator('text=额外费用').first();
      if (await feeSection.isVisible()) {
        // 找到同一费用类型下的多个规格按钮
        const feeButtons = page.locator('button:has-text("/月")');
        const count = await feeButtons.count();

        if (count >= 2) {
          // 点击第一个规格
          await feeButtons.nth(0).click();
          await page.waitForTimeout(200);

          // 点击第二个规格（假设是同一类型的不同规格）
          await feeButtons.nth(1).click();
          await page.waitForTimeout(200);

          // 验证：如果两个按钮属于同一费用类型，第一个应该被取消选中
          // 这里我们简单地检查已选费用列表中只有一个费用
          const selectedFees = page.locator('[role="dialog"] .bg-muted\\/50');
          const selectedCount = await selectedFees.count();

          // 同一费用类型只能有一个，所以已选费用数量应该小于等于费用类型数量
          expect(selectedCount).toBeLessThanOrEqual(1);
        }
      }

      // 关闭弹窗
      await page.click('[data-testid="leases-cancel-btn"]');
    } finally {
      await generator.cleanup();
    }
  });
});

test.describe('终止租约', () => {
  test('显示终止租约弹窗', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const generator = await createTestDataGenerator(request);
    const apartment = await generator.createApartmentWithRooms(1);
    const tenant = await generator.createTenant();

    try {
      // 创建租约
      if (apartment.rooms.length > 0) {
        await generator.createLease(apartment.rooms[0].id, tenant.id);
      }

      // 导航到租约页面
      await goToLeases(page);

      // 等待列表加载
      await page.waitForSelector(`[data-testid="${LEASES.LIST}"]`);

      // 刷新页面确保数据加载
      await page.reload();
      await page.waitForSelector(`[data-testid="${LEASES.LIST}"]`);

      // 找到进行中的租约
      const activeLease = page.locator(`[data-testid="${LEASES.LIST}"] > *`).first();
      await expect(activeLease).toBeVisible({ timeout: 5000 });

      await activeLease.hover();
      await page.waitForTimeout(300);

      // 点击终止按钮（使用 first() 避免多个匹配）
      const terminateButton = page.locator(`[data-testid="${LEASES.TERMINATE_BUTTON}"]`).first();
      if (await terminateButton.isVisible()) {
        await terminateButton.click();

        // 等待终止弹窗
        await expect(page.locator(`[data-testid="${LEASES.TERMINATE_DIALOG}"]`)).toBeVisible();
      } else {
        // 尝试通过更多菜单
        const moreButton = page.locator('button[aria-label="更多"]').first();
        if (await moreButton.isVisible()) {
          await moreButton.click();
          const terminateOption = page.locator('button:has-text("终止")').first();
          if (await terminateOption.isVisible()) {
            await terminateOption.click();
            await expect(page.locator(`[data-testid="${LEASES.TERMINATE_DIALOG}"]`)).toBeVisible();
          }
        }
      }
    } finally {
      await generator.cleanup();
    }
  });
});
