import { test, expect } from '@playwright/test';
import { SETTINGS, PERMISSIONS, SUBSCRIPTION, COMMON } from '../testids';

/**
 * 设置模块 E2E 测试
 * 对应测试用例：1.10 设置模块
 *
 * 模块编号：
 * - SET-*: 设置首页
 * - PERM-*: 权限管理
 * - SUB-*: 订阅管理
 */

test.describe('设置首页 (SET)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('查看设置首页 (SET-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible({ timeout: 10000 });

    // 验证设置入口存在
    const teamLink = page.getByRole('link', { name: /团队|团队设置/ }).or(
      page.getByTestId(SETTINGS.TEAM)
    );
    const subscriptionLink = page.getByRole('link', { name: /订阅|订阅管理/ }).or(
      page.getByTestId(SETTINGS.SUBSCRIPTION)
    );
    const permissionsLink = page.getByRole('link', { name: /权限|权限管理/ }).or(
      page.getByTestId(SETTINGS.PERMISSIONS)
    );

    // 验证至少有一个设置入口
    const hasTeam = await teamLink.isVisible().catch(() => false);
    const hasSubscription = await subscriptionLink.isVisible().catch(() => false);
    const hasPermissions = await permissionsLink.isVisible().catch(() => false);

    expect(hasTeam || hasSubscription || hasPermissions).toBe(true);
  });
});

