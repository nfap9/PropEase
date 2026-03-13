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
  - `messages.ts`：错误消息定义
  - `swagger.ts`：OpenAPI 文档配置
  - `lib/`：Prisma 单例等基础库
  - `constants/`：权限默认值等常量定义
  - `errors/`：领域特定异常处理
  - `middlewares/`：响应包装、错误处理、认证、权限校验
  - `observability/`：可观测性相关
  - `repositories/`：数据仓库层，封装数据库操作
  - `routes/`：API 路由
    - `health.ts`：健康检查
    - `v1/`：版本 1 API（auth、organizations、apartments、tenants、leases、utilities、bills、reports、permissions、subscriptions、notifications、customRoles、admin、webhooks、config、fee-types、usage）
  - `scheduler/`：定时任务（通知检查、月度账单生成）
  - `services/`：业务逻辑层
  - `startup/`：启动时检查（数据库连接检查）
  - `types/`：TypeScript 类型定义
  - `utils/`：工具函数（security、jwt、context、appError、orgContext、audit、billExports、subscriptionProration 等）

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

- 使用 PostgreSQL；表结构以 `prisma/schema.prisma` 为准，在 api 目录执行 `pnpm exec prisma db push` 同步。