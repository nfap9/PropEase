/**
 * 运营后台额度定价页 Page Object
 */

import { Page } from '@playwright/test';
import { BaseAdminPage } from './base-admin-page';
import { ADMIN_PRICING } from '../../testids';

export class PricingPage extends BaseAdminPage {
  readonly heading = this.page.locator(`[data-testid="${ADMIN_PRICING.HEADING}"]`);
  readonly pricePerOrgInput = this.page.locator(`[data-testid="${ADMIN_PRICING.PRICE_PER_ORG_INPUT}"]`);
  readonly pricePerApartmentInput = this.page.locator(`[data-testid="${ADMIN_PRICING.PRICE_PER_APARTMENT_INPUT}"]`);
  readonly pricePerRoomInput = this.page.locator(`[data-testid="${ADMIN_PRICING.PRICE_PER_ROOM_INPUT}"]`);
  readonly pricePerMemberInput = this.page.locator(`[data-testid="${ADMIN_PRICING.PRICE_PER_MEMBER_INPUT}"]`);
  readonly saveButton = this.page.locator(`[data-testid="${ADMIN_PRICING.SAVE_BUTTON}"]`);

  constructor(page: Page) {
    super(page);
  }

  async load(): Promise<void> {
    await this.goto('/usage-pricing');
    await this.waitForHeading(ADMIN_PRICING.HEADING);
  }

  async setPricePerOrg(value: string): Promise<void> {
    await this.pricePerOrgInput.clear();
    await this.pricePerOrgInput.fill(value);
  }

  async setPricePerApartment(value: string): Promise<void> {
    await this.pricePerApartmentInput.clear();
    await this.pricePerApartmentInput.fill(value);
  }

  async setPricePerRoom(value: string): Promise<void> {
    await this.pricePerRoomInput.clear();
    await this.pricePerRoomInput.fill(value);
  }

  async setPricePerMember(value: string): Promise<void> {
    await this.pricePerMemberInput.clear();
    await this.pricePerMemberInput.fill(value);
  }

  async save(): Promise<void> {
    await this.saveButton.click();
    await this.waitForLoading();
  }
}
