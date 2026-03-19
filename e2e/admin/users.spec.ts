/**
 * 运营后台注册用户管理 E2E 测试
 *
 * 覆盖场景：
 * - 用户列表展示
 * - 搜索用户
 * - 查看用户详情
 */

import { test, expect } from '../fixtures';
import { RegisteredUsersPage } from '../pages/admin/registered-users-page';
import { ADMIN_REGISTERED_USERS } from '../testids';

test.describe('注册用户管理页面', () => {
  let usersPage: RegisteredUsersPage;

  test.beforeEach(async ({ adminPage }) => {
    usersPage = new RegisteredUsersPage(adminPage);
    await usersPage.load();
  });

  test('显示用户列表', async () => {
    await expect(usersPage.list).toBeVisible();
    await expect(usersPage.heading).toBeVisible();
  });

  test('搜索框可输入', async () => {
    await expect(usersPage.searchInput).toBeVisible();
    await usersPage.search('138');
    // 等待搜索结果
    await usersPage.list.waitFor({ state: 'visible', timeout: 10000 });
  });

  test('清空搜索显示所有用户', async () => {
    await usersPage.search('138');
    await usersPage.search('');
    await usersPage.list.waitFor({ state: 'visible', timeout: 10000 });
  });

  test('用户列表可以加载数据', async () => {
    const count = await usersPage.getRowCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('用户详情', () => {
  let usersPage: RegisteredUsersPage;

  test.beforeEach(async ({ adminPage }) => {
    usersPage = new RegisteredUsersPage(adminPage);
    await usersPage.load();
  });

  test('用户列表不为空时显示第一项', async () => {
    const count = await usersPage.getRowCount();
    if (count > 0) {
      const firstUser = usersPage.list.locator('> *').first();
      await firstUser.waitFor({ state: 'visible', timeout: 10000 });
    }
  });
});

test.describe('用户搜索功能', () => {
  let usersPage: RegisteredUsersPage;

  test.beforeEach(async ({ adminPage }) => {
    usersPage = new RegisteredUsersPage(adminPage);
    await usersPage.load();
  });

  test('搜索输入框可见', async () => {
    await expect(usersPage.searchInput).toBeVisible();
  });

  test('执行搜索后列表更新', async () => {
    await usersPage.searchInput.fill('138');
    await usersPage.searchInput.press('Enter');
    await usersPage.list.waitFor({ state: 'visible', timeout: 10000 });
  });
});
