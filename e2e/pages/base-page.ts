/**
 * Page Object 基础类
 *
 * 提供所有页面对象共用的通用方法
 * 继承此类可以快速创建具体的页面对象
 */

import { Page, Locator, expect } from '@playwright/test';
import { COMMON } from '../testids';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== 导航 ====================

  /**
   * 导航到指定路径
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * 刷新当前页面
   */
  async reload(): Promise<void> {
    await this.page.reload();
  }

  /**
   * 等待页面导航完成
   */
  async waitForURL(pattern: string | RegExp, options?: { timeout?: number }): Promise<void> {
    await this.page.waitForURL(pattern, { timeout: options?.timeout ?? 30000 });
  }

  // ==================== 等待 ====================

  /**
   * 等待加载指示器消失
   */
  async waitForLoading(options?: { timeout?: number }): Promise<void> {
    const loading = this.page.locator(`[data-testid="${COMMON.LOADING}"]`);
    await loading.waitFor({ state: 'hidden', timeout: options?.timeout ?? 30000 }).catch(() => {
      // 加载元素可能已经不存在，忽略错误
    });
  }

  /**
   * 等待元素可见
   */
  async waitForVisible(selector: string, options?: { timeout?: number }): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout: options?.timeout ?? 10000 });
    return locator;
  }

  /**
   * 等待元素消失
   */
  async waitForHidden(selector: string, options?: { timeout?: number }): Promise<void> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'hidden', timeout: options?.timeout ?? 10000 });
  }

  /**
   * 等待元素可点击
   */
  async waitForEnabled(selector: string, options?: { timeout?: number }): Promise<Locator> {
    const locator = this.page.locator(selector);
    await locator.waitFor({ state: 'visible', timeout: options?.timeout ?? 10000 });
    return locator;
  }

  // ==================== 输入 ====================

  /**
   * 填充输入框
   */
  async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  /**
   * 清空并填充输入框
   */
  async clearAndFill(selector: string, value: string): Promise<void> {
    await this.page.locator(selector).clear();
    await this.page.fill(selector, value);
  }

  /**
   * 输入文本（模拟打字）
   */
  async type(selector: string, value: string, options?: { delay?: number }): Promise<void> {
    await this.page.type(selector, value, options);
  }

  // ==================== 点击 ====================

  /**
   * 点击元素
   */
  async click(selector: string, options?: { timeout?: number }): Promise<void> {
    await this.page.click(selector, { timeout: options?.timeout ?? 10000 });
  }

  /**
   * 点击并等待导航
   */
  async clickAndNavigate(selector: string, expectedPath: string | RegExp): Promise<void> {
    await Promise.all([
      this.page.waitForURL(expectedPath),
      this.page.click(selector),
    ]);
  }

  // ==================== 对话框 ====================

  /**
   * 等待对话框出现
   */
  async waitForDialog(testId: string, options?: { timeout?: number }): Promise<Locator> {
    const dialog = this.page.locator(`[data-testid="${testId}"]`);
    await dialog.waitFor({ state: 'visible', timeout: options?.timeout ?? 10000 });
    return dialog;
  }

  /**
   * 等待对话框消失
   */
  async waitForDialogHidden(testId: string, options?: { timeout?: number }): Promise<void> {
    const dialog = this.page.locator(`[data-testid="${testId}"]`);
    await dialog.waitFor({ state: 'hidden', timeout: options?.timeout ?? 10000 });
  }

  /**
   * 点击确认按钮（通用）
   */
  async clickConfirm(): Promise<void> {
    await this.page.click(`[data-testid="${COMMON.CONFIRM_BUTTON}"]`);
  }

  /**
   * 点击取消按钮（通用）
   */
  async clickCancel(): Promise<void> {
    await this.page.click(`[data-testid="${COMMON.CANCEL_BUTTON}"]`);
  }

  /**
   * 点击关闭按钮（通用）
   */
  async clickClose(): Promise<void> {
    await this.page.click(`[data-testid="${COMMON.CLOSE_BUTTON}"]`);
  }

  // ==================== 提示消息 ====================

  /**
   * 等待成功提示出现
   */
  async waitForSuccess(options?: { timeout?: number }): Promise<Locator> {
    return this.page.waitForSelector(`[data-testid="${COMMON.SUCCESS}"]`, {
      timeout: options?.timeout ?? 5000,
    });
  }

  /**
   * 等待错误提示出现
   */
  async waitForError(options?: { timeout?: number }): Promise<Locator> {
    return this.page.waitForSelector(`[data-testid="${COMMON.ERROR}"]`, {
      timeout: options?.timeout ?? 5000,
    });
  }

  // ==================== 断言 ====================

  /**
   * 验证元素可见
   */
  async expectVisible(selector: string, options?: { timeout?: number }): Promise<void> {
    await expect(this.page.locator(selector)).toBeVisible({ timeout: options?.timeout ?? 10000 });
  }

  /**
   * 验证元素不可见
   */
  async expectHidden(selector: string, options?: { timeout?: number }): Promise<void> {
    await expect(this.page.locator(selector)).not.toBeVisible({ timeout: options?.timeout ?? 10000 });
  }

  /**
   * 验证元素包含文本
   */
  async expectText(selector: string, text: string | RegExp): Promise<void> {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  /**
   * 验证当前 URL
   */
  async expectURL(pattern: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(pattern);
  }

  // ==================== 工具 ====================

  /**
   * 获取元素文本
   */
  async getText(selector: string): Promise<string> {
    return this.page.textContent(selector) ?? '';
  }

  /**
   * 获取元素属性
   */
  async getAttribute(selector: string, attribute: string): Promise<string | null> {
    return this.page.getAttribute(selector, attribute);
  }

  /**
   * 检查元素是否存在
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.locator(selector).isVisible();
  }

  /**
   * 等待指定时间
   */
  async wait(ms: number): Promise<void> {
    await this.page.waitForTimeout(ms);
  }

  /**
   * 获取当前页面 URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  // ==================== 截图 ====================

  /**
   * 截图（用于调试）
   */
  async screenshot(name?: string): Promise<void> {
    const filename = name ? `e2e/results/screenshots/${name}.png` : `e2e/results/screenshots/debug_${Date.now()}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
  }
}
