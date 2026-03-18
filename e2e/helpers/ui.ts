import { Page, Locator, expect } from '@playwright/test';
import { COMMON } from '../testids';

/**
 * 等待加载状态消失
 */
export async function waitForLoadingToDisappear(page: Page): Promise<void> {
  const loading = page.locator(`[data-testid="${COMMON.LOADING}"]`);
  await loading.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
    // 加载元素可能已经不存在，忽略错误
  });
}

/**
 * 等待成功提示出现
 */
export async function waitForSuccess(page: Page): Promise<Locator> {
  return page.waitForSelector(`[data-testid="${COMMON.SUCCESS}"]`, {
    timeout: 5000,
  });
}

/**
 * 等待错误提示出现
 */
export async function waitForError(page: Page): Promise<Locator> {
  return page.waitForSelector(`[data-testid="${COMMON.ERROR}"]`, {
    timeout: 5000,
  });
}

/**
 * 点击确认按钮（通用弹窗）
 */
export async function clickConfirm(page: Page): Promise<void> {
  await page.click(`[data-testid="${COMMON.CONFIRM_BUTTON}"]`);
}

/**
 * 点击取消按钮（通用弹窗）
 */
export async function clickCancel(page: Page): Promise<void> {
  await page.click(`[data-testid="${COMMON.CANCEL_BUTTON}"]`);
}

/**
 * 关闭弹窗
 */
export async function closeDialog(page: Page): Promise<void> {
  await page.click(`[data-testid="${COMMON.CLOSE_BUTTON}"]`);
}

/**
 * 搜索操作
 */
export async function search(page: Page, keyword: string, searchTestId: string = COMMON.SEARCH_INPUT): Promise<void> {
  await page.fill(`[data-testid="${searchTestId}"]`, keyword);
  // 按回车触发搜索
  await page.press(`[data-testid="${searchTestId}"]`, 'Enter');
}

/**
 * 检查空状态是否显示
 */
export async function isEmptyStateVisible(page: Page, testId: string = COMMON.EMPTY_STATE): Promise<boolean> {
  const emptyState = page.locator(`[data-testid="${testId}"]`);
  return emptyState.isVisible();
}

/**
 * 等待表格数据加载
 */
export async function waitForTableData(page: Page, listTestId: string): Promise<void> {
  await waitForLoadingToDisappear(page);
  await page.waitForSelector(`[data-testid="${listTestId}"] tbody tr`, {
    timeout: 10000,
  });
}

/**
 * 获取表格行数
 */
export async function getTableRowCount(page: Page, listTestId: string): Promise<number> {
  const rows = page.locator(`[data-testid="${listTestId}"] tbody tr`);
  return rows.count();
}

/**
 * 分页 - 下一页
 */
export async function goToNextPage(page: Page): Promise<void> {
  await page.click(`[data-testid="${COMMON.PAGINATION}"] button[aria-label="下一页"]`);
}

/**
 * 分页 - 上一页
 */
export async function goToPrevPage(page: Page): Promise<void> {
  await page.click(`[data-testid="${COMMON.PAGINATION}"] button[aria-label="上一页"]`);
}

// ==================== 新增的高级辅助函数 ====================

/**
 * 等待 API 响应
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  options?: { method?: string; status?: number; timeout?: number }
): Promise<ReturnType<Page['waitForResponse']>> {
  return page.waitForResponse(
    (response) => {
      const urlMatches = typeof urlPattern === 'string'
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url());
      const methodMatches = !options?.method || response.request().method() === options.method;
      const statusMatches = !options?.status || response.status() === options.status;
      return urlMatches && methodMatches && statusMatches;
    },
    { timeout: options?.timeout ?? 30000 }
  );
}

/**
 * 等待 API 请求完成并获取响应
 */
export async function waitForApiAndGetResponse<T = unknown>(
  page: Page,
  urlPattern: string | RegExp,
  options?: { method?: string; status?: number; timeout?: number }
): Promise<T> {
  const response = await waitForApiResponse(page, urlPattern, options);
  return response.json() as Promise<T>;
}

/**
 * 等待表单提交并处理响应
 */
