/**
 * 运营后台订阅管理页 Page Object
 */

import { Page, Locator } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_SUBSCRIPTIONS } from '../../testids';

export class SubscriptionsPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_SUBSCRIPTIONS.HEADING}"]`);
  readonly list = this.page.locator(`[data-testid="${ADMIN_SUBSCRIPTIONS.LIST}"]`);
  readonly statusFilter = this.page.locator(`[data-testid="${ADMIN_SUBSCRIPTIONS.STATUS_FILTER}"]`);
  readonly planFilter = this.page.locator(`[data-testid="${ADMIN_SUBSCRIPTIONS.PLAN_FILTER}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/subscriptions');
    await this.waitForHeading(ADMIN_SUBSCRIPTIONS.HEADING);
  }

  async isListVisible(): Promise<boolean> {
    return this.list.isVisible();
  }

  async getRowCount(): Promise<number> {
    await this.list.waitFor({ state: 'visible', timeout: 10000 });
    return this.list.locator('table tbody tr').count();
  }

  async getRowLocator(rowIndex: number): Promise<Locator> {
    await this.list.waitFor({ state: 'visible', timeout: 10000 });
    return this.list.locator('table tbody tr').nth(rowIndex);
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.heading.isVisible();
  }
}
