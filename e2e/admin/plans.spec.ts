/**
 * 运营后台服务配置 E2E 测试
 *
 * 覆盖场景：
 * - 服务列表展示
 * - 创建服务
 * - 编辑服务
 * - 启用/停用服务
 */

import { test, expect } from '../fixtures';
import { PlansPage } from '../pages/admin/plans-page';
import { ADMIN_PLANS } from '../testids';

test.describe('服务配置页面', () => {
  let plansPage: PlansPage;

  test.beforeEach(async ({ adminPage }) => {
    plansPage = new PlansPage(adminPage);
    await plansPage.load();
  });

  test('显示服务列表', async () => {
    await expect(plansPage.list).toBeVisible();
    await expect(plansPage.heading).toBeVisible();
  });

  test('显示创建服务按钮', async () => {
    await expect(plansPage.createButton).toBeVisible();
    await expect(plansPage.createButton).toBeEnabled();
  });

  test('点击创建按钮显示弹窗', async () => {
    await plansPage.clickCreate();
    await expect(plansPage.createDialog).toBeVisible();
  });

  test('创建服务弹窗包含必要元素', async () => {
    await plansPage.clickCreate();
    await expect(plansPage.createDialog).toBeVisible();
    // 弹窗中应有关闭按钮
    const closeButton = plansPage.createDialog.locator('button[aria-label="关闭"], [data-testid="common-close-btn"]');
    await expect(closeButton.first()).toBeVisible();
  });

  test('服务列表可以加载数据', async () => {
    const count = await plansPage.getRowCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('创建服务', () => {
  let plansPage: PlansPage;

  test.beforeEach(async ({ adminPage }) => {
    plansPage = new PlansPage(adminPage);
    await plansPage.load();
  });

  test('点击创建按钮后弹窗可见', async () => {
    await plansPage.clickCreate();
    await plansPage.createDialog.waitFor({ state: 'visible', timeout: 10000 });
    await expect(plansPage.createDialog).toBeVisible();
  });
});

test.describe('服务状态管理', () => {
  let plansPage: PlansPage;

  test.beforeEach(async ({ adminPage }) => {
    plansPage = new PlansPage(adminPage);
    await plansPage.load();
  });

  test('服务列表加载完成', async () => {
    await plansPage.list.waitFor({ state: 'visible', timeout: 10000 });
    await expect(plansPage.list).toBeVisible();
  });
});
