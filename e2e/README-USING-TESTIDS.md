# 使用 data-testid 编写 E2E 测试

## 概述

本项目使用 `data-testid` 约定来编写 E2E 测试，避免因前端文案变更导致测试失败。

## 文件说明

| 文件 | 说明 |
|------|------|
| `testids.ts` | 所有 data-testid 常量定义 |
| `test-helpers.ts` | 测试辅助工具函数 |
| `example-using-testids.spec.ts` | 使用示例（本文件） |

## 基本用法

### 1. 导入

```typescript
import { test, expect } from '@playwright/test';
import { DASHBOARD, NAV, APARTMENTS } from './testids';
import { navigateTo, waitForDialogOpen, createUniqueName } from './test-helpers';
```

### 2. 使用 testids 定位元素

```typescript
// ✅ 推荐：使用 data-testid
await page.getByTestId(DASHBOARD.HEADING).toBeVisible();

// ❌ 不推荐：使用文案
await page.getByRole('heading', { name: '首页' }).toBeVisible();
```

### 3. 使用辅助工具

```typescript
// 导航到页面
await navigateTo(page, '/dashboard');

// 等待弹窗
const dialog = await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);

// 创建唯一名称
const name = createUniqueName('测试公寓');

// 安全点击（元素不存在不报错）
await safeClick(page.getByTestId('some-btn'));
```

## 前端添加 data-testid

### 在组件中添加

```tsx
// 示例：页面标题
<h1 className="text-3xl font-bold" data-testid="dashboard-heading">
  首页
</h1>

// 示例：按钮
<button data-testid="apartments-new-btn">新增公寓</button>

// 示例：输入框
<input
  type="text"
  placeholder="请输入公寓名称"
  data-testid="apartments-name-input"
/>

// 示例：链接
<Link href="/apartments" data-testid="nav-apartments">
  公寓管理
</Link>

// 示例：列表
<div data-testid="apartments-list">
  {apartments.map(apt => (
    <div key={apt.id} data-testid={`apartment-${apt.id}`}>
      {apt.name}
    </div>
  ))}
</div>

// 示例：弹窗
<Dialog data-testid="apartments-create-dialog">
  <DialogHeader>
    <DialogTitle>新增公寓</DialogTitle>
  </DialogHeader>
  ...
</Dialog>
```

### 动态 testid

```tsx
// 列表项使用动态 testid
{apartments.map(apt => (
  <div key={apt.id} data-testid={`apartment-${apt.id}`}>
    {apt.name}
  </div>
))}

// 测试中使用
const apartmentCard = page.getByTestId(`apartment-${apartmentId}`);
await expect(apartmentCard).toBeVisible();
```

## 测试用例示例

### 示例 1: 页面导航

```typescript
test('从首页可进入公寓管理', async ({ page }) => {
  // 使用 testid 定位导航链接
  await page.getByTestId(NAV.DASHBOARD).click();
  await page.getByTestId(NAV.APARTMENTS).click();

  // 验证 URL
  await expect(page).toHaveURL(/\/apartments$/);

  // 使用 testid 验证页面标题
  await expect(page.getByTestId(APARTMENTS.HEADING)).toBeVisible();
});
```

### 示例 2: 表单操作

```typescript
test('创建新公寓', async ({ page }) => {
  await navigateTo(page, '/apartments');

  // 点击新增按钮
  await page.getByTestId(APARTMENTS.NEW_BUTTON).click();

  // 等待弹窗打开
  const dialog = await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);

  // 填写表单
  await page.getByTestId(APARTMENTS.NAME_INPUT).fill(createUniqueName('测试公寓'));
  await page.getByTestId(APARTMENTS.ADDRESS_INPUT).fill('测试地址');

  // 提交
  await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();

  // 等待弹窗关闭
  await waitForDialogClosed(page);
});
```

### 示例 3: 列表操作

