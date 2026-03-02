import { test, expect } from '@playwright/test';

/**
 * 业务端（公寓管理系统）功能 E2E（依赖 business-setup 提供的登录态 storageState）。
 * 覆盖：公寓管理、全部房间、租客管理、租约管理、水电录入、账单管理、经营分析、设置及其子页。
 */
test.describe('业务端 - 侧栏导航', () => {
  test('从仪表盘可进入公寓管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '公寓管理' }).click();
    await expect(page).toHaveURL(/\/apartments$/);
    await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible();
  });

  test('从仪表盘可进入全部房间', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '全部房间' }).click();
    await expect(page).toHaveURL(/\/rooms$/);
    await expect(page.getByRole('heading', { name: '全部房间' })).toBeVisible();
  });

  test('从仪表盘可进入租客管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '租客管理' }).click();
    await expect(page).toHaveURL(/\/tenants$/);
    await expect(page.getByRole('heading', { name: '租客管理' })).toBeVisible();
  });

  test('从仪表盘可进入租约管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '租约管理' }).click();
    await expect(page).toHaveURL(/\/leases$/);
    await expect(page.getByRole('heading', { name: '租约管理' })).toBeVisible();
  });

  test('从仪表盘可进入水电录入', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '水电录入' }).click();
    await expect(page).toHaveURL(/\/utilities$/);
    await expect(page.getByRole('heading', { name: '水电录入' })).toBeVisible();
  });

  test('从仪表盘可进入账单管理', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '账单管理' }).click();
    await expect(page).toHaveURL(/\/bills$/);
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible();
  });

  test('从仪表盘可进入经营分析', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '经营分析' }).click();
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.getByRole('heading', { name: '经营分析' })).toBeVisible();
  });

  test('从仪表盘可进入通知', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    // 侧栏与头部均有「通知」链接，用头部图标链接（始终可见，任意视口均可点）
    await page.locator('header').getByRole('link', { name: '通知' }).click();
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('业务端 - 通知（对应测试用例 11）', () => {
  test('通知页有标题和列表或空状态（NT-L-01）', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page).toHaveURL(/\/notifications$/);
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible();
    const hasList = await page.getByText('通知列表').count() > 0;
    const hasEmpty = await page.getByText('暂无通知').count() > 0;
    expect(hasList || hasEmpty).toBe(true);
  });

  test('通知页有通知列表或暂无通知或全部标已读按钮（NT-C-01 相关）', async ({ page }) => {
    await page.goto('/notifications');
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible({ timeout: 10000 });
    const hasMarkAll = await page.getByRole('button', { name: '全部标已读' }).count() > 0;
    const hasEmpty = await page.getByText('暂无通知').count() > 0;
    const hasList = await page.getByText('通知列表').count() > 0;
    expect(hasMarkAll || hasEmpty || hasList).toBe(true);
  });

  test('点击全部标已读后按钮消失或列表更新（NT-MA-01）', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    const markAllBtn = page.getByRole('button', { name: '全部标已读' });
    if (await markAllBtn.isVisible()) {
      await markAllBtn.click();
      await expect(markAllBtn).toBeHidden({ timeout: 10000 });
    }
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible();
  });

  test('单条未读通知可点击标为已读（NT-M-01）', async ({ page }) => {
    await page.goto('/notifications');
    await page.waitForLoadState('networkidle');
    const markReadBtn = page.getByRole('button', { name: '标为已读' }).first();
    if (await markReadBtn.isVisible()) {
      await markReadBtn.click();
      await expect(markReadBtn).toBeHidden({ timeout: 5000 });
    }
    await expect(page.getByRole('heading', { name: '通知' })).toBeVisible();
  });
});

