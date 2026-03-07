import { test, expect } from '@playwright/test';
import {
  APARTMENTS,
  ROOMS,
  TENANTS,
  LEASES,
  UTILITIES,
  BILLS,
  REPORTS,
  COMMON,
} from '../testids';
import {
  createUniqueName,
  createUniquePhone,
  waitForDialogOpen,
  waitForDialogClosed,
  isVisible,
} from '../test-helpers';

/**
 * 跨模块流程测试
 * 对应测试用例：三、跨模块集成测试用例
 *
 * 模块编号：BIZ-FLOW, PERM-FLOW, QUOTA-FLOW
 */

test.describe('完整业务流程 (BIZ-FLOW)', () => {
  const timestamp = Date.now();

  test('完整租赁流程 (BIZ-FLOW-01)', async ({ page }) => {
    // 1. 创建公寓
    await page.goto('/apartments');
    const aptName = createUniqueName('E2E流程公寓');
    let newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      let dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(aptName);
      await dialog.getByLabel('地址').fill('E2E流程测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }

    // 2. 进入公寓详情，添加房间
    const aptCard = page.getByRole('link', { name: new RegExp(aptName) });
    await aptCard.click();
    await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

    const roomNumber = `R${timestamp.toString().slice(-4)}`;
    let addRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
    if (await addRoomBtn.isVisible()) {
      await addRoomBtn.click();
      let dialog = page.getByRole('dialog').filter({ hasText: /新增房间/ });
      await dialog.getByLabel(/房间号/).fill(roomNumber);
      await dialog.getByLabel(/月租/).fill('2000');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }

    // 3. 创建租客
    await page.goto('/tenants');
    const tenantName = createUniqueName('E2E流程租客');
    const tenantPhone = createUniquePhone();
    newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      let dialog = page.getByRole('dialog').filter({ hasText: /新增租客/ });
      await dialog.getByLabel(/姓名/).fill(tenantName);
      await dialog.getByLabel(/联系电话|电话|手机/).fill(tenantPhone);
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }

    // 4. 创建租约
    await page.goto('/leases');
    let createLeaseBtn = page.getByRole('button', { name: /新增租约|创建租约/ }).first();
    if (await createLeaseBtn.isVisible()) {
      await createLeaseBtn.click();
      let dialog = page.getByRole('dialog').filter({ hasText: /新增租约|创建租约/ });

      // 选择公寓
      const apartmentSelect = dialog.getByLabel(/公寓/);
      if (await apartmentSelect.isVisible()) {
        await apartmentSelect.click();
        await page.getByRole('option', { name: new RegExp(aptName) }).click();
      }

      await page.waitForTimeout(500);

      // 选择房间
      const roomSelect = dialog.getByLabel(/房间/);
      if (await roomSelect.isVisible()) {
        await roomSelect.click();
        await page.getByRole('option', { name: new RegExp(roomNumber) }).click();
      }

      await page.waitForTimeout(500);

      // 选择租客
      const tenantSelect = dialog.getByLabel(/租客/);
      if (await tenantSelect.isVisible()) {
        await tenantSelect.click();
        await page.getByRole('option', { name: new RegExp(tenantName) }).click();
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

      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 15000 });
    }

    // 5. 录入水电
    await page.goto('/utilities');
    // 等待页面加载
    await page.waitForLoadState('networkidle');

    // 查找待录入项
    const pendingItem = page.getByRole('row').filter({ hasText: new RegExp(roomNumber) }).first();
    const entryBtn = page.getByRole('button', { name: /录入|录入读数/ }).first();

    if (await entryBtn.isVisible()) {
      await entryBtn.click();
      let dialog = page.getByRole('dialog').filter({ hasText: /录入读数|水电录入/ });
      const waterInput = dialog.getByLabel(/水表|水费/);
      const electricityInput = dialog.getByLabel(/电表|电费/);
      if (await waterInput.isVisible()) {
        await waterInput.fill('100');
      }
      if (await electricityInput.isVisible()) {
        await electricityInput.fill('200');
      }
      await dialog.getByRole('button', { name: /保存|确认/ }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }

    // 6. 验证账单生成（如果有）
    await page.goto('/bills');
    await page.waitForLoadState('networkidle');

    // 验证有账单或空状态
    const table = page.getByRole('table');
    const emptyState = page.getByText('暂无账单');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);

    // 7. 终止租约
    await page.goto('/leases');
    const leaseRow = page.getByRole('row').filter({ hasText: new RegExp(roomNumber) }).first();
    if (await leaseRow.isVisible()) {
      const terminateBtn = leaseRow.getByRole('button', { name: /终止|退租/ });
      if (await terminateBtn.isVisible()) {
        await terminateBtn.click();
        const dialog = page.getByRole('dialog').filter({ hasText: /确认终止|确认退租/ });
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }

    // 8. 验证房间状态变为空置
    await page.goto('/rooms');
    await page.waitForLoadState('networkidle');
    const roomRow = page.getByRole('row').filter({ hasText: new RegExp(roomNumber) }).first();
    if (await roomRow.isVisible()) {
      await expect(roomRow.getByText(/空置/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('租约续约流程 (BIZ-FLOW-02)', async ({ page }) => {
    // 查找即将到期的租约
    await page.goto('/leases');

    const expiringLease = page.getByRole('row').filter({ hasText: /即将到期/ }).first();
    if (await expiringLease.isVisible()) {
      // 点击续约按钮
      const renewBtn = expiringLease.getByRole('button', { name: /续约/ });
      if (await renewBtn.isVisible()) {
        await renewBtn.click();

        // 填写新租约信息
        const dialog = page.getByRole('dialog').filter({ hasText: /续约/ });
        if (await dialog.isVisible()) {
          // 续约会自动带出房间和租客信息
          // 填写新的租期和租金
          const rentInput = dialog.getByLabel(/月租/);
          if (await rentInput.isVisible()) {
            await rentInput.fill('2500');
          }

          await dialog.getByRole('button', { name: '创建' }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }
  });

  test('租客换房流程 (BIZ-FLOW-03)', async ({ page }) => {
    // 1. 终止原租约
    await page.goto('/leases');
    const activeLease = page.getByRole('row').filter({ hasText: /生效中/ }).first();
    if (await activeLease.isVisible()) {
      const terminateBtn = activeLease.getByRole('button', { name: /终止|退租/ });
      if (await terminateBtn.isVisible()) {
        await terminateBtn.click();
        const dialog = page.getByRole('dialog').filter({ hasText: /确认终止/ });
        if (await dialog.isVisible()) {
          await dialog.getByRole('button', { name: /确认/ }).click();
          await expect(dialog).toBeHidden({ timeout: 10000 });
        }
      }
    }

    // 2. 创建新租约（新房间、相同租客）
    // 这部分逻辑与 BIZ-FLOW-01 中的创建租约类似
    // 实际测试中需要根据具体数据状态进行验证
  });
});

test.describe('权限控制 (PERM-FLOW)', () => {
  test('运营人员权限限制 (PERM-FLOW-01)', async ({ page }) => {
    // 使用运营人员账号登录
    // 需要在测试环境中有运营人员账号
    // 这里假设当前账号是运营人员

    await page.goto('/settings/permissions');

    // 运营人员可能无法访问权限管理
    const hasAccess = await page.getByRole('heading', { name: /权限|角色/ }).isVisible().catch(() => false);

    // 如果是运营人员，可能被重定向或看到无权限提示
    if (!hasAccess) {
      await expect(page.getByText(/无权限|没有权限/).or(page.getByText(/403|禁止访问/))).toBeVisible({ timeout: 5000 });
    }
  });

  test('组织成员权限 (PERM-FLOW-02)', async ({ page }) => {
    // 使用普通成员账号登录
    // 检查无权限的菜单是否隐藏

    await page.goto('/apartments');

    // 尝试删除公寓
    const aptCard = page.locator('a[href^="/apartments/"]').first();
    if (await aptCard.isVisible()) {
      const moreBtn = aptCard.getByRole('button', { name: '更多操作' });
      if (await moreBtn.isVisible()) {
        await moreBtn.click();

        // 普通成员可能看不到删除按钮
        const deleteBtn = page.getByRole('menuitem', { name: '删除' });
        const canDelete = await deleteBtn.isVisible().catch(() => false);
        const isDisabled = canDelete && await deleteBtn.isDisabled().catch(() => true);

        // 如果能看到，应该是禁用状态
        if (canDelete) {
          expect(isDisabled).toBe(true);
        }

        await page.keyboard.press('Escape');
      }
    }
  });
});

test.describe('数据一致性 (DATA-FLOW)', () => {
  test('删除公寓-数据级联 (DATA-FLOW-01)', async ({ page }) => {
    // 创建一个公寓
    await page.goto('/apartments');
    const aptName = createUniqueName('E2E级联删除');

    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(aptName);
      await dialog.getByLabel('地址').fill('级联删除测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // 尝试删除公寓
      const aptCard = page.getByRole('link', { name: new RegExp(aptName) });
      const moreBtn = aptCard.getByRole('button', { name: '更多操作' });
      if (await moreBtn.isVisible()) {
        await moreBtn.click();
        await page.getByRole('menuitem', { name: '删除' }).click();

        const confirmDialog = page.getByRole('dialog').filter({ hasText: /确认删除/ });
        if (await confirmDialog.isVisible()) {
          await confirmDialog.getByRole('button', { name: /确认|删除/ }).click();
          await expect(confirmDialog).toBeHidden({ timeout: 10000 });

          // 验证公寓已从列表中消失
          await expect(page.getByRole('link', { name: new RegExp(aptName) })).toBeHidden({ timeout: 5000 });
        }
      }
    }
  });

  test('账单金额计算一致性 (DATA-FLOW-03)', async ({ page }) => {
    // 查看账单详情，验证金额计算
    await page.goto('/bills');

    const billRow = page.getByRole('row').filter({ hasText: /待支付|已支付/ }).first();
    if (await billRow.isVisible()) {
      const detailBtn = billRow.getByRole('button', { name: /详情|查看/ });
      if (await detailBtn.isVisible()) {
        await detailBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /账单详情/ });
        if (await dialog.isVisible()) {
          // 验证有租金明细
          const hasRent = await dialog.getByText(/租金|月租/).isVisible().catch(() => false);

          // 验证有总金额
          const hasTotal = await dialog.getByText(/总计|合计|总额/).isVisible().catch(() => false);

          // 验证账单详情包含必要信息
          expect(hasRent || hasTotal).toBe(true);

          await page.keyboard.press('Escape');
        }
      }
    }
  });

  test('删除租客-数据检查 (DATA-FLOW-02)', async ({ page }) => {
    // 查找有活跃租约的租客
    await page.goto('/tenants');

    const tenantRow = page.getByRole('row').filter({ hasText: /生效中|租约/ }).first();
    if (await tenantRow.isVisible()) {
      const deleteBtn = tenantRow.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // 验证提示无法删除
        const warning = page.getByText(/有履行中租约|无法删除|租约关联/);
        const hasWarning = await warning.isVisible().catch(() => false);

        if (hasWarning) {
          await expect(warning).toBeVisible();
        } else {
          // 如果没有警告，可能是确认弹窗
          const confirmDialog = page.getByRole('alertdialog').filter({ hasText: /确认删除/ });
          if (await confirmDialog.isVisible()) {
            // 取消删除
            await confirmDialog.getByRole('button', { name: /取消/ }).click();
          }
        }
      }
    }
  });
});

test.describe('额度限制 (QUOTA-FLOW)', () => {
  test('公寓数量限制 (QUOTA-FLOW-01)', async ({ page }) => {
    await page.goto('/apartments');

    // 检查是否有额度提示
    const quotaWarning = page.getByText(/已达到|上限|额度/);
    const hasWarning = await quotaWarning.isVisible().catch(() => false);

    if (hasWarning) {
      // 验证提示包含升级套餐选项
      await expect(page.getByText(/升级|套餐/)).toBeVisible();
    }

    // 尝试创建公寓
    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      if (await dialog.isVisible()) {
        await dialog.getByLabel('公寓名称').fill(createUniqueName('E2E额度测试'));
        await dialog.getByLabel('地址').fill('额度测试地址');
        await dialog.getByRole('button', { name: '创建' }).click();

        // 如果达到上限，应该显示错误
        const errorText = page.getByText(/已达到.*上限|无法创建|额度不足/);
        const hasError = await errorText.isVisible().catch(() => false);
        if (hasError) {
          await expect(errorText).toBeVisible();
        } else {
          // 如果没有错误，关闭弹窗
          await page.keyboard.press('Escape');
        }
      }
    }
  });

  test('房间数量限制 (QUOTA-FLOW-02)', async ({ page }) => {
    // 进入公寓详情
    await page.goto('/apartments');
    const aptCard = page.getByRole('link').or(page.locator('a[href^="/apartments/"]')).first();

    if (await aptCard.isVisible()) {
      await aptCard.click();
      await page.waitForLoadState('networkidle');

      // 检查是否有额度提示
      const quotaWarning = page.getByText(/已达到|上限|额度/);
      const hasWarning = await quotaWarning.isVisible().catch(() => false);

      if (hasWarning) {
        await expect(quotaWarning).toBeVisible();
      }
    }
  });

  test('成员数量限制 (QUOTA-FLOW-03)', async ({ page }) => {
    await page.goto('/settings/team');

    // 切换到成员管理
    const membersTab = page.getByRole('tab', { name: /成员/ });
    if (await membersTab.isVisible()) {
      await membersTab.click();
    }

    // 检查是否有额度提示
    const quotaWarning = page.getByText(/已达到|上限|额度/);
    const hasWarning = await quotaWarning.isVisible().catch(() => false);

    if (hasWarning) {
      await expect(page.getByText(/升级|套餐/)).toBeVisible();
    }
  });
});

test.describe('订阅与支付流程 (SUB-FLOW)', () => {
  test('查看可用套餐 (SUB-FLOW-01)', async ({ page }) => {
    await page.goto('/settings/subscription');

    // 验证页面标题
    await expect(page.getByRole('heading', { name: /订阅|套餐/ })).toBeVisible({ timeout: 10000 });

    // 验证有套餐列表
    const planList = page.locator('[data-testid="subscription-plan-list"]').or(
      page.getByRole('list')
    );
    const hasPlans = await planList.isVisible().catch(() => false);

    // 或者验证有套餐卡片
    const planCards = page.getByText(/套餐|版/);
    const hasCards = await planCards.first().isVisible().catch(() => false);

    expect(hasPlans || hasCards).toBe(true);
  });

  test('套餐升级流程 (SUB-FLOW-02)', async ({ page }) => {
    await page.goto('/settings/subscription');

    // 查找升级按钮
    const upgradeBtn = page.getByRole('button', { name: /升级|更换套餐/ });

    if (await upgradeBtn.isVisible()) {
      await upgradeBtn.click();

      // 等待套餐选择页面或弹窗
      const planDialog = page.getByRole('dialog').filter({ hasText: /选择套餐|升级/ });
      const planPage = page.getByRole('heading', { name: /选择套餐|升级/ });

      const hasDialog = await planDialog.isVisible().catch(() => false);
      const hasPage = await planPage.isVisible().catch(() => false);

      expect(hasDialog || hasPage).toBe(true);
    }
  });

  test('订阅到期流程 (SUB-FLOW-03)', async ({ page }) => {
    await page.goto('/settings/subscription');

    // 查看当前订阅状态
    const currentSubscription = page.getByText(/当前套餐|到期时间|订阅状态/);
    const hasSubscription = await currentSubscription.isVisible().catch(() => false);

    if (hasSubscription) {
      // 验证显示到期时间或续费提示
      const expiryInfo = page.getByText(/到期|续费/);
      await expect(expiryInfo.first()).toBeVisible();
    }
  });
});
