# Apartment Ultra

多租户 SaaS 公寓管理系统，为管理多个租赁房产的房东设计。

## 技术栈

| 层级 | 技术 |
|------|------|
| 租客端 / 运营后台 | React 18, Vite 6, antd 6, Tailwind CSS 3.4, TypeScript |
| 后端 API | Node.js + Express + TypeScript + Prisma |
| 数据库 | PostgreSQL 15, Redis 7 |
| 认证 | JWT (HS256) |
| 部署 | Docker, Nginx |
| 包管理 | pnpm 9+ (workspace monorepo) |

## 项目结构

```
apartment-ultra/
├── api/                     # 后端 API (Node/Express/TypeScript)
├── tenant-web/              # 租客端前端 (Vite + React)
├── admin-web/               # 运营后台前端 (Vite + React)
├── packages/
│   ├── api-contract/        # 前后端共享类型与 Zod schema
│   ├── web-api-client/      # Axios API 客户端封装
│   └── web-shared/          # 前端共享组件与工具
├── docker/                  # Docker Compose 与 Nginx 配置
├── docs/                    # 设计文档与规范
└── scripts/                 # 运维脚本
```

## 快速开始

### 环境要求

- Docker & Docker Compose
- Node.js 18+（推荐 Node 20）
- pnpm 9+

### 本地开发

```bash
# 1. 启动 Docker 中间件（PostgreSQL, Redis）
pnpm docker:middleware

# 2. 安装依赖
pnpm install

# 3. 同步数据库 Schema
pnpm --filter apartment-ultra-api exec prisma db push

# 4. 启动后端（端口 8000）
pnpm dev:api

# 5. 启动租客端（端口 3000，另开终端）
pnpm dev:web

# 6. 启动运营后台（端口 3001，另开终端）
pnpm dev:admin
```

### 生产环境 Docker

```bash
# 启动全套生产服务（Postgres + Redis + API + 前端 + Nginx）
pnpm docker:prod
```

## 访问地址

| 服务 | 地址 |
|------|------|
| 统一入口（Nginx） | http://localhost |
| 租客端 Web | http://localhost/tenant |
| 运营后台 | http://localhost/admin |
| API | http://localhost/api/v1 |
| API 文档 | http://localhost/api-docs |

## 代码质量

```bash
pnpm build        # 全量构建
pnpm lint         # 后端 + 前端 lint
pnpm type-check   # 全量类型检查
pnpm test         # 全量测试
```

## 文档

| 文档 | 说明 |
|------|------|
| [AGENTS.md](AGENTS.md) | AI Coding Agent 项目总览与规范 |
| [STANDARDS.md](STANDARDS.md) | 前端 antd 组件使用规范 |
| [docs/entity-spec.md](docs/entity-spec.md) | 实体设计规范 |
| [docs/business-flow.md](docs/business-flow.md) | 核心业务流程 |
| [docker/README.md](docker/README.md) | 生产环境部署配置 |
