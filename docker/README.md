# PropEase Docker 部署指南

## 概览

本目录提供 PropEase 的 Docker Compose 配置、环境变量模板与部署辅助文档。

### 服务架构

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| PostgreSQL | `apartment_ultra_db` | 5432 | 数据库 |
| Redis | `apartment_ultra_redis` | 6379 | 缓存 |
| API | `apartment_ultra_api` | 8000 | 后端 API |
| 租客端 | `apartment_ultra_tenant_web` | 3000 | 前端 Web |
| 运营后台 | `apartment_ultra_admin` | 8080 | 运营管理 |
| Nginx | `apartment_ultra_nginx` | 80 | 反向代理 |

### 镜像列表

| 服务 | 镜像名称 | Dockerfile |
|------|----------|------------|
| API | `propease-api` | `api/Dockerfile` |
| 租客端 | `propease-tenant-web` | `tenant-web/Dockerfile` |
| 运营后台 | `propease-admin-web` | `admin-web/Dockerfile` |

---

## 快速开始

### 方式一：使用部署脚本（推荐）

```bash
# 1. 设置环境变量（交互式向导）
./scripts/setup-env.sh

# 2. 构建镜像
./scripts/build-images.sh

# 3. 部署
./scripts/deploy.sh

# 4. 验证
./scripts/verify-production.sh
```

### 方式二：手动部署

```bash
# 1. 复制并编辑环境变量
cp docker/.env.production.example .env.production
vim .env.production  # 填写必填项

# 2. 构建镜像
docker build -t propease-api:latest -f api/Dockerfile .
docker build -t propease-tenant-web:latest -f tenant-web/Dockerfile .
docker build -t propease-admin-web:latest -f admin-web/Dockerfile .

# 3. 启动服务
docker compose -f docker/docker-compose.yaml --env-file .env.production up -d

# 4. 验证
curl http://localhost/api/v1/health
```

---

## 部署脚本说明

### setup-env.sh
交互式环境变量设置向导，自动：
- 复制示例配置文件
- 生成随机 SECRET_KEY
- 验证必填项

### build-images.sh
构建所有 Docker 镜像：
- `propease-api:latest`
- `propease-tenant-web:latest`
- `propease-admin-web:latest`

支持自定义标签：
```bash
API_IMAGE_TAG=v1.0.0 TENANT_WEB_IMAGE_TAG=v1.0.0 ADMIN_WEB_IMAGE_TAG=v1.0.0 ./scripts/build-images.sh
```

### deploy.sh
完整部署脚本，支持以下选项：

| 选项 | 说明 |
|------|------|
| `--skip-backup` | 跳过数据库备份 |
| `--skip-pre-check` | 跳过部署前检查 |
| `--only-migrate` | 仅运行数据库迁移 |

```bash
./scripts/deploy.sh                    # 完整部署
./scripts/deploy.sh --skip-backup     # 跳过备份
./scripts/deploy.sh --only-migrate    # 仅迁移数据库
```

### pre-deploy-check.sh
部署前检查，包括：
- 环境变量完整性
- Docker/Docker Compose 版本
- 端口占用情况
- 磁盘空间
- 必要文件存在性

### backup.sh
数据库备份脚本：
- 备份到 `docker/backup/` 目录
- 自动压缩为 `.sql.gz`
- 保留最近 7 天的备份

### verify-production.sh
生产环境验证脚本，检查：
- 所有容器状态
- API 健康检查
- 租客端/运营后台可访问性
- Nginx 代理状态
- 数据库/Redis 连接

---

## 环境变量说明

### 必填项

| 变量 | 说明 | 示例 |
|------|------|------|
| `SECRET_KEY` | JWT 签名密钥 | `your-32-char-secret-key` |
| `POSTGRES_PASSWORD` | 数据库密码 | `secure-password` |
| `CORS_ORIGINS` | 允许的跨域来源 | `["http://localhost"]` |
| `VITE_API_URL` | 前端 API 地址 | `http://localhost/api/v1` |
| `SERVER_NAME` | 服务器域名 | `your-domain.com` |

