import { Page, Locator } from '@playwright/test';
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
