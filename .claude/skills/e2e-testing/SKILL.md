# E2E 测试实践指导

本项目的 E2E 测试实践指导，基于 Playwright 框架。结合通用 Playwright 最佳实践和项目特定规范使用。

## 核心原则

### 禁止使用 test.skip()

**规则**：测试用例**绝对不允许**使用 `test.skip()` 跳过逻辑。

**原因**：
- 跳过测试会掩盖系统问题
- 无法判断测试是否真正验证了功能
- CI 中跳过的测试不会被计入失败，导致假阳性

```typescript
// ❌ 禁止
test('编辑公寓', async ({ page }) => {
  const apartment = await findApartment();
  if (!apartment) {
    test.skip();  // 禁止！
    return;
  }
});

// ✅ 正确：让测试失败
test('编辑公寓', async ({ page }) => {
  const apartment = await findApartment();
  expect(apartment).toBeTruthy();
});
```

### 禁止硬编码等待

**规则**：禁止使用 `page.waitForTimeout()` 硬编码等待时间。

**原因**：
- 硬编码等待导致测试不稳定
- 等待时间过短会导致偶发失败
- 等待时间过长会拖慢测试速度

```typescript
// ❌ 禁止
await page.waitForTimeout(2000);
await page.click('#submit');

// ✅ 正确：使用 Playwright 自动等待
await page.click('#submit');
await page.waitForSelector('.success-message');

// ✅ 正确：使用基于状态的断言
await expect(page.locator('.status')).toHaveText('完成');
```

### 数据隔离

**规则**：每个测试用例必须创建自己独立的测试数据，使用 `try/finally` 确保清理。

```typescript
test('测试用例', async ({ page, request }) => {
  const generator = await createTestDataGenerator(request);

  try {
    // 1. 准备：创建独立测试数据
    const { apartment, tenant, lease } = await generator.createFullTestEnvironment();

    // 2. 执行：测试操作
    await goToBills(page);

    // 3. 验证：断言结果
    await expect(page.locator('.status')).toHaveText('成功');
  } finally {
    // 4. 清理：无论成功失败都清理
    await generator.cleanup();
  }
});
```

## 选择器策略

### 优先级顺序

```typescript
// 1. ✅ 最佳：基于角色（可访问性、稳定性）
page.getByRole('button', { name: '提交' })
page.getByRole('textbox', { name: '邮箱' })
page.getByRole('link', { name: '注册' })

// 2. ✅ 良好：用户可见文本
page.getByLabel('邮箱地址')
page.getByPlaceholder('请输入邮箱')
page.getByText('欢迎回来')

// 3. ✅ 良好：TestID（稳定、明确）
page.getByTestId('submit-button')

// 4. ⚠️ 避免：CSS 选择器（脆弱）
page.locator('.btn-primary')

// 5. ❌ 禁止：XPath（极度脆弱）
page.locator('//div[@class="container"]/button[1]')
```

### 项目 TestID 规范

使用 `e2e/testids.ts` 中的常量，命名格式：`page-section-element`

```typescript
import { APARTMENTS } from '../testids';

await page.click(`[data-testid="${APARTMENTS.NEW_BUTTON}"]`);
await page.fill(`[data-testid="${APARTMENTS.NAME_INPUT}"]`, '测试公寓');
```

## 测试数据管理

### TestDataGenerator

位置：`e2e/helpers/test-data.ts`

```typescript
import { createTestDataGenerator } from '../helpers/test-data';

const generator = await createTestDataGenerator(request);
```

### 可用方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `createApartmentWithRooms(count)` | 创建公寓和房间 | `{ id, name, rooms[] }` |
| `createTenant(name?)` | 创建租客 | `{ id, name }` |
| `createLease(roomId, tenantId)` | 创建租约 | `{ id }` |
| `terminateLease(leaseId)` | 终止租约 | `void` |
| `createFeeType(name?)` | 创建费用类型 | `{ id, name }` |
| `createBill(leaseId, options?)` | 创建账单 | `{ id }` |
| `createFullTestEnvironment()` | 创建公寓+租客+租约 | `{ apartment, tenant, lease }` |
| `cleanup()` | 清理所有资源 | - |

### 唯一性保证

数据前缀使用 `时间戳 + 随机数` 确保并行测试唯一性：

```typescript
// 格式: E2E_1709123456789_abc123
const timestamp = Date.now();
const random = Math.random().toString(36).substring(2, 8);
return `E2E_${timestamp}_${random}`;
```

## 认证模式

