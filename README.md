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
| API | FastAPI (Python) |
| 数据库 | PostgreSQL, SQLAlchemy 2.0 |
| 认证 | JWT |
| 包管理 | uv (Python), pnpm (Node.js) |

## 快速开始

### 环境要求

- Docker & Docker Compose
- Python 3.11-3.12 (本地开发)
- Node.js 18+ (本地开发)
- [uv](https://docs.astral.sh/uv/) - Python 包管理器
- [pnpm](https://pnpm.io/) - Node.js 包管理器

### 方式一：Makefile（推荐）

```bash
# 1. 一键设置开发环境
make dev-setup

# 2. 启动 API (终端1)
make dev-api

# 3. 启动 Web (终端2)
make dev-web
```

### 方式二：Docker

```bash
# 开发环境
cd docker && docker compose -f docker-compose.dev.yaml up

# 生产环境
cd docker && docker compose -f docker-compose.yaml up
```

### 方式三：手动设置

```bash
# 1. 启动中间件
cd docker
cp middleware.env.example middleware.env
docker compose -f docker-compose.middleware.yaml up -d

# 2. 设置 API
cd ../api
cp .env.example .env
uv sync --dev
uv run alembic upgrade head
uv run uvicorn app.main:app --reload

# 3. 设置 Web (新终端)
cd ../web
cp .env.example .env.local
pnpm install
pnpm dev
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
├── Makefile                # 开发命令入口
├── dev/                    # 开发脚本
├── docker/                 # Docker 配置
├── docs/                   # 文档与计划（含商业化功能计划）
├── api/                    # FastAPI 后端
│   ├── app/
│   │   ├── controllers/    # API 控制器（console / admin / webhooks）
│   │   ├── services/       # 业务逻辑
│   │   ├── repositories/   # 数据访问
│   │   ├── models/         # ORM 模型
│   │   ├── schemas/        # Pydantic 模型
│   │   └── scheduler/      # 定时任务（账单生成、通知检查）
│   ├── migrations/         # 数据库迁移
│   └── tests/              # 测试
└── web/                    # Next.js 前端
    └── src/
        ├── app/            # App Router（业务端 + /admin 运营后台）
        ├── components/     # React 组件
        └── lib/            # 工具库与 API 客户端
```

## 常用命令

```bash
# 开发
make dev-api         # 启动 API
make dev-web         # 启动 Web

# 代码质量
make format          # 格式化代码
make lint            # 修复代码问题
make test            # 运行测试

# 数据库
make migrate         # 运行迁移
make migrate-create  # 创建迁移
make db-reset        # 重置数据库

# 测试数据
make db-reset-demo   # 重置数据库并生成演示数据
make db-seed-demo    # 生成演示数据（不重置）

# Docker
make docker-up       # 启动容器
make docker-down     # 停止容器
```

## 测试数据

项目提供测试数据种子脚本，方便开发和演示。

### 快速生成演示数据

```bash
# 方式一：重置数据库并生成完整演示数据（推荐）
make db-reset-demo

# 方式二：在现有数据库上生成演示数据
make db-seed-demo

# 方式三：仅创建管理员用户
make db-reset-seed
```

### 演示数据内容

运行 `seed_demo.py` 后将生成：

| 数据 | 数量 | 说明 |
|------|------|------|
| 组织 | 1 | 阳光公寓管理公司 |
| 公寓 | 3 | 含不同户型 |
| 房间 | 25 | 约 60% 入住率 |
| 租客 | 20 | 随机中文姓名和联系方式 |
| 租约 | 15 | 有效租约 |
| 水电读数 | 45 | 近 3 个月数据 |
| 账单 | 45 | 含支付记录 |

### 测试账号

**业务端（演示数据 `make db-reset-demo` 后）**

| 字段 | 值 |
|------|------|
| 手机号 | 13800000001 |
| 密码 | Admin123456 |

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

## 订阅与支付

- **套餐**：免费版 / 专业版 / 企业版（见种子数据或运营后台配置）。
- **业务端**：设置 → 订阅管理 选择套餐；免费套餐直接开通，付费套餐创建订单后跳转微信扫码支付页，支付成功后自动开通/续费/升级。
- **微信支付**：需配置 `WECHAT_PAY_*` 环境变量并开启 `WECHAT_PAY_ENABLED`；未配置时仍可创建订单，前端提示“未配置支付”。回调地址：`{WECHAT_PAY_NOTIFY_URL_BASE}/api/v1/webhooks/wechat-pay`。

## 文档与计划

- [商业化功能实现计划](docs/plans/commercial-features-plan.md)：P0～P3 阶段（公用费用、免费限制、订阅、账单自动生成、个人团队、团队删除、事务提醒、自定义角色、运营后台、支付集成）已完成。

## License

MIT