```typescript
test('查看公寓列表', async ({ page }) => {
  await navigateTo(page, '/apartments');

  // 等待列表或空状态
  const { hasList, hasEmpty } = await waitForListOrEmpty(
    page,
    APARTMENTS.LIST,
    APARTMENTS.EMPTY_STATE
  );

  // 任一条件满足即通过
  expect(hasList || hasEmpty).toBe(true);
});
```

### 示例 4: 编辑操作

```typescript
test('编辑公寓', async ({ page }) => {
  await navigateTo(page, '/apartments');

  // 点击更多操作菜单
  await page.getByTestId(APARTMENTS.MORE_MENU).click();

  // 点击编辑按钮
  await page.getByTestId(APARTMENTS.EDIT_BUTTON).click();

  // 等待编辑弹窗
  await waitForDialogOpen(page, APARTMENTS.EDIT_DIALOG);

  // 修改名称
  const newName = createUniqueName('编辑后的公寓');
  await page.getByTestId(APARTMENTS.NAME_INPUT).fill(newName);

  // 保存
  await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();

  // 等待弹窗关闭
  await waitForDialogClosed(page);
});
```

### 示例 5: 删除操作

```typescript
test('删除公寓', async ({ page }) => {
  await navigateTo(page, '/apartments');

  // 点击更多操作菜单
  await page.getByTestId(APARTMENTS.MORE_MENU).click();

  // 点击删除按钮
  await page.getByTestId(APARTMENTS.DELETE_BUTTON).click();

  // 等待确认删除弹窗
  await waitForDialogOpen(page, APARTMENTS.DELETE_CONFIRM_DIALOG);

  // 确认删除
  await page.getByTestId(COMMON.CONFIRM_BUTTON).click();

  // 等待弹窗关闭
  await waitForDialogClosed(page);

  // 验证删除成功
  await expect(page.getByTestId(APARTMENTS.EMPTY_STATE)).toBeVisible();
});
```

### 示例 6: 筛选和搜索

```typescript
test('搜索公寓', async ({ page }) => {
  await navigateTo(page, '/apartments');

  // 输入搜索关键词
  await page.getByTestId(APARTMENTS.SEARCH_INPUT).fill('测试');

  // 等待结果更新
  await page.waitForTimeout(500);

  // 验证列表有内容
  const list = page.getByTestId(APARTMENTS.LIST);
  await expect(list).toBeVisible();
});
```

### 示例 7: 完整业务流程

```typescript
test('完整业务流程：公寓 -> 房间 -> 租客 -> 租约', async ({ page }) => {
  const timestamp = Date.now();

  // 1. 创建公寓
  await navigateTo(page, '/apartments');
  await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
  await waitForDialogOpen(page, APARTMENTS.CREATE_DIALOG);

  const apartmentName = `流程公寓_${timestamp}`;
  await page.getByTestId(APARTMENTS.NAME_INPUT).fill(apartmentName);
  await page.getByTestId(APARTMENTS.ADDRESS_INPUT).fill('测试地址');
  await page.getByTestId(APARTMENTS.CONFIRM_BUTTON).click();
  await waitForDialogClosed(page);

  // 2. 添加房间
  await page.getByTestId(APARTMENTS.MORE_MENU).click();
  await page.getByTestId('apartments-rooms-btn').click(); // 需要添加
  await page.getByTestId(ROOMS.NEW_BUTTON).click();
  await waitForDialogOpen(page, ROOMS.CREATE_DIALOG);

  const roomNumber = `101_${timestamp}`;
  await page.getByTestId(ROOMS.NUMBER_INPUT).fill(roomNumber);
  await page.getByTestId(ROOMS.MONTHLY_RENT_INPUT).fill('2000');
  await page.getByTestId('rooms-create-confirm-btn').click(); // 需要添加
  await waitForDialogClosed(page);

  // 3. 创建租客
  await page.getByTestId(NAV.TENANTS).click();
  await page.getByTestId(TENANTS.NEW_BUTTON).click();
  await waitForDialogOpen(page, TENANTS.CREATE_DIALOG);

  const tenantName = `流程租客_${timestamp}`;
  await page.getByTestId(TENANTS.NAME_INPUT).fill(tenantName);
  await page.getByTestId(TENANTS.PHONE_INPUT).fill(createUniquePhone());
  await page.getByTestId('tenants-create-confirm-btn').click(); // 需要添加
  await waitForDialogClosed(page);

  // 4. 创建租约
  await page.getByTestId(NAV.LEASES).click();
  await page.getByTestId(LEASES.NEW_BUTTON).click();
  await waitForDialogOpen(page, LEASES.CREATE_DIALOG);

  await page.getByTestId(LEASES.APARTMENT_SELECT).selectOption(apartmentName);
  await page.getByTestId(LEASES.ROOM_SELECT).selectOption(roomNumber);
  await page.getByTestId(LEASES.TENANT_SELECT).selectOption(tenantName);
  await page.getByTestId(LEASES.START_DATE_INPUT).fill('2026-03-01');
  await page.getByTestId(LEASES.MONTHLY_RENT_INPUT).fill('2000');
  await page.getByTestId(LEASES.DEPOSIT_INPUT).fill('2000');
  await page.getByTestId(LEASES.CONFIRM_BUTTON).click();
  await waitForDialogClosed(page);
});
```

