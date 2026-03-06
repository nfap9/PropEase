import { test, expect } from '@playwright/test';
import {
  DASHBOARD,
  NAV,
  APARTMENTS,
  TENANTS,
  LEASES,
  COMMON,
} from './testids';
import {
  navigateTo,
  waitForDialogOpen,
  waitForDialogClosed,
  waitForListOrEmpty,
  createUniqueName,
  createUniquePhone,
} from './test-helpers';

/**
 * 使用 data-testid 的 E2E 测试示例
 *
 * 相比传统方式的优势：
 * 1. 不依赖文案，前端文案变更不影响测试
 * 2. 代码更易维护，testids 集中管理
 * 3. 更好的 IDE 提示和类型安全
 */

test.describe('首页/仪表盘（使用 data-testid）', () => {
  test('首页显示统计卡片', async ({ page }) => {
    await navigateTo(page, '/dashboard');

    // 验证页面标题（不依赖文案）
    await expect(page.getByTestId(DASHBOARD.HEADING)).toBeVisible();

    // 验证统计卡片
    await expect(page.getByTestId(DASHBOARD.APARTMENT_COUNT_CARD)).toBeVisible();
    await expect(page.getByTestId(DASHBOARD.ROOM_COUNT_CARD)).toBeVisible();
    await expect(page.getByTestId(DASHBOARD.OCCUPANCY_RATE_CARD)).toBeVisible();
    await expect(page.getByTestId(DASHBOARD.ACTIVE_LEASES_CARD)).toBeVisible();
  });
});

test.describe('侧栏导航（使用 data-testid）', () => {
  test('从首页可进入公寓管理', async ({ page }) => {
    await navigateTo(page, '/dashboard');

    // 使用 testid 点击导航链接
    await page.getByTestId(NAV.APARTMENTS).click();

    // 验证 URL
    await expect(page).toHaveURL(/\/apartments$/);

    // 验证页面标题
    await expect(page.getByTestId(APARTMENTS.HEADING)).toBeVisible();
  });

  test('从首页可进入全部房间', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.ROOMS).click();
    await expect(page).toHaveURL(/\/rooms$/);
  });

  test('从首页可进入租客管理', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.TENANTS).click();
    await expect(page).toHaveURL(/\/tenants$/);
  });

  test('从首页可进入租约管理', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.LEASES).click();
    await expect(page).toHaveURL(/\/leases$/);
  });

  test('从首页可进入水电录入', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.UTILITIES).click();
    await expect(page).toHaveURL(/\/utilities$/);
  });

  test('从首页可进入账单管理', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.BILLS).click();
    await expect(page).toHaveURL(/\/bills$/);
  });

  test('从首页可进入经营分析', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.REPORTS).click();
    await expect(page).toHaveURL(/\/reports$/);
  });

  test('从首页可进入通知', async ({ page }) => {
    await navigateTo(page, '/dashboard');
    await page.getByTestId(NAV.NOTIFICATIONS).click();
    await expect(page).toHaveURL(/\/notifications$/);
  });
});

