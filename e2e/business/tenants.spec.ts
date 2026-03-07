import { test, expect } from '@playwright/test';
import { TENANTS } from '../testids';
import { createUniqueName, createUniquePhone } from '../test-helpers';

/**
 * 租客管理模块 E2E 测试
 * 对应测试用例：1.5 租客管理模块
 *
 * 模块编号：TN（租客）
 * - TN-L-*: 租客列表
 * - TN-C-*: 租客创建
 * - TN-R-*: 租客详情查看
 * - TN-U-*: 租客编辑
 * - TN-D-*: 租客删除
 * - TN-F-*: 租客搜索
 */

test.describe('租客列表 (TN-L)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenants');
  });

  test('查看租客列表 (TN-L-01)', async ({ page }) => {
    // 验证页面标题
    await expect(page.getByRole('heading', { name: '租客管理' })).toBeVisible({ timeout: 10000 });

    // 验证表格或空状态存在
    const table = page.getByRole('table');
    const emptyState = page.getByText('暂无租客');
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await emptyState.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
  });
});

test.describe('租客创建 (TN-C)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tenants');
  });

  test('新增租客成功 (TN-C-01)', async ({ page }) => {
    const tenantName = createUniqueName('E2E租客');
    const phone = createUniquePhone();

    // 点击新增租客按钮
    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (!(await newBtn.isVisible())) {
      console.log('新增租客按钮不可见，跳过测试');
      return;
    }
    await newBtn.click();

    const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写必填信息
    await dialog.getByLabel(/姓名/).fill(tenantName);
    await dialog.getByLabel(/联系电话|电话|手机/).fill(phone);
    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // 验证租客出现在列表中
    await expect(page.getByText(tenantName)).toBeVisible({ timeout: 5000 });
  });

  test('租客姓名为空 (TN-C-02)', async ({ page }) => {
    const phone = createUniquePhone();

    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (!(await newBtn.isVisible())) return;

    await newBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 只填写电话，不填姓名
    await dialog.getByLabel(/联系电话|电话|手机/).fill(phone);
    await dialog.getByRole('button', { name: '创建' }).click();

    // 验证姓名字段错误提示
    await expect(dialog.getByText(/请输入姓名|姓名.*必填/)).toBeVisible({ timeout: 5000 });
  });

  test('租客电话为空 (TN-C-03)', async ({ page }) => {
    const tenantName = createUniqueName('E2E租客');

    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (!(await newBtn.isVisible())) return;

    await newBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 只填写姓名，不填电话
    await dialog.getByLabel(/姓名/).fill(tenantName);
    await dialog.getByRole('button', { name: '创建' }).click();

    // 验证电话字段错误提示
    await expect(dialog.getByText(/请输入电话|请输入联系电话|电话.*必填/)).toBeVisible({ timeout: 5000 });
  });

  test('完整租客信息 (TN-C-04)', async ({ page }) => {
    const tenantName = createUniqueName('E2E完整租客');
    const phone = createUniquePhone();

    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (!(await newBtn.isVisible())) return;

    await newBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 填写所有可用字段
    await dialog.getByLabel(/姓名/).fill(tenantName);
    await dialog.getByLabel(/联系电话|电话|手机/).fill(phone);

    // 填写身份证号（如果有）
    const idCardInput = dialog.getByLabel(/身份证/);
    if (await idCardInput.isVisible()) {
      await idCardInput.fill('110101199001011234');
    }

    // 填写备注（如果有）
    const notesInput = dialog.getByLabel(/备注/);
    if (await notesInput.isVisible()) {
      await notesInput.fill('E2E测试完整信息');
    }

    // 填写紧急联系人（如果有）
    const emergencyContactInput = dialog.getByLabel(/紧急联系人/);
    if (await emergencyContactInput.isVisible()) {
      await emergencyContactInput.fill('张三');
    }

    const emergencyPhoneInput = dialog.getByLabel(/紧急联系电话/);
    if (await emergencyPhoneInput.isVisible()) {
      await emergencyPhoneInput.fill('13800138000');
    }

    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });

    // 验证创建成功
    await expect(page.getByText(tenantName)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('租客详情与编辑 (TN-R, TN-U)', () => {
  let tenantName: string;
  let phone: string;

  test.beforeEach(async ({ page }) => {
    tenantName = createUniqueName('E2E租客详情');
    phone = createUniquePhone();

    // 创建一个租客
    await page.goto('/tenants');
    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
      await dialog.getByLabel(/姓名/).fill(tenantName);
      await dialog.getByLabel(/联系电话|电话|手机/).fill(phone);
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });

  test('查看租客详情 (TN-R-01)', async ({ page }) => {
    // 刷新页面确保数据加载
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 点击租客查看详情
    const tenantRow = page.getByRole('row').filter({ hasText: tenantName }).first();
    if (await tenantRow.isVisible()) {
      // 点击租客名称链接或详情按钮
      const nameLink = tenantRow.getByRole('link', { name: tenantName }).or(
        tenantRow.getByRole('button', { name: tenantName })
      ).or(
        tenantRow.getByText(tenantName)
      );

      if (await nameLink.isVisible()) {
        await nameLink.click();
        // 验证详情页
        await expect(page.getByText(/租客详情|租客信息/)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(tenantName)).toBeVisible();
        await expect(page.getByText(phone)).toBeVisible();
      }
    }
  });

  test('编辑租客信息 (TN-U-01)', async ({ page }) => {
    await page.reload();
    await page.waitForLoadState('networkidle');

    const tenantRow = page.getByRole('row').filter({ hasText: tenantName }).first();
    if (await tenantRow.isVisible()) {
      // 点击编辑按钮
      const editBtn = tenantRow.getByRole('button', { name: /编辑/ });
      if (await editBtn.isVisible()) {
        await editBtn.click();

        const dialog = page.getByRole('dialog').filter({ hasText: /编辑租客/ });
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // 修改备注
        const notesInput = dialog.getByLabel(/备注/);
        if (await notesInput.isVisible()) {
          await notesInput.fill('E2E测试备注');
        }

        await dialog.getByRole('button', { name: '保存' }).click();
        await expect(dialog).toBeHidden({ timeout: 10000 });
      }
    }
  });
});

test.describe('租客删除 (TN-D)', () => {
  test('删除无租约租客 (TN-D-01)', async ({ page }) => {
    // 先创建一个租客
    await page.goto('/tenants');
    const tenantName = createUniqueName('E2E待删租客');
    const phone = createUniquePhone();

    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
      await dialog.getByLabel(/姓名/).fill(tenantName);
      await dialog.getByLabel(/联系电话|电话|手机/).fill(phone);
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });

      // 刷新页面
      await page.reload();
      await page.waitForLoadState('networkidle');

      // 查找刚创建的租客（无租约状态）
      const tenantRow = page.getByRole('row').filter({ hasText: tenantName }).first();
      if (await tenantRow.isVisible()) {
        const deleteBtn = tenantRow.getByRole('button', { name: /删除/ });
        if (await deleteBtn.isVisible()) {
          await deleteBtn.click();

          // 确认删除弹窗
          const confirmDialog = page.getByRole('dialog').filter({ hasText: /确认删除|删除租客/ });
          if (await confirmDialog.isVisible()) {
            await confirmDialog.getByRole('button', { name: /确认|删除/ }).click();
            await expect(confirmDialog).toBeHidden({ timeout: 10000 });

            // 验证删除成功
            await expect(page.getByText(tenantName)).toBeHidden({ timeout: 5000 });
          }
        }
      }
    }
  });

  test('删除有租约的租客 (TN-D-02)', async ({ page }) => {
    await page.goto('/tenants');

    // 查找有租约的租客
    const tenantWithLease = page.getByRole('row').filter({ hasText: /生效中|履行中/ }).first();
    if (await tenantWithLease.isVisible()) {
      const deleteBtn = tenantWithLease.getByRole('button', { name: /删除/ });
      if (await deleteBtn.isVisible()) {
        await deleteBtn.click();

        // 验证提示信息
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await expect(dialog.getByText(/有租约|无法删除|履行中/)).toBeVisible({ timeout: 5000 });
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});

test.describe('租客搜索 (TN-F)', () => {
  test.beforeEach(async ({ page }) => {
    // 创建一个租客用于搜索
    await page.goto('/tenants');
    const tenantName = createUniqueName('E2E搜索租客');
    const phone = createUniquePhone();

    const newBtn = page.getByRole('button', { name: '新增租客' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      const dialog = page.getByRole('dialog').filter({ hasText: /新增租客|添加租客/ });
      await dialog.getByLabel(/姓名/).fill(tenantName);
      await dialog.getByLabel(/联系电话|电话|手机/).fill(phone);
      await dialog.getByRole('button', { name: '创建' }).click();
      await expect(dialog).toBeHidden({ timeout: 10000 });
    }
  });

  test('搜索租客 (TN-F-01)', async ({ page }) => {
    // 刷新确保数据加载
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 使用搜索框
    const searchInput = page.getByPlaceholder(/搜索|姓名|手机/).or(
      page.getByRole('searchbox')
    ).first();

    if (await searchInput.isVisible()) {
      const searchText = 'E2E搜索租客';
      await searchInput.fill(searchText);

      // 等待搜索结果
      await page.waitForTimeout(500);
      await expect(page.getByText(searchText)).toBeVisible({ timeout: 5000 });
    }
  });
});
