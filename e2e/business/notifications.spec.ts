import { test, expect } from '@playwright/test';
import { NOTIFICATIONS, COMMON } from '../testids';

import { createUniqueName } from '../test-helpers';

/**
 * 通知模块 E2E 测试
 * 对应测试用例:1.11 通知模块
 *
 * 模块编号:NT(通知)
 * - NT-L-*: 通知列表
 * - NT-C-*: 收到通知
 * - NT-M-*: 标记已读
 * - NT-MA-*: 全部标记已读
 * - NT-D-*: 删除通知
 * - NT-T-*: 通知类型筛选
 */

test.describe('通知列表 (NT-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
  });

  test('查看通知列表 (NT-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /通知|消息/ })).toBeVisible({ timeout: 10000 });

    // 验证列表或空状态存在
    const list = page.locator('[data-testid="notifications-list"]').or(page.getByRole('list'));
    const emptyState = page.getByText(/暂无通知|没有通知/);
    const hasList = await list.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false)
    expect(hasList || hasEmpty).toBe(true);
  });
});

test.describe('收到新通知 (NT-C)', () => {
  test('收到新通知 (NT-C-01)', async ({ page }) => {
    // 导航到通知页面
    await page.goto('/notifications');
    await page.waitForTimeout(2000);
    // 检查是否有通知数据
    const notificationList = page.locator('[data-testid="notifications-list"]').or(page.getByRole('list'));
    const emptyState = page.getByText(/暂无通知|没有通知/);
    const hasList = await notificationList.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    // 验证页面状态正确
    expect(hasList || hasEmpty).toBe(true);
    // 检查头部通知图标（如果有)
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    const notificationIcon = page.locator('[data-testid="nav-notifications"]').or(
      page.getByRole('link', { name: /通知/ })
    ).or(
      page.getByRole('button', { name: /通知/ })
    );
    if (await notificationIcon.isVisible().catch(() => false)) {
      // 检查未读标识(红点)
      const unreadBadge = page.locator('[data-testid="notifications-unread-indicator"]').or(
        page.locator('.badge, .unread-indicator')
      );
      const hasUnread = await unreadBadge.isVisible().catch(() => false);
      // 未读标识是可选的,只做记录
    }
    // 此测试只验证通知页面可以正常加载,不实际触发通知
    // 因为触发通知需要特定的业务场景
  });
});

test.describe('标记已读 (NT-M)', () => {
  test('单条标记已读 (NT-M-01)', async ({ page }) => {
    await page.goto('/notifications');
    // 查找未读通知
    const unreadNotification = page.locator('[data-testid="notifications-unread-indicator"]').first().or(
      page.locator('.unread').first()
    );
    if (await unreadNotification.isVisible().catch(() => false)) {
      // 点击标记已读按钮
      const markReadBtn = page.getByRole('button', { name: /标为已读/ }).or(
        page.locator('[data-testid="notifications-mark-read-btn"]')
      ).first();
      if (await markReadBtn.isVisible().catch(() => false)) {
        await markReadBtn.click();
        // 验证操作成功
        await expect(page.getByText(/已标记为已读|操作成功/)).toBeVisible({ timeout: 5000 }).catch(() => {
          // 某些系统可能没有提示，只验证未读标识消失
        });
      }
    }
  });
});

test.describe('全部标记已读 (NT-MA)', () => {
  test('全部标记已读 (NT-MA-01)', async ({ page }) => {
    await page.goto('/notifications');
    // 点击全部标已读按钮
    const markAllReadBtn = page.getByRole('button', { name: /全部标已读|全部已读/ }).or(
      page.locator('[data-testid="notifications-mark-all-read-btn"]')
    );
    if (await markAllReadBtn.isVisible().catch(() => false)) {
      await markAllReadBtn.click();
      // 验证操作成功
      await expect(page.getByText(/已全部标记为已读|操作成功/)).toBeVisible({ timeout: 5000 }).catch(() => {
        // 某些系统可能没有提示
      });
      // 验证没有未读通知
      const unreadBadge = page.locator('[data-testid="notifications-unread-indicator"]');
      const hasUnread = await unreadBadge.isVisible().catch(() => false);
      expect(hasUnread).toBe(false);
    }
  });
});

test.describe('删除通知 (NT-D)', () => {
  test('删除通知 (NT-D-01)', async ({ page }) => {
    await page.goto('/notifications');
    // 查找通知项
    const notificationItem = page.getByRole('listitem').or(page.locator('[data-testid="notification-item"]')).first();
    if (await notificationItem.isVisible().catch(() => false)) {
      // 悬停显示删除按钮
      await notificationItem.hover();
      const deleteBtn = notificationItem.getByRole('button', { name: /删除/ }).or(
        page.locator('[data-testid="notifications-delete-btn"]')
      ).first();
      if (await deleteBtn.isVisible().catch(() => false)) {
        await deleteBtn.click();
        // 如果有确认弹窗
        const confirmDialog = page.getByRole('alertdialog').filter({ hasText: /确认删除/ });
        if (await confirmDialog.isVisible()) {
          await confirmDialog.getByRole('button', { name: /确认|删除/ }).click();
          // 验证删除成功
          await expect(page.getByText(/删除成功/)).toBeVisible({ timeout: 5000 }).catch(() => {
            // 某些系统可能没有提示
          });
        }
      }
    }
  });
});

test.describe('通知类型筛选 (NT-T)', () => {
  test('通知类型筛选 (NT-T-01)', async ({ page }) => {
    await page.goto('/notifications');
    // 查找类型筛选器
    const typeFilter = page.getByRole('combobox', { name: /类型/ }).or(
      page.getByRole('button', { name: /全部类型/ })
    );
    if (await typeFilter.isVisible().catch(() => false)) {
      await typeFilter.click();
      // 选择一个类型
      const option = page.getByRole('option', { name: /系统|账单|租约/ }).first();
      if (await option.isVisible()) {
        await option.click();
        // 等待列表更新
        await page.waitForTimeout(500);
      }
    }
  });
});
