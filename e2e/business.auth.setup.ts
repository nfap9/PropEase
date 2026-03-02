import { test as setup, expect } from '@playwright/test';

const businessAuthFile = '.auth/business.json';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const E2E_PHONE = '13800138000';
const E2E_PASSWORD = 'Test1234';

setup('业务端登录并保存登录态', async ({ page, request }) => {
  const loginRes = await request.post(`${API_BASE_URL}/auth/login`, {
    data: {
      phone: E2E_PHONE,
      password: E2E_PASSWORD,
    },
  });
  expect(loginRes.ok()).toBeTruthy();
  const raw = (await loginRes.json()) as {
    code?: number;
    data?: { access_token: string; refresh_token: string };
    access_token?: string;
    refresh_token?: string;
  };
  const tokenData =
    typeof raw.code === 'number'
      ? raw.data
      : { access_token: raw.access_token!, refresh_token: raw.refresh_token! };
  expect(tokenData?.access_token).toBeTruthy();
  expect(tokenData?.refresh_token).toBeTruthy();

  await page.addInitScript((token: { access: string; refresh: string }) => {
    localStorage.setItem('access_token', token.access);
    localStorage.setItem('refresh_token', token.refresh);
  }, {
    access: tokenData!.access_token,
    refresh: tokenData!.refresh_token,
  });

  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  await expect(
    page.getByRole('heading', { name: '仪表盘' }).or(page.getByText('欢迎使用 Apartment Ultra'))
  ).toBeVisible();
  await page.context().storageState({ path: businessAuthFile });
});
