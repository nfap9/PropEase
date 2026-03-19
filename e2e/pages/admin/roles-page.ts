/**
 * 运营后台运营角色页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_ROLES } from '../../testids';

export class RolesPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_ROLES.HEADING}"]`);
  readonly list = this.page.locator(`[data-testid="${ADMIN_ROLES.LIST}"]`);
  readonly createButton = this.page.locator(`[data-testid="${ADMIN_ROLES.CREATE_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/roles');
    await this.waitForHeading(ADMIN_ROLES.HEADING);
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  }

  async isListVisible(): Promise<boolean> {
    return this.list.isVisible();
  }

  async getRoleCount(): Promise<number> {
    await this.list.waitFor({ state: 'visible', timeout: 10000 });
    return this.list.locator('ul li').count();
  }
}
