# AGENTS.md — Apartment Ultra 项目总览

> 本文档面向 AI Coding Agent。如果你对该项目一无所知，请从本文件开始阅读。
> 修改具体子目录代码前，**必须先阅读对应目录下的 `AGENTS.md`**：
> - [`api/AGENTS.md`](./api/AGENTS.md)
> - [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
> - [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

---

## 1. 项目概况

**Apartment Ultra** 是一个多租户公寓管理系统，采用 pnpm workspace 管理的 monorepo 结构。

核心业务能力：
- 房源、公寓、房间、租客、租约管理
- 账单、水电和报表
- 平台运营、服务定价、商店配置与订阅能力

原始业务背景保留在 [`docs/原始需求.md`](./docs/原始需求.md)，它是历史输入，不一定逐项等于当前实现。

---

## 2. 技术栈

### 2.1 包管理与构建

- **包管理器**: pnpm 9+ (workspace)
- **Node 版本**: >= 18（CI 使用 Node 20，Docker 使用 node:20-alpine）
- **TypeScript**: ^5（strict mode）
- **pnpm catalog**: 在 `pnpm-workspace.yaml` 中统一管理常用依赖版本
- **pnpm overrides**: 在根 `package.json` 中强制统一 React、Vite、axios、zod 等版本

### 2.2 后端 (`api/`)

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

### 2.3 租客端前端 (`tenant-web/`)

技术栈明细、分层架构、构建命令与测试规范见 [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)。

### 2.4 运营后台前端 (`admin-web/`)

技术栈明细、分层架构、构建命令与测试规范见 [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)。

### 2.5 共享包

| 包名 | 路径 | 说明 |
|------|------|------|
| `@apartment-ultra/api-contract` | `packages/api-contract/` | 纯类型包：前后端共享的 TypeScript 类型和 Zod schema。按领域模块拆分，支持子路径导出 `./schemas` |
| `@apartment-ultra/web-api-client` | `packages/web-api-client/` | Axios 封装：统一响应解包、错误处理（`ApiError`）、token 自动刷新、`x-org-id` header 自动注入。与 `react-hook-form` 集成：`setFormErrors` |

---

## 3. 仓库结构

```
apartment-ultra/
├── api/                        # 后端 API (Node/Express/TypeScript)
│   ├── src/
│   │   ├── index.ts            # Express 应用入口
│   │   ├── config.ts           # 环境配置
│   │   ├── constants/          # 常量
│   │   ├── errors/             # 错误基类和领域错误
│   │   ├── lib/                # Prisma Client, Redis, schemas
│   │   ├── middlewares/        # 认证、授权、限流、响应包装、错误处理
│   │   ├── migrations/         # 数据迁移脚本（TS）
│   │   ├── observability/      # OpenTelemetry 初始化
│   │   ├── repositories/       # 数据仓库层（封装 Prisma 查询）
│   │   ├── routes/v1/          # API 路由（Controller）
│   │   ├── scheduler/          # 定时任务
│   │   ├── services/           # 业务逻辑层
│   │   ├── startup/            # 数据库连接检查和 schema 校验
│   │   ├── test/               # 测试工具（setup.ts, controllerHelper.ts）
│   │   ├── types/              # 类型定义
│   │   └── utils/              # 工具函数
│   ├── prisma/schema.prisma    # 数据库 Schema
│   └── Dockerfile
├── tenant-web/                 # 租客端前端 (Vite + React)
│   ├── src/
│   │   ├── api/                # Axios 客户端 + 按模块 API 方法
│   │   ├── components/         # 公共组件、布局、主题
│   │   ├── constants/          # 静态配置、枚举
│   │   ├── contexts/           # AuthContext, BrandConfigContext
│   │   ├── hooks/              # 业务 hooks
│   │   ├── i18n/               # 国际化
│   │   ├── pages/              # 按业务模块组织的页面
│   │   ├── routes/             # React Router 配置
│   │   ├── styles/             # 全局 CSS
│   │   ├── test/               # 测试 setup
│   │   ├── types/              # 类型定义
│   │   └── utils/              # 纯工具函数
│   └── Dockerfile
├── admin-web/                  # 运营后台前端 (Vite + React)
│   ├── src/
│   │   ├── api/                # API 客户端（含 admin-client.ts）
│   │   ├── components/
│   │   ├── constants/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── i18n/
│   │   ├── pages/              # 运营后台页面
│   │   ├── router/             # 路由配置
│   │   ├── schemas/            # 表单类型和校验（业务层）
│   │   ├── styles/
│   │   ├── types/
│   │   └── utils/
│   └── Dockerfile
├── packages/
│   ├── api-contract/           # 共享 API 类型与 Zod schema
│   └── web-api-client/         # 前端 API 客户端封装
├── docker/                     # Docker Compose、Nginx 配置、环境文件模板
│   ├── docker-compose.yaml             # 生产编排
│   ├── docker-compose.middleware.yaml  # 本地 Postgres + Redis
│   ├── docker-compose.observability.yaml # 可观测性（叠加使用）
│   └── nginx.conf.template
├── docs/                       # 设计文档、规范、流程图
├── .github/workflows/          # CI/CD
│   ├── ci.yml                  # Lint、类型检查、测试、Docker 构建推送
│   └── deploy.yml              # SSH 部署（workflow_dispatch）
├── package.json                # 根 package.json，定义 workspace scripts
├── pnpm-workspace.yaml         # Workspace 定义 + pnpm catalog
├── tsconfig.base.json          # 根 TS 基础配置
├── tsconfig.react-package.json # React 包共享 TS 配置
└── .prettierrc                 # Prettier 配置
```

---

## 4. 构建与测试命令

### 4.1 根目录常用命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev:api      # PORT=8000, api 开发模式 (tsx watch)
pnpm dev:web      # tenant-web 开发模式 (vite)
pnpm dev:admin    # admin-web 开发模式 (vite)

# Docker 本地中间件（Postgres 15 + Redis 7，暴露 5432/6379）
pnpm docker:middleware

# 生产环境 Docker Compose
pnpm docker:prod

# 代码质量
pnpm build        # 全量构建 (pnpm -r run build)
pnpm lint         # 后端 + 两个前端 lint
pnpm format       # Prettier 格式化
pnpm type-check   # 全量类型检查（含 Prisma generate）
pnpm test         # 全量测试
```

### 4.2 后端 (`api/`)

后端详细的构建命令、分层约定、路由规范和测试策略见 [`api/AGENTS.md`](./api/AGENTS.md)。

### 4.3 前端 (`tenant-web/` / `admin-web/`)

前端项目各自的构建命令与测试规范见：
- [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

### 4.4 共享包

```bash
# api-contract
pnpm build        # tsc (dist/)
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

后端分层（Controller → Service → Repository → Prisma）的详细约定见 [`api/AGENTS.md`](./api/AGENTS.md)。

### 6.2 前端分层（四层架构，ESLint 强制）

前端各项目分层约定的详细说明见：
- [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

---

## 7. 测试策略

### 7.1 后端 (`api/`)

后端测试框架、setup 和测试分布的详细说明见 [`api/AGENTS.md`](./api/AGENTS.md)。

### 7.2 前端 (`tenant-web/` / `admin-web/`)

前端测试框架、setup 和测试分布的详细说明见：
- [`tenant-web/AGENTS.md`](./tenant-web/AGENTS.md)
- [`admin-web/AGENTS.md`](./admin-web/AGENTS.md)

---

## 8. 部署与运维

### 8.1 Docker 多阶段构建

- `api/Dockerfile`、`tenant-web/Dockerfile`、`admin-web/Dockerfile` 均使用 `node:20-alpine`
- 构建上下文为 monorepo 根目录
- 前端生产环境使用 `serve` 提供静态文件服务

### 8.2 生产编排 (`docker/docker-compose.yaml`)

| 服务 | 镜像 | 端口/说明 | 内存限制 |
|------|------|-----------|----------|
| postgres | `postgres:15-alpine` | 5432 | 1G |
| redis | `redis:7-alpine` | 6379 (AOF 持久化) | - |
| api | apartment-ultra-api | 8000 | 1G |
| tenant-web | apartment-ultra-tenant-web | 3000 | 512M |
| admin-web | apartment-ultra-admin-web | 8080 | 512M |
| nginx | `nginx:alpine` | 80 (统一入口，反向代理) | - |

### 8.3 CI/CD (`.github/workflows/`)

**ci.yml**:
- 变更检测（`dorny/paths-filter`）：按 `api`, `tenant_web`, `admin_web`, `mobile`, `docker` 分别触发
- `api` job: lint → type-check → prisma generate/db push（使用 Postgres 15 service）
- `tenant-web` / `admin-web` job: lint → type-check → build
- `mobile` job: type-check only
- `docker` job: push 到 main 时构建并推送镜像到 GHCR

**deploy.yml**:
- `workflow_dispatch` 手动触发，支持 `production` / `staging`
- SSH 到服务器执行 `docker compose pull && up -d` + health check

---

## 9. 安全与敏感信息

- JWT 使用 HS256，密钥通过环境变量 `SECRET_KEY` 注入
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
