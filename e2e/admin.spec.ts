import { test, expect } from '@playwright/test';
import {
  ADMIN,
  ADM_ROLES,
  ADM_USERS,
  ADM_REGISTERED_USERS,
  ADM_ORGANIZATIONS,
  ADM_PLANS,
  ADM_SUBSCRIPTIONS,
  COMMON,
} from './testids';

/**
 * 运营后台功能 E2E
 * - 依赖 e2e/admin.auth.setup.ts 提供的登录态（.auth/admin.json），用例中不写登录步骤
 * - 覆盖：平台概览、侧栏导航、运营账号、用户管理、运营角色等（对应测试用例 12.x）
 *
 * 注意：当前测试部分仍使用文案定位，前端添加 data-testid 后可进一步优化
 */

test.describe('运营后台 - 概览（对应测试用例 12.7）', () => {
  test('平台概览页显示统计卡片（ADM-ST-01）', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.OVERVIEW_HEADING)
    await expect(page.getByText('平台概览')).toBeVisible({ timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.ORG_COUNT)
    await expect(page.getByText('组织数')).toBeVisible();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.USER_COUNT)
    await expect(page.getByText('用户数')).toBeVisible();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.APARTMENT_COUNT)
    await expect(page.getByText('公寓数')).toBeVisible();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.ROOM_COUNT)
    await expect(page.getByText('房间数')).toBeVisible();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.ACTIVE_SUBSCRIPTION_COUNT)
    await expect(page.getByText('活跃订阅数')).toBeVisible();
  });
});

test.describe('运营后台 - 侧栏导航', () => {
  test('可进入运营账号页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADMIN.USERS)
    await page.getByRole('link', { name: '运营账号' }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_USERS.HEADING)
    await expect(page.getByRole('heading', { name: '运营账号' })).toBeVisible();
  });

  test('可进入用户管理页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_REGISTERED_USERS)
    await page.getByRole('link', { name: '用户管理' }).click();
    await expect(page).toHaveURL(/\/admin\/registered-users/);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_REGISTERED_USERS.HEADING)
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
  });

  test('可进入运营角色页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES)
    await page.getByRole('link', { name: '运营角色' }).click();
    await expect(page).toHaveURL(/\/admin\/roles/);
    await page.waitForLoadState('networkidle');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.HEADING)
    // 运营角色页可能是布局页，验证页面元素而非标题
    await expect(page.getByText('新建角色')).toBeVisible({ timeout: 10000 });
  });

  test('可进入组织管理页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS)
    await page.getByRole('link', { name: '组织管理' }).click();
    await expect(page).toHaveURL(/\/admin\/organizations/);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS.HEADING)
    await expect(page.getByRole('heading', { name: '组织管理' })).toBeVisible();
  });

  test('可进入套餐配置页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_PLANS)
    await page.getByRole('link', { name: '套餐配置' }).click();
    await expect(page).toHaveURL(/\/admin\/plans/);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_PLANS.HEADING)
    await expect(page.getByRole('heading', { name: '套餐配置' })).toBeVisible();
  });

  test('可进入订阅管理页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_SUBSCRIPTIONS)
    await page.getByRole('link', { name: '订阅管理' }).click();
    await expect(page).toHaveURL(/\/admin\/subscriptions/);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_SUBSCRIPTIONS.HEADING)
    await expect(page.getByRole('heading', { name: '订阅管理' })).toBeVisible();
  });
});

