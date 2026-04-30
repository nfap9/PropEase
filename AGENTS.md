# AGENTS.md — PropEase 项目总览

> 本文档面向 AI Coding Agent。如果你对该项目一无所知，请从本文件开始阅读。
> 修改具体子目录代码前，**必须先阅读对应目录下的 `AGENTS.md`**：
> - [`api/AGENTS.md`](./api/AGENTS.md)
> - [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
> - [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

---

## 1. 项目概况

**PropEase** 是一个多租户公寓管理系统，采用 pnpm workspace 管理的 monorepo 结构。

核心业务能力：
- 房源、公寓、房间、租客、租约管理
- 账单、水电和报表
- 平台运营、服务定价、商店配置与订阅能力

原始业务背景保留在 [`docs/原始需求.md`](./docs/原始需求.md)，它是历史输入，不一定逐项等于当前实现。

---

## 2. 技术栈

### 2.1 包管理与构建

- **包管理器**: pnpm 9+ (workspace)
- **Node 版本**: >= 18（Docker 使用 node:20-alpine）
- **TypeScript**: ^5（strict mode）
- **pnpm catalog**: 在 `pnpm-workspace.yaml` 中统一管理 35+ 常用依赖版本
- **pnpm overrides**: 在根 `package.json` 中强制统一 React、Vite、axios、zod、react-router-dom、@tanstack/react-query 等版本
- **onlyBuiltDependencies**: `pnpm-workspace.yaml` 中显式允许 `prisma`、`@prisma/client`、`@prisma/engines`、`esbuild` 的 post-install 脚本（pnpm 10+ 要求）

### 2.2 后端 (`api/`)

| 类别 | 技术 |
|------|------|
| 运行时 | Node.js 18+ (ESM, `"type": "module"`) |
| 框架 | Express 4 |
| ORM | Prisma 7.4.2 + PostgreSQL (`pg` adapter, `@prisma/adapter-pg`) |
| 缓存 | Redis (ioredis) |
| 校验 | Zod |
| 认证 | JWT (HS256), bcryptjs |
| 日志 | Pino + pino-pretty |
| API 文档 | Swagger-jsdoc + Swagger-ui-express |
| 定时任务 | node-cron |
| 可观测性 | OpenTelemetry (OTLP-gRPC, Express/HTTP/Prisma 自动埋点) |
| 其他 | pdf-lib, exceljs, ulid, zod-to-openapi |

### 2.3 租客端前端 (`tenant-web/`)

技术栈明细、分层架构、构建命令与测试规范见 [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)。

要点：Vite 6 + React 18 + React Router DOM 7 + Ant Design 6 + Tailwind CSS 3.4 + TanStack Query 5，端口 3000，部署基路径 `/tenant/`。

### 2.4 运营后台前端 (`admin-web/`)

技术栈明细、分层架构、构建命令与测试规范见 [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)。

要点：Vite 6 + React 18 + React Router DOM 7 + Ant Design 6 + Tailwind CSS 3.4 + TanStack Query 5，端口 3001，部署基路径 `/admin/`。

### 2.5 共享包

| 包名 | 路径 | 说明 |
|------|------|------|
| `@propease/api-contract` | `packages/api-contract/` | 前后端共享的 TypeScript 类型、常量与 Zod schema。按领域模块拆分（auth、bills、apartments、permissions 等）。统一 API 响应契约 `SuccessBody<T>`、`ErrorResponseBody`、`BusinessCode`。提供权限常量 `RESOURCES`、`ACTIONS`、`toPermissionCodes()`。使用 `tsc` 编译到 `dist/`（ESM + `.d.ts`）。 |
| `@propease/web-api-client` | `packages/web-api-client/` | Axios 封装：统一响应解包、错误处理（`ApiError`）、token 自动刷新、`x-org-id` header 自动注入、401 跳转登录。与 `react-hook-form` 集成：`setFormErrors`、`extractFieldErrors`。提供三个工厂：`createApiClient`、`createBrowserApiClient`、`createAdminApiClient`。不编译到 dist，源码直接被 Vite 消费（`noEmit: true`）。 |

---

## 3. 仓库结构

```
propease/
├── api/                        # 后端 API (Node/Express/TypeScript)
│   ├── src/
│   │   ├── index.ts            # Express 应用入口（先初始化 OpenTelemetry，再挂载路由和定时任务）
│   │   ├── config.ts           # 环境配置（Zod 校验，含生产环境安全检查）
│   │   ├── constants/          # 常量
│   │   ├── errors/             # 错误基类和领域错误
│   │   ├── lib/                # Prisma Client 初始化、Redis 初始化、共享 schema
│   │   ├── middlewares/        # 认证、授权、限流、响应包装、错误处理、校验
│   │   ├── migrations/         # 数据迁移脚本（TS）
│   │   ├── observability/      # OpenTelemetry 初始化
│   │   ├── repositories/       # 数据仓库层（封装 Prisma 查询，每个仓库配 .test.ts）
│   │   ├── routes/v1/          # API 路由（Controller），含 admin/、billing/、webhooks/ 子目录
│   │   ├── scheduler/          # 定时任务（月度账单、租约变更、通知检查）
│   │   ├── services/           # 业务逻辑层（~25 个服务，多数配 .test.ts）
│   │   ├── startup/            # 数据库连接等待和 schema 校验
│   │   ├── test/               # 测试工具（setup.ts, controllerHelper.ts）
│   │   ├── types/              # 类型定义
│   │   └── utils/              # 工具函数
│   ├── prisma/schema.prisma    # 数据库 Schema（~809 行，无 PostgreSQL ENUM，ID 为 String @db.VarChar(26)）
│   └── Dockerfile              # 多阶段构建（builder → runner），构建上下文为 monorepo 根目录
├── tenant-web/                 # 租客端前端 (Vite + React)
│   ├── src/
│   │   ├── api/                # Axios 客户端 + 按模块 API 方法
│   │   ├── components/         # 公共组件（layout/、common/、theme/）
│   │   ├── constants/          # 静态配置、枚举
│   │   ├── contexts/           # AuthContext, BrandConfigContext
│   │   ├── hooks/              # 业务 hooks（四层架构中的业务层）
│   │   ├── i18n/               # 国际化
│   │   ├── pages/              # 按业务模块组织的页面（内部常分 components/、hooks/、views/）
│   │   ├── routes/             # React Router 配置（basename: /tenant/）
│   │   ├── styles/             # 全局 CSS（Tailwind directives）
│   │   ├── test/               # 测试 setup（ Vitest + jsdom）
│   │   ├── types/              # 类型定义（工具层）
│   │   └── utils/              # 纯工具函数
│   └── Dockerfile              # 三阶段构建（deps → builder → runner，serve 提供静态文件）
├── admin-web/                  # 运营后台前端 (Vite + React)
│   ├── src/
│   │   ├── api/                # API 客户端（含 admin-client.ts）
│   │   ├── components/         # 公共组件（layout/ 含 AppLayout、AppHeader、侧边栏导航）
│   │   ├── constants/          # 静态配置、枚举（含 NAV_SECTIONS 导航配置）
│   │   ├── contexts/           # AuthContext
│   │   ├── hooks/              # 业务 hooks
│   │   ├── i18n/               # 国际化
│   │   ├── pages/              # 运营后台页面（扁平结构，index.tsx 为路由入口）
│   │   ├── router/             # React Router 配置（basename: /admin/）
│   │   ├── schemas/            # 表单类型和校验（业务层，admin-web 特有）
│   │   ├── styles/             # 全局 CSS
│   │   ├── types/              # 类型定义
│   │   └── utils/              # 纯工具函数
│   └── Dockerfile              # 三阶段构建（同 tenant-web，暴露 8080）
├── packages/
│   ├── api-contract/           # 共享 API 类型与 Zod schema（tsc 编译产物在 dist/）
│   └── web-api-client/         # 前端 API 客户端封装（源码直接消费，noEmit）
├── docker/                     # Docker Compose、Nginx 配置、环境文件模板
│   ├── docker-compose.yaml             # 生产编排（Postgres + Redis + API + 2个前端构建容器 + nginx）
│   ├── docker-compose.middleware.yaml  # 本地 Postgres 15 + Redis 7（暴露 5432/6379）
│   ├── docker-compose.observability.yaml # 可观测性（叠加使用）
│   ├── Dockerfile.web          # 前端镜像构建（合并 tenant-web + admin-web）
│   └── nginx.conf.template     # 统一入口反向代理（80 端口 → /api/v1/、/tenant/、/admin/、/api-docs/）
├── docs/                       # 设计文档、规范、流程图
│   ├── antd-form-guideline.md
│   ├── bill-reversal-design.md
│   ├── business-flow.md
│   ├── discussion-backlog.md
│   ├── entity-spec.md
│   ├── layout-conventions.md
│   ├── notification-spec.md
│   └── tenant-user-guide.md

├── package.json                # 根 package.json，定义 workspace scripts 与 pnpm overrides
├── pnpm-workspace.yaml         # Workspace 定义 + pnpm catalog
├── tsconfig.base.json          # 根 TS 基础配置（strict: true）
├── tsconfig.react-package.json # React 包共享 TS 配置（moduleResolution: bundler, jsx: react-jsx）
└── .prettierrc                 # Prettier 配置（2 空格、单引号、trailingComma es5、printWidth 120）
```

---

## 4. 构建与测试命令

### 4.1 根目录常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev:api      # PORT=8000, api 开发模式 (tsx watch)
pnpm dev:web      # tenant-web 开发模式 (vite，端口 3000，代理 /api → localhost:8000)
pnpm dev:admin    # admin-web 开发模式 (vite，端口 3001)

# Docker 本地中间件（Postgres 15 + Redis 7，暴露 5432/6379）
docker compose -p propease-middleware -f docker/docker-compose.middleware.yaml --env-file docker/.env.middleware up -d

# 代码质量
pnpm build        # 全量构建 (pnpm -r run build)
pnpm lint         # 后端 + 两个前端 lint
pnpm format       # Prettier 格式化
pnpm type-check   # 全量类型检查（含 Prisma generate）
pnpm test         # 全量测试（Prisma generate → api tests → tenant-web tests → admin-web tests）
```

### 4.2 后端 (`api/`)

后端详细的构建命令、分层约定、路由规范和测试策略见 [`api/AGENTS.md`](./api/AGENTS.md)。

```bash
pnpm dev          # tsx watch src/index.ts
pnpm dev:docker   # prisma db push && prisma generate && tsx watch
pnpm build        # tsc (dist/)
pnpm start        # node dist/index.js
pnpm lint         # eslint src --ext .ts
pnpm type-check   # tsc --noEmit
pnpm test         # vitest run
pnpm db:push
pnpm db:reset
pnpm export:openapi
```

### 4.3 前端 (`tenant-web/` / `admin-web/`)

前端项目各自的构建命令与测试规范见：
- [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

```bash
pnpm dev              # vite
pnpm build            # tsc && vite build
pnpm preview          # vite preview
pnpm lint             # eslint src --ext ts,tsx
pnpm type-check       # tsc --noEmit
pnpm test             # vitest (watch)
pnpm test:run         # vitest run
pnpm test:coverage    # vitest run --coverage
```

### 4.4 共享包

```bash
# api-contract
pnpm build        # tsc (dist/，输出 .js + .d.ts + .d.ts.map)
pnpm type-check   # tsc --noEmit

# web-api-client
pnpm type-check   # tsc --noEmit
pnpm test:run     # vitest run
```

---

## 5. 代码风格与规范

### 5.1 通用命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| API 字段/参数 | snake_case | `full_name`, `organization_id` |
| 局部变量 | camelCase | `leaseId`, `isLoading` |
| 组件名 | PascalCase | `LeaseDialogs` |
| 组件/目录文件 | kebab-case | `lease-dialogs.tsx` |
| 类型/接口 | PascalCase | `LeaseFormData` |
| 常量 | UPPER_CASE | `PERMISSIONS` |

### 5.2 导入顺序

1. Node 内置模块
2. 第三方包
3. 内部包（`@/` alias 或 workspace 包）
4. 相对导入（`./`, `../`）

### 5.3 TypeScript 铁律

- **严格模式（strict mode），禁止使用 `any`**
- Props 和 API 响应必须定义类型
- 后端额外启用：`noUnusedLocals`, `noUnusedParameters`, `noImplicitReturns`
- 测试文件中以上规则关闭

### 5.4 导出规范

- **优先使用命名导出**，禁止默认导出（前端项目）

### 5.5 格式化

- Prettier：2 空格缩进、单引号、trailing comma (`es5`)、printWidth 120
- 插件：`prettier-plugin-tailwindcss`

---

## 6. 架构模式

### 6.1 后端分层（Clean-ish Architecture）

```
routes (Controller) → services (业务逻辑) → repositories (数据访问) → Prisma → PostgreSQL
```

- **Service 层禁止直接写 Prisma 查询**，必须通过 `createXxxRepository(prisma)` 注入
- **事务处理**：`prisma.$transaction(async (tx) => { ... })`，事务内使用 `createXxxRepository(tx)`
- 响应统一包装为 `{ code: 0, data, message }`，错误响应含 `code`、`message` 和可选 `fieldErrors`
- 不包装的路径：`/health`、`/api-docs`、`/openapi.json`、`/api/v1/webhooks/*`

后端分层（Controller → Service → Repository → Prisma）的详细约定见 [`api/AGENTS.md`](./api/AGENTS.md)。

### 6.2 前端分层（四层架构，ESLint 强制）

前端各项目分层约定的详细说明见：
- [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

```
视图层 (pages/ components/ routes/ 或 router/)
    ↓ 引用
业务层 (hooks/；admin-web 额外含 schemas/)
    ↓ 引用
基础设施层 (api/ contexts/ i18n/)
    ↓ 引用
工具层 (utils/ types/ constants/)
```

- 工具层禁止引用上层任何目录
- 基础设施层禁止引用业务层、视图层
- 业务层禁止引用视图层
- admin-web 的 `schemas/` 位于业务层，存放表单类型定义和纯校验函数；tenant-web 无 `schemas/` 目录，类型定义放在 `types/`（工具层）

---

## 7. 测试策略

### 7.1 后端 (`api/`)

- **框架**: Vitest 1.6.1（Node 环境）
- **Coverage**: `@vitest/coverage-v8`
- **Setup**: `api/src/test/setup.ts`
  - Mock `console.error`（非预期错误会导致测试失败）
  - 固定 `NODE_ENV=test`、`DATABASE_URL`
  - Mock 部分 Prisma Client 方法
  - Fake timers 固定为 `2024-01-01T00:00:00Z`
  - 全局变量 `testOrgId`、`testUserId`
- **测试分布**:
  - `middlewares/*.test.ts` — 中间件单元测试
  - `repositories/*.test.ts` — 仓库层测试（mock Prisma）
  - `services/*.test.ts` — 业务逻辑测试（mock repository）
  - `routes/v1/*.test.ts` — Controller 测试
  - `utils/*.test.ts` — 工具函数测试

后端测试框架、setup 和测试分布的详细说明见 [`api/AGENTS.md`](./api/AGENTS.md)。

### 7.2 前端 (`tenant-web/` / `admin-web/`)

- **框架**: Vitest 4 + jsdom + `@testing-library/react` + `@testing-library/jest-dom`
- **Coverage**: v8 provider
- **Setup**: `src/test/setup.ts`（tenant-web 已存在；admin-web 预留）
- **测试文件命名**: `.test.tsx` / `.test.ts`
- **组件测试位置**: 放在组件/源文件同目录下（如 `LeaseDialog.test.tsx`）
- 使用 Testing Library 的 `render` 和 `screen`

前端测试框架、setup 和测试分布的详细说明见：
- [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

---

## 8. 部署与运维

### 8.1 Docker 多阶段构建

- `api/Dockerfile` 使用 `node:20-alpine`
- `docker/Dockerfile.web` 使用 `node:20-alpine` 构建前端，`nginx:alpine` 输出构建产物
- **构建上下文为 monorepo 根目录**（所有 Dockerfile 通过 `COPY . /app` 引入 workspace）
- API 镜像在 runner 阶段会重新执行 `prisma generate`

### 8.2 生产编排 (`docker/docker-compose.yaml`)

| 服务 | 镜像 | 端口/说明 | 内存限制 |
|------|------|-----------|----------|
| postgres | `postgres:15-alpine` | 内部 5432 | `${POSTGRES_MEMORY:-1G}` |
| redis | `redis:7-alpine` | 内部 6379（AOF 持久化） | — |
| api | `propease-api:${API_IMAGE_TAG:-latest}` | 8000 | `${API_MEMORY:-1G}` |
| tenant-web | `propease-web:${WEB_IMAGE_TAG:-latest}` | 构建完成后退出 | — |
| admin-web | `propease-web:${WEB_IMAGE_TAG:-latest}` | 构建完成后退出 | — |
| nginx | `nginx:alpine` | `${NGINX_PORT:-80}:80`（统一入口，反向代理 + 静态文件） | — |

**前端部署流程**：tenant-web 和 admin-web 容器启动后，将构建产物通过共享卷 `web_static` 写入 `/usr/share/nginx/html/`，容器随即退出。Nginx 以只读方式挂载该卷，直接服务静态文件。

Nginx 配置 (`docker/nginx.conf.template`) 将流量分发到：
- `/api/v1/` → API 服务
- `/api-docs/`、`/openapi.json` → API 文档
- `/tenant/` → 租客端静态文件（SPA fallback）
- `/admin/` → 管理后台静态文件（SPA fallback）

---

## 9. 安全与敏感信息

- JWT 使用 HS256，密钥通过环境变量 `SECRET_KEY` 注入
- `api/src/config.ts` 在生产环境下执行安全校验：`SECRET_KEY` 必须 ≥ 32 字符且不能是开发默认值；`DATABASE_URL` 不能是 localhost；`CORS_ORIGINS` 不能为 `*`
- 密码使用 bcryptjs 哈希
- 微信支付证书和密钥通过环境变量配置，`.env` 文件已加入 `.gitignore`
- API 路由中 `/api/v1/webhooks/*` 通常为无认证回调端点，编写时需注意幂等性和签名验证

---

## 10. 语言要求

- Agent 回复使用中文
- 新增或维护的项目文档使用中文
- 用户界面文本使用中文

---

## 11. 相关文档索引

| 文档 | 说明 |
|------|------|
| [`api/AGENTS.md`](./api/AGENTS.md) | 后端 API 开发指南（分层约定、路由编写规范、数据库） |
| [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md) | 租客端开发指南（四层架构、API 客户端组织、测试规范） |
| [`admin-web/AGENTS.md`](./admin-web/AGENTS.md) | 运营后台开发指南（四层架构、pages/features 划分） |
| [`STANDARDS.md`](./STANDARDS.md) | 前端 antd 组件使用规范（Form/Modal/Table 等） |
| [`docs/entity-spec.md`](./docs/entity-spec.md) | 实体设计规范 |
| [`docs/business-flow.md`](./docs/business-flow.md) | 核心业务流程 |
| [`docs/layout-conventions.md`](./docs/layout-conventions.md) | 布局与间距规范 |
| [`docs/bill-reversal-design.md`](./docs/bill-reversal-design.md) | 账单冲正设计 |
| [`docs/notification-spec.md`](./docs/notification-spec.md) | 通知规范 |
