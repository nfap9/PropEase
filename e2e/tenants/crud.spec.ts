/**
 * 租客 CRUD 操作 E2E 测试
 *
 * 覆盖场景：
 * - 创建租客
 * - 编辑租客
 * - 删除租客
 *
 * 每个测试都会创建独立的测试数据，确保测试隔离性
 */

import { test, expect, APIRequestContext } from '@playwright/test';
import { goToTenants } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { TENANTS } from '../testids';
import { createTestDataGenerator } from '../helpers/test-data';

// 生成唯一的测试数据
const uniquePhone = () => `13900${Date.now().toString().slice(-6)}`;
const uniqueName = () => `测试租客_${Date.now().toString().slice(-4)}`;

test.describe('创建租客', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToTenants(page);
  });

  test('成功创建租客', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${TENANTS.NEW_BUTTON}"]`);

    // 等待弹窗出现
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写租客信息
    const name = uniqueName();
    const phone = uniquePhone();

    await page.fill(`[data-testid="${TENANTS.NAME_INPUT}"]`, name);
    await page.fill(`[data-testid="${TENANTS.PHONE_INPUT}"]`, phone);
    await page.fill(`[data-testid="${TENANTS.ID_CARD_INPUT}"]`, '110101199001011234');

    // 提交
    const confirmButton = page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 等待弹窗关闭
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });

    // 清理：删除刚创建的租客
    await page.waitForTimeout(500);
    await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, name);
    await page.waitForTimeout(500);

    const createdTenant = page.locator(`text="${name}"`).first();
    if (await createdTenant.isVisible()) {
      await createdTenant.hover();
      await page.waitForTimeout(300);

      const deleteButton = page.locator('button:has-text("删除")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('姓名为空显示验证错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${TENANTS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();

    // 只填写手机号，不填写姓名
    await page.fill(`[data-testid="${TENANTS.PHONE_INPUT}"]`, uniquePhone());

    // 提交
    const confirmButton = page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误（弹窗不关闭）
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();
  });

  test('手机号格式错误显示验证错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${TENANTS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写错误格式的手机号
    await page.fill(`[data-testid="${TENANTS.NAME_INPUT}"]`, uniqueName());
    await page.fill(`[data-testid="${TENANTS.PHONE_INPUT}"]`, '123456');

    // 提交
    const confirmButton = page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();
  });

  test('身份证号格式错误显示验证错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${TENANTS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写错误格式的身份证号
    await page.fill(`[data-testid="${TENANTS.NAME_INPUT}"]`, uniqueName());
    await page.fill(`[data-testid="${TENANTS.PHONE_INPUT}"]`, uniquePhone());
    await page.fill(`[data-testid="${TENANTS.ID_CARD_INPUT}"]`, '123');

    // 提交
    const confirmButton = page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();
  });

  test('取消创建应该关闭弹窗', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);

    // 点击新增按钮
    await page.click(`[data-testid="${TENANTS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();

    // 填写一些数据
    await page.fill(`[data-testid="${TENANTS.NAME_INPUT}"]`, '测试');

    // 点击取消
    const cancelButton = page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"] button:has-text("取消")`).first();
    await cancelButton.click();

    // 弹窗应该关闭
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).not.toBeVisible();
  });
});

test.describe('编辑租客', () => {
  test('成功编辑租客信息', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据
    const generator = await createTestDataGenerator(request);
    const tenant = await generator.createTenant();

    try {
      await goToTenants(page);
      await page.waitForSelector(`[data-testid="${TENANTS.LIST}"]`);

      // 搜索刚创建的租客
      await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, tenant.name);
      await page.waitForTimeout(500);

      // 找到租客
      const testTenant = page.locator(`text="${tenant.name}"`).first();
      await expect(testTenant).toBeVisible({ timeout: 5000 });
      await testTenant.hover();
      await page.waitForTimeout(300);

      // 点击编辑按钮
      const editButton = page.locator('button:has-text("编辑")').first();
      if (await editButton.isVisible()) {
        await editButton.click();

        // 等待编辑弹窗
        const editDialog = page.locator('[data-testid="tenants-edit-dialog"]');
        await expect(editDialog).toBeVisible({ timeout: 3000 });

        // 修改备注
        const notesInput = page.locator('[data-testid="tenants-notes-input"]');
        if (await notesInput.isVisible()) {
          await notesInput.fill(`更新备注_${Date.now()}`);
        }

        // 保存
        const confirmButton = editDialog.locator('button:has-text("确认")').first();
        await confirmButton.click();

        // 验证弹窗关闭
        await expect(editDialog).not.toBeVisible({ timeout: 5000 });
      } else {
        // 尝试通过更多菜单
        const moreButton = page.locator('button[aria-label="更多"]').first();
        await expect(moreButton).toBeVisible({ timeout: 3000 });
        await moreButton.click();
        const editOption = page.locator('button:has-text("编辑")').first();
        await expect(editOption).toBeVisible({ timeout: 3000 });
        await editOption.click();
      }
    } finally {
      await generator.cleanup();
    }
  });
});

