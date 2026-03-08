# Docker 部署

## 快速部署

```bash
# 1. 初始化配置
./scripts/setup-env.sh

# 2. 部署
./scripts/deploy-from-local.sh

# 3. 访问
# 浏览器打开 http://<服务器地址>
```

---

## 环境文件

| 文件 | 用途 |
|------|------|
| `docker-compose.yaml` | 本地生产/联调环境 |
| `docker-compose.dev.yaml` | 开发环境（热重载） |
| `docker-compose.server.yaml` | 云服务器生产环境 |
| `docker-compose.middleware.yaml` | 本地中间件 |

---

## 必要环境变量

```bash
cp docker/.env.production.example .env.production
```

| 变量 | 说明 |
|------|------|
| `POSTGRES_PASSWORD` | 数据库密码 |
| `SECRET_KEY` | JWT 密钥 |
| `CORS_ORIGINS` | 允许的前端来源 |
| `NEXT_PUBLIC_API_URL` | API 地址 |
| `ADMIN_INIT_PASSWORD` | 管理员密码 |

---

## 脚本

| 脚本 | 用途 |
|------|------|
| `setup-env.sh` | 初始化配置 |
| `deploy-from-local.sh` | 一键部署 |
| `pre-deploy-check.sh` | 部署前检查 |
| `verify-production.sh` | 本地验证生产构建 |

---

## 架构

```
┌─────────────────────────────────────────┐
│           Nginx (Docker :80)            │
├──────────────────┬──────────────────────┤
│   Web (Next.js)  │   API (Express)      │
│      :3000       │       :8000          │
├──────────────────┴──────────────────────┤
│            PostgreSQL :5432             │
│              Redis :6379                │
└─────────────────────────────────────────┘
```

---

## 常用命令

```bash
# 查看状态
docker compose -f docker/docker-compose.server.yaml --env-file .env.production ps

# 查看日志
docker compose -f docker/docker-compose.server.yaml --env-file .env.production logs -f api

# 重启服务
docker compose -f docker/docker-compose.server.yaml --env-file .env.production restart

# 健康检查
curl http://localhost:8000/health
```

---

## 问题排查

详见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
