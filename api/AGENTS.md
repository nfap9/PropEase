# API 开发指南

> 修改 `api/` 目录下的任何代码前，**优先阅读本文件**。
> 根目录总览见 [`../AGENTS.md`](../AGENTS.md)。

Node/TypeScript 后端（Express），为项目当前唯一运行后端。

## 技术栈

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js 18+ (ESM, `"type": "module"`) |
| 框架 | Express 4 |
| ORM | Prisma 7.4 + PostgreSQL (`pg` adapter) |
| 缓存 | Redis (ioredis) |
| 校验 | Zod |
| 认证 | JWT (HS256), bcryptjs |
| 日志 | Pino + pino-pretty |
| API 文档 | Swagger-jsdoc + Swagger-ui-express |
| 定时任务 | node-cron |
| 可观测性 | OpenTelemetry (OTLP-gRPC, Express/HTTP/Prisma 自动埋点) |
| 其他 | pdf-lib, exceljs, ulid, zod-to-openapi |

## 构建与测试命令

```bash
pnpm dev          # tsx watch src/index.ts
pnpm dev:docker   # prisma db push + generate + tsx watch
pnpm build        # tsc (dist/)
pnpm start        # node dist/index.js
pnpm lint         # eslint src --ext .ts
pnpm type-check   # tsc --noEmit
pnpm test         # vitest run
pnpm prisma:generate
pnpm db:push
pnpm db:reset
pnpm export:openapi
```

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
- 不包装：`/health`、`/docs`、`/openapi.json`、`/api/v1/webhooks/*` 前缀

## 分层约定（Clean-ish Architecture）

```
routes (Controller) → services (业务逻辑) → repositories (数据访问) → Prisma → PostgreSQL
```

- **Service 层禁止直接写 Prisma 查询**，必须通过 `createXxxRepository(prisma)` 注入
- **事务处理**：`prisma.$transaction(async (tx) => { ... })`，事务内使用 `createXxxRepository(tx)`

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

## 测试策略

- **框架**: Vitest 1.6.1（Node 环境）
- **Coverage**: `@vitest/coverage-v8`
- **Setup**: `api/src/test/setup.ts`
  - Mock `console.error`
  - Stub `NODE_ENV=test`, `DATABASE_URL`
  - Mock Prisma Client（仅 mock 部分模型方法）
  - Fake timers 固定为 `2024-01-01T00:00:00Z`
  - 全局变量 `testOrgId`, `testUserId`
- **测试分布**:
  - `middlewares/*.test.ts` — 中间件单元测试
  - `repositories/*.test.ts` — 仓库层测试（mock Prisma）
  - `services/*.test.ts` — 业务逻辑测试（mock repository）
  - `routes/v1/*.test.ts` — Controller 测试
  - `utils/*.test.ts` — 工具函数测试

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

## 数据库

- 使用 PostgreSQL，表结构以 `prisma/schema.prisma` 为准