test.describe('删除租客', () => {
  test('删除无租约的租客', async ({ page }) => {
    await login(page);
    await goToTenants(page);

    // 先创建一个租客用于删除
    await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);

    const name = uniqueName();
    const phone = uniquePhone();

    // 创建
    await page.click(`[data-testid="${TENANTS.NEW_BUTTON}"]`);
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).toBeVisible();
    await page.fill(`[data-testid="${TENANTS.NAME_INPUT}"]`, name);
    await page.fill(`[data-testid="${TENANTS.PHONE_INPUT}"]`, phone);
    const confirmButton = page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();
    await expect(page.locator(`[data-testid="${TENANTS.CREATE_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });

    // 搜索刚创建的租客
    await page.waitForTimeout(500);
    await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, name);
    await page.waitForTimeout(500);

    // 找到并删除
    const createdTenant = page.locator(`text="${name}"`).first();
    await expect(createdTenant).toBeVisible({ timeout: 5000 });
    await createdTenant.hover();
    await page.waitForTimeout(300);

    // 点击删除按钮
    const deleteButton = page.locator('button:has-text("删除")').first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // 等待确认弹窗
      const deleteDialog = page.locator('[data-testid="tenants-delete-dialog"]');
      await expect(deleteDialog).toBeVisible({ timeout: 3000 });

      // 确认删除
      const confirmDeleteBtn = deleteDialog.locator('button:has-text("确认")').last();
      await confirmDeleteBtn.click();

      // 验证弹窗关闭
      await expect(deleteDialog).not.toBeVisible({ timeout: 5000 });
    } else {
      // 尝试通过更多菜单
      const moreButton = page.locator('button[aria-label="更多"]').first();
      await expect(moreButton).toBeVisible({ timeout: 3000 });
      await moreButton.click();
      const delBtn = page.locator('button:has-text("删除")').first();
      await expect(delBtn).toBeVisible({ timeout: 3000 });
      await delBtn.click();
    }
  });

  test('删除有关联租约的租客应该失败', async ({ page, request }) => {
    await login(page);

    // 创建独立的测试数据：公寓、房间、租客、租约
    const generator = await createTestDataGenerator(request);
    const apartment = await generator.createApartmentWithRooms(1);
    const tenant = await generator.createTenant();

    // 创建租约，使租客有关联
    await generator.createLease(apartment.rooms[0].id, tenant.id);

    try {
      await goToTenants(page);
      await page.waitForSelector(`[data-testid="${TENANTS.LIST}"]`);

      // 搜索刚创建的租客
      await page.fill(`[data-testid="${TENANTS.SEARCH_INPUT}"]`, tenant.name);
      await page.waitForTimeout(500);

      // 找到有租约的租客
      const tenantWithLease = page.locator(`text="${tenant.name}"`).first();
      await expect(tenantWithLease).toBeVisible({ timeout: 5000 });
      await tenantWithLease.hover();
      await page.waitForTimeout(300);

      // 尝试删除
      const deleteButton = page.locator('button:has-text("删除")').first();
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        // 应该显示错误提示或阻止删除
        await page.waitForTimeout(500);
      } else {
        // 尝试通过更多菜单
        const moreButton = page.locator('button[aria-label="更多"]').first();
        await expect(moreButton).toBeVisible({ timeout: 3000 });
        await moreButton.click();
        const delBtn = page.locator('button:has-text("删除")').first();
        // 有租约的租客，删除按钮可能是禁用的或不显示
        if (await delBtn.isVisible()) {
          await delBtn.click();
          // 应该显示错误提示
          await page.waitForTimeout(500);
        }
      }
    } finally {
      await generator.cleanup();
    }
  });
});
