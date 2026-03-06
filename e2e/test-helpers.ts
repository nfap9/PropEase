import { Page, Locator } from '@playwright/test';

/**
 * 测试辅助工具
 * 提供常用的测试操作和断言方法
 */

/**
 * 等待元素可见（带超时）
 */
export async function waitForVisible(
  locator: Locator,
  options: { timeout?: number } = {}
) {
  await locator.waitFor({ state: 'visible', ...options });
}

/**
 * 点击元素并等待网络空闲
 */
export async function clickAndWait(page: Page, locator: Locator | string) {
  const l = typeof locator === 'string' ? page.locator(locator) : locator;
  await l.click();
  await page.waitForLoadState('networkidle');
}

/**
 * 填写表单
 */
export async function fillForm(data: Record<string, string | number>, page: Page) {
  for (const [key, value] of Object.entries(data)) {
    const locator = page.getByTestId(key);
    await locator.fill(String(value));
  }
}

/**
 * 等待弹窗关闭
 */
export async function waitForDialogClosed(page: Page) {
  await expect(page.getByRole('dialog')).toBeHidden({ timeout: 10000 });
}

/**
 * 等待弹窗打开
 */
export async function waitForDialogOpen(page: Page, testId?: string) {
  const dialog = testId
    ? page.getByTestId(testId)
    : page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  return dialog;
}

/**
 * 导航到页面并等待加载完成
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * 判断元素是否可见（不抛异常）
 */
export async function isVisible(locator: Locator): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 判断元素是否存在（不抛异常）
 */
export async function exists(locator: Locator): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'attached', timeout: 2000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * 安全点击 - 如果元素存在则点击，不存在则跳过
 */
export async function safeClick(locator: Locator): Promise<boolean> {
  if (await isVisible(locator)) {
    await locator.click();
    return true;
  }
  return false;
}

/**
 * 等待列表或空状态（任一满足即返回）
 */
export async function waitForListOrEmpty(
  page: Page,
  listTestId: string,
  emptyTestId: string
) {
  const list = page.getByTestId(listTestId);
  const empty = page.getByTestId(emptyTestId);

  // 等待任一元素出现
  await page.waitForFunction(
    ({ listId, emptyId }) => {
      const listEl = document.querySelector(`[data-testid="${listId}"]`);
      const emptyEl = document.querySelector(`[data-testid="${emptyId}"]`);
      return listEl !== null || emptyEl !== null;
    },
    { listId: listTestId, emptyId: emptyTestId },
    { timeout: 10000 }
  );

  return {
    hasList: await isVisible(list),
    hasEmpty: await isVisible(empty),
  };
}

/**
 * 创建唯一名称用于测试
 */
export function createUniqueName(prefix: string): string {
  return `${prefix}_${Date.now()}`;
}

/**
 * 创建唯一手机号用于测试
 */
export function createUniquePhone(prefix = '139'): string {
  return `${prefix}${Date.now().toString().slice(-8)}`;
}

/**
 * 模拟上传文件
 */
export async function uploadFile(page: Page, inputTestId: string, filePath: string) {
  const fileInput = page.getByTestId(inputTestId);
  await fileInput.setInputFiles(filePath);
}

/**
 * 选择下拉选项
 */
export async function selectOption(
  page: Page,
  selectTestId: string,
  optionText: string
) {
  const select = page.getByTestId(selectTestId);
  await select.selectOption(optionText);
}

/**
 * 获取表格行数量
 */
export async function getTableRowCount(page: Page, tableTestId: string): Promise<number> {
  const table = page.getByTestId(tableTestId);
  const rows = table.locator('tr').filter({ hasText: /.+/ }); // 过滤空行
  return await rows.count();
}

/**
 * 等待请求完成
 */
export async function waitForRequest(
  page: Page,
  urlPattern: string | RegExp,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET'
) {
  return page.waitForResponse(
    (res) =>
      res.url().match(urlPattern) && res.request().method() === method,
    { timeout: 15000 }
  );
}

/**
 * 截断字符串并添加后缀
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * 等待并断言文本包含
 */
export async function assertTextContains(
  page: Page,
  testId: string,
  expectedText: string
) {
  const locator = page.getByTestId(testId);
  await expect(locator).toContainText(expectedText);
}

/**
 * 等待并断言文本等于
 */
export async function assertTextEquals(
  page: Page,
  testId: string,
  expectedText: string
) {
  const locator = page.getByTestId(testId);
  await expect(locator).toHaveText(expectedText);
}

/**
 * 检查元素是否被禁用
 */
