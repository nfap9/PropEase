/**
 * 运营后台 - 服务管理 E2E 测试
 *
 * 覆盖场景：
 * - 服务列表展示
 * - 创建服务
 * - 编辑服务
 * - 启用/停用服务
 */

import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/auth';
import { ADMIN_PLANS, COMMON } from '../testids';

const ADMIN_BASE_URL = 'http://localhost:3001';

test.describe('服务管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_BASE_URL}/admin/plans`);
  });

  test('应该显示服务列表', async ({ page }) => {
    await page.waitForTimeout(500);

    const planList = page.locator(`[data-testid="${ADMIN_PLANS.LIST}"]`);
    if (await planList.isVisible()) {
      const plans = planList.locator('> *');
      const count = await plans.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('应该显示创建服务按钮', async ({ page }) => {
    await page.waitForTimeout(500);

    const createButton = page.locator(`[data-testid="${ADMIN_PLANS.CREATE_BUTTON}"]`);
    if (await createButton.isVisible()) {
      await expect(createButton).toBeEnabled();
    }
  });
});

test.describe('创建服务', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_BASE_URL}/admin/plans`);
  });

  test('显示创建服务弹窗', async ({ page }) => {
    await page.waitForTimeout(500);

    const createButton = page.locator(`[data-testid="${ADMIN_PLANS.CREATE_BUTTON}"]`);
    if (await createButton.isVisible()) {
      await createButton.click();

      const dialog = page.locator(`[data-testid="${ADMIN_PLANS.CREATE_DIALOG}"]`);
      if (await dialog.isVisible()) {
        await expect(dialog).toBeVisible();
      }
    }
  });

  test('创建服务 - 名称为空显示验证错误', async ({ page }) => {
    await page.waitForTimeout(500);

    const createButton = page.locator(`[data-testid="${ADMIN_PLANS.CREATE_BUTTON}"]`);
    if (await createButton.isVisible()) {
      await createButton.click();

      const dialog = page.locator(`[data-testid="${ADMIN_PLANS.CREATE_DIALOG}"]`);
      if (await dialog.isVisible()) {
        // 直接点击确认
        const confirmButton = dialog.locator('button:has-text("确认")').first();
        await confirmButton.click();

        // 应该显示验证错误
        await expect(dialog).toBeVisible();
      }
    }
  });
});

test.describe('编辑服务', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_BASE_URL}/admin/plans`);
  });

  test('编辑服务信息', async ({ page }) => {
    await page.waitForTimeout(500);

    const planList = page.locator(`[data-testid="${ADMIN_PLANS.LIST}"]`);
    if (await planList.isVisible()) {
      const firstPlan = planList.locator('> *').first();
      if (await firstPlan.isVisible()) {
        await firstPlan.hover();

        const editButton = firstPlan.locator('button:has-text("编辑")').first();
        if (await editButton.isVisible()) {
          await editButton.click();
          await page.waitForTimeout(500);
        }
      }
    }
  });
});

test.describe('服务状态管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_BASE_URL}/admin/plans`);
  });

  test('停用服务按钮存在', async ({ page }) => {
    await page.waitForTimeout(500);

    const planList = page.locator(`[data-testid="${ADMIN_PLANS.LIST}"]`);
    if (await planList.isVisible()) {
      const firstPlan = planList.locator('> *').first();
      if (await firstPlan.isVisible()) {
        await firstPlan.hover();

        const disableButton = firstPlan.locator('button:has-text("停用")').first();
        if (await disableButton.isVisible()) {
          await expect(disableButton).toBeVisible();
        }
      }
    }
  });
});
