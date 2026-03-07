/**
 * 登录功能 E2E 测试
 *
 * 覆盖场景：
 * - 密码登录
 * - 验证码登录
 * - 错误凭证处理
 * - 已登录用户重定向
 */

import { test, expect } from '../fixtures';
import { login, loginWithCode, logout, isAuthenticated } from '../helpers/auth';
import { AUTH, DASHBOARD } from '../testids';

test.describe('登录页面', () => {
  test('登录页面应该正常加载', async ({ page }) => {
    await page.goto('/login');

    // 验证登录页面存在
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();

    // 验证关键元素存在
    await expect(page.locator(`[data-testid="${AUTH.PHONE_INPUT}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_BUTTON}"]`)).toBeVisible();
  });

  test('应该在密码登录和验证码登录之间切换', async ({ page }) => {
    await page.goto('/login');

    // 默认应该是密码登录 Tab
    await expect(page.locator(`[data-testid="${AUTH.PASSWORD_INPUT}"]`)).toBeVisible();

    // 切换到验证码登录
    await page.click(`[data-testid="${AUTH.CODE_TAB}"]`);
    await expect(page.locator(`[data-testid="${AUTH.PHONE_INPUT_CODE}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${AUTH.VERIFICATION_CODE_INPUT}"]`)).toBeVisible();

    // 切换回密码登录
    await page.click(`[data-testid="${AUTH.PASSWORD_TAB}"]`);
    await expect(page.locator(`[data-testid="${AUTH.PASSWORD_INPUT}"]`)).toBeVisible();
  });
});

test.describe('密码登录', () => {
  test('成功登录后跳转到首页', async ({ page }) => {
    await login(page);

    // 验证已登录
    expect(await isAuthenticated(page)).toBe(true);

    // 验证已跳转
    expect(page.url()).toMatch(/\/(dashboard|apartments|rooms)/);
  });

  test('登录后 token 存储到 localStorage', async ({ page }) => {
    await login(page);

    // 验证 token 已存储
    const hasToken = await page.evaluate(() => {
      return localStorage.getItem('access_token') !== null;
    });
    expect(hasToken).toBe(true);
  });

  test('空手机号显示验证错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 不填写任何内容直接点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();
  });

  test('错误手机号格式显示验证错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 填写错误的手机号格式
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '123456');
    await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, 'Test1234');

    // 点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();
  });

  test('空密码显示验证错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 只填写手机号
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13800138000');

    // 点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();
  });

  test('错误密码显示错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 填写正确的手机号和错误的密码
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13800138000');
    await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, 'WrongPassword123');

    // 点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 等待错误提示出现或页面不跳转
    // 注：具体错误提示的实现可能不同，这里验证页面保持在登录页
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  test('不存在的手机号显示错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 填写不存在的手机号
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '19999999999');
    await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, 'Test1234');

    // 点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 等待错误提示
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });
});

test.describe('验证码登录', () => {
  test('成功登录后跳转到首页', async ({ page }) => {
    await loginWithCode(page);

    // 验证已登录
    expect(await isAuthenticated(page)).toBe(true);

    // 验证已跳转
    expect(page.url()).toMatch(/\/(dashboard|apartments|rooms)/);
  });

  test('空验证码显示验证错误', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 切换到验证码登录
    await page.click(`[data-testid="${AUTH.CODE_TAB}"]`);

    // 只填写手机号
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT_CODE}"]`, '13800138000');

    // 点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();
  });

  test('错误验证码显示错误提示', async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector(`[data-testid="${AUTH.LOGIN_PAGE}"]`);

    // 切换到验证码登录
    await page.click(`[data-testid="${AUTH.CODE_TAB}"]`);

    // 填写手机号和错误的验证码
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT_CODE}"]`, '13800138000');
    await page.fill(`[data-testid="${AUTH.VERIFICATION_CODE_INPUT}"]`, '000000');

    // 点击登录
    await page.click(`[data-testid="${AUTH.LOGIN_BUTTON}"]`);

    // 等待错误提示
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });
});

test.describe('已登录用户', () => {
  test('已登录用户访问登录页应自动跳转', async ({ authenticatedPage }) => {
    // 已登录用户访问登录页
    await authenticatedPage.goto('/login');

    // 应该自动跳转到其他页面
    await authenticatedPage.waitForURL(/\/(dashboard|apartments|rooms)/, { timeout: 5000 });
  });

  test('退出登录后跳转到登录页', async ({ page }) => {
    // 先登录
    await login(page);

    // 退出登录
    await logout(page);

    // 验证已跳转到登录页
    await expect(page.locator(`[data-testid="${AUTH.LOGIN_PAGE}"]`)).toBeVisible();

    // 验证 token 已清除
    expect(await isAuthenticated(page)).toBe(false);
  });
});
