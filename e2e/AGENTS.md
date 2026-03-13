# E2E 测试规范

本文档定义 Apartment Ultra 项目的 E2E 测试编写规范。编写测试前请阅读此文档。

## 核心原则

| 原则 | 说明 |
|------|------|
| 禁止 `test.skip()` | 让测试失败而非跳过 |
| 禁止 `waitForTimeout()` | 使用 Playwright 自动等待或状态断言 |
| 每个测试独立数据 | 使用 `TestDataGenerator` 创建 |
| 必须清理数据 | 使用 `try/finally` 确保清理 |

## 目录结构

```
e2e/
├── helpers/           # 辅助工具
│   ├── test-data.ts   # 测试数据生成器
│   ├── api.ts         # API 辅助类
│   ├── auth.ts        # 认证辅助函数
│   ├── navigation.ts  # 导航辅助函数
│   └── ui.ts          # UI 操作辅助函数
├── fixtures.ts        # Playwright fixtures（自动登录）
├── testids.ts         # data-testid 常量
├── apartments/        # 公寓模块测试
├── rooms/             # 房间模块测试
├── tenants/           # 租客模块测试
├── leases/            # 租约模块测试
├── bills/             # 账单模块测试
├── settings/          # 设置模块测试
├── subscription/      # 订阅模块测试
├── organization/      # 组织管理测试
├── permissions/       # 权限管理测试
├── utilities/         # 水电录入测试
├── auth/              # 认证测试
└── admin/             # 运营端测试
```

## 测试数据生成器

```typescript
import { createTestDataGenerator } from '../helpers/test-data';

test('测试用例', async ({ page, request }) => {
  const generator = await createTestDataGenerator(request);

  try {
    // 创建测试数据
    const { apartment, tenant, lease } = await generator.createFullTestEnvironment();
    const bill = await generator.createBill(lease.id, { rent_amount: 2000 });

    // 执行测试...
  } finally {
    await generator.cleanup();  // 必须清理
  }
});
```

### 可用方法

| 方法 | 说明 |
|------|------|
| `createApartmentWithRooms(count)` | 创建公寓和房间 |
| `createTenant(name?)` | 创建租客 |
| `createLease(roomId, tenantId)` | 创建租约 |
| `terminateLease(leaseId)` | 终止租约 |
| `createFeeType(name?)` | 创建费用类型 |
| `createBill(leaseId, options?)` | 创建账单 |
| `createFullTestEnvironment()` | 创建公寓+租客+租约 |
| `cleanup()` | 清理所有资源 |

## 认证与 Fixtures

```typescript
// 方式一：手动登录
import { login } from '../helpers/auth';
await login(page);

// 方式二：使用 fixtures 自动登录（推荐）
import { test, expect } from '../fixtures';

test('测试', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/dashboard');
});
```

### 测试账号

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `E2E_TEST_PHONE` | 租户端手机号 | 13800138000 |
| `E2E_TEST_PASSWORD` | 租户端密码 | Test1234 |
| `E2E_PLATFORM_ADMIN_USERNAME` | 运营端用户名 | e2e_admin |
| `E2E_PLATFORM_ADMIN_PASSWORD` | 运营端密码 | admin123 |

## TestID 规范

使用 `testids.ts` 中的常量，避免硬编码：

```typescript
import { APARTMENTS } from '../testids';

await page.click(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`);
```

命名格式：`page-section-element`（如 `apartments-new-btn`）

## 辅助函数

```typescript
// 导航
import { goToApartments, goToBills } from '../helpers/navigation';
await goToApartments(page);

// UI 操作
import { waitForSuccess, clickConfirm, search } from '../helpers/ui';
await waitForSuccess(page);
await clickConfirm(page);
await search(page, '关键词');

// API 调用
import { ApiHelper, apiLogin } from '../helpers/api';
const { accessToken } = await apiLogin(request, phone, password);
const api = createApiHelper(request);
api.setToken(accessToken);
const data = await api.get('/api/v1/apartments');
```

## 测试命名

使用中文，文件名 `*.spec.ts`：

```typescript
test.describe('公寓管理', () => {
  test('成功创建公寓', async ({ page }) => { /* ... */ });
  test('创建公寓时名称不能为空', async ({ page }) => { /* ... */ });
});
```
