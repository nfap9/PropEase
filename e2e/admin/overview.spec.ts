/**
 * 运营后台概览页 E2E 测试
 *
 * 覆盖场景：
 * - 概览页统计数据展示
 * - 退出登录
 */

import { test, expect } from '../fixtures';
import { OverviewPage } from '../pages/admin/overview-page';
import { ADMIN } from '../testids';

test.describe('运营后台概览页', () => {
  let overviewPage: OverviewPage;

  test.beforeEach(async ({ adminPage }) => {
    overviewPage = new OverviewPage(adminPage);
    await overviewPage.load();
  });

  test('显示统计数据卡片', async () => {
    // 等待卡片可见
    await overviewPage.apartmentCountCard.waitFor({ state: 'visible', timeout: 10000 });
    await overviewPage.roomCountCard.waitFor({ state: 'visible', timeout: 10000 });

    // 验证卡片内容非空
    const apartmentCount = await overviewPage.getStatCardValue(ADMIN.APARTMENT_COUNT);
    expect(apartmentCount.trim().length).toBeGreaterThan(0);
  });

  test('显示房间数统计', async () => {
    await overviewPage.apartmentCountCard.waitFor({ state: 'visible', timeout: 10000 });
    await overviewPage.roomCountCard.waitFor({ state: 'visible', timeout: 10000 });

    const roomCount = await overviewPage.getStatCardValue(ADMIN.ROOM_COUNT);
    expect(roomCount.trim().length).toBeGreaterThan(0);
  });

  test('退出登录成功', async () => {
    await overviewPage.logout();
    await expect(overviewPage.page).toHaveURL(/admin\/login/);
  });
});

test.describe('运营后台概览页 - 导航测试', () => {
  let overviewPage: OverviewPage;

  test.beforeEach(async ({ adminPage }) => {
    overviewPage = new OverviewPage(adminPage);
    await overviewPage.load();
  });

  test('概览页标题可见', async () => {
    await expect(overviewPage.heading).toBeVisible();
  });

  test('概览页显示所有统计卡片', async () => {
    await expect(overviewPage.apartmentCountCard).toBeVisible();
    await expect(overviewPage.roomCountCard).toBeVisible();
    await expect(overviewPage.occupancyRateCard).toBeVisible();
    await expect(overviewPage.monthlyRevenueCard).toBeVisible();
  });
});
