/**
 * 运营后台概览页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN } from '../../testids';

export class OverviewPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN.OVERVIEW_HEADING}"]`);
  readonly apartmentCountCard = this.page.locator(`[data-testid="${ADMIN.APARTMENT_COUNT}"]`);
  readonly roomCountCard = this.page.locator(`[data-testid="${ADMIN.ROOM_COUNT}"]`);
  readonly occupancyRateCard = this.page.locator(`[data-testid="${ADMIN.OCCUPANCY_RATE}"]`);
  readonly monthlyRevenueCard = this.page.locator(`[data-testid="${ADMIN.MONTHLY_REVENUE}"]`);
  readonly pendingBillsCard = this.page.locator(`[data-testid="${ADMIN.PENDING_BILLS}"]`);
  readonly overdueBillsCard = this.page.locator(`[data-testid="${ADMIN.OVERDUE_BILLS}"]`);
  readonly logoutButton = this.page.locator(`[data-testid="${ADMIN.LOGOUT_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/');
    await this.waitForHeading(ADMIN.OVERVIEW_HEADING);
  }

  async getStatCardValue(testId: string): Promise<string> {
    const card = this.page.locator(`[data-testid="${testId}"]`);
    await card.waitFor({ state: 'visible', timeout: 10000 });
    return (await card.textContent()) ?? '';
  }

  async isHeadingVisible(): Promise<boolean> {
    return this.heading.isVisible();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.waitForLoginPage();
  }
}
