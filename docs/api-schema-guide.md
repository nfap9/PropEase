# API Schema 管理规范

## 当前架构

API Schema 管理采用**双轨制**：

| 文件 | 用途 | 维护方式 |
|------|------|----------|
| `api/src/lib/schemas.ts` | Zod schemas（运行时验证） | 集中管理 |
| `api/src/swagger.ts` | OpenAPI schemas（API 文档） | 手动同步 |

## 理想目标

单一数据源：Zod schema → 自动生成 OpenAPI schema

**障碍**：`zod-to-openapi` 0.2.1 与当前 Zod 版本不兼容

## 当前迁移状态

| 模块 | 运行时 Schema | 文档 Schema |
|------|---------------|-------------|
| Bills | ✅ lib/schemas.ts | ✅ swagger.ts |
| 其他模块 | ❌ 分散在各自 controller | ❌ 待完善 |

## 添加新路由的 Schema 规范

### 1. 运行时 Schema（lib/schemas.ts）

```typescript
import { z } from 'zod';

export const YourEntitySchema = z.object({
  field1: z.string().min(1, '错误提示'),
  field2: z.number().optional(),
});

// Query/Request schemas
export const YourEntityQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  // ... 其他查询参数
});
```

### 2. OpenAPI Schema（swagger.ts）

在 `schemaDefinitions` 中添加对应的 OpenAPI 定义：

```typescript
const schemaDefinitions = {
  // ...
  YourEntity: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      field1: { type: 'string', description: '字段说明' },
      field2: { type: 'number' },
    },
  },
  YourEntityQuery: {
    type: 'object',
    properties: {
      page: { type: 'integer', default: 1 },
      pageSize: { type: 'integer', default: 20 },
    },
  },
};
```

### 3. 路由文档（your-route.ts）

使用 JSDoc 添加 OpenAPI 注释：

```typescript
/**
 * @openapi
 * /your-entity:
 *   post:
 *     summary: 创建实体
 *     tags: [模块名]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/YourEntity'
 *     responses:
 *       201:
 *         description: 创建成功
 */
router.post('/', controller.create);
```

## 迁移检查清单

将现有 controller 中的 schema 迁移到 lib/schemas.ts 时：

- [ ] 将 `export const XxxSchema = z.object({...})` 移到 lib/schemas.ts
- [ ] 在 swagger.ts 中添加对应的 OpenAPI 定义
- [ ] 更新 controller 的 import 语句
- [ ] 确保验证逻辑不变

## 参考示例

查看 `bills.ts` 和 `bills.controller.ts` 作为完整示例：
- 完整的 OpenAPI JSDoc 注释
- lib/schemas.ts 中的 Zod schemas
- swagger.ts 中的 OpenAPI schemas