### 可选配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `POSTGRES_USER` | `postgres` | 数据库用户 |
| `POSTGRES_DB` | `apartment_ultra` | 数据库名 |
| `API_V1_PREFIX` | `/api/v1` | API 路径前缀 |
| `NGINX_PORT` | `80` | Nginx 端口 |
| `API_IMAGE_TAG` | `latest` | API 镜像标签 |
| `TENANT_WEB_IMAGE_TAG` | `latest` | 租客端镜像标签 |
| `ADMIN_WEB_IMAGE_TAG` | `latest` | 运营后台镜像标签 |

### 微信支付（可选）

```bash
WECHAT_PAY_ENABLED=true
WECHAT_MCH_ID=your-mch-id
WECHAT_APP_ID=your-app-id
WECHAT_APIV3_KEY=your-apiv3-key
WECHAT_CERT_SERIAL_NO=your-cert-serial
WECHAT_PAY_NOTIFY_URL_BASE=https://your-domain.com
WECHAT_PRIVATE_KEY=your-private-key
```

---

## 访问地址

部署完成后，通过 Nginx 访问：

| 服务 | 地址 |
|------|------|
| 租客端 | http://`SERVER_NAME` |
| 运营后台 | http://`SERVER_NAME`/admin |
| API | http://`SERVER_NAME`/api/v1 |
| API 文档 | http://`SERVER_NAME`/api-docs |

---

## Docker Compose 组合

### 中间件独立部署

用于本地开发时只想用 Docker 运行中间件：

```bash
docker compose -f docker/docker-compose.middleware.yaml --env-file docker/.env.middleware.example up -d
```

### 叠加可观测性服务

```bash
docker compose -f docker/docker-compose.yaml -f docker/docker-compose.observability.yaml --env-file .env.production up -d
```

---

## 故障排除

### 常见问题

**Q: 容器启动失败，显示端口被占用**
```bash
# 检查端口占用
lsof -i :80 -i :5432 -i :6379

# 如果是测试环境，可以先停止
docker compose -f docker/docker-compose.yaml down
```

**Q: API 健康检查失败**
```bash
# 检查 API 日志
docker logs apartment_ultra_api --tail 50

# 检查数据库连接
docker exec apartment_ultra_db pg_isready -U postgres
```

**Q: 前端无法访问 API**
```bash
# 检查 Nginx 日志
docker logs apartment_ultra_nginx --tail 50

# 检查 API 代理
curl http://localhost/api/v1/health
```

### 查看日志

```bash
# 所有服务日志
docker compose -f docker/docker-compose.yaml logs -f

# 指定服务日志
docker compose -f docker/docker-compose.yaml logs -f api

# 最近 100 行
docker compose -f docker/docker-compose.yaml logs --tail 100
```

### 重启服务

```bash
# 重启单个服务
docker compose -f docker/docker-compose.yaml restart api

# 重启所有服务
docker compose -f docker/docker-compose.yaml restart
```

---

## 目录结构

```
.
├── docker/
│   ├── docker-compose.yaml           # 主配置
│   ├── docker-compose.middleware.yaml # 中间件配置
│   ├── docker-compose.observability.yaml # 可观测性配置
│   ├── nginx.conf.template           # Nginx 配置模板
│   ├── .env.production.example       # 环境变量示例
│   ├── .env.middleware.example       # 中间件环境变量示例
│   └── backup/                       # 数据库备份目录
├── scripts/
│   ├── setup-env.sh                  # 环境变量设置
│   ├── build-images.sh               # 构建镜像
│   ├── deploy.sh                     # 部署脚本
│   ├── pre-deploy-check.sh           # 部署前检查
│   ├── backup.sh                     # 数据库备份
│   └── verify-production.sh          # 验证脚本
└── api/
    └── Dockerfile                    # API 镜像构建
```
