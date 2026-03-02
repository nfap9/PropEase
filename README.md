# Apartment Ultra

多租户 SaaS 公寓/房产管理系统，为管理多个租赁房产的房东设计，支持免费与付费套餐、运营后台与微信支付订阅。

## 功能特性

### 业务端（租户/二房东）

- 🏢 **公寓管理** - 管理多个公寓楼和房间，公用费用配置（水电单价、网费、管理费）
- 👥 **租客管理** - 租客信息、合同管理
- 📋 **租约管理** - 租约创建、续约、终止
- 💧 **水电记录** - 水电表读数追踪
- 💰 **账单管理** - 自动生成账单，支持 PDF/Excel 导出与支付记录
- 📊 **报表分析** - 收入统计、入住率分析
- 👨‍💼 **多用户协作** - 团队成员权限与自定义角色（管理员、财务、运营）
- 📬 **事务提醒** - 租约到期、账单逾期等通知
- 📦 **订阅与支付** - 套餐选择（免费/专业/企业）、微信扫码支付购买与续费

### 运营后台（平台方）

- 🔐 **独立登录** - 运营账号与业务端分离，JWT type=admin
- 👤 **运营人员** - 账号与角色管理、密码重置
- 🏛️ **组织管理** - 组织列表、详情、启用/停用
- 📋 **套餐配置** - 订阅套餐 CRUD
- 📑 **订阅管理** - 全平台订阅列表、手动续期/取消
- 📈 **运营分析** - 平台概览（组织数、用户数、公寓/房间数、活跃订阅数）

## 技术栈

