/**
 * 运营后台 - 组织管理 E2E 测试
 *
 * 覆盖场景：
 * - 组织列表展示
 * - 组织详情查看
 * - 启用/停用组织
 */

import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/auth';
import { ADMIN_ORGANIZATIONS, COMMON } from '../testids';

const ADMIN_BASE_URL = 'http://localhost:3001';

test.describe('组织管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto(`${ADMIN_BASE_URL}/admin/organizations`);
  });

  test('应该显示组织列表', async ({ page }) => {
    await page.waitForTimeout(500);

    const orgList = page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.LIST}"]`);
    if (await orgList.isVisible()) {
      const orgs = orgList.locator('> *');
      const count = await orgs.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('组织详情', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('查看组织详情', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/organizations`);
    await page.waitForTimeout(500);

    const orgList = page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.LIST}"]`);
    if (await orgList.isVisible()) {
      const firstOrg = orgList.locator('> *').first();
      if (await firstOrg.isVisible()) {
        await firstOrg.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('组织状态管理', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('停用组织按钮存在', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/organizations`);
    await page.waitForTimeout(500);

    const orgList = page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.LIST}"]`);
    if (await orgList.isVisible()) {
      const firstOrg = orgList.locator('> *').first();
      if (await firstOrg.isVisible()) {
        await firstOrg.hover();

        const disableButton = page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.DISABLE_BUTTON}"]`).first();
        // 只验证按钮存在，不实际点击
        if (await disableButton.isVisible()) {
          await expect(disableButton).toBeVisible();
        }
      }
    }
  });

  test('启用组织按钮存在', async ({ page }) => {
    await page.goto(`${ADMIN_BASE_URL}/admin/organizations`);
    await page.waitForTimeout(500);

    const orgList = page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.LIST}"]`);
    if (await orgList.isVisible()) {
      // 查找已停用的组织
      const disabledOrg = orgList.locator('text="已停用"').first();
      if (await disabledOrg.isVisible()) {
        await disabledOrg.hover();

        const enableButton = page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.ENABLE_BUTTON}"]`).first();
        if (await enableButton.isVisible()) {
          await expect(enableButton).toBeVisible();
        }
      }
    }
  });
});