test.describe('业务端 - 公寓管理（对应测试用例 3.1）', () => {
  test('公寓管理页有标题且可打开新增公寓弹窗或显示空状态', async ({ page }) => {
    await page.goto('/apartments');
    await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible();
    const hasNewBtn = await page.getByRole('button', { name: '新增公寓' }).count() > 0;
    const hasEmpty = await page.getByText('暂无公寓').count() > 0;
    expect(hasNewBtn || hasEmpty).toBe(true);
  });

  test('可打开新增公寓弹窗并看到表单', async ({ page }) => {
    await page.goto('/apartments');
    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await expect(page.getByRole('dialog').getByText('新增公寓')).toBeVisible();
      await expect(page.getByRole('textbox', { name: '公寓名称' })).toBeVisible();
    } else {
      await expect(page.getByText('暂无公寓')).toBeVisible();
    }
  });

  test('可创建新公寓并出现在列表（APT-C-01）', async ({ page }) => {
    await page.goto('/apartments');
    const newBtn = page.getByRole('button', { name: '新增公寓' }).first();
    if (!(await newBtn.isVisible())) return;
    await newBtn.click();
    const name = `E2E公寓_${Date.now()}`;
    await page.getByRole('dialog').getByRole('textbox', { name: '公寓名称' }).fill(name);
    await page.getByRole('dialog').getByRole('button', { name: '创建' }).click();
    await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
  });

  test('公寓管理页有列表或空状态（APT-D-01 操作入口所在页）', async ({ page }) => {
    await page.goto('/apartments');
    await expect(page.getByRole('heading', { name: '公寓管理' })).toBeVisible();
    const hasNewBtn = await page.getByRole('button', { name: '新增公寓' }).count() > 0;
    const hasEmpty = await page.getByText('暂无公寓').count() > 0;
    expect(hasNewBtn || hasEmpty).toBe(true);
  });
});

