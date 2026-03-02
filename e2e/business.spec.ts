import { test, expect } from '@playwright/test';

/**
 * 业务端（公寓管理系统）功能 E2E（依赖 business-setup 提供的登录态 storageState）。
 * 覆盖：公寓管理、全部房间、租客管理、租约管理、水电录入、账单管理、经营分析、设置及其子页。
 */
test.describe('业务端 - 侧栏导航', () => {
  test('从仪表盘可进入公寓管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '公寓管理' }).click();
    await expect(page).toHaveURL(/\/apartments$/);
    await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible();
  });

  test('从仪表盘可进入全部房间', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '全部房间' }).click();
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(page.getByRole('heading', { name: '全部房间' })).toBeVisible();
  });

  test('从仪表盘可进入租客管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '租客管理' }).click();
    await expect(page).toHaveURL(/\/tenants$/);
    await expect(page.getByRole('heading', { name: '租客管理' })).toBeVisible();
  });

  test('从仪表盘可进入租约管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '租约管理' }).click();
    await expect(page).toHaveURL(/\/leases$/);
    await expect(page.getByRole('heading', { name: '租约管理' })).toBeVisible();
  });

  test('从仪表盘可进入水电录入', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '水电录入' }).click();
    await expect(page).toHaveURL(/\/utilities$/);
    await expect(page.getByRole('heading', { name: '水电录入' })).toBeVisible();
  });

  test('从仪表盘可进入账单管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '账单管理' }).click();
    await expect(page).toHaveURL(/\/bills$/);
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible();
  });

  test('从仪表盘可进入经营分析', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '经营分析' }).click();
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.getByRole('heading', { name: '经营分析' })).toBeVisible();
  });
});

test.describe('业务端 - 公寓管理', () => {
  test('公寓管理页有标题且可打开新增公寓弹窗或显示空状态', async ({ page }) => {
    await page.goto('/apartments');
    await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible();
    const hasNewBtn = await page.getByRole('button', { name: '新增公寓' }).count() > 0;
    const hasEmpty = await page.getByText('暂无公寓').count() > 0;
    expect(hasNewBtn || hasEmpty).toBe(true);
  });

  test('可打开新增公寓弹窗并看到表单', async ({ page }) => {
    await page.goto('/apartments');
    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByRole('dialog').getByText('新增公寓')).toBeVisible();
      await expect(page.getByRole('textbox', { name: '公寓名称' })).toBeVisible();
    } else {
      await expect(page.getByText('暂无公寓')).toBeVisible();
    }
  });
});

test.describe('业务端 - 全部房间', () => {
  test('全部房间页有标题和搜索框', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: '全部房间' })).toBeVisible();
    await expect(page.getByPlaceholder('搜索房间号或备注...')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('业务端 - 租客管理', () => {
  test('租客管理页有标题和新增租客按钮或列表', async ({ page }) => {
    await page.goto('/tenants');
    await expect(page.getByRole('heading', { name: '租客管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增租客' })).toBeVisible();
  });

  test('可打开新增租客弹窗', async ({ page }) => {
    await page.goto('/tenants');
    await page.getByRole('button', { name: '新增租客' }).click();
    await expect(page.getByRole('dialog').getByText('新增租客')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '姓名' })).toBeVisible();
  });
});

test.describe('业务端 - 租约管理', () => {
  test('租约管理页有标题和新增租约按钮或列表', async ({ page }) => {
    await page.goto('/leases');
    await expect(page.getByRole('heading', { name: '租约管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增租约' })).toBeVisible();
  });
});

test.describe('业务端 - 水电录入', () => {
  test('水电录入页有标题和录入读数或批量导入按钮', async ({ page }) => {
    await page.goto('/utilities');
    await expect(page.getByRole('heading', { name: '水电录入' })).toBeVisible();
    const hasEntry = await page.getByRole('button', { name: '录入读数' }).count() > 0;
    const hasBatch = await page.getByRole('button', { name: '批量导入' }).count() > 0;
    expect(hasEntry || hasBatch).toBe(true);
  });
});

test.describe('业务端 - 账单管理', () => {
  test('账单管理页有标题', async ({ page }) => {
    await page.goto('/bills');
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible();
  });
});

test.describe('业务端 - 经营分析', () => {
  test('经营分析页有标题', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: '经营分析' })).toBeVisible();
  });
});

test.describe('业务端 - 设置', () => {
  test('设置首页有标题和团队设置、订阅管理等入口', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
    await expect(page.getByText('团队设置')).toBeVisible();
    await expect(page.getByText('订阅管理')).toBeVisible();
  });

  test('可进入团队设置页', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('link', { name: '团队设置' }).first().click();
    await expect(page).toHaveURL(/\/settings\/team/);
    await expect(page.getByRole('heading', { name: '团队设置' })).toBeVisible();
  });

  test('团队设置页有标题', async ({ page }) => {
    await page.goto('/settings/team');
    await expect(page.getByRole('heading', { name: '团队设置' })).toBeVisible();
  });

  test('可进入权限管理页', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '权限管理' }).click();
    await expect(page).toHaveURL(/\/settings\/permissions/);
    await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible();
  });

  test('可进入订阅管理页', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('link', { name: '订阅管理' }).first().click();
    await expect(page).toHaveURL(/\/settings\/subscription/);
    await expect(page.getByText('订阅管理')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('业务端 - 公寓详情', () => {
  test('有公寓时可从公寓列表进入公寓详情', async ({ page }) => {
    await page.goto('/apartments');
    const apartmentCard = page.locator('a[href^="/apartments/"]').first();
    if (await apartmentCard.isVisible()) {
      await apartmentCard.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+/, { timeout: 10000 });
      await expect(page.getByRole('button', { name: '返回公寓列表' })).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.getByText('暂无公寓')).toBeVisible();
    }
  });
});
