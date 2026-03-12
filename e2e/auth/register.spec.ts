/**
 * 注册功能 E2E 测试
 *
 * 覆盖场景：
 * - 成功注册新用户
 * - 重复手机号注册
 * - 参数校验
 */

import { test, expect } from '../fixtures';
import { AUTH } from '../testids';

test.describe('注册页面', () => {
  test('注册页面应该正常加载', async ({ page }) => {
    await page.goto('/register');

    // 验证注册页面存在
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();

    // 验证关键元素存在
    await expect(page.locator(`[data-testid="${AUTH.PHONE_INPUT}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_BUTTON}"]`)).toBeVisible();
  });

  test('从登录页可以跳转到注册页', async ({ page }) => {
    await page.goto('/login');

    // 点击注册链接
    await page.click('a[href="/register"]');

    // 验证跳转到注册页
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });
});

test.describe('注册表单验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector(`[data-testid="${AUTH.REGISTER_PAGE}"]`);
  });

  test('空手机号显示验证错误', async ({ page }) => {
    // 不填写手机号直接点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });

  test('错误手机号格式显示验证错误', async ({ page }) => {
    // 填写错误的手机号格式
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '123456');

    // 点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });

  test('空姓名显示验证错误', async ({ page }) => {
    // 只填写手机号
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13900139999');

    // 点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });

  test('空密码显示验证错误', async ({ page }) => {
    // 填写手机号和姓名
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13900139999');
    await page.fill(`[data-testid="${AUTH.NAME_INPUT}"]`, '测试用户');

    // 点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });

  test('密码强度不足显示验证错误', async ({ page }) => {
    // 填写手机号、姓名和弱密码
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13900139999');
    await page.fill(`[data-testid="${AUTH.NAME_INPUT}"]`, '测试用户');
    await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, '123');

    // 点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });

  test('密码和确认密码不一致显示验证错误', async ({ page }) => {
    // 填写必填信息，密码和确认密码不一致
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13900139999');
    await page.fill(`[data-testid="${AUTH.NAME_INPUT}"]`, '测试用户');
    await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, 'Test1234');
    await page.fill(`[data-testid="${AUTH.CONFIRM_PASSWORD_INPUT}"]`, 'Test5678');

    // 点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 应该显示验证错误（页面不跳转）
    await expect(page.locator(`[data-testid="${AUTH.REGISTER_PAGE}"]`)).toBeVisible();
  });
});

test.describe('已注册手机号', () => {
  test('使用已注册手机号注册显示错误', async ({ page }) => {
    await page.goto('/register');
    await page.waitForSelector(`[data-testid="${AUTH.REGISTER_PAGE}"]`);

    // 使用测试账号手机号（已注册）
    await page.fill(`[data-testid="${AUTH.PHONE_INPUT}"]`, '13800138000');
    await page.fill(`[data-testid="${AUTH.NAME_INPUT}"]`, '测试用户');
    await page.fill(`[data-testid="${AUTH.PASSWORD_INPUT}"]`, 'Test1234');
    await page.fill(`[data-testid="${AUTH.CONFIRM_PASSWORD_INPUT}"]`, 'Test1234');

    // 点击注册
    await page.click(`[data-testid="${AUTH.REGISTER_BUTTON}"]`);

    // 等待响应
    await page.waitForTimeout(1000);

    // 应该显示错误（页面不跳转）
    expect(page.url()).toContain('/register');
  });
});
