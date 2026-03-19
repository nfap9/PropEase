/**
 * 运营后台组织管理页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_ORGANIZATIONS } from '../../testids';

export class OrganizationsPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.HEADING}"]`);
  readonly list = this.page.locator(`[data-testid="${ADMIN_ORGANIZATIONS.LIST}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/organizations');
    await this.waitForHeading(ADMIN_ORGANIZATIONS.HEADING);
  }

  async isListVisible(): Promise<boolean> {
    return this.list.isVisible();
  }

  async getListRowCount(): Promise<number> {
    await this.list.waitFor({ state: 'visible', timeout: 10000 });
    return this.list.locator('table tbody tr').count();
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.heading.isVisible();
  }

  async filterByStatus(status: 'all' | 'active' | 'inactive'): Promise<void> {
    await this.page.click('[role="combobox"]');
    await this.page.waitForSelector('[role="listbox"]', { timeout: 5000 });
    await this.page.click(`[role="option"]:has-text("${status === 'all' ? '全部' : status === 'active' ? '启用' : '停用'}")`);
  }
}