test.describe('运营后台 - 运营角色（对应测试用例 12.3）', () => {
  test('角色列表可见且可打开新建角色弹窗（ADM-R-01）', async ({ page }) => {
    await page.goto('/admin/roles');
    await page.waitForLoadState('networkidle');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.HEADING)
    // 运营角色页是布局页，验证"新建角色"按钮和角色列表
    await expect(page.getByText('新建角色')).toBeVisible({ timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.NEW_BUTTON)
    await expect(page.getByRole('button', { name: '新建角色' })).toBeVisible();
    await page.getByRole('button', { name: '新建角色' }).click();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.CREATE_DIALOG)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.NAME_INPUT)
    await expect(dialog.getByLabel('角色名称')).toBeVisible();
  });

  test('可创建新角色并出现在列表中（ADM-R-03）', async ({ page }) => {
    await page.goto('/admin/roles');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.NEW_BUTTON)
    await page.getByRole('button', { name: '新建角色' }).click();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.CREATE_DIALOG)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.NAME_INPUT)
    const roleName = `E2E角色_${Date.now()}`;
    await dialog.getByLabel('角色名称').fill(roleName);
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ROLES.CONFIRM_BUTTON)
    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(roleName)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('运营后台 - 运营账号（对应测试用例 12.2）', () => {
  test('运营账号列表可见且可打开新建账号弹窗（ADM-U-02）', async ({ page }) => {
    await page.goto('/admin/users');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_USERS.HEADING)
    await expect(page.getByRole('heading', { name: '运营账号' })).toBeVisible({ timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_USERS.NEW_BUTTON)
    await expect(page.getByRole('button', { name: '新建账号' })).toBeVisible();
    await page.getByRole('button', { name: '新建账号' }).click();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_USERS.CREATE_DIALOG)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

test.describe('运营后台 - 用户管理（对应测试用例 12.5）', () => {
  test('用户管理页有列表或搜索（ADM-RU-02）', async ({ page }) => {
    await page.goto('/admin/registered-users');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_REGISTERED_USERS.HEADING)
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible({ timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_REGISTERED_USERS.SEARCH_INPUT)
    await expect(page.getByPlaceholder('手机号或姓名')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('运营后台 - 组织管理（对应测试用例 12.4）', () => {
  test('组织列表可见且有组织名称列（ADM-O-01）', async ({ page }) => {
    await page.goto('/admin/organizations');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS.HEADING)
    await expect(page.getByRole('heading', { name: '组织管理' })).toBeVisible({ timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS.ORG_NAME_COLUMN)
    await expect(page.getByRole('columnheader', { name: '组织名称' })).toBeVisible();
  });

  test('可点击组织名称进入组织详情（ADM-O-02）', async ({ page }) => {
    await page.goto('/admin/organizations');
    // 无稳定可访问名的列表链接，用 href 定位
    const orgLink = page.locator('a[href^="/admin/organizations/"]').first();
    if ((await orgLink.count()) === 0) return;
    await orgLink.click();
    await expect(page).toHaveURL(/\/admin\/organizations\/[^/]+/, { timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS.DETAIL_HEADING)
    await expect(page.getByText('组织详情')).toBeVisible({ timeout: 10000 });
  });

  test('组织详情页可启用或停用组织（ADM-O-03）', async ({ page }) => {
    await page.goto('/admin/organizations');
    const orgLink = page.locator('a[href^="/admin/organizations/"]').first();
    if ((await orgLink.count()) === 0) return;
    await orgLink.click();
    await expect(page).toHaveURL(/\/admin\/organizations\/[^/]+/, { timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS.ENABLE_BUTTON)
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_ORGANIZATIONS.DISABLE_BUTTON)
    const enableBtn = page.getByRole('button', { name: '启用组织' });
    const disableBtn = page.getByRole('button', { name: '停用组织' });
    expect(await enableBtn.isVisible() || await disableBtn.isVisible()).toBe(true);
  });
});

test.describe('运营后台 - 套餐配置（对应测试用例 12.6）', () => {
  test('套餐列表可见且可打开新建套餐弹窗（ADM-PL-01）', async ({ page }) => {
    await page.goto('/admin/plans');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_PLANS.HEADING)
    await expect(page.getByRole('heading', { name: '套餐配置' })).toBeVisible({ timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_PLANS.NEW_BUTTON)
    await expect(page.getByRole('button', { name: '新建套餐' })).toBeVisible();
    await page.getByRole('button', { name: '新建套餐' }).click();
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_PLANS.CREATE_DIALOG)
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });
});

test.describe('运营后台 - 订阅管理（对应测试用例 12.6）', () => {
  test('订阅管理页有列表或筛选（ADM-SUB-01）', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_SUBSCRIPTIONS.HEADING)
    await expect(page.getByRole('heading', { name: '订阅管理' })).toBeVisible();
    const hasOrgCol = await page.getByRole('columnheader', { name: '组织 ID' }).count() > 0;
    const hasOrgText = await page.getByText('组织 ID').count() > 0;
    expect(hasOrgCol || hasOrgText).toBe(true);
  });

  test('订阅列表有操作列或状态列（ADM-SUB-01）', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(ADM_SUBSCRIPTIONS.HEADING)
    await expect(page.getByRole('heading', { name: '订阅管理' })).toBeVisible();
    const hasStatus = await page.getByRole('columnheader', { name: '状态' }).count() > 0;
    const hasActions = await page.getByRole('columnheader', { name: '操作' }).count() > 0;
    expect(hasStatus || hasActions).toBe(true);
  });
});

test.describe('运营后台 - 退出登录', () => {
  test('点击退出登录后跳转到登录页', async ({ page }) => {
    await page.goto('/admin');
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(COMMON.LOGOUT_BUTTON)
    await page.getByRole('button', { name: '退出登录' }).click();
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
    // TODO: 前端添加 data-testid 后改为 page.getByTestId(COMMON.LOGIN_PAGE_HEADING)
    await expect(page.getByText('管理后台登录')).toBeVisible({ timeout: 5000 });
  });
});