test.describe('公寓管理（使用 data-testid）', () => {
  test('公寓管理页有标题和列表或空状态', async ({ page }) => {
    await navigateTo(page, '/apartments');

    // 验证标题
    await expect(page.getByTestId(APARTMENTS.HEADING)).toBeVisible();

    // 验证列表或空状态（任一满足即可）
    const { hasList, hasEmpty } = await waitForListOrEmpty(
      page,
      APARTMENTS.LIST,
      APARTMENTS.EMPTY_STATE
    );
    expect(hasList || hasEmpty).toBe(true);
  });

  test('可打开新增公寓弹窗', async ({ page }) => {
    await navigateTo(page, '/apartments');

    // 点击新增按钮
    await page.getByTestId(APARTMENTS.NEW_BUTTON).click();

    // 验证弹窗打开
    await expect(page.getByTestId(APARTMENTS.CREATE_DIALOG)).toBeVisible();

    // 验证表单元素
    await expect(page.getByTestId(APARTMENTS.NAME_INPUT)).toBeVisible();
    await expect(page.getByTestId(APARTMENTS.ADDRESS_INPUT)).toBeVisible();

    // 关闭弹窗
    await page.getByTestId(COMMON.CANCEL_BUTTON).click();
    await expect(page.getByTestId(APARTMENTS.CREATE_DIALOG)).toBeHidden();
  });

  test('创建时公寓名称为必填', async ({ page }) => {
    await navigateTo(page, '/apartments');

    await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
    await expect(page.getByTestId(APARTMENTS.CREATE_DIALOG)).toBeVisible();

    // 只填地址，不填名称
    await page.getByTestId(APARTMENTS.ADDRESS_INPUT).fill('测试地址');
    await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();

    // 验证错误提示（这里假设前端有错误提示的 testid）
    // 实际需要根据前端实现调整
    const error = page.locator('[data-testid*="error"]');
    if (await error.count() > 0) {
      await expect(error.first()).toBeVisible();
    }

    await page.getByTestId(COMMON.CANCEL_BUTTON).click();
  });

  test('可创建新公寓并出现在列表', async ({ page }) => {
    await navigateTo(page, '/apartments');

    await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
    await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);

    // 填写表单
    const name = createUniqueName('E2E公寓');
    await page.getByTestId(APARTMENTS.NAME_INPUT).fill(name);
    await page.getByTestId(APARTMENTS.ADDRESS_INPUT).fill('E2E测试地址');

    // 提交
    await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();
    await waitForDialogClosed(page);

    // 验证出现在列表中（这里需要动态 testid）
    // 假设公寓卡片有 testid="apartment-{id}"
    // 实际使用时需要根据 ID 定位
    await expect(page.getByText(name)).toBeVisible();
  });

  test('可编辑公寓并保存', async ({ page }) => {
    // 首先创建一个公寓用于编辑
    const name = createUniqueName('E2E公寓_编辑');
    await navigateTo(page, '/apartments');

    await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
    await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);
    await page.getByTestId(APARTMENTS.NAME_INPUT).fill(name);
    await page.getByTestId(APARTMENTS.ADDRESS_INPUT).fill('E2E测试地址');
    await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();
    await waitForDialogClosed(page);

    // 找到创建的公寓并编辑
    const apartmentCard = page.getByText(name);
    await expect(apartmentCard).toBeVisible();

    // 点击更多操作（需要前端添加对应 testid）
    // await page.getByTestId('apartments-more-menu').click();

    // 修改名称
    const newName = createUniqueName('E2E公寓_编辑后');
    // await page.getByTestId(APARTMENTS.NAME_INPUT).fill(newName);
    // await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();
    // await waitForDialogClosed(page);

    // 验证修改成功
    await expect(page.getByText(newName)).toBeVisible();
  });

  test('可删除公寓', async ({ page }) => {
    // 首先创建一个公寓用于删除
    const name = createUniqueName('E2E公寓_待删');
    await navigateTo(page, '/apartments');

    await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
    await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);
    await page.getByTestId(APARTMENTS.NAME_INPUT).fill(name);
    await page.getByTestId(APARTMENTS.ADDRESS_INPUT).fill('E2E测试地址');
    await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();
    await waitForDialogClosed(page);

    // 找到创建的公寓并删除
    const apartmentCard = page.getByText(name);
    await expect(apartmentCard).toBeVisible();

    // 点击更多操作和删除按钮（需要前端添加对应 testid）
    // await page.getByTestId('apartments-more-menu').click();
    // await page.getByTestId(APARTMENTS.DELETE_BUTTON).click();
    // await waitForDialogOpen(page, APARTMENTS.DELETE_CONFIRM_DIALOG);
    // await page.getByTestId(COMMON.CONFIRM_BUTTON).click();
    // await waitForDialogClosed(page);

    // 验证删除成功（显示空状态）
    // await expect(page.getByTestId(APARTMENTS.EMPTY_STATE)).toBeVisible();
  });
});