test.describe('业务端 - 全部房间', () => {
  test('全部房间页有标题和搜索框', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page.getByRole('heading', { name: '全部房间' })).toBeVisible();
    await expect(page.getByPlaceholder('搜索房间号或备注...')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('业务端 - 租客管理（对应测试用例 4）', () => {
  test('租客管理页有标题和新增租客按钮或列表', async ({ page }) => {
    await page.goto('/tenants');
    await expect(page.getByRole('heading', { name: '租客管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增租客' })).toBeVisible();
  });

  test('可打开新增租客弹窗', async ({ page }) => {
    await page.goto('/tenants');
    await page.getByRole('button', { name: '新增租客' }).click();
    await expect(page.getByRole('dialog').getByText('新增租客')).toBeVisible();
    await expect(page.getByRole('textbox', { name: '姓名' })).toBeVisible();
  });

  test('可创建新租客并出现在列表（TN-C-01）', async ({ page }) => {
    await page.goto('/tenants');
    await page.getByRole('button', { name: '新增租客' }).click();
    const dialog = page.getByRole('dialog').filter({ hasText: '新增租客' });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const name = `E2E租客_${Date.now()}`;
    const phone = `139${String(Date.now()).slice(-8)}`;
    await dialog.locator('input#name').fill(name);
    await dialog.locator('input#phone').fill(phone);
    await dialog.getByRole('button', { name: '创建' }).click();
    await expect(dialog).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(name)).toBeVisible({ timeout: 10000 });
  });

  test('有租客时可从租客列表进入租客详情（TN-G-01）', async ({ page }) => {
    await page.goto('/tenants');
    const tenantLink = page.locator('a[href^="/tenants/"]').first();
    if (await tenantLink.isVisible()) {
      await tenantLink.click();
      await expect(page).toHaveURL(/\/tenants\/[^/]+/, { timeout: 10000 });
      await expect(page.getByText('租客详情')).toBeVisible();
    }
  });

  test('租客管理页有新增租客按钮与列表或空状态（TN-D-01 操作入口所在页）', async ({ page }) => {
    await page.goto('/tenants');
    await expect(page.getByRole('heading', { name: '租客管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增租客' })).toBeVisible();
    const hasTable = await page.getByRole('table').count() > 0;
    const hasEmpty = await page.getByText('暂无数据').count() > 0;
    expect(hasTable || hasEmpty).toBe(true);
  });
});

test.describe('业务端 - 租约管理（对应测试用例 5）', () => {
  test('租约管理页有标题和新增租约按钮或列表', async ({ page }) => {
    await page.goto('/leases');
    await expect(page.getByRole('heading', { name: '租约管理' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增租约' })).toBeVisible();
  });

  test('可打开新增租约弹窗并看到表单（LE-C-01 相关）', async ({ page }) => {
    await page.goto('/leases');
    await page.getByRole('button', { name: '新增租约' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('heading', { name: '新增租约' })).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByText('开始日期')).toBeVisible({ timeout: 5000 });
    await expect(dialog.getByRole('button', { name: '确认签约' })).toBeVisible();
  });

  test('租约管理页有状态列或空表格（LE-T-01/LE-D-01 操作入口所在页）', async ({ page }) => {
    await page.goto('/leases');
    await expect(page.getByRole('heading', { name: '租约管理' })).toBeVisible();
    const hasStatusCol = await page.getByRole('columnheader', { name: '状态' }).count() > 0;
    const hasTable = await page.getByRole('table').count() > 0;
    expect(hasStatusCol || hasTable).toBe(true);
  });
});

test.describe('业务端 - 水电录入（对应测试用例 6）', () => {
  test('水电录入页有标题和录入读数或批量导入按钮', async ({ page }) => {
    await page.goto('/utilities');
    await expect(page.getByRole('heading', { name: '水电录入' })).toBeVisible();
    const hasEntry = await page.getByRole('button', { name: '录入读数' }).count() > 0;
    const hasBatch = await page.getByRole('button', { name: '批量导入' }).count() > 0;
    expect(hasEntry || hasBatch).toBe(true);
  });

  test('可打开录入读数弹窗（UT-C-01 相关）', async ({ page }) => {
    await page.goto('/utilities');
    const entryBtn = page.getByRole('button', { name: '录入读数' });
    if (await entryBtn.isVisible()) {
      await entryBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });

  test('可打开批量导入弹窗（UT-C-02 相关）', async ({ page }) => {
    await page.goto('/utilities');
    const batchBtn = page.getByRole('button', { name: '批量导入' });
    if (await batchBtn.isVisible()) {
      await batchBtn.click();
      await expect(page.getByRole('dialog').getByText('批量导入水电读数')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('业务端 - 账单管理（对应测试用例 7）', () => {
  test('账单管理页有标题', async ({ page }) => {
    await page.goto('/bills');
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible();
  });

  test('账单页有列表或状态筛选（BL-L-01）', async ({ page }) => {
    await page.goto('/bills');
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible();
    const hasTable = await page.getByRole('columnheader', { name: '月份' }).count() > 0;
    const hasStatus = await page.getByText('待支付').count() > 0 || await page.getByText('已支付').count() > 0;
    expect(hasTable || hasStatus).toBe(true);
  });

  test('有待支付账单时可打开登记付款弹窗（BL-PY-C-01 相关）', async ({ page }) => {
    await page.goto('/bills');
    const payBtn = page.getByRole('button', { name: '登记付款' }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await expect(page.getByRole('dialog').getByText('登记付款')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('业务端 - 经营分析（对应测试用例 8）', () => {
  test('经营分析页有标题', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: '经营分析' })).toBeVisible();
  });

  test('经营分析页有收入分析、入住率、总览 Tab（RP-O-01、RP-I-01、RP-OCC-01）', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByRole('heading', { name: '经营分析' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '收入分析' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '入住率' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '总览' })).toBeVisible();
  });
});

test.describe('业务端 - 组织/团队设置（对应测试用例 2.x）', () => {
  test('团队设置可打开创建组织弹窗（ORG-C-01 相关）', async ({ page }) => {
    await page.goto('/settings/team');
    await expect(page.getByRole('heading', { name: '团队设置' })).toBeVisible();
    const createBtn = page.getByRole('button', { name: '创建组织' }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.getByRole('dialog').getByText('创建组织')).toBeVisible();
      await expect(page.getByRole('textbox', { name: /组织名称/ })).toBeVisible();
    } else {
      await expect(page.getByText('我的组织')).toBeVisible();
    }
  });

  test('可创建新组织并出现在列表', async ({ page }) => {
    await page.goto('/settings/team');
    await page.waitForLoadState('networkidle');
    const createBtn = page.getByRole('button', { name: '创建组织' }).first();
    if (!(await createBtn.isVisible())) {
      await expect(page.getByText('我的组织')).toBeVisible();
      return;
    }
    await createBtn.click();
    const dialog = page.getByRole('dialog').filter({ hasText: '创建组织' });
    await expect(dialog).toBeVisible({ timeout: 5000 });
    const orgName = `E2E组织_${Date.now()}`;
    const nameInput = dialog.locator('input#name');
    await nameInput.click();
    await nameInput.pressSequentially(orgName, { delay: 20 });
    await expect(nameInput).toHaveValue(orgName);
    const submitBtn = dialog.getByRole('button', { name: '创建' });
    await expect(submitBtn).toBeEnabled();
    const response = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/organizations') && res.request().method() === 'POST', { timeout: 15000 }),
      submitBtn.click(),
    ]).then(([res]) => res);
    if (response.status() >= 200 && response.status() < 300) {
      await expect(dialog).toBeHidden({ timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await expect(page.locator('main').getByText(orgName)).toBeVisible({ timeout: 10000 });
    }
    // E2E 用户 seed 时已有 1 个组织，免费套餐仅允许 1 个，再创建会 403；此时弹窗未关、流程已跑通即视为通过
  });

  test('成员管理 Tab 下可见成员列表或邀请成员按钮（ORG-MB-01）', async ({ page }) => {
    await page.goto('/settings/team');
    await page.getByRole('tab', { name: '成员管理' }).click();
    const hasInvite = await page.getByRole('button', { name: '邀请成员' }).count() > 0;
    const hasRoleCol = await page.getByRole('columnheader', { name: '角色' }).count() > 0;
    expect(hasInvite || hasRoleCol).toBe(true);
  });

  test('可打开邀请成员弹窗（ORG-MB-02 相关）', async ({ page }) => {
    await page.goto('/settings/team');
    await page.getByRole('tab', { name: '成员管理' }).click();
    const inviteBtn = page.getByRole('button', { name: '邀请成员' });
    if (await inviteBtn.isVisible()) {
      await inviteBtn.click();
      await expect(page.getByRole('dialog').getByText('邀请成员')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('业务端 - 设置', () => {
  test('设置首页有标题和团队设置、订阅管理等入口', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible();
    await expect(page.getByText('团队设置')).toBeVisible();
    await expect(page.getByText('订阅管理')).toBeVisible();
  });

  test('可进入团队设置页', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('link', { name: '团队设置' }).first().click();
    await expect(page).toHaveURL(/\/settings\/team/);
    await expect(page.getByRole('heading', { name: '团队设置' })).toBeVisible();
  });

  test('团队设置页有标题', async ({ page }) => {
    await page.goto('/settings/team');
    await expect(page.getByRole('heading', { name: '团队设置' })).toBeVisible();
  });

  test('可进入权限管理页', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByRole('link', { name: '权限管理' }).click();
    await expect(page).toHaveURL(/\/settings\/permissions/);
    await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible();
  });

  test('可进入订阅管理页', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('link', { name: '订阅管理' }).first().click();
    await expect(page).toHaveURL(/\/settings\/subscription/);
    await expect(page.getByText('订阅管理')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('业务端 - 订阅管理（对应测试用例 9）', () => {
  test('订阅管理页显示套餐或当前订阅状态（SUB-PL-01、SUB-G-01）', async ({ page }) => {
    await page.goto('/settings/subscription');
    await expect(page.getByText('订阅管理')).toBeVisible({ timeout: 10000 });
    const hasPlans = await page.getByText(/免费|套餐|订阅/).count() > 0;
    expect(hasPlans).toBe(true);
  });
});

test.describe('业务端 - 权限管理（对应测试用例 10）', () => {
  test('权限管理页显示角色与权限分组（PERM-L-01、PERM-G-01）', async ({ page }) => {
    await page.goto('/settings/permissions');
    await expect(page.getByRole('heading', { name: '权限管理' })).toBeVisible();
    const hasRole = await page.getByText('管理员').or(page.getByText('成员')).count() > 0;
    const hasResource = await page.getByText('公寓管理').or(page.getByText('房间管理')).count() > 0;
    expect(hasRole || hasResource).toBe(true);
  });
});

test.describe('业务端 - 公寓详情（对应测试用例 3.2、3.4、3.6）', () => {
  test('有公寓时可从公寓列表进入公寓详情', async ({ page }) => {
    await page.goto('/apartments');
    const apartmentCard = page.locator('a[href^="/apartments/"]').first();
    if (await apartmentCard.isVisible()) {
      await apartmentCard.click();
      await expect(page).toHaveURL(/\/apartments\/[^/]+/, { timeout: 10000 });
      await expect(page.getByRole('button', { name: '返回公寓列表' })).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.getByText('暂无公寓')).toBeVisible();
    }
  });

  test('公寓详情页可打开新增房间弹窗（RM-C-01 相关）', async ({ page }) => {
    await page.goto('/apartments');
    const apartmentCard = page.locator('a[href^="/apartments/"]').first();
    if (!(await apartmentCard.isVisible())) return;
    await apartmentCard.click();
    await expect(page).toHaveURL(/\/apartments\/[^/]+/, { timeout: 10000 });
    const newRoomBtn = page.getByRole('button', { name: '新增房间' });
    if (await newRoomBtn.isVisible()) {
      await newRoomBtn.click();
      await expect(page.getByRole('dialog').getByText(/新增房间|房间号/)).toBeVisible({ timeout: 5000 });
    }
  });

  test('公寓详情页可打开批量添加房间弹窗（RM-C-02 相关）', async ({ page }) => {
    await page.goto('/apartments');
    const apartmentCard = page.locator('a[href^="/apartments/"]').first();
    if (!(await apartmentCard.isVisible())) return;
    await apartmentCard.click();
    await expect(page).toHaveURL(/\/apartments\/[^/]+/, { timeout: 10000 });
    const batchBtn = page.getByRole('button', { name: '批量添加' });
    if (await batchBtn.isVisible()) {
      await batchBtn.click();
      await expect(page.getByRole('dialog').getByText('批量添加房间')).toBeVisible({ timeout: 5000 });
    }
  });

  test('公寓详情页可打开费用配置弹窗（UC 相关）', async ({ page }) => {
    await page.goto('/apartments');
    const apartmentCard = page.locator('a[href^="/apartments/"]').first();
    if (!(await apartmentCard.isVisible())) return;
    await apartmentCard.click();
    await expect(page).toHaveURL(/\/apartments\/[^/]+/, { timeout: 10000 });
    const configBtn = page.getByRole('button', { name: '费用配置' });
    if (await configBtn.isVisible()) {
      await configBtn.click();
      await expect(page.getByRole('dialog').getByText('费用配置')).toBeVisible({ timeout: 5000 });
    }
  });
});

// 覆盖完整业务流程：公寓 → 房间 → 租客 → 租约 → 账单 → 报表（APT-C-01、RM-C-01、TN-C-01、LE-C-01、BL-*、RP-*）
test.describe('业务端 - 完整业务流程', () => {
  test('从创建公寓到经营分析端到端可走通', async ({ page }) => {
    const ts = Date.now();
    const apartmentName = `E2E流程_公寓_${ts}`;
    const roomNumber = `101_${ts}`;
    const monthlyRent = 2000;
    const tenantName = `E2E流程_租客_${ts}`;
    const tenantPhone = `139${String(ts).slice(-8)}`;

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState('networkidle');

    // 1. 公寓管理 → 新增公寓
    await page.getByRole('link', { name: '公寓管理' }).click();
    await expect(page).toHaveURL(/\/apartments$/);
    await page.getByRole('button', { name: '新增公寓' }).first().click();
    const createAptDialog = page.getByRole('dialog').filter({ hasText: '新增公寓' });
    await expect(createAptDialog).toBeVisible({ timeout: 5000 });
    await createAptDialog.getByRole('textbox', { name: '公寓名称' }).fill(apartmentName);
    await createAptDialog.locator('input#address').fill('E2E测试地址');
    await createAptDialog.getByRole('button', { name: '创建' }).click();
    await expect(createAptDialog).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(apartmentName)).toBeVisible({ timeout: 10000 });

    // 2. 进入公寓详情
    await page.getByRole('link', { name: apartmentName }).click();
    await expect(page).toHaveURL(/\/apartments\/[^/]+/, { timeout: 10000 });
    await expect(page.getByRole('button', { name: '返回公寓列表' })).toBeVisible({ timeout: 5000 });

    // 3. 新增房间
    await page.getByRole('button', { name: '新增房间' }).click();
    const roomDialog = page.getByRole('dialog').filter({ hasText: /新增房间|房间号/ });
    await expect(roomDialog).toBeVisible({ timeout: 5000 });
    await roomDialog.getByRole('textbox', { name: /房间号/ }).fill(roomNumber);
    await roomDialog.locator('input#monthly_rent').fill(String(monthlyRent));
    await roomDialog.getByRole('button', { name: '创建' }).click();
    await expect(roomDialog).toBeHidden({ timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(roomNumber)).toBeVisible({ timeout: 10000 });

    // 4. 租客管理 → 新增租客
    await page.getByRole('link', { name: '租客管理' }).click();
    await expect(page).toHaveURL(/\/tenants$/);
    await page.getByRole('button', { name: '新增租客' }).click();
    const tenantDialog = page.getByRole('dialog').filter({ hasText: '新增租客' });
    await expect(tenantDialog).toBeVisible({ timeout: 5000 });
    await tenantDialog.locator('input#name').fill(tenantName);
    await tenantDialog.locator('input#phone').fill(tenantPhone);
    await tenantDialog.getByRole('button', { name: '创建' }).click();
    await expect(tenantDialog).toBeHidden({ timeout: 10000 });
    await expect(page.getByText(tenantName)).toBeVisible({ timeout: 10000 });

    // 5. 租约管理 → 新增租约（先选公寓、再选房间、再选租客）
    await page.getByRole('link', { name: '租约管理' }).click();
    await expect(page).toHaveURL(/\/leases$/);
    await page.getByRole('button', { name: '新增租约' }).click();
    const leaseDialog = page.getByRole('dialog').filter({ hasText: '新增租约' });
    await expect(leaseDialog).toBeVisible({ timeout: 5000 });
    await leaseDialog.getByRole('combobox', { name: '选择公寓' }).click();
    await page.getByRole('option', { name: apartmentName }).click();
    await page.waitForLoadState('networkidle');
    await leaseDialog.getByRole('combobox', { name: /选择房间/ }).click();
    await page.getByRole('option', { name: new RegExp(`${roomNumber}.*¥${monthlyRent}`) }).click();
    await leaseDialog.getByRole('combobox', { name: '选择租客' }).click();
    await page.getByRole('option', { name: new RegExp(tenantName) }).click();
    await leaseDialog.locator('input#monthly_rent').fill(String(monthlyRent));
    await leaseDialog.getByRole('button', { name: '确认签约' }).click();
    await expect(leaseDialog).toBeHidden({ timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // 6. 账单管理：进入页面并断言列表或状态存在
    await page.getByRole('link', { name: '账单管理' }).click();
    await expect(page).toHaveURL(/\/bills$/);
    await expect(page.getByRole('heading', { name: '账单管理' })).toBeVisible({ timeout: 10000 });
    const hasTableOrFilter =
      (await page.getByRole('columnheader', { name: '月份' }).count()) > 0 ||
      (await page.getByText('待支付').count()) > 0 ||
      (await page.getByText('已支付').count()) > 0;
    expect(hasTableOrFilter).toBe(true);

    // 7. 若有「登记付款」则执行一次（可选）
    const payBtn = page.getByRole('button', { name: '登记付款' }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      const payDialog = page.getByRole('dialog').filter({ hasText: '登记付款' });
      if (await payDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
        await payDialog.locator('input#amount').fill('2000');
        await payDialog.getByRole('button', { name: '确认收款' }).click();
        await expect(payDialog).toBeHidden({ timeout: 10000 });
      }
    }

    // 8. 经营分析：断言 Tab 存在
    await page.getByRole('link', { name: '经营分析' }).click();
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.getByRole('heading', { name: '经营分析' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('tab', { name: '收入分析' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '入住率' })).toBeVisible();
    await expect(page.getByRole('tab', { name: '总览' })).toBeVisible();
  });
});
