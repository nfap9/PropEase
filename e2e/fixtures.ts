import { test as base, Page } from '@playwright/test';
import { login, AUTH_STORAGE_KEYS } from './helpers/auth';

/**
 * 认证信息类型
 */
export interface AuthState {
  accessToken: string;
  refreshToken: string;
  organizationId?: string;
}

/**
 * 测试上下文扩展
 */
export interface TestFixtures {
  /**
   * 已认证的页面（自动登录）
   *
   * 使用此 fixture 时会自动执行登录操作，并保存认证状态到 localStorage
   */
  authenticatedPage: Page;
  /**
   * 认证状态
   */
  authState: AuthState;
  /**
   * 当前组织 ID（在登录后自动设置）
   */
  orgId: string | undefined;
}

/**
 * 扩展的 test 对象
 *
 * 使用示例：
 * ```ts
 * import { test, expect } from './fixtures';
 *
 * test('需要登录的测试', async ({ authenticatedPage }) => {
 *   await authenticatedPage.goto('/dashboard');
 *   // 已登录状态，可以直接访问需要认证的页面
 * });
 * ```
 */
export const test = base.extend<TestFixtures>({
  // 已认证的页面 fixture
  authenticatedPage: async ({ page }, use) => {
    // 执行密码登录
    await login(page);

    // 获取登录后存储的 token
    const accessToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.ACCESS_TOKEN
    );
    const refreshToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.REFRESH_TOKEN
    );
    const organizationId = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.CURRENT_ORG_ID
    );

    // 使用已登录的页面
    await use(page);

    // 测试结束后清理（可选）
    // 这里不清除状态，让其他测试可以复用
  },

  // 认证状态 fixture
  authState: async ({ page }, use) => {
    // 执行登录
    await login(page);

    // 获取认证状态
    const accessToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.ACCESS_TOKEN
    );
    const refreshToken = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.REFRESH_TOKEN
    );
    const organizationId = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.CURRENT_ORG_ID
    );

    await use({
      accessToken: accessToken || '',
      refreshToken: refreshToken || '',
      organizationId: organizationId || undefined,
    });
  },

  // 组织 ID fixture - 在登录后自动获取当前组织 ID
  orgId: async ({ page }, use) => {
    // 执行登录（如果还没有登录）
    await login(page);

    // 获取当前组织 ID
    const organizationId = await page.evaluate(
      (key) => localStorage.getItem(key),
      AUTH_STORAGE_KEYS.CURRENT_ORG_ID
    );

    await use(organizationId || undefined);
  },
});

/**
 * 创建已认证状态的 setup 测试
 *
 * 用于在测试运行前预先登录并保存状态，提高测试效率
 *
 * 使用示例：
 * ```ts
 * // e2e/auth.setup.ts
 * import { test as setup, expect } from '@playwright/test';
 * import { login, saveAuthState } from './helpers/auth';
 *
 * setup('authenticate', async ({ page, context }) => {
 *   await login(page);
 *   await saveAuthState(context, '.auth/user.json');
 * });
 * ```
 */
export { expect } from '@playwright/test';
