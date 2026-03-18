/**
 * List Page Object 列表页面基类
 *
 * 提供列表页面的通用操作方法
 */

import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base-page';
import { COMMON } from '../testids';

export class ListPage extends BasePage {
  protected listSelector: string;
  protected searchInputSelector?: string;
  protected emptyStateSelector?: string;

  constructor(
    page: Page,
    options: {
      listSelector: string;
      searchInputSelector?: string;
      emptyStateSelector?: string;
    }
  ) {
    super(page);
    this.listSelector = options.listSelector;
    this.searchInputSelector = options.searchInputSelector;
    this.emptyStateSelector = options.emptyStateSelector;
  }

  // ==================== 列表操作 ====================

  /**
   * 获取列表中的行数
   */
  async getRowCount(): Promise<number> {
    await this.waitForLoading();
    const rows = this.page.locator(`${this.listSelector} tbody tr`);
    return rows.count();
  }

  /**
   * 等待列表数据加载完成
   */
  async waitForDataLoaded(): Promise<void> {
    await this.waitForLoading();
    // 等待至少一行数据或空状态
    if (this.emptyStateSelector) {
      await Promise.race([
        this.page.waitForSelector(`${this.listSelector} tbody tr`, { timeout: 10000 }),
        this.page.waitForSelector(`[data-testid="${this.emptyStateSelector}"]`, { timeout: 10000 }),
      ]).catch(() => {});
    } else {
      await this.page.waitForSelector(`${this.listSelector} tbody tr`, { timeout: 10000 }).catch(() => {});
    }
  }

  /**
   * 检查列表是否为空
   */
  async isEmpty(): Promise<boolean> {
    if (this.emptyStateSelector) {
      const emptyState = this.page.locator(`[data-testid="${this.emptyStateSelector}"]`);
      return emptyState.isVisible();
    }
    // 如果没有专门的空状态元素，检查是否有数据行
    const rows = await this.getRowCount();
    return rows === 0;
  }

  // ==================== 搜索 ====================

  /**
   * 执行搜索
   */
  async search(keyword: string): Promise<void> {
    if (!this.searchInputSelector) {
      throw new Error('Search input not configured');
    }
    await this.page.fill(this.searchInputSelector, keyword);
    await this.page.press(this.searchInputSelector, 'Enter');
    await this.waitForDataLoaded();
  }

  /**
   * 清空搜索
   */
  async clearSearch(): Promise<void> {
    if (!this.searchInputSelector) {
      return;
    }
    await this.page.fill(this.searchInputSelector, '');
    await this.waitForDataLoaded();
  }

  // ==================== 分页 ====================

  /**
   * 获取当前页码
   */
  async getCurrentPage(): Promise<number> {
    const pagination = this.page.locator(`[data-testid="${COMMON.PAGINATION}"]`);
    const activePage = await pagination.locator('.ant-pagination-item-active').textContent();
    return parseInt(activePage ?? '1', 10);
  }

  /**
   * 前往下一页
   */
  async goToNextPage(): Promise<void> {
    await this.page.click(`[data-testid="${COMMON.PAGINATION}"] button[aria-label="下一页"]`);
    await this.waitForDataLoaded();
  }

  /**
   * 前往上一页
   */
  async goToPrevPage(): Promise<void> {
    await this.page.click(`[data-testid="${COMMON.PAGINATION}"] button[aria-label="上一页"]`);
    await this.waitForDataLoaded();
  }

  /**
   * 前往指定页码
   */
  async goToPage(pageNumber: number): Promise<void> {
    await this.page.click(`[data-testid="${COMMON.PAGINATION}"] .ant-pagination-item-${pageNumber}`);
    await this.waitForDataLoaded();
  }

  /**
   * 检查是否有下一页
   */
  async hasNextPage(): Promise<boolean> {
    const nextButton = this.page.locator(`[data-testid="${COMMON.PAGINATION}"] button[aria-label="下一页"]`);
    const isDisabled = await nextButton.getAttribute('disabled');
    return isDisabled === null;
  }

  /**
   * 检查是否有上一页
   */
  async hasPrevPage(): Promise<boolean> {
    const prevButton = this.page.locator(`[data-testid="${COMMON.PAGINATION}"] button[aria-label="上一页"]`);
    const isDisabled = await prevButton.getAttribute('disabled');
    return isDisabled === null;
  }

  // ==================== 行操作 ====================

  /**
   * 查找包含指定文本的行
   */
  findRow(text: string): Locator {
    return this.page.locator(`${this.listSelector} tbody tr:has-text("${text}")`);
  }

  /**
   * 点击指定文本所在的行
   */
  async clickRow(text: string): Promise<void> {
    const row = this.findRow(text);
    await row.click();
  }

  // ==================== 表格操作 ====================

  /**
   * 获取指定单元格的值
   */
  async getCellValue(rowIndex: number, columnIndex: number): Promise<string> {
    const cell = this.page.locator(`${this.listSelector} tbody tr:nth-child(${rowIndex}) td:nth-child(${columnIndex})`);
    return cell.textContent() ?? '';
  }

  /**
   * 验证表格包含指定数据
   */
  async expectRowContains(text: string): Promise<void> {
    const row = this.findRow(text);
    await expect(row).toBeVisible();
  }

  /**
   * 验证表格不包含指定数据
   */
  async expectRowNotContains(text: string): Promise<void> {
    const row = this.findRow(text);
    await expect(row).not.toBeVisible();
  }
}
