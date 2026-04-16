# API 开发指南

Node/TypeScript 后端（Express），为项目当前唯一运行后端。


## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express
- **语言**: TypeScript (ESM)
- **ORM**: Prisma（PostgreSQL）
- **校验**: Zod
- **认证**: JWT (HS256)；密码 bcrypt
- **测试**: Vitest
- **Lint**: ESLint + TypeScript ESLint

## 代码风格

### 命名规范

- 请求/响应字段、路径与查询参数：**snake_case**
- 目录：**kebab-case**（如 `lease-fee-items/`）
- 类型/接口：**PascalCase**（如 `LeaseFormData`）
- 常量：**UPPER_CASE**

### 导入顺序

1. Node 内置模块
2. 第三方包
3. 内部包（workspace 包）
4. 相对导入（`./`, `../`）

### ESLint 规则

- `@typescript-eslint/no-explicit-any`: error（禁止 `any`）
- `@typescript-eslint/no-unused-vars`: error（未使用变量报错，`_` 前缀忽略）
- 测试文件（`*.test.ts`）：以上规则关闭

### 格式化

- 使用 Prettier
- 两个空格缩进，单引号，trailing comma


## 响应契约

- 成功：`{ code: 0, data, message }`
- 错误：`{ code, message, data?: { errors?: [{ field, message }] } }`
- 不包装：`/health`、`/docs`、`/openapi.json`、`/api/v1/webhooks` 前缀


## 分层约定

### services/（业务逻辑层）

- 业务规则、权限/状态校验、错误语义与流程编排
- **禁止**在 service 内直接写 Prisma 查询
- 通过 `createXxxRepository(prisma)` 或 `defaultXxxRepo` 注入依赖

### repositories/（数据仓库层）

- 封装 Prisma 读写
- 单元测试优先 mock repository，不 mock Prisma Client

### 事务处理

- 使用 `prisma.$transaction(async (tx) => ...)`
- 事务内用 `createXxxRepository(tx)` 组装仓储
- 避免在 service 中混用事务对象和裸 Prisma 查询

---

## API 路由编写规范

```typescript
// routes/v1/apartments.ts
import { Router } from 'express';
import { z } from 'zod';
import { apartmentService } from '@/services/apartment';
import { validateBody, validateQuery } from '@/middlewares/validation';
import { asyncHandler } from '@/middlewares/error';

const router = Router();

const createSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

router.post('/', validateBody(createSchema), asyncHandler(async (req, res) => {
  const result = await apartmentService.create(req.body);
  res.success(result);
}));

export default router;
```

---

## 数据库

- 使用 PostgreSQL，表结构以 `prisma/schema.prisma` 为准
