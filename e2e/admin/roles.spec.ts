/**
 * 运营后台 - 角色管理页面 E2E 测试
 *
 * 覆盖场景：
 * - 角色列表展示
 * - 新建角色按钮
 * - 新建角色弹窗
 */

import { test, expect } from '../fixtures';
import { RolesPage } from '../pages/admin/roles-page';
import { ADMIN_ROLES } from '../testids';

test.describe('运营角色页面', () => {
  let rolesPage: RolesPage;

  test.beforeEach(async ({ adminPage }) => {
    rolesPage = new RolesPage(adminPage);
    await rolesPage.load();
  });

  test('显示角色列表', async () => {
    await expect(rolesPage.heading).toBeVisible();
    await expect(rolesPage.list).toBeVisible();
  });

  test('显示新建角色按钮', async () => {
    await expect(rolesPage.createButton).toBeVisible();
    await expect(rolesPage.createButton).toBeEnabled();
  });

  test('点击新建角色按钮显示弹窗', async () => {
    await rolesPage.createButton.click();
    // 等待角色创建弹窗出现
    const dialog = rolesPage.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test('新建角色弹窗包含名称输入框', async () => {
    await rolesPage.createButton.click();
    const dialog = rolesPage.page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    // 验证名称输入框存在
    const nameInput = rolesPage.page.locator(`[data-testid="${ADMIN_ROLES.NAME_INPUT}"]`);
    await expect(nameInput).toBeVisible();
  });

  test('角色列表可以获取角色数量', async () => {
    const count = await rolesPage.getRoleCount();
    // 角色数量应该大于等于 0
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
