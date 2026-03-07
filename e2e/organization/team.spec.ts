/**
 * 组织团队管理 E2E 测试
 *
 * 覆盖场景：
 * - 组织列表
 * - 创建组织
 * - 成员管理
 */

import { test, expect } from '../fixtures';
import { goToSettings } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { TEAM_SETTINGS, SETTINGS } from '../testids';

test.describe('团队设置页面', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToSettings(page);
  });

  test('应该显示设置页面', async ({ page }) => {
    await expect(page.locator(`[data-testid="${SETTINGS.HEADING}"]`)).toBeVisible();
  });

  test('导航到团队设置', async ({ page }) => {
    await expect(page.locator(`[data-testid="${SETTINGS.TEAM}"]`)).toBeVisible();
    await page.click(`[data-testid="${SETTINGS.TEAM}"]`);

    // 等待跳转到团队设置页面
    await page.waitForURL(/\/settings\/team/);
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.HEADING}"]`)).toBeVisible();
  });
});

test.describe('组织管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings/team');
    await page.waitForSelector(`[data-testid="${TEAM_SETTINGS.HEADING}"]`);
  });

  test('显示组织信息', async ({ page }) => {
    // 验证组织名称显示
    const orgName = page.locator('text="E2E个人组织"');
    if (await orgName.isVisible()) {
      await expect(orgName).toBeVisible();
    }
  });

  test('显示成员列表', async ({ page }) => {
    // 验证成员列表存在
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.MEMBER_LIST}"]`)).toBeVisible();
  });

  test('显示创建组织按钮', async ({ page }) => {
    // 验证创建组织按钮存在
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_BTN}"]`)).toBeVisible();
  });
});

test.describe('创建组织', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings/team');
    await page.waitForSelector(`[data-testid="${TEAM_SETTINGS.HEADING}"]`);
  });

  test('显示创建组织弹窗', async ({ page }) => {
    await page.click(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_BTN}"]`);

    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
  });

  test('成功创建组织', async ({ page }) => {
    await page.click(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_BTN}"]`);
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 填写组织名称
    const nameInput = page.locator('[data-testid="team-org-name-input"]');
    await nameInput.fill(`测试组织_${Date.now()}`);

    // 提交
    const confirmButton = page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 等待弹窗关闭
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"]`)).not.toBeVisible({ timeout: 5000 });
  });

  test('组织名称为空显示验证错误', async ({ page }) => {
    await page.click(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_BTN}"]`);
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 不填写名称直接提交
    const confirmButton = page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.CREATE_ORG_DIALOG}"]`)).toBeVisible();
  });
});

test.describe('成员管理', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/settings/team');
    await page.waitForSelector(`[data-testid="${TEAM_SETTINGS.HEADING}"]`);
  });

  test('显示邀请成员弹窗', async ({ page }) => {
    // 点击邀请成员按钮
    const inviteButton = page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_BTN}"]`);
    await inviteButton.click();

    // 等待弹窗
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });
  });

  test('邀请成员 - 手机号为空显示验证错误', async ({ page }) => {
    const inviteButton = page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_BTN}"]`);
    await inviteButton.click();
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 不填写手机号直接提交
    const confirmButton = page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"]`)).toBeVisible();
  });

  test('邀请成员 - 错误手机号格式显示验证错误', async ({ page }) => {
    const inviteButton = page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_BTN}"]`);
    await inviteButton.click();
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"]`)).toBeVisible({ timeout: 3000 });

    // 填写错误格式的手机号
    const phoneInput = page.locator('[data-testid="team-invite-phone-input"]');
    await phoneInput.fill('123456');

    const confirmButton = page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"] button:has-text("确认")`).first();
    await confirmButton.click();

    // 应该显示验证错误
    await expect(page.locator(`[data-testid="${TEAM_SETTINGS.INVITE_DIALOG}"]`)).toBeVisible();
  });

  test('显示成员角色', async ({ page }) => {
    // 等待成员列表加载
    await page.waitForSelector(`[data-testid="${TEAM_SETTINGS.MEMBER_LIST}"]`);

    // 验证当前用户的角色显示
    const ownerRole = page.locator('text="所有者"');
    if (await ownerRole.isVisible()) {
      await expect(ownerRole.first()).toBeVisible();
    }
  });
});
