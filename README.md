# Apartment Ultra

多租户 SaaS 公寓/房产管理系统，为管理多个租赁房产的房东设计。

## 功能特性

- 🏢 **公寓管理** - 管理多个公寓楼和房间
- 👥 **租客管理** - 租客信息、合同管理
- 📋 **租约管理** - 租约创建、续约、终止
- 💧 **水电记录** - 水电表读数追踪
- 💰 **账单管理** - 自动生成账单，支持 PDF/Excel 导出
- 📊 **报表分析** - 收入统计、入住率分析
- 👨‍💼 **多用户协作** - 团队成员权限管理

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
| Web | http://localhost:3000 |
| API 文档 (Swagger) | http://localhost:8000/docs |
| API 文档 (ReDoc) | http://localhost:8000/redoc |

## 项目结构

```
apartment-ultra/
├── Makefile                # 开发命令入口
├── dev/                    # 开发脚本
├── docker/                 # Docker 配置
├── api/                    # FastAPI 后端
│   ├── app/
│   │   ├── controllers/    # API 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── repositories/   # 数据访问
│   │   ├── models/         # ORM 模型
│   │   └── schemas/        # Pydantic 模型
│   ├── migrations/         # 数据库迁移
│   └── tests/              # 测试
└── web/                    # Next.js 前端
    └── src/
        ├── app/            # App Router 页面
        ├── components/     # React 组件
        └── lib/            # 工具库
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

# Docker
make docker-up       # 启动容器
make docker-down     # 停止容器
```

## API 概览

详细 API 文档请参阅 [docs/API.md](docs/API.md) 或访问 http://localhost:8000/docs

### 认证

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 |
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
| POST | `/api/v1/bills/generate` | 生成账单 |

## 用户角色

| 角色 | 权限 |
|------|------|
| owner | 完全访问 + 账单管理 |
| admin | 完全访问 |
| member | 读写操作 |
| viewer | 只读访问 |

## License

MIT
