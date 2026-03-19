/**
 * 运营后台 - 额度定价配置页面 E2E 测试
 *
 * 覆盖场景：
 * - 价格配置表单展示
 * - 各单价输入框
 * - 保存按钮
 * - 填写价格后保存
 */

import { test, expect } from '../fixtures';
import { PricingPage } from '../pages/admin/pricing-page';
import { ADMIN_PRICING } from '../testids';

test.describe('额度定价配置页面', () => {
  let pricingPage: PricingPage;

  test.beforeEach(async ({ adminPage }) => {
    pricingPage = new PricingPage(adminPage);
    await pricingPage.load();
  });

  test('显示价格配置表单', async () => {
    await expect(pricingPage.heading).toBeVisible();
    await expect(pricingPage.pricePerOrgInput).toBeVisible();
  });

  test('保存按钮存在且可点击', async () => {
    await expect(pricingPage.saveButton).toBeVisible();
    await expect(pricingPage.saveButton).toBeEnabled();
  });

  test('组织单价输入框可编辑', async () => {
    await pricingPage.pricePerOrgInput.clear();
    await pricingPage.pricePerOrgInput.fill('99.99');
    await expect(pricingPage.pricePerOrgInput).toHaveValue('99.99');
  });

  test('公寓单价输入框可编辑', async () => {
    await pricingPage.pricePerApartmentInput.clear();
    await pricingPage.pricePerApartmentInput.fill('9.99');
    await expect(pricingPage.pricePerApartmentInput).toHaveValue('9.99');
  });

  test('填写所有价格后保存', async () => {
    await pricingPage.setPricePerOrg('88.88');
    await pricingPage.setPricePerApartment('8.88');
    await pricingPage.setPricePerRoom('0.88');
    await pricingPage.setPricePerMember('0.08');
    await pricingPage.saveButton.click();
    // 等待保存完成
    await pricingPage.waitForLoading();
  });
});
