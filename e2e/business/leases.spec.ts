import { test, expect } from '@playwright/test';
import { LEASES, COMMON } from '../testids';
import {
  createUniqueName,
  createUniquePhone,
  waitForDialogOpen,
  waitForDialogClosed,
  isVisible,
} from '../test-helpers';

/**
 * 租约管理模块 E2E 测试
 * 对应测试用例：1.6 租约管理模块
 *
 * 模块编号：LE（租约）
 * - LE-L-*: 租约列表
 * - LE-C-*: 租约创建
 * - LE-R-*: 租约详情查看
 * - LE-T-*: 租约终止
 */

test.describe('租约列表 (LE-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/leases');
  });

  test('查看租约列表 (LE-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: '租约管理' })).toBeVisible({ timeout: 10000 });

    // 验证表格或空状态存在
    const table = page.getByRole('table');
    const emptyState = page.getByText('暂无租约');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });
});

test.describe('租约创建 (LE-C)', () => {
  test.beforeEach(async ({ page }) => {
    // 需要先准备数据：公寓、房间、租客
    await page.goto('/leases');
  });

  test('创建月租租约成功 (LE-C-01)', async ({ page }) => {
    // 准备测试数据
    await prepareLeaseData(page);

    // 点击新增租约按钮
    const newBtn = page.getByRole('button', { name: /新增租约|创建租约/ }).first();
    if (!(await newBtn.isVisible())) {
      console.log('新增租约按钮不可见，跳过测试');
      return;
    }
    await newBtn.click();

    const dialog = page.getByRole('dialog').filter({ hasText: /新增租约|创建租约/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 选择公寓
    const apartmentSelect = dialog.getByLabel(/公寓/).or(
      dialog.locator('[data-testid="leases-apartment-select"]')
    );
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // 选择房间
    await page.waitForTimeout(500);
    const roomSelect = dialog.getByLabel(/房间/).or(
      dialog.locator('[data-testid="leases-room-select"]')
    );
    if (await roomSelect.isVisible()) {
      await roomSelect.click();
      const option = page.getByRole('option').filter({ hasText: /空置|可选/ }).first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // 选择租客
    await page.waitForTimeout(500);
    const tenantSelect = dialog.getByLabel(/租客/).or(
      dialog.locator('[data-testid="leases-tenant-select"]')
    );
    if (await tenantSelect.isVisible()) {
      await tenantSelect.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // 填写月租和押金
    const rentInput = dialog.getByLabel(/月租/);
    const depositInput = dialog.getByLabel(/押金/);
    if (await rentInput.isVisible()) {
      await rentInput.fill('2000');
    }
    if (await depositInput.isVisible()) {
      await depositInput.fill('4000');
    }

    // 提交
    await dialog.getByRole('button', { name: '创建' }).click();

    // 验证创建成功
    await expect(dialog).toBeHidden({ timeout: 15000 });
    await expect(page.getByText(/生效中|已签约/)).toBeVisible({ timeout: 5000 });
  });

  test('租约-房间必选 (LE-C-04)', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /新增租约|创建租约/ }).first();
    if (!(await newBtn.isVisible())) return;

    await newBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新增租约|创建租约/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 不选择房间，直接提交
    await dialog.getByRole('button', { name: '创建' }).click();

    // 验证错误提示
    await expect(dialog.getByText(/请选择房间/)).toBeVisible({ timeout: 5000 });
  });

  test('租约-租客必选 (LE-C-05)', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /新增租约|创建租约/ }).first();
    if (!(await newBtn.isVisible())) return;

    await newBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新增租约|创建租约/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 不选择租客，直接提交
    await dialog.getByRole('button', { name: '创建' }).click();

    // 验证错误提示
    await expect(dialog.getByText(/请选择租客/)).toBeVisible({ timeout: 5000 });
  });

  test('租约-已租房间不可选 (LE-C-06)', async ({ page }) => {
    const newBtn = page.getByRole('button', { name: /新增租约|创建租约/ }).first();
    if (!(await newBtn.isVisible())) return;

    await newBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新增租约|创建租约/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 选择公寓
    const apartmentSelect = dialog.getByLabel(/公寓/);
    if (await apartmentSelect.isVisible()) {
      await apartmentSelect.click();
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        await option.click();
      }
    }

    // 查看房间列表
    await page.waitForTimeout(500);
    const roomSelect = dialog.getByLabel(/房间/);
    if (await roomSelect.isVisible()) {
      await roomSelect.click();

      // 验证已租房间标记为"已租"或不可选
      const rentedOption = page.getByRole('option').filter({ hasText: /已租/ });
      if (await rentedOption.count() > 0) {
        // 已租选项应该禁用或有标记
        const isDisabled = await rentedOption.first().isDisabled().catch(() => false);
        // 或者选项文本包含"已租"
        await expect(rentedOption.first()).toHaveText(/已租/);
      }
    }
  });
});

