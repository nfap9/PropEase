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