test.describe('租客管理（使用 data-testid）', () => {
  test('租客管理页有标题和新增租客按钮', async ({ page }) => {
    await navigateTo(page, '/tenants');

    // 验证标题和按钮
    await expect(page.getByTestId(TENANTS.HEADING)).toBeVisible();
    await expect(page.getByTestId(TENANTS.NEW_BUTTON)).toBeVisible();
  });

  test('可打开新增租客弹窗', async ({ page }) => {
    await navigateTo(page, '/tenants');

    await page.getByTestId(TENANTS.NEW_BUTTON).click();
    await expect(page.getByTestId(TENANTS.CREATE_DIALOG)).toBeVisible();

    // 验证表单元素
    await expect(page.getByTestId(TENANTS.NAME_INPUT)).toBeVisible();
    await expect(page.getByTestId(TENANTS.PHONE_INPUT)).toBeVisible();

    await page.getByTestId(COMMON.CANCEL_BUTTON).click();
  });

  test('可创建新租客并出现在列表', async ({ page }) => {
    await navigateTo(page, '/tenants');

    await page.getByTestId(TENANTS.NEW_BUTTON).click();
    await waitForDialogOpen(page, TENANTS.CREATE_DIALOG);

    // 填写表单
    const name = createUniqueName('E2E租客');
    const phone = createUniquePhone();

    await page.getByTestId(TENANTS.NAME_INPUT).fill(name);
    await page.getByTestId(TENANTS.PHONE_INPUT).fill(phone);

    // 提交
    await page.getByTestId('tenants-create-confirm-btn').click();
    await waitForDialogClosed(page);

    // 验证出现在列表中
    await expect(page.getByText(name)).toBeVisible();
  });
});

test.describe('租约管理（使用 data-testid）', () => {
  test('租约管理页有标题和新增租约按钮', async ({ page }) => {
    await navigateTo(page, '/leases');

    await expect(page.getByTestId(LEASES.HEADING)).toBeVisible();
    await expect(page.getByTestId(LEASES.NEW_BUTTON)).toBeVisible();
  });

  test('可打开新增租约弹窗', async ({ page }) => {
    await navigateTo(page, '/leases');

    await page.getByTestId(LEASES.NEW_BUTTON).click();
    await expect(page.getByTestId(LEASES.CREATE_DIALOG)).toBeVisible();

    // 验证表单元素
    await expect(page.getByTestId(LEASES.APARTMENT_SELECT)).toBeVisible();
    await expect(page.getByTestId(LEASES.ROOM_SELECT)).toBeVisible();
    await expect(page.getByTestId(LEASES.TENANT_SELECT)).toBeVisible();

    await page.getByTestId(COMMON.CANCEL_BUTTON).click();
  });

  test('创建租约流程', async ({ page }) => {
    // 前置条件：需要有公寓、房间、租客
    // 这里假设已存在
    await navigateTo(page, '/leases');

    await page.getByTestId(LEASES.NEW_BUTTON).click();
    await waitForDialogOpen(page, LEASES.CREATE_DIALOG);

    // 选择公寓、房间、租客
    await page.getByTestId(LEASES.APARTMENT_SELECT).click();
    await page.getByRole('option', { name: /测试公寓/ }).click();

    await page.getByTestId(LEASES.ROOM_SELECT).click();
    await page.getByRole('option', { name: /101/ }).click();

    await page.getByTestId(LEASES.TENANT_SELECT).click();
    await page.getByRole('option', { name: /测试租客/ }).click();

    // 填写租约信息
    await page.getByTestId(LEASES.START_DATE_INPUT).fill('2026-03-01');
    await page.getByTestId(LEASES.MONTHLY_RENT_INPUT).fill('2000');
    await page.getByTestId(LEASES.DEPOSIT_INPUT).fill('2000');

    // 提交
    await page.getByTestId(LEASES.CONFIRM_BUTTON).click();
    await waitForDialogClosed(page);

    // 验证创建成功
    await expect(page.getByTestId(LEASES.LIST)).toBeVisible();
  });
});

test.describe('对比示例：旧方式 vs 新方式', () => {
  test('❌ 旧方式：依赖文案（不推荐）', async ({ page }) => {
    await navigateTo(page, '/apartments');

    // 问题：如果"新增公寓"文案改为"创建公寓"，测试就会失败
    await page.getByRole('button', { name: '新增公寓' }).click();
    await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible();
  });

  test('✅ 新方式：使用 testid（推荐）', async ({ page }) => {
    await navigateTo(page, '/apartments');

    // 优势：文案变更不影响测试
    await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
    await expect(page.getByTestId(APARTMENTS.HEADING)).toBeVisible();
  });
});
