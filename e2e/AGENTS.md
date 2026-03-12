# E2E 测试规范

本文档定义了 Apartment Ultra 项目的 E2E 测试编写规范和最佳实践。编写E2E测试必须遵守这个文档；

## 核心原则

### 1. 禁止使用 test.skip()

**规则**：测试用例**绝对不允许**使用 `test.skip()` 跳过逻辑。

**原因**：
- 跳过测试会掩盖系统问题
- 无法判断测试是否真正验证了功能
- CI 中跳过的测试不会被计入失败，导致假阳性

**错误示例**：
```typescript
// ❌ 禁止这样做
test('编辑公寓', async ({ page }) => {
  const apartment = await findApartment();
  if (!apartment) {
    test.skip();  // 禁止！
    return;
  }
  // ...
});
```

**正确做法**：
```typescript
// ✅ 如果找不到元素，让测试失败
test('编辑公寓', async ({ page }) => {
  const apartment = await findApartment();
  expect(apartment).toBeTruthy();  // 找不到则失败
  // ...
});
```

### 2. 每个测试创建独立数据

**规则**：每个测试用例必须创建自己独立的测试数据，不依赖其他测试或预置数据。

**原因**：
- 保证测试隔离性
- 支持并行执行
- 避免测试间相互影响

**实现方式**：使用 `TestDataGenerator` 类：

```typescript
test('成功编辑房间信息', async ({ page, request }) => {
  await login(page);

  // 创建独立的测试数据
  const generator = await createTestDataGenerator(request);
  const apartment = await generator.createApartmentWithRooms(1);

  try {
    // 执行测试...
    const room = apartment.rooms[0];
    // ...
  } finally {
    // 清理数据
    await generator.cleanup();
  }
});
```

### 3. 使用 try/finally 清理数据

**规则**：所有创建测试数据的测试必须使用 `try/finally` 确保数据清理。

**原因**：
- 防止测试数据堆积
- 保持测试环境干净
- 避免影响后续测试

**模式**：
```typescript
test('测试用例', async ({ page, request }) => {
  const generator = await createTestDataGenerator(request);

  try {
    // 创建数据
    const data = await generator.createXxx();

    // 执行测试
    // ...
  } finally {
    // 无论成功失败都清理
    await generator.cleanup();
  }
});
```

## 测试数据生成器

### TestDataGenerator 类

位置：`e2e/helpers/test-data.ts`

#### 创建实例

```typescript
import { createTestDataGenerator } from '../helpers/test-data';

const generator = await createTestDataGenerator(request);
```

#### 可用方法

| 方法 | 说明 | 返回值 |
|------|------|--------|
| `createApartmentWithRooms(count)` | 创建公寓和指定数量的房间 | `{ id, name, rooms[] }` |
| `createTenant(name?)` | 创建租客 | `{ id, name }` |
| `createLease(roomId, tenantId)` | 创建租约 | `{ id }` |
| `createFeeType(name?)` | 创建费用类型 | `{ id, name }` |
| `createBill(leaseId, options?)` | 创建账单 | `{ id }` |
| `createFullTestEnvironment()` | 创建完整测试环境（公寓+租客+租约） | `{ apartment, tenant, lease }` |
| `cleanup()` | 清理所有创建的资源 | - |

#### 完整测试环境

对于需要租约的测试（账单、付款等），使用 `createFullTestEnvironment()`：

```typescript
const { apartment, tenant, lease } = await generator.createFullTestEnvironment();
```

## 并行测试支持

### 唯一性保证

测试数据生成器使用 `时间戳 + 随机数` 确保并行测试时的唯一性：

```typescript
// 数据前缀格式: E2E_1709123456789_abc123
const timestamp = Date.now();
const random = Math.random().toString(36).substring(2, 8);
return `E2E_${timestamp}_${random}`;
```

### 配置

`playwright.config.ts` 已配置：
- `fullyParallel: true` - 完全并行模式
- CI 环境 `workers: 1` - 限制并发避免资源问题

### 运行并行测试

```bash
# 本地并行运行（默认使用 CPU 核心数）
pnpm test:e2e

# 指定 workers 数量
pnpm test:e2e --workers=4
```

## 测试结构规范

### 文件组织

```
e2e/
├── helpers/           # 辅助工具
│   ├── test-data.ts   # 测试数据生成器
│   ├── api.ts         # API 辅助函数
│   └── auth.ts        # 登录辅助函数
├── fixtures/          # 测试固件
│   └── index.ts       # Playwright fixtures
├── apartments/        # 公寓模块测试
├── rooms/             # 房间模块测试
├── tenants/           # 租客模块测试
├── leases/            # 租约模块测试
├── bills/             # 账单模块测试
└── settings/          # 设置模块测试
```

### 测试命名

- 文件名：`*.spec.ts`
- 测试组：使用中文描述功能模块
- 测试用例：使用中文描述具体场景

```typescript
test.describe('公寓管理', () => {
  test('成功创建公寓', async ({ page }) => { /* ... */ });
  test('创建公寓时名称不能为空', async ({ page }) => { /* ... */ });
  test('删除有房间的公寓应该失败', async ({ page }) => { /* ... */ });
});
```

### Data-testid 规范

使用常量管理 `data-testid`，避免硬编码：

```typescript
// e2e/helpers/selectors.ts
export const APARTMENTS = {
  LIST: 'apartments-list',
  ADD_BUTTON: 'apartments-add-button',
  FORM: 'apartment-form',
  // ...
};

// 测试中使用
import { APARTMENTS } from '../helpers/selectors';

await page.click(`[data-testid="${APARTMENTS.ADD_BUTTON}"]`);
```

## 常见问题处理

### 元素不存在时

**错误做法**：跳过测试
```typescript
if (!await element.isVisible()) {
  test.skip();
}
```

**正确做法**：断言替代元素或让测试失败
```typescript
// 方案1：断言应该存在的父元素
await expect(page.locator('[data-testid="list-container"]')).toBeVisible();

// 方案2：如果元素必须存在，直接断言
await expect(element).toBeVisible();
```

### 等待策略

优先使用 Playwright 的自动等待，避免硬编码等待：

```typescript
// ❌ 避免
await page.waitForTimeout(2000);

// ✅ 推荐
await expect(element).toBeVisible();
await element.click();
```

### 处理异步操作

```typescript
// 等待 API 响应
const responsePromise = page.waitForResponse('**/api/v1/apartments');
await button.click();
const response = await responsePromise;
expect(response.status()).toBe(200);
```

## 测试清单

编写或审查 E2E 测试时，检查以下项：

- [ ] 没有使用 `test.skip()`
- [ ] 每个测试创建独立的测试数据
- [ ] 使用 `try/finally` 确保数据清理
- [ ] 测试数据使用唯一标识符（支持并行）
- [ ] 使用 `data-testid` 而非 CSS 选择器
- [ ] 没有硬编码的 `waitForTimeout`
- [ ] 测试命名清晰，使用中文
- [ ] 断言充分，验证关键行为
