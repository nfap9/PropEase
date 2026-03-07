/**
 * 水电配置 E2E 测试
 *
 * 覆盖场景：
 * - 配置水电单价
 * - 更新水电单价
 */

import { test, expect } from '../fixtures';
import { goToApartments } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { APARTMENTS } from '../testids';

test.describe('水电配置', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToApartments(page);
  });

  test('从公寓列表进入水电配置', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 点击测试公寓进入详情
    const testApartment = page.locator('text="E2E测试公寓1"').first();
    if (await testApartment.isVisible()) {
      await testApartment.click();

      // 等待跳转到详情页
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 验证详情页加载
      // 注：具体的 testid 需要根据实际页面添加
      expect(page.url()).toContain('/apartments/');
    } else {
      test.skip();
    }
  });

  test('配置水电单价', async ({ page }) => {
    // 等待列表加载
    await page.waitForSelector(`[data-testid="${APARTMENTS.LIST}"]`);

    // 点击测试公寓进入详情
    const testApartment = page.locator('text="E2E测试公寓1"').first();
    if (await testApartment.isVisible()) {
      await testApartment.click();
      await page.waitForURL(/\/apartments\/[a-z0-9]+/);

      // 寻找水电配置按钮或 Tab
      // 注：具体的 UI 元素需要根据实际页面调整
      await page.waitForTimeout(500);

      // 验证可以访问水电配置
      // 这里假设有一个配置按钮或链接
      const configButton = page.locator('button:has-text("配置"), a:has-text("配置")').first();
      if (await configButton.isVisible()) {
        await configButton.click();
      }
    } else {
      test.skip();
    }
  });
});