export async function isDisabled(locator: Locator): Promise<boolean> {
  return await locator.isDisabled();
}

/**
 * 检查元素是否被启用
 */
export async function isEnabled(locator: Locator): Promise<boolean> {
  return !(await locator.isDisabled());
}

/**
 * 滚动到元素
 */
export async function scrollToElement(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
}

/**
 * 等待并点击确认按钮
 */
export async function clickConfirmButton(page: Page, testId?: string) {
  const btn = testId
    ? page.getByTestId(testId)
    : page.getByRole('button', { name: /^确认|创建|保存/ });
  await btn.click();
}

/**
 * 等待并点击取消按钮
 */
export async function clickCancelButton(page: Page, testId?: string) {
  const btn = testId
    ? page.getByTestId(testId)
    : page.getByRole('button', { name: /^取消|关闭/ });
  await btn.click();
}

/**
 * 获取通知文本
 */
export async function getNotificationText(page: Page): Promise<string> {
  const notification = page.getByTestId('common-success').or(
    page.getByTestId('common-error')
  );
  return await notification.textContent() || '';
}

/**
 * 等待通知消失
 */
export async function waitForNotification(page: Page) {
  const notification = page.getByTestId('common-success').or(
    page.getByTestId('common-error')
  );
  await expect(notification).toBeHidden({ timeout: 5000 });
}

/**
 * 清空输入框
 */
export async function clearInput(locator: Locator) {
  await locator.click();
  await locator.fill('');
}

/**
 * 检查输入框是否有错误提示
 */
export async function hasInputError(page: Page, inputTestId: string): Promise<boolean> {
  const input = page.getByTestId(inputTestId);
  const error = input.locator('xpath=following-sibling::*[@data-testid]');
  return await isVisible(error);
}

/**
 * 等待 URL 变化
 */
export async function waitForUrlChange(
  page: Page,
  pattern: RegExp
): Promise<string> {
  await page.waitForURL(pattern, { timeout: 10000 });
  return page.url();
}

/**
 * 刷新页面并等待加载
 */
export async function refreshAndWait(page: Page) {
  await page.reload();
  await page.waitForLoadState('networkidle');
}

/**
 * 切换 Tab
 */
export async function switchTab(page: Page, tabTestId: string) {
  const tab = page.getByTestId(tabTestId);
  await tab.click();
  await page.waitForLoadState('networkidle');
}

/**
 * 批量选择表格行
 */
export async function selectTableRows(
  page: Page,
  tableTestId: string,
  rowIndexes: number[]
) {
  const table = page.getByTestId(tableTestId);
  for (const index of rowIndexes) {
    const checkbox = table.locator('tr').nth(index).getByRole('checkbox');
    await checkbox.check();
  }
}

/**
 * 获取选中表格行的数量
 */
export async function getSelectedRowCount(
  page: Page,
  tableTestId: string
): Promise<number> {
  const table = page.getByTestId(tableTestId);
  const checkboxes = table.getByRole('checkbox', { checked: true });
  return await checkboxes.count();
}

/**
 * 模拟拖拽排序
 */
export async function dragAndDrop(
  page: Page,
  sourceTestId: string,
  targetTestId: string
) {
  const source = page.getByTestId(sourceTestId);
  const target = page.getByTestId(targetTestId);

  await source.dragTo(target);
}

/**
 * 等待动画完成
 */
export async function waitForAnimation(page: Page) {
  await page.waitForFunction(() => {
    return document.getAnimations().length === 0;
  });
}

/**
 * 获取元素属性值
 */
export async function getAttribute(
  locator: Locator,
  attribute: string
): Promise<string | null> {
  return await locator.getAttribute(attribute);
}

/**
 * 检查元素是否有某个类名
 */
export async function hasClass(locator: Locator, className: string): Promise<boolean> {
  const classes = (await locator.getAttribute('class')) || '';
  return classes.split(' ').includes(className);
}

/**
 * 等待元素数量变化
 */
export async function waitForCountChange(
  locator: Locator,
  expectedCount: number,
  options: { timeout?: number } = {}
) {
  await expect(locator).toHaveCount(expectedCount, {
    timeout: options.timeout || 10000,
  });
}

/**
 * 切换到 iframe
 */
export async function switchToIframe(page: Page, iframeSelector: string) {
  const frame = page.frameLocator(iframeSelector);
  return frame;
}

/**
 * 等待元素可点击
 */
export async function waitForClickable(locator: Locator) {
  await expect(locator).toBeEnabled();
  await locator.waitFor({ state: 'attached' });
}
