/**
 * 运营后台 - 品牌配置页面 E2E 测试
 *
 * 覆盖场景：
 * - 品牌配置表单展示
 * - Logo 上传区域
 * - 保存按钮
 * - 填写品牌名称后保存
 */

import { test, expect } from '../fixtures';
import { BrandPage } from '../pages/admin/brand-page';
import { ADMIN_BRAND } from '../testids';

test.describe('品牌配置页面', () => {
  let brandPage: BrandPage;

  test.beforeEach(async ({ adminPage }) => {
    brandPage = new BrandPage(adminPage);
    await brandPage.load();
  });

  test('显示品牌配置表单', async () => {
    await expect(brandPage.heading).toBeVisible();
    await expect(brandPage.nameInput).toBeVisible();
  });

  test('Logo 上传区域存在', async () => {
    await expect(brandPage.logoInput).toBeVisible();
  });

  test('保存按钮存在且可点击', async () => {
    await expect(brandPage.saveButton).toBeVisible();
    await expect(brandPage.saveButton).toBeEnabled();
  });

  test('填写品牌名称后保存', async () => {
    const testBrandName = 'TestBrand_E2E';
    await brandPage.nameInput.clear();
    await brandPage.nameInput.fill(testBrandName);
    await brandPage.saveButton.click();
    // 等待保存完成（调用 waitForLoading）
    await brandPage.waitForLoading();
  });

  test('可以清空并重新填写品牌名称', async () => {
    await brandPage.nameInput.clear();
    await brandPage.nameInput.fill('NewBrandName');
    await expect(brandPage.nameInput).toHaveValue('NewBrandName');
  });
});
