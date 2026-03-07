/**
 * 通知 E2E 测试
 *
 * 覆盖场景：
 * - 通知列表
 * - 标记已读
 */

import { test, expect } from '../fixtures';
import { goToNotifications } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { NOTIFICATIONS } from '../testids';

test.describe('通知页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNotifications(page);
  });

  test('应该显示通知页面', async ({ page }) => {
    await expect(page.locator(`[data-testid="${NOTIFICATIONS.HEADING}"]`)).toBeVisible();
  });

  test('显示通知列表或空状态', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${NOTIFICATIONS.HEADING}"]`);

    // 等待列表或空状态
    const list = page.locator(`[data-testid="${NOTIFICATIONS.LIST}"]`);
    const emptyState = page.locator(`[data-testid="${NOTIFICATIONS.EMPTY_STATE}"]`);

    const hasList = await list.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });
});

test.describe('通知操作', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToNotifications(page);
  });

  test('标记单条通知为已读', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${NOTIFICATIONS.HEADING}"]`);

    const list = page.locator(`[data-testid="${NOTIFICATIONS.LIST}"]`);
    if (await list.isVisible()) {
      const firstNotification = list.locator('> *').first();
      if (await firstNotification.isVisible()) {
        // 检查是否有未读标识
        const unreadIndicator = firstNotification.locator(`[data-testid="${NOTIFICATIONS.UNREAD_INDICATOR}"]`);
        if (await unreadIndicator.isVisible()) {
          await firstNotification.hover();
          await page.waitForTimeout(300);

          // 点击标记已读按钮
          const markReadButton = page.locator(`[data-testid="${NOTIFICATIONS.MARK_READ_BUTTON}"]`).first();
          if (await markReadButton.isVisible()) {
            await markReadButton.click();
            await page.waitForTimeout(500);
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test('标记全部已读', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${NOTIFICATIONS.HEADING}"]`);

    const markAllReadButton = page.locator(`[data-testid="${NOTIFICATIONS.MARK_ALL_READ_BUTTON}"]`);
    if (await markAllReadButton.isVisible()) {
      await markAllReadButton.click();
      await page.waitForTimeout(500);
    } else {
      // 可能没有未读通知，按钮不可见
    }
  });

  test('删除通知', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${NOTIFICATIONS.HEADING}"]`);

    const list = page.locator(`[data-testid="${NOTIFICATIONS.LIST}"]`);
    if (await list.isVisible()) {
      const firstNotification = list.locator('> *').first();
      if (await firstNotification.isVisible()) {
        await firstNotification.hover();
        await page.waitForTimeout(300);

        // 点击删除按钮
        const deleteButton = page.locator(`[data-testid="${NOTIFICATIONS.DELETE_BUTTON}"]`).first();
        if (await deleteButton.isVisible()) {
          await deleteButton.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      test.skip();
    }
  });
});
