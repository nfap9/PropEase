/**
 * 运营后台运营账号页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_USERS } from '../../testids';

export class UsersPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_USERS.HEADING}"]`);
  readonly list = this.page.locator(`[data-testid="${ADMIN_USERS.LIST}"]`);
  readonly createButton = this.page.locator(`[data-testid="${ADMIN_USERS.CREATE_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/users');
    await this.waitForHeading(ADMIN_USERS.HEADING);
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  }

  async isListVisible(): Promise<boolean> {
    return this.list.isVisible();
  }

  async getRowCount(): Promise<number> {
    await this.list.waitFor({ state: 'visible', timeout: 10000 });
    return this.list.locator('table tbody tr').count();
  }
}