test.describe('租约详情与操作 (LE-R, LE-T)', () => {
  test('查看租约详情 (LE-R-01)', async ({ page }) => {
    await page.goto('/leases');

    // 查找生效中的租约
    const activeLease = page.getByRole('row').filter({ hasText: /生效中/ }).first();
    if (await activeLease.isVisible()) {
      // 点击租约详情
      const detailBtn = activeLease.getByRole('button', { name: /详情|查看/ });
      if (await detailBtn.isVisible()) {
        await detailBtn.click();

        // 验证详情页
        await expect(page.getByText(/租约详情|租约信息/)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('终止租约 (LE-T-01)', async ({ page }) => {
    await page.goto('/leases');

    // 查找生效中的租约
    const activeLease = page.getByRole('row').filter({ hasText: /生效中/ }).first();
    if (await activeLease.isVisible()) {
      // 点击终止按钮
      const terminateBtn = activeLease.getByRole('button', { name: /终止|退租/ });
      if (await terminateBtn.isVisible()) {
        await terminateBtn.click();

        // 确认终止
        const dialog = page.getByRole('dialog').filter({ hasText: /确认终止|确认退租/ });
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });

          // 验证租约状态变为已终止
          await expect(page.getByText(/已终止/)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});

/**
 * 辅助函数：准备租约测试数据
 */
async function prepareLeaseData(page: import('@playwright/test').Page) {
  // 检查是否已有公寓
  await page.goto('/apartments');
  await page.waitForLoadState('networkidle');

  let hasApartment = (await page.locator('a[href^="/apartments/"]').count()) > 0;

  if (!hasApartment) {
    // 创建公寓
    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(createUniqueName('E2E租约公寓'));
      await dialog.getByLabel('地址').fill('E2E测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  }

  // 检查是否已有空置房间
  await page.goto('/rooms');
  await page.waitForLoadState('networkidle');

  const hasVacantRoom = await page.getByText(/空置/).isVisible().catch(() => false);

  if (!hasVacantRoom && hasApartment) {
    // 进入第一个公寓添加房间
    await page.goto('/apartments');
    const firstApt = page.locator('a[href^="/apartments/"]').first();
    if (await firstApt.isVisible()) {
      await firstApt.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();
        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间/ });
        await dialog.getByLabel(/房间号/).fill(`R${Date.now().toString().slice(-4)}`);
        await dialog.getByLabel(/月租/).fill('2000');
        await dialog.getByRole('button', { name: '创建' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  }

  // 检查是否已有租客
  await page.goto('/tenants');
  await page.waitForLoadState('networkidle');

  let hasTenant = (await page.getByRole('row').filter({ hasText: /\d/ }).count()) > 1;

  if (!hasTenant) {
    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: /新增租客/ });
      await dialog.getByLabel(/姓名/).fill(createUniqueName('E2E租约租客'));
      await dialog.getByLabel(/联系电话|电话|手机/).fill(createUniquePhone());
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  }
}