### 方式一：手动登录

```typescript
import { login, logout } from '../helpers/auth';

await login(page);  // 使用默认测试账号
await login(page, '13900000001', 'password');  // 自定义账号
await logout(page);
```

### 方式二：Fixtures 自动登录（推荐）

```typescript
import { test, expect } from '../fixtures';

test('需要登录的测试', async ({ authenticatedPage }) => {
  // authenticatedPage 已经是登录状态
  await authenticatedPage.goto('/dashboard');
});

// 获取认证状态
test('使用认证状态', async ({ authState }) => {
  console.log(authState.accessToken);
  console.log(authState.organizationId);
});
```

### 测试账号配置

通过环境变量配置，避免硬编码：

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `E2E_TEST_PHONE` | 租户端手机号 | 13800138000 |
| `E2E_TEST_PASSWORD` | 租户端密码 | Test1234 |
| `E2E_PLATFORM_ADMIN_USERNAME` | 运营端用户名 | e2e_admin |
| `E2E_PLATFORM_ADMIN_PASSWORD` | 运营端密码 | admin123 |

## 辅助函数

### 导航

```typescript
import { goToApartments, goToBills, goToRooms } from '../helpers/navigation';

await goToApartments(page);
await goToBills(page);

// 房间列表搜索（触发 API 重新获取）
await searchRoomInList(page, 'R1234');
```

### UI 操作

```typescript
import {
  waitForLoadingToDisappear,
  waitForSuccess,
  clickConfirm,
  search,
  waitForTableData,
  getTableRowCount,
} from '../helpers/ui';

await waitForLoadingToDisappear(page);
await waitForSuccess(page);
await clickConfirm(page);
await search(page, '关键词');
await waitForTableData(page, 'apartments-list');
const count = await getTableRowCount(page, 'apartments-list');
```

### API 调用

```typescript
import { ApiHelper, apiLogin, createApiHelper } from '../helpers/api';

// 登录获取 token
const { accessToken } = await apiLogin(request, phone, password);

// 创建 API 实例
const api = createApiHelper(request);
api.setToken(accessToken);
api.setOrgId('org-xxx');

// 发起请求
const apartments = await api.get('/api/v1/apartments');
const newApartment = await api.post('/api/v1/apartments', { name: '测试' });
await api.delete(`/api/v1/apartments/${id}`);
```

## 测试命名规范

- **文件名**：`*.spec.ts`
- **测试组**：使用中文描述功能模块
- **测试用例**：使用中文描述具体场景

```typescript
test.describe('公寓管理', () => {
  test('成功创建公寓', async ({ page }) => { /* ... */ });
  test('创建公寓时名称不能为空', async ({ page }) => { /* ... */ });
  test('删除有房间的公寓应该失败', async ({ page }) => { /* ... */ });
});

test.describe('账单管理', () => {
  test.describe('生成账单', () => {
    test('成功生成月度账单', async ({ page }) => { /* ... */ });
  });

  test.describe('登记付款', () => {
    test('成功登记全额付款', async ({ page }) => { /* ... */ });
  });
});
```

## 最佳实践与反模式

### ✅ 最佳实践

1. **使用 data-testid 选择器**：避免依赖 CSS 类名或 DOM 结构
2. **使用 try/finally 清理数据**：确保测试后环境干净
3. **创建独立测试数据**：每个测试自己创建所需数据
4. **使用语义化断言**：`expect(locator).toBeVisible()` 而非 `expect(await locator.count()).toBe(1)`
5. **合理使用 fixtures**：复用登录状态，减少重复代码

### ❌ 反模式

1. **硬编码等待**：`page.waitForTimeout(2000)`
2. **依赖其他测试的数据**：测试间不应有依赖关系
3. **使用 test.skip()**：应该修复测试而非跳过
4. **硬编码选择器**：`page.locator('.css-class')`
5. **共享测试状态**：每个测试必须独立

## 测试清单

编写或审查 E2E 测试时检查：

- [ ] 没有使用 `test.skip()`
- [ ] 每个测试创建独立的测试数据
- [ ] 使用 `try/finally` 确保数据清理
- [ ] 测试数据使用唯一标识符（支持并行）
- [ ] 使用 `data-testid` 而非 CSS 选择器
- [ ] 没有硬编码的 `waitForTimeout`
- [ ] 测试命名清晰，使用中文
- [ ] 断言充分，验证关键行为
- [ ] 使用 fixtures 复用登录状态
- [ ] API 调用使用 ApiHelper 而非裸 request