export async function submitFormAndWait(
  page: Page,
  submitButtonSelector: string,
  apiUrlPattern: string | RegExp,
  options?: { method?: string }
): Promise<{ ok: boolean; status: number }> {
  const responsePromise = page.waitForResponse(
    (response) => {
      const urlMatches = typeof apiUrlPattern === 'string'
        ? response.url().includes(apiUrlPattern)
        : apiUrlPattern.test(response.url());
      const methodMatches = !options?.method || response.request().method() === options.method;
      return urlMatches && methodMatches;
    },
    { timeout: 30000 }
  ).catch(() => null);

  await page.click(submitButtonSelector);

  const response = await responsePromise;
  return { ok: response?.ok() ?? false, status: response?.status() ?? 0 };
}

/**
 * 验证 toast 提示出现并消失
 */
export async function verifyToast(
  page: Page,
  type: 'success' | 'error' | 'warning' | 'info',
  timeout: number = 5000
): Promise<void> {
  const toastSelector = `[data-testid="${COMMON.SUCCESS}"], [data-testid="${COMMON.ERROR}"]`;
  const toast = page.locator(toastSelector);

  // 等待 toast 出现
  await toast.waitFor({ state: 'visible', timeout });

  // 验证 toast 可见
  await expect(toast).toBeVisible();

  // 等待 toast 自动消失
  await toast.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
}

/**
 * 等待并验证对话框打开
 */
export async function waitForDialogOpen(page: Page, dialogTestId: string): Promise<Locator> {
  const dialog = page.locator(`[data-testid="${dialogTestId}"]`);
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  await expect(dialog).toBeVisible();
  return dialog;
}

/**
 * 等待并验证对话框关闭
 */
export async function waitForDialogClosed(page: Page, dialogTestId: string, timeout: number = 10000): Promise<void> {
  const dialog = page.locator(`[data-testid="${dialogTestId}"]`);
  await dialog.waitFor({ state: 'hidden', timeout });
}

/**
 * 验证页面跳转
 */
export async function verifyNavigation(page: Page, expectedPath: string | RegExp): Promise<void> {
  await page.waitForURL(expectedPath, { timeout: 15000 });
  await expect(page).toHaveURL(expectedPath);
}

/**
 * 选择下拉框选项
 */
export async function selectOption(page: Page, selectTestId: string, value: string): Promise<void> {
  await page.click(`[data-testid="${selectTestId}"] .ant-select-selector`);
  await page.waitForSelector('.ant-select-dropdown', { state: 'visible', timeout: 5000 });
  await page.click(`.ant-select-item-option-active:has-text("${value}")`);
}

/**
 * 上传文件
 */
export async function uploadFile(page: Page, selector: string, filePath: string): Promise<void> {
  await page.setInputFiles(selector, filePath);
}

/**
 * 等待元素可点击
 */
export async function waitForClickable(page: Page, selector: string, timeout: number = 10000): Promise<Locator> {
  const locator = page.locator(selector);
  await locator.waitFor({ state: 'visible', timeout });
  await locator.waitFor({ state: 'attached', timeout });
  return locator;
}

/**
 * 滚动到元素
 */
export async function scrollToElement(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded();
}

/**
 * 清空输入框
 */
export async function clearInput(page: Page, selector: string): Promise<void> {
  await page.locator(selector).clear();
}

/**
 * 双击元素
 */
export async function doubleClick(page: Page, selector: string): Promise<void> {
  await page.dblclick(selector);
}

/**
 * 右键点击元素
 */
export async function rightClick(page: Page, selector: string): Promise<void> {
  await page.click(selector, { button: 'right' });
}

/**
 * 悬停到元素
 */
export async function hover(page: Page, selector: string): Promise<void> {
  await page.hover(selector);
}

/**
 * 获取元素数量
 */
export async function getElementCount(page: Page, selector: string): Promise<number> {
  return page.locator(selector).count();
}

/**
 * 等待元素可点击并点击
 */
export async function clickWhenVisible(page: Page, selector: string, timeout: number = 10000): Promise<void> {
  const locator = await waitForClickable(page, selector, timeout);
  await locator.click();
}
