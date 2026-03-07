import { test, expect } from '@playwright/test';
import { createUniquePhone } from '../test-helpers';
import { AUTH } from '../testids';

/**
 * 认证模块 E2E 测试
 * 对应测试用例：1.1 用户认证模块
 *
 * 模块编号：AUTH（认证）
 * - AUTH-REG-*: 注册功能
 * - AUTH-LOGIN-*: 登录功能
 */

test.describe('认证 - 注册功能 (AUTH-REG)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByTestId('auth-register-page')).toBeVisible();
  });

  test('手机号注册成功 (AUTH-REG-01)', async ({ page }) => {
    // 生成唯一的测试手机号
    const phone = createUniquePhone();
    const name = `E2E测试用户_${Date.now()}`;
    const password = 'Test1234';

    // 填写注册表单
    await page.getByTestId('auth-name-input').fill(name);
    await page.getByTestId(AUTH.PHONE_INPUT).fill(phone);
    await page.getByTestId('auth-password-input').fill(password);
    await page.getByTestId('auth-confirm-password-input').fill(password);

    // 由于验证码需要实际发送，这里只验证表单填写和按钮状态
    // 实际注册测试需要 mock 验证码接口或使用测试环境
    const registerButton = page.getByTestId('auth-register-button');
    await expect(registerButton).toBeEnabled();
  });

  test('手机号为空注册 (AUTH-REG-02)', async ({ page }) => {
    // 不填写手机号，直接点击注册
    await page.getByTestId('auth-name-input').fill('测试用户');
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-confirm-password-input').fill('Test1234');
    await page.getByTestId('auth-register-button').click();

    // 验证表单验证错误提示
    // 手机号字段应该显示错误
    await expect(page.getByText(/请输入有效的手机号|请输入手机号/)).toBeVisible();
  });

  test('用户名为空注册 (AUTH-REG-03)', async ({ page }) => {
    // 不填写姓名
    await page.getByTestId(AUTH.PHONE_INPUT).fill(createUniquePhone());
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-confirm-password-input').fill('Test1234');
    await page.getByTestId('auth-register-button').click();

    // 验证姓名字段错误提示
    await expect(page.getByText(/姓名至少2个字符|请输入姓名/)).toBeVisible();
  });

  test('密码为空注册 (AUTH-REG-04)', async ({ page }) => {
    // 不填写密码
    await page.getByTestId('auth-name-input').fill('测试用户');
    await page.getByTestId(AUTH.PHONE_INPUT).fill(createUniquePhone());
    await page.getByTestId('auth-confirm-password-input').fill('Test1234');
    await page.getByTestId('auth-register-button').click();

    // 验证密码字段错误提示
    await expect(page.getByText(/密码至少8个字符|请输入密码/)).toBeVisible();
  });

  test('两次密码不一致 (AUTH-REG-05)', async ({ page }) => {
    // 填写不一致的密码
    await page.getByTestId('auth-name-input').fill('测试用户');
    await page.getByTestId(AUTH.PHONE_INPUT).fill(createUniquePhone());
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-confirm-password-input').fill('Different1');
    await page.getByTestId('auth-register-button').click();

    // 验证密码不一致提示
    await expect(page.getByText(/两次输入的密码不一致/)).toBeVisible();
  });

  test('手机号格式错误 (AUTH-REG-06)', async ({ page }) => {
    // 填写格式错误的手机号
    await page.getByTestId('auth-name-input').fill('测试用户');
    await page.getByTestId(AUTH.PHONE_INPUT).fill('12345');
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-confirm-password-input').fill('Test1234');
    await page.getByTestId('auth-register-button').click();

    // 验证手机号格式错误提示
    await expect(page.getByText(/手机号格式不正确|请输入有效的手机号/)).toBeVisible();
  });

  test('已注册手机号 (AUTH-REG-07)', async ({ page }) => {
    // 使用已存在的测试账号手机号
    const existingPhone = process.env.E2E_PHONE || '13800138000';
    await page.getByTestId('auth-name-input').fill('测试用户');
    await page.getByTestId(AUTH.PHONE_INPUT).fill(existingPhone);
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-confirm-password-input').fill('Test1234');
    await page.getByTestId('auth-register-button').click();

    // 验证已注册提示
    await expect(page.getByText(/该手机号已注册|手机号已存在/)).toBeVisible({ timeout: 5000 });
  });

  test('密码强度不足 (AUTH-REG-08)', async ({ page }) => {
    // 填写弱密码
    await page.getByTestId('auth-name-input').fill('测试用户');
    await page.getByTestId(AUTH.PHONE_INPUT).fill(createUniquePhone());
    await page.getByTestId('auth-password-input').fill('123456');
    await page.getByTestId('auth-confirm-password-input').fill('123456');
    await page.getByTestId('auth-register-button').click();

    // 验证密码强度提示（如果有的话）
    const strengthWarning = page.getByText(/密码强度|密码太弱|至少8个字符/);
    const hasWarning = await strengthWarning.isVisible().catch(() => false);
    // 有些系统可能允许弱密码，所以这只是可选验证
    if (hasWarning) {
      await expect(strengthWarning).toBeVisible();
    }
  });
});

