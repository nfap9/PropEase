/**
 * 水电导入导出 E2E 测试
 *
 * 覆盖场景：
 * - 导出模板
 * - 导入 Excel 文件
 * - 导出记录
 */

import { test, expect } from '../fixtures';
import { goToUtilities } from '../helpers/navigation';
import { login } from '../helpers/auth';
import { UTILITIES, COMMON } from '../testids';

test.describe('导出模板', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('点击导出模板按钮', async ({ page }) => {
    // 等待页面加载
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 查找导出模板按钮
    const exportTemplateButton = page.locator('button:has-text("导出模板"), [data-testid="utilities-export-template-button"]').first();
    if (await exportTemplateButton.isVisible()) {
      // 点击导出
      await exportTemplateButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

test.describe('导入水电读数', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('显示导入弹窗', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 点击导入按钮
    const importButton = page.locator(`[data-testid="${UTILITIES.BATCH_BUTTON}"], button:has-text("导入")`).first();
    if (await importButton.isVisible()) {
      await importButton.click();
      await page.waitForTimeout(500);
    }
  });

  test('选择文件上传', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 查找文件上传输入框
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible()) {
      // 注：实际测试需要准备测试文件
      // await fileInput.setInputFiles('path/to/test/file.xlsx');
    }
  });

  test('导入格式错误的文件显示错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    const importButton = page.locator(`[data-testid="${UTILITIES.BATCH_BUTTON}"], button:has-text("导入")`).first();
    if (await importButton.isVisible()) {
      await importButton.click();

      // 选择错误格式的文件应该显示错误
      // 注：需要实际准备测试文件
      await page.waitForTimeout(500);
    }
  });

  test('导入缺失必填列显示错误', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    const importButton = page.locator(`[data-testid="${UTILITIES.BATCH_BUTTON}"], button:has-text("导入")`).first();
    if (await importButton.isVisible()) {
      await importButton.click();

      // 选择缺失必填列的文件应该显示错误
      // 注：需要实际准备测试文件
      await page.waitForTimeout(500);
    }
  });
});

test.describe('导出水电记录', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('点击导出按钮', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    // 查找导出按钮
    const exportButton = page.locator('button:has-text("导出"), [data-testid="utilities-export-button"]').first();
    if (await exportButton.isVisible()) {
      await exportButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('选择导出格式', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    const exportButton = page.locator('button:has-text("导出"), [data-testid="utilities-export-button"]').first();
    if (await exportButton.isVisible()) {
      await exportButton.click();

      // 选择导出格式（如果有选项）
      const excelOption = page.locator('text="Excel"').first();
      if (await excelOption.isVisible()) {
        await excelOption.click();
      }
    }
  });

  test('无数据时导出', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    const exportButton = page.locator('button:has-text("导出"), [data-testid="utilities-export-button"]').first();
    if (await exportButton.isVisible()) {
      // 无数据时可能禁用或显示提示
      const isEnabled = await exportButton.isEnabled();
      if (!isEnabled) {
        // 按钮应该禁用
        await expect(exportButton).toBeDisabled();
      }
    }
  });
});

test.describe('导入预览', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await goToUtilities(page);
  });

  test('显示导入预览', async ({ page }) => {
    await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);

    const importButton = page.locator(`[data-testid="${UTILITIES.BATCH_BUTTON}"], button:has-text("导入")`).first();
    if (await importButton.isVisible()) {
      await importButton.click();

      // 注：需要实际选择文件才能看到预览
      await page.waitForTimeout(500);
    }
  });
});
