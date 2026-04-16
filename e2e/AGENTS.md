# E2E 测试规范

本文档定义 Apartment Ultra 项目的 E2E 测试编写规范。编写测试前请阅读此文档。

## 文档职责

- 本文件负责“E2E 测试如何编写”。
- 业务场景来源优先参考 `docs/测试用例/`。
- 测试产物目录 `e2e/results/` 为生成文件，不应视为长期文档。

## 核心原则

| 原则 | 说明 |
|------|------|
| 禁止 `test.skip()` | 让测试失败而非跳过 |
| 禁止 `waitForTimeout()` | 使用 Playwright 自动等待或状态断言 |
| 每个测试独立数据 | 使用 `TestDataGenerator` 创建 |
| 必须清理数据 | 使用 `try/finally` 确保清理 |


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
