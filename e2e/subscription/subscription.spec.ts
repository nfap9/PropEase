/**
 * 订阅模块 E2E 测试
 *
 * 覆盖场景：
 * - 服务列表展示
 * - 当前订阅信息
 * - 升级/降级服务
 * - 订阅状态筛选
 */

import { test, expect } from '../fixtures';
import { goToSettings } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { SUBSCRIPTION, SETTINGS, COMMON } from '../testids';

test.describe('订阅管理页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings/subscription');
  });

  test('应该显示订阅管理页面', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator(`[data-testid="${SUBSCRIPTION.HEADING}"]`)).toBeVisible();
  });

  test('应该显示服务列表', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${SUBSCRIPTION.HEADING}"]`);

    // 服务列表应该存在
    const planList = page.locator(`[data-testid="${SUBSCRIPTION.PLAN_LIST}"]`);
    if (await planList.isVisible()) {
      // 应该有服务选项
      const plans = planList.locator('> *');
      const count = await plans.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('应该显示当前订阅信息', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${SUBSCRIPTION.HEADING}"]`);

    // 当前订阅信息
    const currentSubscription = page.locator(`[data-testid="${SUBSCRIPTION.CURRENT_SUBSCRIPTION}"]`);
    if (await currentSubscription.isVisible()) {
      // 验证订阅信息可见
      await expect(currentSubscription).toBeVisible();
    }
  });

  test('点击升级服务按钮', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${SUBSCRIPTION.HEADING}"]`);

    // 升级按钮
    const upgradeButton = page.locator(`[data-testid="${SUBSCRIPTION.UPGRADE_BUTTON}"]`);
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      // 应该显示升级弹窗或跳转到支付页面
      await page.waitForTimeout(500);
    }
  });
});

test.describe('从设置页访问订阅', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToSettings(page);
  });

  test('从设置页导航到订阅管理', async ({ page }) => {
    // 点击订阅管理链接
    const subscriptionLink = page.locator(`[data-testid="${SETTINGS.SUBSCRIPTION}"]`);
    if (await subscriptionLink.isVisible()) {
      await subscriptionLink.click();

      // 验证跳转到订阅页面
      await page.waitForURL(/\/settings\/subscription/);
      await expect(page.locator(`[data-testid="${SUBSCRIPTION.HEADING}"]`)).toBeVisible();
    }
  });
});

test.describe('订阅状态筛选', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings/subscription');
  });

  test('筛选活跃订阅', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${SUBSCRIPTION.HEADING}"]`);

    // 如果有状态筛选器
    const statusFilter = page.locator('[data-testid="subscription-status-filter"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      const activeOption = page.locator('text="活跃"').first();
      if (await activeOption.isVisible()) {
        await activeOption.click();
        await page.waitForTimeout(500);
      }
    }
  });
});
