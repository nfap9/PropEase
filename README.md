# Apartment Ultra

多租户 SaaS 公寓管理系统，为管理多个租赁房产的房东设计。

## 技术栈

| 层级 | 技术 |
|------|------|
| Web | React 18, Vite, antd, Tailwind CSS, TypeScript |
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

# 7. 启动移动端原型（Expo，另开终端，可选）
pnpm dev:mobile
```

### Docker 三种运行方式

项目当前支持三套明确模式：

```bash
# 1. 中间件模式：只启 PostgreSQL / Redis，业务服务跑宿主机
pnpm docker:middleware

# 2. 开发模式：API + tenant-web + admin-web 全部容器内热更新
pnpm docker:dev

# 3. 生产式本地验证：使用生产 compose 在本机完整拉起
pnpm docker:prod:local
```

如开发态首次依赖卷异常，可执行：

```bash
pnpm docker:dev:reset
pnpm docker:dev
```

### 服务器部署

详见 [docker/README.md](docker/README.md)

## 访问地址

| 服务 | 地址 |
|------|------|
| 租客端 Web | http://localhost:3000 |
| 运营后台 | http://localhost:3001 |
| API 文档 | http://localhost:8000/docs |

## 更多文档

- [文档总览](docs/README.md) - 按作用组织的项目文档导航
- [Docker 部署](docker/README.md) - 生产环境部署配置
- [API 契约文档](docs/api-contract/README.md) - 契约与接口说明