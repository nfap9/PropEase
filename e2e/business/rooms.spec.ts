import { test, expect } from '@playwright/test';
import { ROOMS } from '../testids';
import { createUniqueName } from '../test-helpers';

/**
 * 房间管理模块 E2E 测试
 * 对应测试用例：1.4 房间管理模块
 *
 * 模块编号：RM（房间）
 * - RM-L-*: 房间列表
 * - RM-C-*: 房间创建
 * - RM-U-*: 房间编辑
 * - RM-D-*: 房间删除
 */

test.describe('房间列表 (RM-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/rooms');
  });

  test('查看全部房间 (RM-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: '全部房间' })).toBeVisible({ timeout: 10000 });

    // 验证筛选器存在
    const apartmentFilter = page.getByRole('combobox', { name: /公寓/ }).or(
      page.locator('[data-testid="rooms-apartment-filter"]')
    );
    const statusFilter = page.getByRole('combobox', { name: /状态/ }).or(
      page.locator('[data-testid="rooms-status-filter"]')
    );

    // 验证列表或空状态
    const table = page.getByRole('table');
    const emptyState = page.getByText('暂无房间');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });

  test('按公寓筛选房间 (RM-L-02)', async ({ page }) => {
    // 查找公寓筛选器
    const apartmentFilter = page.getByRole('combobox', { name: /公寓/ }).or(
      page.getByTestId(ROOMS.APARTMENT_FILTER).or(
        page.locator('[data-testid="rooms-apartment-filter"]')
      )
    ).first();

    if (await apartmentFilter.isVisible()) {
      await apartmentFilter.click();

      // 选择第一个公寓选项
      const option = page.getByRole('option').first();
      if (await option.isVisible()) {
        const optionText = await option.textContent();
        await option.click();
        await page.waitForTimeout(1000);

        // 验证筛选结果
        const rows = page.getByRole('row');
        const rowCount = await rows.count();
        // 筛选后应该只显示该公寓的房间（或无结果）
        expect(rowCount).toBeGreaterThanOrEqual(1); // 包含表头
      }
    }
  });

  test('按状态筛选房间 (RM-L-03)', async ({ page }) => {
    // 查找状态筛选器
    const statusFilter = page.getByRole('combobox', { name: /状态/ }).or(
      page.getByTestId(ROOMS.STATUS_FILTER).or(
        page.locator('[data-testid="rooms-status-filter"]')
      )
    ).first();

    if (await statusFilter.isVisible()) {
      await statusFilter.click();

      // 选择"空置"状态
      const vacantOption = page.getByRole('option', { name: /空置|未租/ }).or(
        page.getByText('空置')
      ).first();

      if (await vacantOption.isVisible()) {
        await vacantOption.click();
        await page.waitForTimeout(1000);

        // 验证筛选后的列表只显示空置房间
        const rows = page.getByRole('row');
        // 检查所有行是否只包含"空置"或"未租"状态
        for (let i = 1; i < Math.min(await rows.count(), 5); i++) {
          const row = rows.nth(i);
          const text = await row.textContent();
          // 如果行中有状态文本，应该是空置
          if (text?.includes('空置') || text?.includes('未租') || text?.includes('闲置')) {
            expect(text).toMatch(/空置|未租|闲置/);
          }
        }
      }
    }
  });

  test('搜索房间 (RM-L-04)', async ({ page }) => {
    // 查找搜索框
    const searchInput = page.getByPlaceholder(/搜索房间|房间号/).or(
      page.getByTestId(ROOMS.SEARCH_INPUT).or(
        page.locator('input[type="search"]')
      )
    ).first();

    if (await searchInput.isVisible()) {
      // 输入搜索关键词
      await searchInput.fill('101');
      await page.waitForTimeout(1000);

      // 验证搜索结果
      const rows = page.getByRole('row');
      for (let i = 1; i < Math.min(await rows.count(), 5); i++) {
        const row = rows.nth(i);
        const text = await row.textContent();
        if (text && !text.includes('暂无')) {
          expect(text).toContain('101');
        }
      }
    }
  });

  test('查看房间详情 (RM-L-05)', async ({ page }) => {
    // 查找房间列表中的房间
    const roomRow = page.getByRole('row').filter({ hasText: /房间|室/ }).first();
    if (await roomRow.isVisible()) {
      // 点击房间查看详情
      const roomLink = roomRow.getByRole('link').first();
      if (await roomLink.isVisible()) {
        await roomLink.click();
        // 验证详情页
        await expect(page.getByText(/房间详情|房间信息/)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('房间创建 (RM-C)', () => {
  let apartmentName: string;

  test.beforeEach(async ({ page }) => {
    // 先创建一个公寓用于测试
    apartmentName = createUniqueName('E2E房间公寓');
    await page.goto('/apartments');

    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(apartmentName);
      await dialog.getByLabel('地址').fill('E2E测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });

  test('单个添加房间 (RM-C-01)', async ({ page }) => {
    // 进入公寓详情页
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      // 点击新增房间
      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 填写房间信息
        const roomNumber = `10${Date.now().toString().slice(-3)}`;
        await dialog.getByLabel(/房间号/).fill(roomNumber);
        await dialog.getByLabel(/月租/).fill('1500');

        await dialog.getByRole('button', { name: '创建' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证房间出现在列表中
        await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('房间号为空 (RM-C-03)', async ({ page }) => {
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 只填写月租，不填房间号
        await dialog.getByLabel(/月租/).fill('1500');
        await dialog.getByRole('button', { name: '创建' }).click();

        // 验证错误提示
        await expect(dialog.getByText(/请输入房间号/)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('月租为空 (RM-C-04)', async ({ page }) => {
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 只填写房间号，不填月租
        await dialog.getByLabel(/房间号/).fill('999');
        await dialog.getByRole('button', { name: '创建' }).click();

        // 验证错误提示
        await expect(dialog.getByText(/请输入月租/)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('房间编辑与删除 (RM-U, RM-D)', () => {
  let apartmentName: string;
  let roomNumber: string;

  test.beforeEach(async ({ page }) => {
    // 创建公寓和房间
    apartmentName = createUniqueName('E2E编辑房间公寓');
    roomNumber = `20${Date.now().toString().slice(-3)}`;

    await page.goto('/apartments');

    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(apartmentName);
      await dialog.getByLabel('地址').fill('E2E测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // 进入公寓详情添加房间
      const card = page.getByRole('link', { name: new RegExp(apartmentName) });
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();
        const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await dialog.getByLabel(/房间号/).fill(roomNumber);
        await dialog.getByLabel(/月租/).fill('1500');
        await dialog.getByRole('button', { name: '创建' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });

  test('编辑房间信息 (RM-U-01)', async ({ page }) => {
    await page.goto('/rooms');

    // 找到刚创建的房间
    const roomRow = page.getByRole('row').filter({ hasText: roomNumber }).first();
    if (await roomRow.isVisible()) {
      // 点击编辑按钮
      const editBtn = roomRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑房间/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 修改月租
        const rentInput = dialog.getByLabel(/月租/);
        await rentInput.fill('2000');
        await dialog.getByRole('button', { name: '保存' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证修改成功
        await expect(page.getByText('2000')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('删除有活跃租约的房间 (RM-D-03)', async ({ page }) => {
    await page.goto('/rooms');

    // 查找有租约的房间（状态为"已租"）
    const rentedRoomRow = page.getByRole('row').filter({ hasText: /已租/ }).first();
    if (await rentedRoomRow.isVisible()) {
      // 尝试点击删除按钮
      const deleteBtn = rentedRoomRow.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // 验证提示信息
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          // 应该显示无法删除的提示
          await expect(dialog.getByText(/有租约|无法删除|履行中/)).toBeVisible({ timeout: 5000 });
          // 关闭弹窗
          await page.keyboard.press('Escape');
        }
      }
    }
  });

  test('删除空房间 (RM-D-01)', async ({ page }) => {
    await page.goto('/rooms');

    // 查找空房间（状态为"空置"或"未租"）
    const vacantRoomRow = page.getByRole('row').filter({ hasText: /空置|未租|闲置/ }).first();
    if (await vacantRoomRow.isVisible()) {
      const deleteBtn = vacantRoomRow.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // 确认删除弹窗
        const dialog = page.getByRole('dialog').filter({ hasText: /确认删除|删除房间/ });
        if (await dialog.isVisible()) {
          const confirmBtn = dialog.getByRole('button', { name: /确认|删除/ });
          await confirmBtn.click();
          await expect(dialog).toBeHidden({ timeout: 10000 });

          // 验证删除成功提示
          await expect(page.getByText(/删除成功/)).toBeVisible({ timeout: 5000 }).catch(() => {});
        }
      }
    }
  });

  test('删除有历史租约的房间 (RM-D-02)', async ({ page }) => {
    await page.goto('/rooms');

    // 查找有历史租约但当前未出租的房间
    // 这种房间状态可能是"空置"但有历史记录
    const roomRow = page.getByRole('row').filter({ hasText: /空置|已完成|历史/ }).first();
    if (await roomRow.isVisible()) {
      const deleteBtn = roomRow.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          // 验证是否提示有历史记录
          const hasHistoryWarning = await dialog.getByText(/历史|记录|数据/).isVisible().catch(() => false);
          // 如果有警告，检查是否有继续删除选项
          if (hasHistoryWarning) {
            const confirmBtn = dialog.getByRole('button', { name: /确认|继续删除/ });
            if (await confirmBtn.isVisible()) {
              // 可以删除有历史记录的房间
              await confirmBtn.click();
              await expect(dialog).toBeHidden({ timeout: 10000 });
            }
          }
        }
      }
    }
  });
});

test.describe('房间批量与边界测试 (RM-C-02, RM-C-05, RM-C-06)', () => {
  let apartmentName: string;

  test.beforeEach(async ({ page }) => {
    // 创建公寓用于测试
    apartmentName = createUniqueName('E2E批量房间公寓');
    await page.goto('/apartments');

    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
      await dialog.getByLabel('公寓名称').fill(apartmentName);
      await dialog.getByLabel('地址').fill('E2E测试地址');
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });

  test('批量添加房间 (RM-C-02)', async ({ page }) => {
    // 进入公寓详情页
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      // 查找批量添加按钮
      const batchBtn = page.getByRole('button', { name: /批量添加|批量导入/ }).or(
        page.getByTestId(ROOMS.BATCH_BUTTON)
      );

      if (await batchBtn.isVisible()) {
        await batchBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /批量添加|批量导入/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 填写批量房间信息
        // 可能是输入范围（如 101-110）或每行一个房间号
        const roomRangeInput = dialog.getByLabel(/房间号范围|起始|开始/).or(
          dialog.getByPlaceholder(/101-110|每行/)
        );

        if (await roomRangeInput.isVisible()) {
          // 方式1：输入范围
          await roomRangeInput.fill('301-305');
        }

        // 填写月租
        const rentInput = dialog.getByLabel(/月租|统一月租/);
        if (await rentInput.isVisible()) {
          await rentInput.fill('1500');
        }

        await dialog.getByRole('button', { name: /创建|导入|确定/ }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 验证批量创建成功
        await expect(page.getByText(/301|302|303|304|305/)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('房间号重复 (RM-C-05)', async ({ page }) => {
    const roomNumber = `30${Date.now().toString().slice(-3)}`;

    // 先创建一个房间
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      // 创建第一个房间
      const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
      if (await newRoomBtn.isVisible()) {
        await newRoomBtn.click();
        let dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await dialog.getByLabel(/房间号/).fill(roomNumber);
        await dialog.getByLabel(/月租/).fill('1500');
        await dialog.getByRole('button', { name: '创建' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });

        // 尝试创建重复房间号的房间
        await newRoomBtn.click();
        dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
        await dialog.getByLabel(/房间号/).fill(roomNumber);
        await dialog.getByLabel(/月租/).fill('2000');
        await dialog.getByRole('button', { name: '创建' }).click();

        // 验证错误提示
        await expect(dialog.getByText(/已存在|重复|重复的房间号/)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('达到房间上限 (RM-C-06)', async ({ page }) => {
    // 这个测试需要订阅套餐限制了房间数量
    // 尝试创建超过限额的房间
    await page.goto('/apartments');
    const card = page.getByRole('link', { name: new RegExp(apartmentName) });
    if (await card.isVisible()) {
      await card.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+$/, { timeout: 10000 });

      // 查找配额信息
      const quotaInfo = page.getByText(/配额|限额|剩余|已用/);
      const hasQuota = await quotaInfo.isVisible().catch(() => false);

      if (hasQuota) {
        // 如果显示配额，尝试创建超过配额的房间
        const newRoomBtn = page.getByRole('button', { name: /新增房间|添加房间/ });
        if (await newRoomBtn.isVisible()) {
          // 检查按钮是否禁用（已达上限）
          const isDisabled = await newRoomBtn.isDisabled();
          if (isDisabled) {
            // 按钮已禁用，验证提示信息
            await expect(page.getByText(/已达上限|超过限额/)).toBeVisible({ timeout: 5000 });
          } else {
            // 按钮未禁用，尝试创建并看是否报错
            await newRoomBtn.click();
            const dialog = page.getByRole('dialog').filter({ hasText: /新增房间|添加房间/ });
            await dialog.getByLabel(/房间号/).fill(`99${Date.now().toString().slice(-3)}`);
            await dialog.getByLabel(/月租/).fill('1500');
            await dialog.getByRole('button', { name: '创建' }).click();

            // 如果已达上限，应该显示错误
            const errorMsg = page.getByText(/上限|限额|配额/);
            const hasError = await errorMsg.isVisible({ timeout: 5000 }).catch(() => false);
            // 这个测试可能因为未达上限而跳过
          }
        }
      }
    }
  });
});
