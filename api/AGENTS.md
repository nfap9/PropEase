# api 开发说明

Node/TypeScript 后端（Express），为项目当前唯一运行后端。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express
- **语言**: TypeScript (ESM)
- **ORM**: Prisma（PostgreSQL）
- **校验**: Zod
- **认证**: JWT (HS256)；密码 bcrypt

## 目录结构

- `src/`：源码
  - `config.ts`：环境配置
  - `constants.ts`：业务码、不包装路径
  - `index.ts`：入口，挂载中间件与路由
  - `lib/prisma.ts`：Prisma 单例
  - `middlewares/`：响应包装、错误处理、认证
  - `routes/`：health、v1（auth、organizations、apartments、tenants、leases、utilities、bills、reports、permissions、subscriptions、notifications、custom-roles、admin、webhooks）
  - `startup/`：启动时种子（admin 超级管理员）
  - `utils/`：security、jwt、context、appError、orgContext

- `prisma/schema.prisma`：数据库模型定义，由 Prisma 管理表结构。

## 响应契约

- 成功：`{ code: 0, data, message }`
- 错误：`{ code, message, data?: { errors?: [{ field, message }] } }`
- 不包装：`/health`、`/docs`、`/openapi.json`、`/api/v1/webhooks` 前缀

## 命名规范

请求/响应字段、路径与查询参数统一使用 **snake_case**，与数据库一致。详见 [docs/naming-conventions.md](../docs/naming-conventions.md)。

## 常用命令

- `pnpm install`：安装依赖
- `pnpm exec prisma generate`：生成 Prisma Client
- `pnpm dev`：开发（tsx watch，默认端口 8000，可用 PORT=8001）
- `pnpm run build`：编译
- `pnpm start`：生产运行
- `pnpm run type-check`：类型检查
- `pnpm run test`：测试

## 数据库

- 使用 PostgreSQL；迁移由 Prisma 管理，在仓库根执行 `pnpm run migrate` 或进入 api 目录执行 `pnpm exec prisma migrate deploy`。
