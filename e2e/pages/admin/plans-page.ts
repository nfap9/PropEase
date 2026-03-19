/**
 * 运营后台服务配置页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_PLANS } from '../../testids';

export class PlansPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_PLANS.HEADING}"]`);
  readonly list = this.page.locator(`[data-testid="${ADMIN_PLANS.LIST}"]`);
  readonly createButton = this.page.locator(`[data-testid="${ADMIN_PLANS.CREATE_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/plans');
    await this.waitForHeading(ADMIN_PLANS.HEADING);
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
