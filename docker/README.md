# PropEase Docker 部署指南

## 概览

本目录提供 PropEase 的 Docker Compose 配置与环境变量模板。

### 服务架构

| 服务 | 容器名 | 说明 |
|------|--------|------|
| PostgreSQL | `propease_db` | 数据库 |
| Redis | `propease_redis` | 缓存 |
| API | `propease_api` | 后端 API |
| 租户端构建 | `propease_tenant_web` | 构建完成后退出 |
| 管理后台构建 | `propease_admin_web` | 构建完成后退出 |
| Nginx | `propease_nginx` | 反向代理 + 静态文件托管 |

### 镜像列表

| 服务 | 镜像名称 | Dockerfile |
|------|----------|------------|
| API | `propease-api` | `api/Dockerfile` |
| 前端（合并构建） | `propease-web` | `docker/Dockerfile.web` |

---

## 快速开始

### 环境要求

- Docker & Docker Compose
- pnpm 9+

### 部署步骤

```bash
# 1. 复制并编辑环境变量
cp docker/.env.production.example docker/.env.production
vim docker/.env.production  # 填写必填项

# 2. 执行部署（构建镜像 + 启动服务）
./scripts/deploy.sh

# 3. 验证
curl http://localhost/api/v1/health
```

### 部署脚本选项

| 选项 | 说明 |
|------|------|
| `--skip-build` | 跳过镜像构建，仅重启服务 |
| `--api-only` | 仅构建并部署 API |
| `--web-only` | 仅构建并部署前端 |

---

## 工作流程

1. `tenant-web` 容器启动 → 从镜像复制租户端构建产物到 `web_static` 卷 → 立即退出
2. `admin-web` 容器启动 → 从镜像复制管理后台构建产物到 `web_static` 卷 → 立即退出
3. `nginx` 容器启动 → 以只读方式挂载 `web_static` 卷，直接服务静态文件

前端更新时：重新构建 `propease-web` 镜像 → `docker compose up -d` 重新运行构建容器即可。

---

## 环境变量说明

### 必填项

| 变量 | 说明 | 示例 |
|------|------|------|
| `SECRET_KEY` | JWT 签名密钥（≥32字符） | `your-32-char-secret-key` |
| `POSTGRES_PASSWORD` | 数据库密码 | `secure-password` |
| `CORS_ORIGINS` | 允许的跨域来源 | `["http://localhost"]` |
| `VITE_API_URL` | 前端 API 地址 | `http://localhost/api/v1` |
| `SERVER_NAME` | 服务器域名 | `your-domain.com` |

### 可选配置

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `POSTGRES_USER` | `postgres` | 数据库用户 |
| `POSTGRES_DB` | `apartment_ultra` | 数据库名 |
| `NGINX_PORT` | `80` | Nginx 端口 |
| `API_IMAGE_TAG` | `latest` | API 镜像标签 |
| `WEB_IMAGE_TAG` | `latest` | 前端镜像标签 |

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
docker logs propease_api --tail 50

# 检查数据库连接
docker exec propease_db pg_isready -U postgres
```

**Q: 前端无法访问**
```bash
# 检查 Nginx 日志
docker logs propease_nginx --tail 50

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

### 前端更新

```bash
# 重新构建前端镜像
docker build -t propease-web:latest -f docker/Dockerfile.web .

# 重新运行构建容器（更新卷中的静态文件）
docker compose -f docker/docker-compose.yaml up -d --force-recreate tenant-web admin-web
```

---

## 目录结构

```
.
├── docker/
│   ├── docker-compose.yaml              # 主配置
│   ├── docker-compose.middleware.yaml   # 中间件配置
│   ├── docker-compose.observability.yaml # 可观测性配置
│   ├── Dockerfile.web                 # 前端镜像构建
│   ├── nginx.conf.template             # Nginx 配置模板
│   ├── .env.production.example         # 环境变量示例
│   ├── .env.middleware.example          # 中间件环境变量示例
│   └── backup/                         # 数据库备份目录
└── api/
    └── Dockerfile                       # API 镜像构建
```
