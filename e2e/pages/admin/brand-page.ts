/**
 * 运营后台品牌配置页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_BRAND } from '../../testids';

export class BrandPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_BRAND.HEADING}"]`);
  readonly nameInput = this.page.locator(`[data-testid="${ADMIN_BRAND.NAME_INPUT}"]`);
  readonly logoInput = this.page.locator(`[data-testid="${ADMIN_BRAND.LOGO_INPUT}"]`);
  readonly saveButton = this.page.locator(`[data-testid="${ADMIN_BRAND.SAVE_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/brand');
    await this.waitForHeading(ADMIN_BRAND.HEADING);
  }

  async setAppName(name: string): Promise<void> {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
  }

  async setLogoUrl(url: string): Promise<void> {
    await this.logoInput.clear();
    await this.logoInput.fill(url);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.waitForLoading();
  }
}
