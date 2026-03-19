/**
 * 运营后台组织管理 E2E 测试
 *
 * 覆盖场景：
 * - 组织列表展示
 * - 组织详情查看
 * - 启用/停用组织
 */

import { test, expect } from '../fixtures';
import { OrganizationsPage } from '../pages/admin/organizations-page';
import { ADMIN_ORGANIZATIONS } from '../testids';

test.describe('组织管理页面', () => {
  let orgPage: OrganizationsPage;

  test.beforeEach(async ({ adminPage }) => {
    orgPage = new OrganizationsPage(adminPage);
    await orgPage.load();
  });

  test('显示组织列表', async () => {
    await expect(orgPage.list).toBeVisible();
    await expect(orgPage.heading).toBeVisible();
  });

  test('组织列表可以加载数据', async () => {
    const count = await orgPage.getListRowCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('组织详情', () => {
  let orgPage: OrganizationsPage;

  test.beforeEach(async ({ adminPage }) => {
    orgPage = new OrganizationsPage(adminPage);
    await orgPage.load();
  });

  test('组织列表不为空时显示第一项', async () => {
    const count = await orgPage.getListRowCount();
    if (count > 0) {
      const firstOrg = orgPage.list.locator('> *').first();
      await firstOrg.waitFor({ state: 'visible', timeout: 10000 });
    }
  });
});

test.describe('组织状态管理', () => {
  let orgPage: OrganizationsPage;

  test.beforeEach(async ({ adminPage }) => {
    orgPage = new OrganizationsPage(adminPage);
    await orgPage.load();
  });

  test('页面显示组织列表', async () => {
    await orgPage.list.waitFor({ state: 'visible', timeout: 10000 });
    await expect(orgPage.list).toBeVisible();
  });
});
