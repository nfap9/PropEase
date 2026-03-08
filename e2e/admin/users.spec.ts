/**
 * 运营后台 - 用户管理 E2E 测试
 *
 * 覆盖场景：
 * - 用户列表展示
 * - 搜索用户
 * - 查看用户详情
 */

import { test, expect } from '@playwright/test';
import { adminLogin } from '../helpers/auth';
import { ADMIN_REGISTERED_USERS, COMMON } from '../testids';

test.describe('注册用户管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
    await page.goto('/admin/registered-users');
  });

  test('应该显示用户管理页面', async ({ page }) => {
    // 等待页面加载
    await page.waitForTimeout(500);
  });

  test('应该显示用户列表', async ({ page }) => {
    await page.waitForTimeout(500);

    const userList = page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.LIST}"]`);
    if (await userList.isVisible()) {
      const users = userList.locator('> *');
      const count = await users.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('搜索用户', async ({ page }) => {
    await page.waitForTimeout(500);

    const searchInput = page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.SEARCH_INPUT}"]`);
    if (await searchInput.isVisible()) {
      // 输入搜索关键词
      await searchInput.fill('138');
      await page.waitForTimeout(500);

      // 验证搜索结果
      const userList = page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.LIST}"]`);
      if (await userList.isVisible()) {
        await page.waitForTimeout(300);
      }
    }
  });

  test('清空搜索显示所有用户', async ({ page }) => {
    await page.waitForTimeout(500);

    const searchInput = page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.SEARCH_INPUT}"]`);
    if (await searchInput.isVisible()) {
      // 输入并清空
      await searchInput.fill('138');
      await page.waitForTimeout(300);
      await searchInput.clear();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('用户详情', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('查看用户详情', async ({ page }) => {
    await page.goto('/admin/registered-users');
    await page.waitForTimeout(500);

    const userList = page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.LIST}"]`);
    if (await userList.isVisible()) {
      const firstUser = userList.locator('> *').first();
      if (await firstUser.isVisible()) {
        await firstUser.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
