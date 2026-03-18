/**
 * E2E 测试示例 - 展示新测试模式
 *
 * 这个文件展示了如何使用新的 Page Object 模式和 fixtures
 * 包含：
 * 1. 使用 BasePage 进行通用操作
 * 2. 使用 ListPage 进行列表操作
 * 3. 使用 fixtures 进行测试
 * 4. 使用 test data generator 创建测试数据
 */

import { test, expect } from './fixtures';
import { goToApartments, goToRooms } from './helpers/navigation';
import { login, logout } from './helpers/auth';
import { createTestDataGenerator } from './helpers/test-data';
import { APARTMENTS, AUTH, DASHBOARD } from './testids';
import {
  submitFormAndWait,
  waitForDialogOpen,
  waitForDialogClosed,
  verifyNavigation,
} from './helpers/ui';
import { BasePage, ListPage } from './pages';

/**
 * 示例：使用 BasePage
 * BasePage 提供了通用的页面操作方法
 */
test.describe('使用 BasePage', () => {
  test('基础页面操作演示', async ({ basePage }) => {
    // 导航
    await basePage.goto('/login');
    await basePage.expectURL('/login');

    // 验证元素可见
    await basePage.expectVisible(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 截图保存到 e2e/results/screenshots/
    // await basePage.screenshot('login-page');
  });
});

/**
 * 示例：使用 ListPage
 * 继承 BasePage 并添加列表特有的操作
 */
test.describe('使用 ListPage', () => {
  test('列表页面操作演示', async ({ page }) => {
    // 创建列表页面实例
    const roomsPage = new ListPage(page, {
      listSelector: '[data-testid="rooms-list"]',
      searchInputSelector: '[data-testid="rooms-search-input"]',
      emptyStateSelector: 'rooms-empty-state',
    });

    await login(page);
    await roomsPage.goto('/rooms');

    // 等待数据加载
    await roomsPage.waitForDataLoaded();

    // 获取行数
    const rowCount = await roomsPage.getRowCount();
    console.log(`当前房间数量: ${rowCount}`);

    // 搜索（如果搜索框存在）
    if (await page.isVisible('[data-testid="rooms-search-input"]')) {
      await roomsPage.search('测试');
    }
  });
});

/**
 * 示例：使用 authenticatedPage fixture
 * 自动登录的页面，无需手动调用 login
 */
test.describe('使用 authenticatedPage fixture', () => {
  test('已登录用户访问仪表盘', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // 验证页面加载
    await expect(authenticatedPage.locator(`[data-testid="${DASHBOARD.HEADING}"]`)).toBeVisible();
  });

  test('已登录用户访问公寓管理', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/apartments');

    // 验证公寓列表加载
    await expect(authenticatedPage.locator(`[data-testid="${APARTMENTS.LIST}"]`)).toBeVisible();

    // 验证新增按钮存在
    await expect(authenticatedPage.locator(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`)).toBeVisible();
  });
});

/**
 * 示例：使用 TestDataGenerator
 * 自动创建和清理测试数据
 */
test.describe('使用 TestDataGenerator', () => {
  test('创建公寓和房间', async ({ page, request }) => {
    await login(page);

    // 创建测试数据生成器
    const generator = await createTestDataGenerator(request);

    try {
      // 创建公寓和房间
      const apartment = await generator.createApartmentWithRooms(3);
      console.log(`创建了公寓: ${apartment.name}, 房间数: ${apartment.rooms.length}`);

      // 导航到公寓管理页面验证
      await goToApartments(page);

      // 搜索刚创建的公寓
      await page.fill('[data-testid="apartments-search-input"]', apartment.name);
      await page.press('[data-testid="apartments-search-input"]', 'Enter');

      // 等待搜索结果
      await page.waitForTimeout(500);

      // 验证公寓出现在列表中
      await expect(page.locator(`text="${apartment.name}"`).first()).toBeVisible();
    } finally {
      // 自动清理 - 删除创建的公寓、房间、租客等
      await generator.cleanup();
    }
  });

  test('创建完整测试环境（公寓、房间、租客、租约）', async ({ page, request }) => {
    await login(page);

    const generator = await createTestDataGenerator(request);

    try {
      // 创建完整的测试环境
      const env = await generator.createFullTestEnvironment();
      console.log(`创建了: ${env.apartment.name}, 租客: ${env.tenant.name}`);

      // 可以继续进行账单测试等...
    } finally {
      await generator.cleanup();
    }
  });
});

/**
 * 示例：使用增强的 UI 辅助函数
 */
test.describe('增强的 UI 辅助函数', () => {
  test('表单提交并等待 API 响应', async ({ page }) => {
    await login(page);
    await goToApartments(page);

    // 点击新增按钮
    await page.click(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`);

    // 等待对话框打开
    await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);

    // 填写表单
    await page.fill(`[data-testid="${APARTMENTS.NAME_INPUT}"]`, `测试公寓_${Date.now()}`);
    await page.fill(`[data-testid="${APARTMENTS.ADDRESS_INPUT}"]`, '测试地址');

    // 提交并等待 API 响应
    const result = await submitFormAndWait(
      page,
      `[data-testid="${APARTMENTS.CONFIRM_BUTTON}"]`,
      '/api/v1/apartments',
      { method: 'POST' }
    );

    console.log(`表单提交结果: ok=${result.ok}, status=${result.status}`);

    // 等待对话框关闭
    await waitForDialogClosed(page, APARTMENTS.CREATE_DIALOG);
  });

  test('验证页面跳转', async ({ page }) => {
    await login(page);

    // 从登录页跳转到首页
    await verifyNavigation(page, /\/(dashboard|apartments|rooms)/);
  });
});

/**
 * 示例：运营后台测试
 * 使用 adminPage fixture
 */
test.describe('运营后台测试', () => {
  test('访问运营后台概览', async ({ adminPage }) => {
    await adminPage.goto('/admin');

    // 验证页面加载（根据实际情况调整）
    // await expect(adminPage.locator('[data-testid="admin-overview-heading"]')).toBeVisible();
  });
});
