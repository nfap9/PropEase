# Apartment Ultra 部署文档

## 目录

- [环境要求](#环境要求)
- [镜像命名规范](#镜像命名规范)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [CI/CD 部署](#cicd-部署)
- [环境变量说明](#环境变量说明)
- [故障排查](#故障排查)

## 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- （可选）pnpm 9+ 用于本地开发

## 镜像命名规范

| 服务 | 镜像名称 | 说明 |
|------|---------|------|
| API | `apartment-ultra-api` | 后端 API 服务 |
| 租客端 | `apartment-ultra-tenant-web` | 租客端前端 |
| 运营后台 | `apartment-ultra-admin-web` | 运营管理后台 |

镜像标签：
- `latest` - 最新版本
- `main` - main 分支构建
- `{sha}` - Git commit SHA

## 本地开发

### 只启动中间件（推荐）

```bash
cd docker
docker compose -f docker-compose.middleware.yaml up -d
```

仅启动 PostgreSQL 和 Redis，API 和前端在本地运行：

```bash
# 终端 1：启动后端
pnpm dev:api

# 终端 2：启动前端
pnpm dev:web
```

### 本地完整部署测试

```bash
# 使用本地 Docker 环境配置
docker compose -f docker/docker-compose.yaml --env-file docker/.env.docker up -d
```

## 生产部署

### 1. 初始化环境配置

```bash
./scripts/setup-env.sh
```

按提示输入服务器地址，脚本会自动生成 `.env.production` 文件。

### 2. 部署前检查

```bash
./scripts/pre-deploy-check.sh
```

### 3. 构建镜像

```bash
# 构建所有镜像
./scripts/build-images.sh --tag latest --save

# 或指定 API URL
NEXT_PUBLIC_API_URL=http://your-server/api/v1 ./scripts/build-images.sh --save
```

### 4. 一键部署

```bash
DEPLOY_HOST=your-server-ip ./scripts/deploy.sh
```

### 5. 服务器端手动部署

如果已有镜像文件：

```bash
# 上传镜像后执行
./scripts/deploy-images.sh
```

## CI/CD 部署

### GitHub Actions 配置

1. 在 GitHub 仓库设置中添加 Secrets：
   - `DEPLOY_HOST` - 服务器地址
   - `DEPLOY_USER` - SSH 用户名
   - `DEPLOY_KEY` - SSH 私钥

2. 推送到 main 分支自动构建镜像并推送到 GHCR

3. 手动触发部署：
   - 进入 Actions -> Deploy
   - 选择环境（production/staging）
   - 点击 Run workflow

### 从 GHCR 拉取镜像

```bash
# 登录 GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# 拉取镜像
docker pull ghcr.io/OWNER/apartment-ultra-api:main
docker pull ghcr.io/OWNER/apartment-ultra-tenant-web:main
docker pull ghcr.io/OWNER/apartment-ultra-admin-web:main
```

## 环境变量说明

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `POSTGRES_PASSWORD` | 数据库密码 | 随机生成 |
| `SECRET_KEY` | JWT 密钥 | 64位随机字符串 |
| `CORS_ORIGINS` | 允许的前端域名 | `["http://localhost"]` |
| `NEXT_PUBLIC_API_URL` | 前端访问的 API 地址 | `http://server/api/v1` |
| `SERVER_NAME` | 服务器地址（Nginx） | `your-server-ip` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `API_IMAGE_TAG` | API 镜像标签 | `latest` |
| `TENANT_WEB_IMAGE_TAG` | 租客端镜像标签 | `latest` |
| `ADMIN_WEB_IMAGE_TAG` | 运营后台镜像标签 | `latest` |
| `WECHAT_PAY_ENABLED` | 启用微信支付 | `false` |

### 完整配置示例

```bash
# .env.production
POSTGRES_USER=apartment_admin
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=apartment_ultra

SECRET_KEY=your-jwt-secret-key
CORS_ORIGINS=["http://your-server"]

NEXT_PUBLIC_API_URL=http://your-server/api/v1
SERVER_NAME=your-server

API_IMAGE_TAG=latest
TENANT_WEB_IMAGE_TAG=latest
ADMIN_WEB_IMAGE_TAG=latest
```

## 故障排查

### 常见问题

1. **服务无法启动**
   ```bash
   # 查看日志
   docker compose -f docker/docker-compose.yaml logs api
   docker compose -f docker/docker-compose.yaml logs tenant-web
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker compose -f docker/docker-compose.yaml exec postgres pg_isready
   ```

3. **镜像拉取失败**
   ```bash
   # 检查镜像是否存在
   docker images | grep apartment-ultra
   ```

### 健康检查

```bash
# API 健康检查
curl http://localhost:8000/health

# 通过 Nginx
curl http://localhost/health
```

### 日志查看

```bash
# 查看所有服务日志
docker compose -f docker/docker-compose.yaml logs -f

# 查看特定服务
docker compose -f docker/docker-compose.yaml logs -f api
```

## 更多信息

- [故障排查指南](./TROUBLESHOOTING.md)
- [API 文档](../api/README.md)
- [前端文档](../web/README.md)
