# Docker 部署

## 环境说明

| 文件 | 用途 |
|------|------|
| `docker-compose.yaml` | 本地生产/联调环境 |
| `docker-compose.dev.yaml` | 开发环境（支持热重载） |
| `docker-compose.prod.yaml` | 云服务器生产环境 |
| `docker-compose.middleware.yaml` | 本地中间件（PostgreSQL、Redis） |

## 快速启动

```bash
# 开发环境
docker compose -f docker-compose.dev.yaml up

# 生产环境（本地）
docker compose -f docker-compose.yaml up -d
```

---

## 一键部署

### 步骤 1: 初始化配置

```bash
./scripts/setup-env.sh
```

按提示输入服务器 IP，脚本会自动：
- 生成数据库密码
- 生成 JWT 密钥
- 生成管理员密码
- 创建 `.env.production` 文件

### 步骤 2: 部署

```bash
./scripts/deploy-from-local.sh
```

脚本会自动：
- 检测服务器是否安装 Docker（未安装则自动安装）
- 构建镜像
- 上传所有文件
- 启动服务（包含 Nginx）
- 健康检查

### 步骤 3: 访问

浏览器打开 `http://<服务器地址>`

---

## 手动配置（可选）

如需手动配置 `.env.production`：

```bash
cp docker/.env.production.example .env.production
vim .env.production
```

必须配置的变量：

| 变量 | 说明 | 生成方式 |
|------|------|---------|
| `POSTGRES_PASSWORD` | 数据库密码 | `openssl rand -base64 32` |
| `SECRET_KEY` | JWT 密钥 | `openssl rand -hex 64` |
| `CORS_ORIGINS` | 允许的前端来源 | `["http://<ip>"]` |
| `NEXT_PUBLIC_API_URL` | API 地址 | `http://<ip>/api/v1` |
| `SERVER_NAME` | Nginx server_name | `<ip>` |
| `ADMIN_INIT_PASSWORD` | 管理员密码 | 自定义 |

---

## 脚本说明

| 脚本 | 用途 | 执行位置 |
|------|------|---------|
| `setup-env.sh` | 初始化配置，生成密钥 | 本地 |
| `deploy-from-local.sh` | 一键部署 | 本地 |
| `build-local.sh` | 构建 Docker 镜像 | 本地 |
| `deploy-images.sh` | 加载镜像并启动 | 服务器 |
| `backup.sh` | 数据库备份 | 服务器 |

---

## 架构说明

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
# 查看日志
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production logs -f

# 重启服务
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production restart

# 查看状态
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production ps

# 停止服务
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production down
```

---

## 常见问题

### Docker 镜像拉取超时

脚本会自动配置镜像加速。如需手动配置，编辑 `/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": ["https://docker.1ms.run", "https://docker.xuanyuan.me"]
}
```

### 502 Bad Gateway

```bash
# 检查服务状态
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production ps

# 查看日志
docker compose -f docker/docker-compose.prod.yaml --env-file .env.production logs api
```

### 端口被占用

修改 `docker-compose.prod.yaml` 中 nginx 端口：

```yaml
nginx:
  ports:
    - "8080:80"
```
