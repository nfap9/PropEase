# Apartment Ultra 部署文档

## 概览

本目录提供 Apartment Ultra 的 Docker Compose 配置、环境变量模板与部署辅助文档。

当前项目包含 3 个主要服务镜像：

| 服务 | 镜像名称 | 说明 |
|------|------|------|
| API | `apartment-ultra-api` | 后端 API 服务 |
| 租客端 | `apartment-ultra-tenant-web` | 租客端前端 |
| 运营后台 | `apartment-ultra-admin-web` | 运营后台前端 |

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- 可选：`pnpm`，用于本地联调与脚本执行

## 安装部署流程

### 一、服务器环境准备

1. **安装 Docker 和 Docker Compose**
   ```bash
   # Ubuntu
   curl -fsSL https://get.docker.com | sh
   sudo systemctl enable docker
   sudo systemctl start docker

   # 安装 Docker Compose
   sudo apt-get install docker-compose
   ```

2. **开放必要端口**

   | 端口 | 服务 | 说明 |
   |------|------|------|
   | 80/443 | Nginx | HTTP/HTTPS 入口 |
   | 8000 | API | 后端接口 |
   | 3000 | 租客端 | 前端 Web |
   | 3001 | 运营后台 | 前端 Web |
   | 5432 | PostgreSQL | 数据库（仅内网开放） |
   | 6379 | Redis | 缓存（仅内网开放） |

### 二、数据库环境初始化

```bash
# 1. 启动 Docker 中间件（PostgreSQL + Redis）
cp docker/middleware.env.example docker/middleware.env
# 编辑 middleware.env，配置 POSTGRES_PASSWORD

docker compose -p apartment-ultra-middleware \
  -f docker/docker-compose.middleware.yaml \
  --env-file docker/middleware.env up -d
```

验证中间件启动成功：

```bash
docker compose -p apartment-ultra-middleware -f docker/docker-compose.middleware.yaml ps
# 应该看到 postgres 和 redis 均为 healthy 状态
```

### 三、项目部署

#### 方式 A：生产全量 Docker 部署（推荐）

```bash
# 1. 配置环境变量
cp docker/.env.production.example .env.production
# 必填项：SECRET_KEY、CORS_ORIGINS、NEXT_PUBLIC_API_URL、POSTGRES_PASSWORD

# 2. 一键构建并启动
docker compose -f docker/docker-compose.yaml --env-file .env.production up -d --build

# 3. 验证服务健康
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:3001
```

#### 方式 B：中间件 Docker + 业务服务本地开发

```bash
# 1. 启动中间件（仅 PostgreSQL + Redis）
docker compose -p apartment-ultra-middleware \
  -f docker/docker-compose.middleware.yaml \
  --env-file docker/middleware.env up -d

# 2. 克隆代码后安装依赖
pnpm install

# 3. 同步数据库 Schema（新环境使用 db push）
pnpm --filter apartment-ultra-api exec prisma db push

# 4. 启动各服务
pnpm dev:api      # 端口 8000
pnpm dev:web      # 端口 3000
pnpm dev:admin    # 端口 3001
```

#### 方式 C：全量 Docker 本地开发

```bash
docker compose -f docker/docker-compose.yaml \
  --env-file docker/.env.docker up -d --build
```

首次启动如果遇到卷权限问题：

```bash
pnpm docker:dev:reset
pnpm docker:dev
```

### 四、初始化系统管理员

服务启动后，通过 API 创建第一个运营管理员：

```bash
curl -X POST http://localhost:8000/api/v1/admin/init/setup \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"你的密码(至少8字符)","name":"管理员"}'
```

默认测试账号：用户名 `admin`，密码 `Admin@1234`

### 五、常见问题

**Q：prisma migrate deploy 报错 P3005？**

A：新环境应该用 `prisma db push` 而不是 `migrate deploy`。`db push` 直接按 schema 同步数据库表结构，适合干净的新环境。

**Q：接口返回 500 表不存在？**

A：执行 `prisma generate` 重新生成 Prisma Client 类型，然后重启 API：
```bash
pnpm --filter apartment-ultra-api exec prisma generate
docker compose -f docker/docker-compose.yaml restart api
```

**Q：数据库连接失败？**

A：检查 `.env.production` 中 `DATABASE_URL` 是否正确，并确认 PostgreSQL 容器端口（5432）未被防火墙拦截。

## 本地开发

### 只启动中间件

推荐本地仅启动数据库等依赖，业务服务仍在宿主机运行：

```bash
cp docker/middleware.env.example docker/middleware.env
docker compose -p apartment-ultra-middleware -f docker/docker-compose.middleware.yaml --env-file docker/middleware.env up -d
```

然后在仓库根目录分别启动：

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

### 两套运行模式

当前仓库推荐按下列职责区分：

| 模式 | Compose 文件 | 环境文件 | 用途 |
|------|------|------|------|
| `middleware` | `docker/docker-compose.middleware.yaml` | `docker/middleware.env` | 只启动 PostgreSQL / Redis |
| `production` | `docker/docker-compose.yaml` | `.env.production` | 正式部署 |

对应的容器名称会遵循 Compose 统一格式：

- 中间件环境：`apartment-ultra-middleware-<service>-1`
- 生产环境：`apartment-ultra-prod-<service>-1`

例如：`apartment-ultra-prod-api-1`。

### 本地完整部署测试

如果要直接用 Docker Compose 启动整套服务：

```bash
docker compose -f docker/docker-compose.yaml --env-file docker/.env.docker up -d
```

## 生产部署

### 1. 配置环境变量

```bash
cp docker/.env.production.example .env.production
vim .env.production  # 修改 SECRET_KEY、CORS_ORIGINS、NEXT_PUBLIC_API_URL 等必填项
```

### 2. 构建并启动

```bash
docker compose -f docker/docker-compose.yaml --env-file .env.production up -d --build
```

## GitHub Actions 部署

手动部署工作流定义在：

- [deploy.yml](../.github/workflows/deploy.yml)

需要的 GitHub Secrets：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KEY`

工作流会在服务器上执行：

- 进入 `/opt/apartment-ultra`
- 拉取最新镜像
- 读取根目录 `.env.production`
- 执行 `docker compose -f docker/docker-compose.yaml up -d`
- 进行健康检查

## 常用排查命令

### 查看服务日志

```bash
docker compose -f docker/docker-compose.yaml logs -f
docker compose -f docker/docker-compose.yaml logs -f api
```

### 健康检查

```bash
curl http://localhost:8000/health
curl http://localhost/health
```

### 检查数据库状态

```bash
docker compose -f docker/docker-compose.yaml exec postgres pg_isready
```

## 相关文档

- [仓库总览](../README.md)
- [故障排查指南](./TROUBLESHOOTING.md)
- [API 开发说明](../api/AGENTS.md)
- [租客端开发说明](../tenant-web/AGENTS.md)
