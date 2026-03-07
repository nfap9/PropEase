import { Page, BrowserContext } from '@playwright/test';
import { AUTH } from '../testids';

/**
 * 测试账号配置
 *
 * 使用环境变量配置，避免硬编码敏感信息
 */
export const TEST_ACCOUNTS = {
  owner: {
    phone: process.env.E2E_TEST_PHONE || '13800138001',
    password: process.env.E2E_TEST_PASSWORD || 'Test@123456',
  },
  admin: {
    phone: process.env.E2E_ADMIN_PHONE || '13800138002',
    password: process.env.E2E_ADMIN_PASSWORD || 'Test@123456',
  },
  member: {
    phone: process.env.E2E_MEMBER_PHONE || '13800138003',
    password: process.env.E2E_MEMBER_PASSWORD || 'Test@123456',
  },
};

/**
 * Token 存储的 localStorage key
 */
export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  CURRENT_ORG_ID: 'current_organization_id',
} as const;

/**
 * 密码登录
 *
 * @param page - Playwright Page 对象
 * @param phone - 手机号
 * @param password - 密码
 */
export async function login(
  page: Page,
  phone: string = TEST_ACCOUNTS.owner.phone,
  password: string = TEST_ACCOUNTS.owner.password
): Promise<void> {
  await page.goto('/login');

  // 等待登录页加载
  await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

  // 确保在密码登录 Tab
  await page.click(`[data-testid="${AUTH.PASSWORD_TAB}"]`);

  // 填写手机号
  await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, phone);

  // 填写密码
  await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, password);

  // 点击登录按钮
  await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

  // 等待跳转到首页（dashboard 或其他已登录页面）
  await page.waitForURL(/\/(dashboard|apartments|rooms)/, { timeout: 15000 });

  // 等待 token 存入 localStorage
  await page.waitForFunction(
    (key) => localStorage.getItem(key) !== null,
    AUTH_STORAGE_KEYS.ACCESS_TOKEN,
    { timeout: 5000 }
  );
}

/**
 * 验证码登录
 *
 * @param page - Playwright Page 对象
 * @param phone - 手机号
 * @param code - 验证码（默认 6 位测试验证码）
 */
export async function loginWithCode(
  page: Page,
  phone: string = TEST_ACCOUNTS.owner.phone,
  code: string = '123456'
): Promise<void> {
  await page.goto('/login');

  // 切换到验证码登录 Tab
  await page.click(`[data-testid="${AUTH.CODE_TAB}"]`);

  // 填写手机号
  await page.fill(`[data-testid="${AUTH.PHONE_INPUT_CODE}"]`, phone);

  // 填写验证码
  await page.fill(`[data-testid="${AUTH.VERIFICATION_CODE_INPUT}"]`, code);

  // 点击登录按钮
  await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

  // 等待跳转
  await page.waitForURL(/\/(dashboard|apartments|rooms)/, { timeout: 15000 });
}

/**
 * 退出登录
 *
 * @param page - Playwright Page 对象
 */
export async function logout(page: Page): Promise<void> {
  // 清除 localStorage 中的认证信息
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_organization_id');
  });

  // 跳转到登录页
  await page.goto('/login');

  // 等待登录页加载
  await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);
}

/**
 * 保存认证状态到文件
 *
 * 用于在测试之间复用登录状态，减少重复登录
 *
 * @param context - Playwright BrowserContext
 * @param path - 状态保存路径
 */
export async function saveAuthState(
  context: BrowserContext,
  path: string
): Promise<void> {
  await context.storageState({ path });
}

/**
 * 清除认证状态
 *
 * @param context - Playwright BrowserContext
 */
export async function clearAuthState(context: BrowserContext): Promise<void> {
  await context.clearCookies();

  // 清除 localStorage（需要在页面上下文中执行）
  // 注意：这个函数通常配合 page.evaluate 使用
}

/**
 * 检查是否已登录
 *
 * @param page - Playwright Page 对象
 * @returns 是否已登录
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEYS.ACCESS_TOKEN);
  return token !== null;
}

/**
 * 获取当前存储的 token
 *
 * @param page - Playwright Page 对象
 * @returns access_token 或 null
 */
export async function getAccessToken(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * 获取当前组织 ID
 *
 * @param page - Playwright Page 对象
 * @returns 组织 ID 或 null
 */
export async function getCurrentOrgId(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), AUTH_STORAGE_KEYS.CURRENT_ORG_ID);
}

/**
 * 设置当前组织 ID
 *
 * @param page - Playwright Page 对象
 * @param orgId - 组织 ID
 */
export async function setCurrentOrgId(page: Page, orgId: string): Promise<void> {
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: AUTH_STORAGE_KEYS.CURRENT_ORG_ID, value: orgId }
  );
}