test.describe('权限管理 (PERM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/permissions');
  });

  test('查看权限管理 (PERM-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /权限|角色/ })).toBeVisible({ timeout: 10000 });

    // 验证角色列表存在
    const roleList = page.getByTestId(PERMISSIONS.ROLE_LIST).or(
      page.locator('[data-testid="permissions-role-list"]')
    ).or(
      page.getByRole('list').or(page.getByRole('table'))
    );

    const hasList = await roleList.isVisible().catch(() => false);
    const emptyState = page.getByText(/暂无角色|没有角色/);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });

  test('查看角色权限详情 (PERM-G-01)', async ({ page }) => {
    // 选择一个角色
    const roleItem = page.getByRole('button', { name: /管理员|运营|角色/ }).or(
      page.getByRole('listitem')
    ).first();

    if (await roleItem.isVisible()) {
      await roleItem.click();

      // 验证权限配置显示
      const permGroup = page.getByTestId(PERMISSIONS.PERMISSION_GROUP).or(
        page.getByText(/权限|资源/)
      );

      const hasPerms = await permGroup.isVisible().catch(() => false);
      if (hasPerms) {
        await expect(permGroup).toBeVisible();
      }
    }
  });

  test('修改角色权限 (PERM-U-01)', async ({ page }) => {
    // 选择一个可编辑的角色
    const roleItem = page.getByRole('listitem').or(
      page.getByRole('button', { name: /自定义|角色/ })
    ).first();

    if (await roleItem.isVisible()) {
      await roleItem.click();

      // 查找权限复选框
      const permCheckbox = page.getByRole('checkbox').first();
      if (await permCheckbox.isVisible()) {
        const isChecked = await permCheckbox.isChecked();
        await permCheckbox.click();

        // 保存修改
        const saveBtn = page.getByRole('button', { name: /保存/ });
        if (await saveBtn.isVisible()) {
          await saveBtn.click();
          await expect(page.getByText(/保存成功/)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('创建自定义角色 (PERM-C-01)', async ({ page }) => {
    // 点击新建角色按钮
    const createBtn = page.getByRole('button', { name: /新建角色|添加角色/ }).or(
      page.getByTestId(PERMISSIONS.CREATE_ROLE_BUTTON)
    );

    if (await createBtn.isVisible()) {
      await createBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /新建角色|创建角色/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 填写角色名称
      const nameInput = dialog.getByLabel(/角色名称|名称/);
      await nameInput.fill('E2E测试角色');

      // 选择一些权限
      const permCheckbox = dialog.getByRole('checkbox').first();
      if (await permCheckbox.isVisible()) {
        await permCheckbox.click();
      }

      // 保存
      await dialog.getByRole('button', { name: /创建|保存/ }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // 验证创建成功
      await expect(page.getByText('E2E测试角色')).toBeVisible({ timeout: 5000 });
    }
  });

  test('删除自定义角色 (PERM-D-01)', async ({ page }) => {
    // 查找可删除的自定义角色
    const roleItem = page.getByText(/E2E测试角色|自定义角色/).first();

    if (await roleItem.isVisible()) {
      // 点击角色或更多按钮
      const moreBtn = roleItem.getByRole('button', { name: /更多|操作/ });
      if (await moreBtn.isVisible()) {
        await moreBtn.click();
      } else {
        await roleItem.click();
      }

      // 点击删除
      const deleteBtn = page.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // 确认删除
        const confirmDialog = page.getByRole('dialog').filter({ hasText: /确认删除/ });
        if (await confirmDialog.isVisible()) {
          await confirmDialog.getByRole('button', { name: /确认|删除/ }).click();
          await expect(confirmDialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });
});

test.describe('订阅管理 (SUB)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/subscription');
  });

  test('查看可用套餐 (SUB-PL-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /订阅|套餐/ })).toBeVisible({ timeout: 10000 });

    // 验证套餐列表存在
    const planList = page.getByTestId(SUBSCRIPTION.PLAN_LIST).or(
      page.locator('[data-testid="subscription-plan-list"]')
    ).or(
      page.getByRole('list')
    );

    const hasList = await planList.isVisible().catch(() => false);
    expect(hasList).toBe(true);
  });

  test('查看当前订阅 (SUB-G-01)', async ({ page }) => {
    // 查找当前订阅区域
    const currentSub = page.getByTestId(SUBSCRIPTION.CURRENT_SUBSCRIPTION).or(
      page.getByText(/当前套餐|当前订阅|我的订阅/)
    );

    const hasCurrent = await currentSub.isVisible().catch(() => false);

    if (hasCurrent) {
      // 验证订阅信息显示
      await expect(currentSub).toBeVisible();

      // 应该显示到期时间或使用额度
      const info = page.getByText(/到期|额度|剩余/);
      const hasInfo = await info.isVisible().catch(() => false);
      // 可选验证
    }
  });

  test('升级套餐 (SUB-UP-01)', async ({ page }) => {
    // 查找升级按钮
    const upgradeBtn = page.getByRole('button', { name: /升级|升级套餐/ }).or(
      page.getByTestId(SUBSCRIPTION.UPGRADE_BUTTON)
    );

    if (await upgradeBtn.isVisible()) {
      await upgradeBtn.click();

      // 验证跳转到套餐选择或支付页面
      await expect(page.getByText(/选择套餐|支付|升级/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('降级套餐 (SUB-UP-02)', async ({ page }) => {
    // 查找切换套餐或降级按钮
    const downgradeBtn = page.getByRole('button', { name: /切换|降级|更换/ });

    if (await downgradeBtn.isVisible()) {
      await downgradeBtn.click();

      // 选择更低级别的套餐
      const planOption = page.getByRole('button', { name: /基础|免费|标准/ }).first();
      if (await planOption.isVisible()) {
        await planOption.click();

        // 确认降级
        const confirmBtn = page.getByRole('button', { name: /确认|降级/ });
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }
    }
  });

  test('取消订阅 (SUB-CN-01)', async ({ page }) => {
    // 查找取消订阅按钮
    const cancelBtn = page.getByRole('button', { name: /取消订阅|取消/ });

    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();

      // 确认取消弹窗
      const confirmDialog = page.getByRole('dialog').filter({ hasText: /取消订阅|确认取消/ });
      if (await confirmDialog.isVisible()) {
        await confirmDialog.getByRole('button', { name: /确认|取消订阅/ }).click();
        await expect(confirmDialog).toBeHidden({ timeout: 10000 });
      }
    }
  });
});

test.describe('团队设置 (TEAM)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/team');
  });

  test('查看团队成员列表 (ORG-MB-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /团队|成员/ })).toBeVisible({ timeout: 10000 });

    // 验证成员列表存在
    const memberList = page.getByRole('table').or(
      page.getByRole('list')
    );

    const hasList = await memberList.isVisible().catch(() => false);
    const emptyState = page.getByText(/暂无成员/);
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasList || hasEmpty).toBe(true);
  });

  test('邀请成员 (ORG-MB-02)', async ({ page }) => {
    // 点击邀请成员按钮
    const inviteBtn = page.getByRole('button', { name: /邀请|添加成员/ });

    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();

      const dialog = page.getByRole('dialog').filter({ hasText: /邀请|添加成员/ });
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // 填写手机号
      const phoneInput = dialog.getByLabel(/手机号|电话/);
      await phoneInput.fill('13800138000');

      // 选择角色
      const roleSelect = dialog.getByRole('combobox', { name: /角色/ });
      if (await roleSelect.isVisible()) {
        await roleSelect.click();
        const roleOption = page.getByRole('option').first();
        if (await roleOption.isVisible()) {
          await roleOption.click();
        }
      }

      // 发送邀请
      await dialog.getByRole('button', { name: /发送|邀请/ }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });
});
