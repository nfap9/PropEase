# Apartment Ultra

多租户 SaaS 公寓/房产管理系统，为管理多个租赁房产的房东设计，支持订阅购买、运营后台、服务定价与微信支付。

## 功能特性

### 业务端（租户/二房东）

- 公寓管理、房间管理、公用费用配置
- 租客管理、租约管理（创建/续约/终止）
- 水电记录、账单管理（自动生成、PDF/Excel 导出）
- 报表分析、多用户协作、事务提醒
- 订阅与支付（套餐购买、微信支付）

### 运营后台（平台方）

- 运营账号与角色管理
- 组织管理、服务定价、商店配置、订阅管理
- 运营分析（平台概览）

## 技术栈

| 层级 | 技术 |
|------|------|
| Web | Next.js 14, shadcn/ui, Tailwind CSS, TypeScript |
| API | Node.js + Express + TypeScript |
| 数据库 | PostgreSQL, Prisma |
| 认证 | JWT |
| 包管理 | pnpm (pnpm workspaces monorepo) |

## 快速开始

### 环境要求

- Docker & Docker Compose（中间件与可选全栈运行）
- Node.js 18+（本地开发）
- [pnpm](https://pnpm.io/)

### 本地开发

```bash
# 1. 启动 Docker 中间件（PostgreSQL, Redis）
cd docker && docker compose -f docker-compose.middleware.yaml up -d

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

### 服务器部署

详见 [docker/README.md](docker/README.md)

## 访问地址

| 服务 | 地址 |
|------|------|
| 租客端 Web | http://localhost:3000 |
| 运营后台 | http://localhost:3001 |
| API 文档 | http://localhost:8000/docs |

## 测试账号

**业务端**：需自行注册，或设置 `SEED_E2E_USER=true` 启动 API 创建测试用户（手机号 `13800138000`，密码 `Test1234`）

**运营后台**：用户名 `admin`，密码 `Admin@123456`（启动时自动创建）

## 更多文档

- [文档总览](docs/README.md) - 按作用组织的项目文档导航
- [Issue 使用规范](docs/issue-management.md) - GitHub Issue 的标题、模板与拆分规则
- [后端 API 文档](api/AGENTS.md) - 后端架构与开发指南
- [运营后台文档](admin-web/AGENTS.md) - 运营后台开发说明
- [租客端文档](tenant-web/AGENTS.md) - 租客端前端开发说明
- [E2E 测试指南](e2e/AGENTS.md) - E2E 测试编写规范
- [Docker 部署](docker/README.md) - 生产环境部署配置
- [API 契约文档](docs/api-contract/README.md) - 契约与接口说明
- [命名规范](docs/naming-conventions.md) - 前后端与测试统一命名约定

## License

MIT