| 层级 | 技术 |
|------|------|
| Web | Next.js 14, shadcn/ui, Tailwind CSS, TypeScript |
| API | Node.js + Express + TypeScript（**api/**，项目运行与调试均使用此后端） |
| 数据库 | PostgreSQL, Prisma |
| 认证 | JWT |
| 包管理 | pnpm (Node.js)，**标准 monorepo**（根目录单一 lockfile，`pnpm install` 在根执行） |

> **说明**：仓库为 pnpm workspaces monorepo（`api`、`web` 为子包）。

## 快速开始

### 环境要求

- Docker & Docker Compose（中间件与可选全栈运行）
- Node.js 18+（本地开发后端与前端）
- [pnpm](https://pnpm.io/) - Node.js 包管理器

### 方式一：本地（pnpm + Docker 中间件）

```bash
# 1. 一键设置开发环境（Docker 中间件 + 根目录 pnpm 安装 + api/前端配置）
pnpm run dev-setup

# 2. 启动开发服务（任选其一）
pnpm run dev:api    # 终端 1：启动后端（api，端口 8000）
pnpm run dev:web    # 终端 2：启动前端
# 或一键启动：pnpm run dev:local  # 后端后台 + 前端前台；停后端用 pnpm run dev-local-stop
```

### 方式二：Docker

```bash
# 开发环境（全部服务在容器内，后端为 api，支持热重载）
cd docker && docker compose -f docker-compose.dev.yaml up

# 生产/联调
cd docker && docker compose -f docker-compose.yaml up
```

## 访问地址

| 服务 | 地址 |
|------|------|
| Web（业务端） | http://localhost:3000 |
| 运营后台 | http://localhost:3000/admin |
| API 文档 (Swagger) | http://localhost:8000/docs |
| API 文档 (ReDoc) | http://localhost:8000/redoc |

## 项目结构

```
apartment-ultra/
├── package.json            # 根 package（scripts：dev-setup / dev:api / dev:web / docker:* / lint / type-check / test）
├── pnpm-workspace.yaml     # pnpm workspaces（api、web）
├── pnpm-lock.yaml          # 单一锁文件（仅在根目录执行 pnpm install）
├── scripts/                # 开发脚本（dev-setup、dev-local 等）
├── docker/                 # Docker 配置（构建上下文为仓库根）
├── docs/                   # 文档与计划（含商业化功能计划）
├── api/                    # 后端（Node/Express/TypeScript）
│   ├── src/                # 源码（路由、中间件、服务等）
│   └── prisma/             # Prisma schema 与迁移
└── web/                    # Next.js 前端
    └── src/
        ├── app/            # App Router（业务端 + /admin 运营后台）
        ├── components/     # React 组件
        └── lib/            # 工具库与 API 客户端
```

## 常用命令

```bash
# 依赖安装（在仓库根目录执行一次即可）
pnpm install

# 开发（后端为 api）
pnpm run dev:api     # 启动后端（端口 8000）
pnpm run dev:web     # 启动前端
pnpm run dev:local   # 一键启动后端 + 前端（停后端：pnpm run dev-local-stop）

# 代码质量（api + 前端）
pnpm run format      # 格式化 api
pnpm run lint        # api + 前端检查
pnpm run type-check  # 类型检查
pnpm run test        # 运行单元测试（api + web）
pnpm run test:e2e    # E2E 测试（需先启动 API 与前端，见下方 E2E 说明）

# 数据库（Prisma）
cd api && pnpm exec prisma db push   # 以 schema 同步数据库

# Docker
pnpm run docker:up   # 启动容器
pnpm run docker:down  # 停止容器
```

## 测试账号

**业务端（公寓管理系统）**：无种子脚本时需在登录页自行注册。若启动 API 时设置 `SEED_E2E_USER=true`，将自动创建 E2E 测试用户：手机号 `13800138000`、密码 `Test1234`，供 E2E 用例「密码登录」使用。

**E2E 测试**：运行 `pnpm run test:e2e` 前需先启动 API（端口 8000）与前端（端口 3000），如 `pnpm run dev:local`。若需「密码登录」用例通过，请以 `SEED_E2E_USER=true` 启动 API 一次以创建上述测试用户。**首次运行或升级 Playwright 后**须执行 `pnpm exec playwright install`（或 `pnpm exec playwright install chromium`）安装浏览器，否则 E2E 会报「Executable doesn't exist」。

**运营后台（应用启动时自动种子）**

| 字段 | 值 |
|------|------|
| 用户名 | admin |
| 密码 | Admin@123456 |

## API 概览

详细 API 文档请参阅 [docs/API.md](docs/API.md) 或访问 http://localhost:8000/docs

### 业务端认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册（手机号） |
| POST | `/api/v1/auth/login` | 用户登录 |
| POST | `/api/v1/auth/refresh` | 刷新 Token |
| GET | `/api/v1/auth/me` | 获取当前用户 |

### 核心业务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/v1/apartments` | 公寓管理 |
| GET/POST | `/api/v1/tenants` | 租客管理 |
| GET/POST | `/api/v1/leases` | 租约管理 |
| POST | `/api/v1/utilities` | 水电读数 |
| GET/POST | `/api/v1/bills/...` | 账单与支付记录 |
| GET | `/api/v1/organizations/{id}/usage` | 组织使用量与套餐限制 |
| GET/POST | `/api/v1/subscriptions/...` | 套餐列表、订阅、支付订单 |
| GET/POST | `/api/v1/notifications` | 通知列表与已读 |
| GET/POST | `/api/v1/custom-roles/orgs/{id}/roles` | 自定义角色 |

### 运营后台（需 Admin Token）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/admin/auth/login` | 运营登录 |
| GET/POST/PUT/DELETE | `/api/v1/admin/users` | 运营账号 |
| GET/POST/PUT/DELETE | `/api/v1/admin/roles` | 运营角色 |
| GET/GET/PATCH | `/api/v1/admin/organizations` | 组织列表、详情、启用/停用 |
| GET/POST/PUT/DELETE | `/api/v1/admin/plans` | 套餐配置 |
| GET/GET/POST/POST | `/api/v1/admin/subscriptions` | 订阅列表、详情、续期、取消 |
| GET | `/api/v1/admin/stats` | 平台统计 |

### 支付回调（无需认证，微信验签）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/webhooks/wechat-pay` | 微信支付结果通知 |

## 用户角色

### 业务端（组织内）

| 角色 | 权限 |
|------|------|
| owner | 完全访问、账单管理、订阅与支付、团队设置 |
| admin | 完全访问 |
| member | 读写操作 |
| viewer | 只读访问 |

组织可创建**自定义角色**（如管理员、财务、运营）并配置细粒度权限。

### 运营后台

- 独立账号体系，与业务端用户分离；支持多角色与权限配置，默认种子超级管理员（admin）。

### 账号与登录范围

- **运营账号**：仅能登录**管理后台**（运营后台），用于组织、套餐、订阅等平台管理。
- **注册账号**：仅能登录**公寓管理系统**（业务端），用于公寓、租客、租约、账单等业务操作。两套账号互不通用，登录入口与 Token 相互独立。

## 订阅与支付

- **套餐**：免费版 / 专业版 / 企业版（见种子数据或运营后台配置）。
- **业务端**：设置 → 订阅管理 选择套餐；免费套餐直接开通，付费套餐创建订单后跳转微信扫码支付页，支付成功后自动开通/续费/升级。
- **微信支付**：需配置 `WECHAT_PAY_*` 环境变量并开启 `WECHAT_PAY_ENABLED`；未配置时仍可创建订单，前端提示“未配置支付”。回调地址：`{WECHAT_PAY_NOTIFY_URL_BASE}/api/v1/webhooks/wechat-pay`。

## 文档与计划

- [商业化功能实现计划](docs/plans/commercial-features-plan.md)：P0～P3 阶段（公用费用、免费限制、订阅、账单自动生成、个人团队、团队删除、事务提醒、自定义角色、运营后台、支付集成）已完成。

## License

MIT