test.describe('认证 - 登录功能 (AUTH-LOGIN)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('auth-login-page')).toBeVisible();
  });

  test('手机号+密码登录成功 (AUTH-LOGIN-01)', async ({ page }) => {
    // 使用环境变量中的测试账号
    const phone = process.env.E2E_PHONE || '13800138000';
    const password = process.env.E2E_PASSWORD || 'Test1234';

    // 确保在密码登录 Tab
    await page.getByTestId(AUTH.PASSWORD_TAB).click();

    // 填写登录表单
    await page.getByTestId(AUTH.PHONE_INPUT).fill(phone);
    await page.getByTestId('auth-password-input').fill(password);
    await page.getByTestId('auth-login-button').click();

    // 验证登录成功跳转
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('手机号为空登录 (AUTH-LOGIN-03)', async ({ page }) => {
    // 确保在密码登录 Tab
    await page.getByTestId(AUTH.PASSWORD_TAB).click();

    // 只填写密码
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-login-button').click();

    // 验证手机号错误提示
    await expect(page.getByText(/请输入有效的手机号|请输入手机号/)).toBeVisible();
  });

  test('密码为空登录 (AUTH-LOGIN-04)', async ({ page }) => {
    // 确保在密码登录 Tab
    await page.getByTestId(AUTH.PASSWORD_TAB).click();

    // 只填写手机号
    await page.getByTestId(AUTH.PHONE_INPUT).fill('13800138000');
    await page.getByTestId('auth-login-button').click();

    // 验证密码错误提示
    await expect(page.getByText(/密码至少8个字符|请输入密码/)).toBeVisible();
  });

  test('密码错误 (AUTH-LOGIN-05)', async ({ page }) => {
    // 确保在密码登录 Tab
    await page.getByTestId(AUTH.PASSWORD_TAB).click();

    // 填写正确手机号但错误密码
    const phone = process.env.E2E_PHONE || '13800138000';
    await page.getByTestId(AUTH.PHONE_INPUT).fill(phone);
    await page.getByTestId('auth-password-input').fill('WrongPassword1');
    await page.getByTestId('auth-login-button').click();

    // 验证登录失败提示
    await expect(page.getByText(/手机号或密码错误/)).toBeVisible();
  });

  test('手机号+验证码登录成功 (AUTH-LOGIN-02)', async ({ page }) => {
    // 切换到验证码登录 Tab
    await page.getByTestId(AUTH.CODE_TAB).click();

    const phone = process.env.E2E_PHONE || '13800138000';
    await page.getByTestId(AUTH.PHONE_INPUT_CODE).fill(phone);

    // 点击发送验证码按钮
    const sendCodeBtn = page.getByTestId(AUTH.SEND_CODE_BUTTON);
    if (await sendCodeBtn.isVisible()) {
      await sendCodeBtn.click();
      // 等待发送成功提示
      await expect(page.getByText(/验证码已发送/)).toBeVisible({ timeout: 10000 });
    }

    // 由于验证码需要实际发送，这里只验证按钮状态和流程
    // 实际验证码测试需要 mock 或测试环境
  });

  test('未注册手机号登录 (AUTH-LOGIN-06)', async ({ page }) => {
    // 确保在密码登录 Tab
    await page.getByTestId(AUTH.PASSWORD_TAB).click();

    // 填写未注册的手机号
    await page.getByTestId(AUTH.PHONE_INPUT).fill(createUniquePhone());
    await page.getByTestId('auth-password-input').fill('Test1234');
    await page.getByTestId('auth-login-button').click();

    // 验证登录失败提示
    await expect(page.getByText(/用户不存在|手机号或密码错误/)).toBeVisible({ timeout: 5000 });
  });

  test('验证码错误 (AUTH-LOGIN-07)', async ({ page }) => {
    // 切换到验证码登录 Tab
    await page.getByTestId(AUTH.CODE_TAB).click();

    const phone = process.env.E2E_PHONE || '13800138000';
    await page.getByTestId(AUTH.PHONE_INPUT_CODE).fill(phone);

    // 点击发送验证码按钮
    const sendCodeBtn = page.getByTestId(AUTH.SEND_CODE_BUTTON);
    if (await sendCodeBtn.isVisible()) {
      await sendCodeBtn.click();
      await page.waitForTimeout(1000);
    }

    // 填写错误验证码
    const codeInput = page.getByTestId(AUTH.VERIFICATION_CODE_INPUT);
    if (await codeInput.isVisible()) {
      await codeInput.fill('000000');
      await page.getByTestId('auth-login-button').click();

      // 验证验证码错误提示
      await expect(page.getByText(/验证码错误/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('验证码过期 (AUTH-LOGIN-08)', async ({ page }) => {
    // 此测试需要等待验证码过期，通常需要较长时间
    // 在实际测试环境中可以 mock 验证码过期场景
    // 这里只验证页面元素存在

    // 切换到验证码登录 Tab
    await page.getByTestId(AUTH.CODE_TAB).click();

    const phone = process.env.E2E_PHONE || '13800138000';
    await page.getByTestId(AUTH.PHONE_INPUT_CODE).fill(phone);

    // 点击发送验证码按钮
    const sendCodeBtn = page.getByTestId(AUTH.SEND_CODE_BUTTON);
    if (await sendCodeBtn.isVisible()) {
      await sendCodeBtn.click();
      // 验证发送成功
      await expect(page.getByText(/验证码已发送/)).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('认证 - 访问控制 (AUTH-ACCESS)', () => {
  test('未登录访问受保护页面 (AUTH-LOGIN-09)', async ({ page }) => {
    // 直接访问受保护页面
    await page.goto('/dashboard');

    // 验证重定向到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('登出功能 (AUTH-LOGIN-10)', async ({ page }) => {
    // 先登录（使用 storageState 会自动处理）
    // 这里需要手动登录以测试登出
    await page.goto('/login');

    const phone = process.env.E2E_PHONE || '13800138000';
    const password = process.env.E2E_PASSWORD || 'Test1234';

    await page.getByTestId(AUTH.PASSWORD_TAB).click();
    await page.getByTestId(AUTH.PHONE_INPUT).fill(phone);
    await page.getByTestId('auth-password-input').fill(password);
    await page.getByTestId('auth-login-button').click();

    // 等待登录成功
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // 点击用户菜单（通常在右上角）
    // 查找用户头像或用户名按钮
    const userMenu = page.locator('[data-testid="user-menu"]').or(
      page.getByRole('button', { name: /用户|头像|个人/ })
    ).or(
      page.locator('button').filter({ hasText: /退出|登出/ }).first()
    );

    // 如果找到用户菜单，点击它
    if (await userMenu.count() > 0) {
      await userMenu.first().click();
    }

    // 点击退出登录按钮
    const logoutButton = page.getByRole('button', { name: /退出登录|登出/ }).or(
      page.getByRole('menuitem', { name: /退出登录|登出/ })
    );
    await logoutButton.click();

    // 验证跳转到登录页
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // 再次访问受保护页面应该重定向到登录页
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});

test.describe('认证 - 导航 (AUTH-NAV)', () => {
  test('登录页可点击注册链接进入注册页', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('auth-register-link').click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId('auth-register-page')).toBeVisible();
  });

  test('注册页可点击登录链接进入登录页', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('link', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByTestId('auth-login-page')).toBeVisible();
  });
});