## 逐步迁移计划

### 阶段 1: 新测试使用 testid
- 新编写的测试用例全部使用 `data-testid`
- 使用 `testids.ts` 中的常量

### 阶段 2: 高频测试优先改造
- 业务端侧栏导航测试
- 公寓管理核心测试
- 租约管理核心测试

### 阶段 3: 全面迁移
- 逐步将所有测试用例迁移到使用 `data-testid`
- 清理旧的文案定位器

### 阶段 4: 前端补充 testid
- 为缺少 testid 的组件补充
- 建立代码审查规范，要求新组件添加 testid

## 最佳实践

### 1. 命名约定
- 使用 kebab-case: `dashboard-heading`
- 遵循层级: `page-section-element`
- 功能相关: `action-object-verb` 如 `apartments-delete-btn`

### 2. 何时使用 testid
- ✅ 页面标题、导航链接
- ✅ 表单输入、按钮
- ✅ 列表容器、空状态
- ✅ 弹窗对话框
- ✅ 关键操作元素

### 3. 何时不需要 testid
- ❌ 纯展示的装饰元素
- ❌ 临时提示消息（已有其他定位方式）
- ❌ 非关键操作的次要元素

### 4. 与现有定位器混合使用
```typescript
// 关键元素使用 testid
await page.getByTestId(APARTMENTS.NEW_BUTTON).click();

// 通用元素使用 role
await page.getByRole('textbox').fill('...');

// 表单标签使用 label
await page.getByLabel('公寓名称').fill('...');
```

## 故障排查

### 问题 1: 测试找不到元素
```typescript
// ❌ 错误
await page.getByTestId('wrong-id').click();

// ✅ 正确：检查 testids.ts 中的定义
await page.getByTestId(APARTMENTS.NEW_BUTTON).click();
```

### 问题 2: 前端没添加 testid
检查前端代码是否添加了对应的 `data-testid` 属性：
```tsx
// ❌ 缺少
<h1>首页</h1>

// ✅ 正确
<h1 data-testid="dashboard-heading">首页</h1>
```

### 问题 3: 动态元素
对于动态生成的元素（如列表项），使用动态 testid：
```tsx
{items.map(item => (
  <div key={item.id} data-testid={`item-${item.id}`}>
    {item.name}
  </div>
))}

// 测试中
const item = page.getByTestId(`item-${itemId}`);
```

## 参考资源

- [Playwright Test Locators](https://playwright.dev/docs/locators)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
