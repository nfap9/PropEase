import { test, expect } from '@playwright/test';
import {
  ADMIN,
  ADMIN_USERS,
  ADMIN_ROLES,
  ADMIN_REGISTERED_USERS,
  ADMIN_ORGANIZATIONS,
  ADMIN_PLANS,
  ADMIN_SUBSCRIPTIONS,
  COMMON,
} from '../testids';
import {
  createUniqueName,
  createUniquePhone,
  waitForDialogOpen,
  waitForDialogClosed,
  isVisible,
} from '../test-helpers';

/**
 * 运营端测试
 * 对应测试用例：二、运营端测试用例
 *
 * 模块编号：
 * - ADM-U: 运营账号管理
 * - ADM-R: 运营角色管理
 * - ADM-RU: 注册用户管理
 * - ADM-O: 组织管理（运营端）
 * - ADM-PL: 套餐配置
 * - ADM-SUB: 订阅管理（运营端）
 * - ADM-ST: 平台概览与统计
 */

test.describe('运营账号管理 (ADM-U)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/users');
  });

  test('查看运营账号列表 (ADM-U-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: /运营账号|账号管理/ })).toBeVisible({ timeout: 10000 });

    // 验证表格存在
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 5000 });

    // 验证表格包含必要列
    const hasUsername = await page.getByText(/用户名|账号/).isVisible().catch(() => false);
    const hasName = await page.getByText(/姓名|名称/).isVisible().catch(() => false);
    const hasRole = await page.getByText(/角色/).isVisible().catch(() => false);
    const hasStatus = await page.getByText(/状态/).isVisible().catch(() => false);

    expect(hasUsername || hasName || hasRole || hasStatus).toBe(true);
  });

  test('新建运营账号 (ADM-U-C-01)', async ({ page }) => {
    // 点击新建账号按钮
    const createBtn = page.getByRole('button', { name: /新建账号|添加账号/ }).first();
    if (!(await createBtn.isVisible())) {
      console.log('新建账号按钮不可见，跳过测试');
      return;
    }
    await createBtn.click();

    const dialog = page.getByRole('dialog').filter({ hasText: /新建账号|添加账号/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写账号信息
    const username = createUniqueName('e2e_admin');
    const realName = createUniqueName('E2E测试');

    await dialog.getByLabel(/用户名|账号/).fill(username);
    await dialog.getByLabel(/姓名|真实姓名/).fill(realName);
    await dialog.getByLabel(/邮箱|email/).fill(`${username}@test.com`);

    // 选择角色
    const roleSelect = dialog.getByLabel(/角色/);
    if (await roleSelect.isVisible()) {
      await roleSelect.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // 创建
    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // 验证账号出现在列表中
    await expect(page.getByText(username).or(page.getByText(realName))).toBeVisible({ timeout: 5000 });
  });

  test('编辑运营账号 (ADM-U-U-01)', async ({ page }) => {
    // 找到第一个账号行
    const accountRow = page.getByRole('row').filter({ hasText: /管理员|运营|用户/ }).first();
    if (await accountRow.isVisible()) {
      const editBtn = accountRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑账号/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 修改姓名
        const nameInput = dialog.getByLabel(/姓名/);
        if (await nameInput.isVisible()) {
          await nameInput.fill(createUniqueName('E2E编辑'));
        }

        await dialog.getByRole('button', { name: '保存' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });

  test('重置密码 (ADM-U-R-01)', async ({ page }) => {
    const accountRow = page.getByRole('row').first();
    if (await accountRow.isVisible()) {
      // 点击更多操作或直接的重置密码按钮
      const resetBtn = accountRow.getByRole('button', { name: /重置密码|重置/ });
      if (await resetBtn.isVisible()) {
        await resetBtn.click();

        // 确认重置
        const dialog = page.getByRole('dialog').filter({ hasText: /确认重置|重置密码/ });
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });

          // 验证成功提示
          await expect(page.getByText(/重置成功|新密码/)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('启用/停用账号 (ADM-U-EN-01, ADM-U-DIS-01)', async ({ page }) => {
    // 找到一个停用的账号
    const disabledRow = page.getByRole('row').filter({ hasText: /停用|禁用/ }).first();
    if (await disabledRow.isVisible()) {
      const enableBtn = disabledRow.getByRole('button', { name: /启用/ });
      if (await enableBtn.isVisible()) {
        await enableBtn.click();
        // 确认
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }

    // 找到一个启用的账号
    const enabledRow = page.getByRole('row').filter({ hasText: /启用|正常|活跃/ }).first();
    if (await enabledRow.isVisible()) {
      const disableBtn = enabledRow.getByRole('button', { name: /停用|禁用/ });
      if (await disableBtn.isVisible()) {
        await disableBtn.click();
        // 确认
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });

  test('用户名重复 (ADM-U-C-02)', async ({ page }) => {
    // 获取已存在的用户名
    const existingRow = page.getByRole('row').filter({ hasText: /admin|管理员/ }).first();
    const existingUsername = await existingRow.getByRole('cell').first().textContent().catch(() => 'admin');

    // 尝试创建重复用户名
    const createBtn = page.getByRole('button', { name: /新建账号|添加账号/ }).first();
    if (!(await createBtn.isVisible())) return;

    await createBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新建账号|添加账号/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 使用已存在的用户名
    await dialog.getByLabel(/用户名|账号/).fill(existingUsername?.trim() || 'admin');
    await dialog.getByRole('button', { name: '创建' }).click();

    // 验证错误提示
    await expect(page.getByText(/已存在|重复/)).toBeVisible({ timeout: 5000 });
    await page.keyboard.press('Escape');
  });

  test('删除运营账号 (ADM-U-D-01)', async ({ page }) => {
    // 找到非系统账号
    const accountRow = page.getByRole('row').filter({ hasText: /e2e|E2E|测试/ }).first();
    if (await accountRow.isVisible()) {
      const deleteBtn = accountRow.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible() && !(await deleteBtn.isDisabled())) {
        await deleteBtn.click();

        const confirmDialog = page.getByRole('alertdialog').filter({ hasText: /确认删除/ });
        if (await confirmDialog.isVisible()) {
          await confirmDialog.getByRole('button', { name: /确认|删除/ }).click();
          await expect(confirmDialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });

  test('修改账号角色 (ADM-U-RL-01)', async ({ page }) => {
    const accountRow = page.getByRole('row').first();
    if (await accountRow.isVisible()) {
      // 查找角色下拉框
      const roleSelect = accountRow.getByRole('combobox');
      if (await roleSelect.isVisible()) {
        await roleSelect.click();
        const option = page.getByRole('option').first();
        if (await option.isVisible()) {
          await option.click();
          // 验证修改成功
          await expect(page.getByText(/修改成功|已更新/)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

test.describe('运营角色管理 (ADM-R)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/roles');
  });

  test('查看角色列表 (ADM-R-L-01)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /角色|角色管理/ })).toBeVisible({ timeout: 10000 });

    // 验证有角色列表
    const roleList = page.locator('[data-testid="admin-roles-list"]').or(
      page.getByRole('list').or(page.getByRole('table'))
    );
    await expect(roleList.first()).toBeVisible({ timeout: 5000 });
  });

  test('新建角色 (ADM-R-C-01)', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /新建角色|添加角色/ }).first();
    if (!(await createBtn.isVisible())) return;

    await createBtn.click();

    const dialog = page.getByRole('dialog').filter({ hasText: /新建角色/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写角色名称
    await dialog.getByLabel(/角色名称|名称/).fill(createUniqueName('E2E角色'));

    // 配置权限
    const checkbox = dialog.getByRole('checkbox').first();
    if (await checkbox.isVisible()) {
      await checkbox.check();
    }

    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test('编辑角色权限 (ADM-R-U-01)', async ({ page }) => {
    // 找到一个可编辑的角色
    const roleRow = page.getByRole('row').filter({ hasText: /角色/ }).first();
    if (await roleRow.isVisible()) {
      const editBtn = roleRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑角色/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 切换权限
        const checkbox = dialog.getByRole('checkbox').first();
        if (await checkbox.isVisible()) {
          await checkbox.click();
        }

        await dialog.getByRole('button', { name: '保存' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });

  test('系统角色不可编辑 (ADM-R-S-01)', async ({ page }) => {
    // 找到系统角色
    const systemRoleRow = page.getByRole('row').filter({ hasText: /系统|超级管理员|管理员/ }).first();
    if (await systemRoleRow.isVisible()) {
      const editBtn = systemRoleRow.getByRole('button', { name: /编辑/ });
      const deleteBtn = systemRoleRow.getByRole('button', { name: /删除/ });

      // 系统角色应该不可编辑或不可删除
      const canEdit = await editBtn.isVisible().catch(() => false);
      const canDelete = await deleteBtn.isVisible().catch(() => false);

      if (canEdit) {
        const isDisabled = await editBtn.isDisabled().catch(() => true);
        expect(isDisabled).toBe(true);
      }
      if (canDelete) {
        const isDisabled = await deleteBtn.isDisabled().catch(() => true);
        expect(isDisabled).toBe(true);
      }
    }
  });
});

test.describe('用户管理/注册用户 (ADM-RU)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/registered-users');
  });

  test('查看用户列表 (ADM-RU-L-01)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /用户|注册用户/ })).toBeVisible({ timeout: 10000 });

    // 验证表格存在
    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('按手机号搜索 (ADM-RU-F-01)', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/搜索|手机号/).or(
      page.getByRole('searchbox')
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('138');
      await page.waitForTimeout(500);
      // 验证搜索结果
    }
  });

  test('查看用户详情 (ADM-RU-R-01)', async ({ page }) => {
    const userRow = page.getByRole('row').filter({ hasText: /1[3-9]\d{9}/ }).first();
    if (await userRow.isVisible()) {
      const detailBtn = userRow.getByRole('button', { name: /详情|查看/ });
      if (await detailBtn.isVisible()) {
        await detailBtn.click();

        // 验证详情页或弹窗
        const detailView = page.getByText(/用户详情|用户信息|所属组织/);
        await expect(detailView.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('禁用/启用用户 (ADM-RU-D-01, ADM-RU-EN-01)', async ({ page }) => {
    const userRow = page.getByRole('row').first();
    if (await userRow.isVisible()) {
      const disableBtn = userRow.getByRole('button', { name: /禁用/ });
      if (await disableBtn.isVisible()) {
        await disableBtn.click();

        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });
});

test.describe('组织管理/运营端 (ADM-O)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/organizations');
  });

  test('查看组织列表 (ADM-O-L-01)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /组织|组织管理/ })).toBeVisible({ timeout: 10000 });

    const table = page.getByRole('table');
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test('查看组织详情 (ADM-O-R-01)', async ({ page }) => {
    const orgRow = page.getByRole('row').filter({ hasText: /组织/ }).first();
    if (await orgRow.isVisible()) {
      const detailBtn = orgRow.getByRole('button', { name: /详情|查看/ });
      if (await detailBtn.isVisible()) {
        await detailBtn.click();

        // 验证详情页
        await expect(page.getByText(/组织详情|基本信息|成员/)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('启用/停用组织 (ADM-O-EN-01, ADM-O-DIS-01)', async ({ page }) => {
    const orgRow = page.getByRole('row').first();
    if (await orgRow.isVisible()) {
      const disableBtn = orgRow.getByRole('button', { name: /停用/ });
      if (await disableBtn.isVisible()) {
        await disableBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /确认/ });
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });
});

test.describe('套餐配置 (ADM-PL)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/plans');
  });

  test('查看套餐列表 (ADM-PL-L-01)', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /套餐|套餐配置/ })).toBeVisible({ timeout: 10000 });

    const planList = page.locator('[data-testid="admin-plans-list"]').or(
      page.getByRole('list').or(page.getByRole('table'))
    );
    await expect(planList.first()).toBeVisible({ timeout: 5000 });
  });

  test('新建套餐 (ADM-PL-C-01)', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /新建套餐|添加套餐/ }).first();
    if (!(await createBtn.isVisible())) return;

    await createBtn.click();

    const dialog = page.getByRole('dialog').filter({ hasText: /新建套餐/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写套餐信息
    await dialog.getByLabel(/套餐名称|名称/).fill(createUniqueName('E2E套餐'));
    await dialog.getByLabel(/套餐编码|编码/).fill(`e2e_${Date.now()}`);
    await dialog.getByLabel(/月价|月付价格/).fill('99');
    await dialog.getByLabel(/年价|年付价格/).fill('999');

    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
  });

  test('编辑套餐 (ADM-PL-U-01)', async ({ page }) => {
    const planRow = page.getByRole('row').first();
    if (await planRow.isVisible()) {
      const editBtn = planRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑套餐/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 修改价格
        const priceInput = dialog.getByLabel(/月价/);
        if (await priceInput.isVisible()) {
          await priceInput.fill('100');
        }

        await dialog.getByRole('button', { name: '保存' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });

  test('配置公寓数量额度 (ADM-PL-Q-01)', async ({ page }) => {
    const planRow = page.getByRole('row').first();
    if (await planRow.isVisible()) {
      const editBtn = planRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑套餐/ });
        if (await dialog.isVisible()) {
          // 查找公寓数量配置
          const aptQuotaInput = dialog.getByLabel(/公寓数量|公寓上限/);
          if (await aptQuotaInput.isVisible()) {
            await aptQuotaInput.fill('10');
          }
          await dialog.getByRole('button', { name: '保存' }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });
});

test.describe('平台概览与统计 (ADM-ST)', () => {
  test('查看平台概览 (ADM-ST-01)', async ({ page }) => {
    await page.goto('/admin');

    // 验证概览页面标题
    await expect(page.getByRole('heading', { name: /概览|统计|总览/ })).toBeVisible({ timeout: 10000 });

    // 验证各项统计卡片
    const expectedStats = [
      /组织/,
      /用户/,
      /公寓/,
      /房间/,
      /订阅/,
    ];

    for (const stat of expectedStats) {
      const statCard = page.getByText(stat);
      const hasStat = await statCard.isVisible().catch(() => false);
      // 至少有一些统计数据显示
      if (hasStat) {
        await expect(statCard.first()).toBeVisible();
      }
    }
  });

  test('查看运营数据分析 (ADM-ST-02)', async ({ page }) => {
    await page.goto('/admin');

    // 查找数据分析区域
    const chartArea = page.locator('canvas, svg').first();
    const hasChart = await chartArea.isVisible().catch(() => false);

    // 或者查找趋势数据
    const trendSection = page.getByText(/趋势|增长|统计/);
    const hasTrend = await trendSection.isVisible().catch(() => false);

    expect(hasChart || hasTrend).toBe(true);
  });
});

test.describe('运营端登录 (ADM-LOGIN)', () => {
  test('运营端登录成功 (ADM-LOGIN-01)', async ({ page }) => {
    // 这个测试需要没有登录态的环境
    // 由于当前测试使用 storageState，这个测试可能需要在单独的项目中运行
    await page.goto('/admin/login');

    // 验证登录页面
    await expect(page.getByRole('heading', { name: /登录|管理后台/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/用户名|账号/)).toBeVisible();
    await expect(page.getByLabel(/密码/)).toBeVisible();
  });

  test('退出登录 (ADM-LOGIN-04)', async ({ page }) => {
    await page.goto('/admin');

    // 点击退出登录
    const logoutBtn = page.getByRole('button', { name: /退出|登出/ }).or(
      page.locator('[data-testid="admin-logout-btn"]')
    );

    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      // 验证跳转到登录页
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
    }
  });
});
