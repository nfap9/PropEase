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
cd docker
docker compose -f docker-compose.middleware.yaml up -d
```

然后在仓库根目录分别启动：

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

### 本地完整部署测试

如果要直接用 Docker Compose 启动整套服务：

```bash
docker compose -f docker/docker-compose.yaml --env-file docker/.env.docker up -d
```

## 生产部署

### 1. 初始化环境变量

在仓库根目录执行：

```bash
./scripts/setup-env.sh
```

该脚本会生成根目录下的 `.env.production`。

### 2. 部署前检查

```bash
./scripts/pre-deploy-check.sh
```

### 3. 构建镜像

```bash
./scripts/build-images.sh --tag latest --save
```

如需覆盖前端 API 地址：

```bash
NEXT_PUBLIC_API_URL=http://your-server/api/v1 ./scripts/build-images.sh --save
```

### 4. 一键部署

```bash
DEPLOY_HOST=your-server-ip ./scripts/deploy.sh
```

### 5. 服务器端手动部署

如果服务器上已经拿到镜像文件：

```bash
./scripts/deploy-images.sh
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
