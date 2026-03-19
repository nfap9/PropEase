/**
 * 运营后台注册用户管理页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_REGISTERED_USERS } from '../../testids';

export class RegisteredUsersPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.HEADING}"]`);
  readonly list = this.page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.LIST}"]`);
  readonly searchInput = this.page.locator(`[data-testid="${ADMIN_REGISTERED_USERS.SEARCH_INPUT}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/registered-users');
    await this.waitForHeading(ADMIN_REGISTERED_USERS.HEADING);
  }

  async search(keyword: string): Promise<void> {
    await this.searchInput.fill(keyword);
    await this.searchInput.press('Enter');
    await this.waitForLoading();
  }

  async isListVisible(): Promise<boolean> {
    return this.list.isVisible();
  }

  async getRowCount(): Promise<number> {
    await this.list.waitFor({ state: 'visible', timeout: 10000 });
    return this.list.locator('table tbody tr').count();
  }
}
