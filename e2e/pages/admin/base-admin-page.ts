/**
 * 运营后台 Page Object 基类
 *
 * 继承 BasePage，提供运营后台通用的页面操作方法
 */

import { Page } from '@playwright/test';
import { BasePage } from '../base-page';
import { ADMIN_LOGIN } from '../../testids';

export class BaseAdminPage extends BasePage {
  protected adminBaseUrl: string;

  constructor(page: Page) {
    super(page);
    this.adminBaseUrl = process.env.E2E_ADMIN_BASE_URL || 'http://localhost:3001';
  }

  /**
   * 导航到运营后台指定路径
   */
  async goto(path: string = ''): Promise<void> {
    await this.page.goto(`${this.adminBaseUrl}${path}`);
  }

  /**
   * 检查页面是否包含指定 heading
   */
  async isOnPage(headingTestId: string): Promise<boolean> {
    return this.page.locator(`[data-testid="${headingTestId}"]`).isVisible();
  }

  /**
   * 等待指定 heading 出现
   */
  async waitForHeading(headingTestId: string): Promise<void> {
    await this.page.waitForSelector(`[data-testid="${headingTestId}"]`, { timeout: 10000 });
  }

  /**
   * 等待登录页加载
   */
  async waitForLoginPage(): Promise<void> {
    await this.page.waitForSelector(`[data-testid="${ADMIN_LOGIN.PAGE}"]`, { timeout: 10000 });
  }

  /**
   * 检查是否已登录运营后台
   */
  async isLoggedIn(): Promise<boolean> {
    return this.page.evaluate(() => {
      return localStorage.getItem('admin_access_token') !== null;
    });
  }
}
