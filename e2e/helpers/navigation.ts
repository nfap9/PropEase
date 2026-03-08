import { Page } from '@playwright/test';
import { NAV, DASHBOARD, APARTMENTS, ROOMS, TENANTS, LEASES, UTILITIES, BILLS, REPORTS, SETTINGS, NOTIFICATIONS, FEE_TYPES } from '../testids';

/**
 * 导航路径映射
 */
const NAV_PATHS = {
  [NAV.DASHBOARD]: '/dashboard',
  [NAV.APARTMENTS]: '/apartments',
  [NAV.ROOMS]: '/rooms',
  [NAV.TENANTS]: '/tenants',
  [NAV.LEASES]: '/leases',
  [NAV.UTILITIES]: '/utilities',
  [NAV.BILLS]: '/bills',
  [NAV.REPORTS]: '/reports',
  [NAV.SETTINGS]: '/settings',
  [NAV.NOTIFICATIONS]: '/notifications',
} as const;

/**
 * 导航到指定页面
 */
export async function navigateTo(page: Page, navId: string): Promise<void> {
  const path = NAV_PATHS[navId as keyof typeof NAV_PATHS];
  if (!path) {
    throw new Error(`Unknown navigation id: ${navId}`);
  }
  await page.goto(path);
}

/**
 * 通过侧边栏导航
 */
export async function navigateViaSidebar(page: Page, navId: string): Promise<void> {
  await page.click(`[data-testid="${navId}"]`);
}

/**
 * 导航到仪表盘
 */
export async function goToDashboard(page: Page): Promise<void> {
  await page.goto('/dashboard');
  await page.waitForSelector(`[data-testid="${DASHBOARD.HEADING}"]`);
}

/**
 * 导航到公寓管理
 */
export async function goToApartments(page: Page): Promise<void> {
  await page.goto('/apartments');
  await page.waitForSelector(`[data-testid="${APARTMENTS.HEADING}"]`);
}

/**
 * 导航到房间管理
 */
export async function goToRooms(page: Page): Promise<void> {
  await page.goto('/rooms');
  await page.waitForSelector(`[data-testid="${ROOMS.HEADING}"]`);
}

/**
 * 导航到租客管理
 */
export async function goToTenants(page: Page): Promise<void> {
  await page.goto('/tenants');
  await page.waitForSelector(`[data-testid="${TENANTS.HEADING}"]`);
}

/**
 * 导航到租约管理
 */
export async function goToLeases(page: Page): Promise<void> {
  await page.goto('/leases');
  await page.waitForSelector(`[data-testid="${LEASES.HEADING}"]`);
}

/**
 * 导航到水电录入
 */
export async function goToUtilities(page: Page): Promise<void> {
  await page.goto('/utilities');
  await page.waitForSelector(`[data-testid="${UTILITIES.HEADING}"]`);
}

/**
 * 导航到账单管理
 */
export async function goToBills(page: Page): Promise<void> {
  await page.goto('/bills');
  await page.waitForSelector(`[data-testid="${BILLS.HEADING}"]`);
}

/**
 * 导航到经营分析
 */
export async function goToReports(page: Page): Promise<void> {
  await page.goto('/reports');
  await page.waitForSelector(`[data-testid="${REPORTS.HEADING}"]`);
}

/**
 * 导航到设置
 */
export async function goToSettings(page: Page): Promise<void> {
  await page.goto('/settings');
  await page.waitForSelector(`[data-testid="${SETTINGS.HEADING}"]`);
}

/**
 * 导航到通知
 */
export async function goToNotifications(page: Page): Promise<void> {
  await page.goto('/notifications');
  await page.waitForSelector(`[data-testid="${NOTIFICATIONS.HEADING}"]`);
}

/**
 * 导航到费用类型管理
 */
export async function goToFeeTypes(page: Page): Promise<void> {
  await page.goto('/settings/fee-types');
  await page.waitForSelector(`[data-testid="${FEE_TYPES.HEADING}"]`);
}
