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

### 二、项目开发和部署

#### 生产全量 Docker 部署

```bash
# 1. 配置环境变量
cp docker/.env.production.example .env.production
# 必填项：SECRET_KEY、CORS_ORIGINS、VITE_API_URL、POSTGRES_PASSWORD

# 2. 一键构建并启动
docker compose -f docker/docker-compose.yaml --env-file .env.production up -d --build

# 3. 验证服务健康
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:3001
```

#### 中间件 Docker + 业务服务本地开发

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