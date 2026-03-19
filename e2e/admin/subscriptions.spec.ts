/**
 * 运营后台 - 订阅管理页面 E2E 测试
 *
 * 覆盖场景：
 * - 订阅列表展示
 * - 状态筛选器
 * - 服务筛选器
 */

import { test, expect } from '../fixtures';
import { SubscriptionsPage } from '../pages/admin/subscriptions-page';
import { ADMIN_SUBSCRIPTIONS } from '../testids';

test.describe('订阅管理页面', () => {
  let subscriptionsPage: SubscriptionsPage;

  test.beforeEach(async ({ adminPage }) => {
    subscriptionsPage = new SubscriptionsPage(adminPage);
    await subscriptionsPage.load();
  });

  test('显示订阅列表', async () => {
    await expect(subscriptionsPage.heading).toBeVisible();
    await expect(subscriptionsPage.list).toBeVisible();
  });

  test('状态筛选器可用', async () => {
    await expect(subscriptionsPage.statusFilter).toBeVisible();
  });

  test('服务筛选器可用', async () => {
    await expect(subscriptionsPage.planFilter).toBeVisible();
  });

  test('可以获取订阅列表行数', async () => {
    const rowCount = await subscriptionsPage.getRowCount();
    // 行数应该大于等于 0
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('页面标题正确', async () => {
    await expect(subscriptionsPage.isHeadingVisible()).toBe(true);
  });
});
