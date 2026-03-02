import { test, expect } from '@playwright/test';

/**
 * 运营后台功能 E2E（依赖 admin-setup 提供的登录态 storageState）。
 */
test.describe('运营后台 - 概览', () => {
  test('平台概览页显示统计卡片', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('平台概览')).toBeVisible();
    await expect(page.getByText('组织数')).toBeVisible();
    await expect(page.getByText('用户数')).toBeVisible();
    await expect(page.getByText('公寓数')).toBeVisible();
    await expect(page.getByText('房间数')).toBeVisible();
    await expect(page.getByText('活跃订阅数')).toBeVisible();
  });
});

test.describe('运营后台 - 侧栏导航', () => {
  test('可进入运营账号页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '运营账号' }).click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByRole('heading', { name: '运营账号' })).toBeVisible();
  });

  test('可进入用户管理页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '用户管理' }).click();
    await expect(page).toHaveURL(/\/admin\/registered-users/);
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
  });

  test('可进入运营角色页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '运营角色' }).click();
    await expect(page).toHaveURL(/\/admin\/roles/);
    await expect(page.getByRole('button', { name: '新建角色' })).toBeVisible();
  });

  test('可进入组织管理页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '组织管理' }).click();
    await expect(page).toHaveURL(/\/admin\/organizations/);
    await expect(page.getByRole('heading', { name: '组织管理' })).toBeVisible();
  });

  test('可进入套餐配置页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '套餐配置' }).click();
    await expect(page).toHaveURL(/\/admin\/plans/);
    await expect(page.getByRole('heading', { name: '套餐配置' })).toBeVisible();
  });

  test('可进入订阅管理页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('link', { name: '订阅管理' }).click();
    await expect(page).toHaveURL(/\/admin\/subscriptions/);
    await expect(page.getByRole('heading', { name: '订阅管理' })).toBeVisible();
  });
});

test.describe('运营后台 - 运营角色', () => {
  test('角色列表可见且可打开新建角色弹窗', async ({ page }) => {
    await page.goto('/admin/roles');
    await expect(page.getByRole('button', { name: '新建角色' })).toBeVisible();
    await page.getByRole('button', { name: '新建角色' }).click();
    await expect(page.getByRole('dialog').getByText('新建角色')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '角色名称' })).toBeVisible();
  });

  test('可创建新角色并出现在列表中', async ({ page }) => {
    await page.goto('/admin/roles');
    const roleName = `E2E角色_${Date.now()}`;
    await page.getByRole('button', { name: '新建角色' }).click();
    await page.getByRole('textbox', { name: '角色名称' }).fill(roleName);
    await page.getByRole('dialog').getByRole('button', { name: '创建' }).click();
    await expect(page.getByText(roleName)).toBeVisible({ timeout: 10000 });
  });
});

test.describe('运营后台 - 运营账号', () => {
  test('运营账号列表可见且可打开新建账号弹窗', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: '运营账号' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新建账号' })).toBeVisible();
    await page.getByRole('button', { name: '新建账号' }).click();
    await expect(
      page.getByRole('dialog').getByText('新建运营账号')
    ).toBeVisible();
  });
});

test.describe('运营后台 - 用户管理', () => {
  test('用户管理页有列表或搜索', async ({ page }) => {
    await page.goto('/admin/registered-users');
    await expect(page.getByRole('heading', { name: '用户管理' })).toBeVisible();
    await expect(page.getByPlaceholder('手机号或姓名')).toBeVisible();
  });
});

test.describe('运营后台 - 组织管理（对应测试用例 12.4）', () => {
  test('组织列表可见且有组织名称列', async ({ page }) => {
    await page.goto('/admin/organizations');
    await expect(page.getByRole('heading', { name: '组织管理' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '组织名称' })).toBeVisible();
  });

  test('可点击组织名称进入组织详情', async ({ page }) => {
    await page.goto('/admin/organizations');
    const orgLink = page.locator('a[href^="/admin/organizations/"]').first();
    await expect(orgLink).toBeVisible({ timeout: 10000 });
    await orgLink.click();
    await expect(page).toHaveURL(/\/admin\/organizations\/[^/]+/);
    await expect(page.getByText('组织详情')).toBeVisible();
  });

  test('组织详情页可启用或停用组织（ADM-O-03）', async ({ page }) => {
    await page.goto('/admin/organizations');
    const orgLink = page.locator('a[href^="/admin/organizations/"]').first();
    if (!(await orgLink.isVisible())) return;
    await orgLink.click();
    await expect(page).toHaveURL(/\/admin\/organizations\/[^/]+/);
    const enableBtn = page.getByRole('button', { name: '启用组织' });
    const disableBtn = page.getByRole('button', { name: '停用组织' });
    expect(await enableBtn.isVisible() || await disableBtn.isVisible()).toBe(true);
  });
});

test.describe('运营后台 - 套餐配置', () => {
  test('套餐列表可见且可打开新建套餐弹窗', async ({ page }) => {
    await page.goto('/admin/plans');
    await expect(page.getByRole('heading', { name: '套餐配置' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新建套餐' })).toBeVisible();
    await page.getByRole('button', { name: '新建套餐' }).click();
    await expect(
      page.getByRole('dialog').getByText('新建套餐')
    ).toBeVisible();
  });
});

test.describe('运营后台 - 订阅管理（对应测试用例 12.6）', () => {
  test('订阅管理页有列表或筛选', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    await expect(page.getByRole('heading', { name: '订阅管理' })).toBeVisible();
    const hasOrgCol = await page.getByRole('columnheader', { name: '组织 ID' }).count() > 0;
    const hasOrgText = await page.getByText('组织 ID').count() > 0;
    expect(hasOrgCol || hasOrgText).toBe(true);
  });

  test('订阅列表有操作列或状态列（ADM-SUB-01）', async ({ page }) => {
    await page.goto('/admin/subscriptions');
    await expect(page.getByRole('heading', { name: '订阅管理' })).toBeVisible();
    const hasStatus = await page.getByRole('columnheader', { name: '状态' }).count() > 0;
    const hasActions = await page.getByRole('columnheader', { name: '操作' }).count() > 0;
    expect(hasStatus || hasActions).toBe(true);
  });
});

test.describe('运营后台 - 退出登录', () => {
  test('点击退出登录后跳转到登录页', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: '退出登录' }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.getByText('管理后台登录')).toBeVisible();
  });
});
